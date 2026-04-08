// ============================================================
// The Soul Summoner's Grimoire — The Herald
// Discord + Telegram bot that runs a grimoire soul 24/7
// Uses raw HTTP/WebSocket APIs to avoid hard dependencies
// ============================================================

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { SoulLoader } from '../core/soul-loader';
import { DriftEngine } from '../systems/drift-engine';
import { AffectionEngine } from '../systems/affection';
import {
  SoulFiles,
  AffectionState,
  SoulState,
  clamp,
  generateId,
} from '../core/types';

// --- Configuration ---

export interface HeraldConfig {
  grimoireRoot: string;
  platform: 'discord' | 'telegram';
  token: string;
  soulAssignments: Record<string, string>; // channelId -> soulName
  driftIntervalMinutes: number;
}

// --- Platform Message Abstractions ---

interface PlatformMessage {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  isDM: boolean;
  isMention: boolean;
}

// --- Discord Gateway Opcodes ---

const enum GatewayOp {
  Dispatch = 0,
  Heartbeat = 1,
  Identify = 2,
  Resume = 6,
  Reconnect = 7,
  InvalidSession = 9,
  Hello = 10,
  HeartbeatAck = 11,
}

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * The Herald — a persistent bot that channels grimoire souls into
 * Discord and Telegram chat rooms. Each channel can be assigned a
 * different soul, and the bot manages affection tracking, drift
 * cycles, and message response generation.
 */
export class Herald {
  private readonly config: HeraldConfig;
  private readonly soulLoader: SoulLoader;
  private readonly driftEngine: DriftEngine;
  private readonly affectionEngine: AffectionEngine;

  private running = false;
  private soulAssignments: Map<string, string>;
  private userAffection: Map<string, AffectionState> = new Map();
  private soulCache: Map<string, SoulFiles> = new Map();

  // Discord state
  private discordWs: import('ws').WebSocket | null = null;
  private discordHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private discordSequence: number | null = null;
  private discordSessionId: string | null = null;
  private discordBotUserId: string | null = null;
  private discordReconnectAttempts = 0;

  // Telegram state
  private telegramOffset = 0;
  private telegramPollAbort: AbortController | null = null;

  // Drift timer
  private driftTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: HeraldConfig) {
    this.config = config;
    this.soulLoader = new SoulLoader();
    this.driftEngine = new DriftEngine();
    this.affectionEngine = new AffectionEngine();
    this.soulAssignments = new Map(Object.entries(config.soulAssignments));
  }

  // --- Public API ---

  /** Start the Herald on the configured platform. */
  async start(): Promise<void> {
    this.running = true;

    // Pre-load all assigned souls
    for (const soulName of new Set(this.soulAssignments.values())) {
      await this.loadSoulForChannel(soulName);
    }

    if (this.config.platform === 'discord') {
      await this.startDiscord(this.config.token);
    } else {
      await this.startTelegram(this.config.token);
    }

    this.startDriftBackground();
  }

  /** Gracefully shut down the Herald. */
  async stop(): Promise<void> {
    this.running = false;

    if (this.discordHeartbeatTimer) {
      clearInterval(this.discordHeartbeatTimer);
      this.discordHeartbeatTimer = null;
    }

    if (this.discordWs) {
      this.discordWs.close(1000, 'Herald shutdown');
      this.discordWs = null;
    }

    if (this.telegramPollAbort) {
      this.telegramPollAbort.abort();
      this.telegramPollAbort = null;
    }

    if (this.driftTimer) {
      clearInterval(this.driftTimer);
      this.driftTimer = null;
    }

    // Persist all cached soul states
    for (const soul of this.soulCache.values()) {
      await this.soulLoader.saveSoul(soul);
    }
  }

  /** Assign a soul to a specific channel. */
  setSoul(channelId: string, soulName: string): void {
    this.soulAssignments.set(channelId, soulName);
  }

  // --- Discord Implementation ---

  private async startDiscord(token: string): Promise<void> {
    let WsModule: any;
    try {
      WsModule = await import('ws');
    } catch {
      throw new Error(
        'The "ws" package is required for Discord gateway connections. ' +
        'Install it with: npm install ws'
      );
    }

    this.connectDiscordGateway(WsModule, token);
  }

  private connectDiscordGateway(
    WsModule: any,
    token: string
  ): void {
    if (!this.running) return;

    const WsClass = WsModule.default || WsModule;
    const ws = new WsClass(DISCORD_GATEWAY_URL);
    this.discordWs = ws;

    ws.on('open', () => {
      this.discordReconnectAttempts = 0;
    });

    ws.on('message', (data: Buffer) => {
      const payload = JSON.parse(data.toString());
      this.handleDiscordPayload(payload, token, WsModule);
    });

    ws.on('close', (code: number) => {
      this.discordHeartbeatTimer && clearInterval(this.discordHeartbeatTimer);
      this.discordHeartbeatTimer = null;

      if (!this.running) return;

      // Reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.discordReconnectAttempts), 30000);
      this.discordReconnectAttempts++;

      if (code === 4004) {
        // Authentication failed — do not reconnect
        this.running = false;
        return;
      }

      setTimeout(() => this.connectDiscordGateway(WsModule, token), delay);
    });

    ws.on('error', () => {
      // Error handler required to prevent unhandled exception.
      // The 'close' event fires after 'error' and handles reconnection.
    });
  }

  private handleDiscordPayload(
    payload: { op: number; d: unknown; s: number | null; t: string | null },
    token: string,
    WsModule: any
  ): void {
    if (payload.s !== null) {
      this.discordSequence = payload.s;
    }

    switch (payload.op) {
      case GatewayOp.Hello: {
        const { heartbeat_interval } = payload.d as { heartbeat_interval: number };
        this.startDiscordHeartbeat(heartbeat_interval);

        if (this.discordSessionId) {
          // Resume existing session
          this.discordSend({
            op: GatewayOp.Resume,
            d: { token, session_id: this.discordSessionId, seq: this.discordSequence },
          });
        } else {
          // Identify
          this.discordSend({
            op: GatewayOp.Identify,
            d: {
              token,
              intents: (1 << 9) | (1 << 12) | (1 << 15), // GUILDS, GUILD_MESSAGES, MESSAGE_CONTENT
              properties: { os: 'linux', browser: 'grimoire', device: 'grimoire' },
            },
          });
        }
        break;
      }

      case GatewayOp.HeartbeatAck:
        break;

      case GatewayOp.Heartbeat:
        this.discordSend({ op: GatewayOp.Heartbeat, d: this.discordSequence });
        break;

      case GatewayOp.Reconnect:
        this.discordWs?.close(4000, 'Reconnect requested');
        break;

      case GatewayOp.InvalidSession: {
        const resumable = payload.d as boolean;
        if (!resumable) {
          this.discordSessionId = null;
          this.discordSequence = null;
        }
        setTimeout(() => this.connectDiscordGateway(WsModule, token), 2000);
        this.discordWs?.close(4000, 'Invalid session');
        break;
      }

      case GatewayOp.Dispatch:
        this.handleDiscordDispatch(payload.t!, payload.d, token);
        break;
    }
  }

  private handleDiscordDispatch(event: string, data: unknown, token: string): void {
    if (event === 'READY') {
      const ready = data as { session_id: string; user: { id: string } };
      this.discordSessionId = ready.session_id;
      this.discordBotUserId = ready.user.id;
      return;
    }

    if (event === 'MESSAGE_CREATE') {
      const msg = data as {
        id: string;
        channel_id: string;
        author: { id: string; username: string; bot?: boolean };
        content: string;
        guild_id?: string;
        mentions?: Array<{ id: string }>;
      };

      // Ignore messages from bots (including self)
      if (msg.author.bot) return;

      const isDM = !msg.guild_id;
      const isMention = Array.isArray(msg.mentions) &&
        msg.mentions.some(m => m.id === this.discordBotUserId);

      if (!isDM && !isMention) return;

      const platformMsg: PlatformMessage = {
        id: msg.id,
        channelId: msg.channel_id,
        userId: msg.author.id,
        username: msg.author.username,
        content: msg.content.replace(/<@!?\d+>/g, '').trim(),
        isDM,
        isMention,
      };

      this.onMessage('discord', platformMsg, token).catch(() => {});
    }
  }

  private startDiscordHeartbeat(intervalMs: number): void {
    if (this.discordHeartbeatTimer) clearInterval(this.discordHeartbeatTimer);

    // Send first heartbeat after a random jitter
    const jitter = Math.floor(Math.random() * intervalMs);
    setTimeout(() => {
      this.discordSend({ op: GatewayOp.Heartbeat, d: this.discordSequence });
    }, jitter);

    this.discordHeartbeatTimer = setInterval(() => {
      this.discordSend({ op: GatewayOp.Heartbeat, d: this.discordSequence });
    }, intervalMs);
  }

  private discordSend(payload: unknown): void {
    if (this.discordWs?.readyState === 1) {
      this.discordWs.send(JSON.stringify(payload));
    }
  }

  private async discordReply(channelId: string, content: string, token: string): Promise<void> {
    await this.httpPost(
      `${DISCORD_API_BASE}/channels/${channelId}/messages`,
      { content },
      { Authorization: `Bot ${token}` }
    );
  }

  // --- Telegram Implementation ---

  private async startTelegram(token: string): Promise<void> {
    this.telegramPollAbort = new AbortController();
    this.pollTelegramUpdates(token);
  }

  private async pollTelegramUpdates(token: string): Promise<void> {
    while (this.running) {
      try {
        const url = `${TELEGRAM_API_BASE}/bot${token}/getUpdates?offset=${this.telegramOffset}&timeout=30`;
        const response = await this.httpGet(url);
        const data = JSON.parse(response) as {
          ok: boolean;
          result: Array<{
            update_id: number;
            message?: {
              message_id: number;
              chat: { id: number; type: string };
              from: { id: number; username?: string; first_name: string };
              text?: string;
            };
          }>;
        };

        if (!data.ok || !data.result.length) continue;

        for (const update of data.result) {
          this.telegramOffset = update.update_id + 1;

          if (!update.message?.text) continue;

          const msg = update.message;
          const platformMsg: PlatformMessage = {
            id: String(msg.message_id),
            channelId: String(msg.chat.id),
            userId: String(msg.from.id),
            username: msg.from?.username ?? msg.from?.first_name ?? 'unknown',
            content: msg.text || '',
            isDM: msg.chat.type === 'private',
            isMention: true, // In Telegram, all messages to the bot are relevant
          };

          await this.onMessage('telegram', platformMsg, token);
        }
      } catch {
        // Brief pause before retrying on error
        await this.sleep(3000);
      }
    }
  }

  private async telegramReply(chatId: string, text: string, token: string): Promise<void> {
    await this.httpPost(
      `${TELEGRAM_API_BASE}/bot${token}/sendMessage`,
      { chat_id: chatId, text, parse_mode: 'Markdown' },
      {}
    );
  }

  // --- Core Bot Logic ---

  private async onMessage(
    platform: 'discord' | 'telegram',
    message: PlatformMessage,
    token: string
  ): Promise<void> {
    const soulName = this.soulAssignments.get(message.channelId);
    if (!soulName) return;

    const response = await this.generateResponse(soulName, message.userId, message.content);
    if (!response) return;

    if (platform === 'discord') {
      await this.discordReply(message.channelId, response, token);
    } else {
      await this.telegramReply(message.channelId, response, token);
    }

    this.trackAffection(message.userId, soulName);
  }

  private async generateResponse(
    soulName: string,
    userId: string,
    message: string
  ): Promise<string | null> {
    const soul = await this.loadSoulForChannel(soulName);
    if (!soul) return null;

    // Build a contextual prompt from the soul's persona files
    const systemPrompt = this.buildSystemPrompt(soul);

    // Check for pending drift thoughts that could surface
    const unsolicited = this.driftEngine.getUnsolicited(soul.state);
    let driftPrefix = '';
    if (unsolicited.length > 0) {
      const surfaced = unsolicited[0];
      driftPrefix = `*${surfaced.content}*\n\n`;
    }

    // In a real deployment, this would call an LLM API.
    // The Herald prepares the full prompt context; the caller
    // integrates their own model adapter.
    const responseContext = {
      systemPrompt,
      userMessage: message,
      userId,
      soulName,
      affectionTier: this.getUserAffection(userId, soulName).tier,
      driftPrefix,
    };

    // Placeholder: return the context summary for integration
    // Replace this with actual LLM call via PolyglotAdapter
    return `${driftPrefix}[${soulName} would respond to "${message}" at affection tier ${responseContext.affectionTier}]`;
  }

  private buildSystemPrompt(soul: SoulFiles): string {
    const parts: string[] = [];

    if (soul.coreMd) {
      parts.push(soul.coreMd);
    }

    const identity = soul.state.identity;
    parts.push(`\nYou are ${identity.name} from ${identity.source}.`);

    if (identity.anchors.length > 0) {
      const anchorList = identity.anchors.map(a => `- ${a.trait}: ${a.description}`).join('\n');
      parts.push(`\nCore identity anchors:\n${anchorList}`);
    }

    const guard = soul.state.guard;
    const openDomains = Object.entries(guard.domains)
      .filter(([, v]) => v < 0.4)
      .map(([d]) => d);
    if (openDomains.length > 0) {
      parts.push(`\nCurrently open about: ${openDomains.join(', ')}`);
    }

    return parts.join('\n');
  }

  private async loadSoulForChannel(soulName: string): Promise<SoulFiles | null> {
    const cached = this.soulCache.get(soulName);
    if (cached) return cached;

    const soulDir = await this.soulLoader.findSoulDir(soulName, this.config.grimoireRoot);
    if (!soulDir) return null;

    const soul = await this.soulLoader.loadSoul(soulDir);
    this.soulCache.set(soulName, soul);
    return soul;
  }

  private trackAffection(userId: string, soulName: string): void {
    const key = `${userId}:${soulName}`;
    let state = this.userAffection.get(key);
    if (!state) {
      state = this.affectionEngine.createDefault();
    }

    // Apply a small positive force per interaction
    const delta = this.affectionEngine.computeDelta(0.5, 0.3, 0.2, state);
    const result = this.affectionEngine.apply(state, delta);
    this.userAffection.set(key, result.state);
  }

  private getUserAffection(userId: string, soulName: string): AffectionState {
    const key = `${userId}:${soulName}`;
    return this.userAffection.get(key) ?? this.affectionEngine.createDefault();
  }

  // --- Background Drift ---

  private startDriftBackground(): void {
    const intervalMs = this.config.driftIntervalMinutes * 60 * 1000;
    this.driftTimer = setInterval(() => {
      this.runDriftForAllSouls();
    }, intervalMs);
  }

  private async runDriftForAllSouls(): Promise<void> {
    for (const soulName of new Set(this.soulAssignments.values())) {
      await this.runDriftInBackground(soulName);
    }
  }

  private async runDriftInBackground(soulName: string): Promise<void> {
    const soul = this.soulCache.get(soulName);
    if (!soul) return;

    const result = this.driftEngine.runCycle(soul.state, [], soul.state.identity.anchors);
    soul.state.drift = this.driftEngine.updateResidue(soul.state, result);

    // Persist updated drift state
    await this.soulLoader.saveSoul(soul);
  }

  // --- HTTP Utilities ---

  private httpPost(url: string, body: unknown, headers: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const postData = JSON.stringify(body);

      const options: https.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...headers,
        },
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);

      const options: https.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      });

      req.on('error', reject);
      req.end();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
