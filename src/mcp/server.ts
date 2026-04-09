// ============================================================
// The Soul Summoner's Grimoire — MCP Server
// Model Context Protocol server over stdio (JSON-RPC 2.0)
// ============================================================

import * as readline from 'readline';
import { getTools, findTool } from './tools';

// ---------------------------------------------------------------------------
// JSON-RPC types
// ---------------------------------------------------------------------------

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVER_NAME = 'grimoire-mcp';
const SERVER_VERSION = '6.0.0';
const PROTOCOL_VERSION = '2024-11-05';

/** Standard JSON-RPC error codes. */
const ERROR_PARSE = -32700;
const ERROR_INVALID_REQUEST = -32600;
const ERROR_METHOD_NOT_FOUND = -32601;
const ERROR_INVALID_PARAMS = -32602;
const ERROR_INTERNAL = -32603;

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function successResponse(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function errorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

// ---------------------------------------------------------------------------
// Method handlers
// ---------------------------------------------------------------------------

function handleInitialize(id: string | number | null, params: Record<string, unknown>): JsonRpcResponse {
  return successResponse(id, {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
  });
}

function handleToolsList(id: string | number | null): JsonRpcResponse {
  const tools = getTools().map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  return successResponse(id, { tools });
}

async function handleToolsCall(
  id: string | number | null,
  params: Record<string, unknown>,
): Promise<JsonRpcResponse> {
  const toolName = params.name as string | undefined;
  const toolArgs = (params.arguments as Record<string, unknown>) ?? {};

  if (!toolName) {
    return errorResponse(id, ERROR_INVALID_PARAMS, 'Missing required parameter: name');
  }

  const tool = findTool(toolName);
  if (!tool) {
    return errorResponse(
      id,
      ERROR_METHOD_NOT_FOUND,
      `Unknown tool: ${toolName}`,
      { availableTools: getTools().map((t) => t.name) },
    );
  }

  try {
    const result = await tool.handler(toolArgs);
    return successResponse(id, {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return successResponse(id, {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Message router
// ---------------------------------------------------------------------------

async function handleMessage(raw: string): Promise<JsonRpcResponse | null> {
  let request: JsonRpcRequest;

  try {
    request = JSON.parse(raw);
  } catch {
    return errorResponse(null, ERROR_PARSE, 'Parse error: invalid JSON');
  }

  if (!request || request.jsonrpc !== '2.0') {
    return errorResponse(
      request?.id ?? null,
      ERROR_INVALID_REQUEST,
      'Invalid request: missing jsonrpc 2.0 field',
    );
  }

  // Notifications (no id) do not receive responses per JSON-RPC spec.
  const isNotification = request.id === undefined || request.id === null;

  switch (request.method) {
    case 'initialize':
      return handleInitialize(request.id ?? null, request.params ?? {});

    case 'initialized':
      // Client acknowledgment notification — no response needed.
      return null;

    case 'tools/list':
      return handleToolsList(request.id ?? null);

    case 'tools/call':
      return await handleToolsCall(request.id ?? null, request.params ?? {});

    case 'notifications/cancelled':
    case 'notifications/progress':
    case 'notifications/message':
      // Known notifications — absorb silently.
      return null;

    case 'ping':
      return successResponse(request.id ?? null, {});

    default:
      // If it is a notification for an unknown method, silently ignore.
      if (isNotification) return null;
      return errorResponse(
        request.id ?? null,
        ERROR_METHOD_NOT_FOUND,
        `Method not found: ${request.method}`,
      );
  }
}

// ---------------------------------------------------------------------------
// Stdio transport
// ---------------------------------------------------------------------------

function send(response: JsonRpcResponse): void {
  const serialized = JSON.stringify(response);
  process.stdout.write(serialized + '\n');
}

function startServer(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: undefined,
    terminal: false,
  });

  // Suppress unhandled promise rejections from crashing the server.
  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    process.stderr.write(`[grimoire-mcp] Unhandled rejection: ${message}\n`);
  });

  rl.on('line', async (line: string) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;

    try {
      const response = await handleMessage(trimmed);
      if (response !== null) {
        send(response);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      send(errorResponse(null, ERROR_INTERNAL, `Internal server error: ${message}`));
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });

  process.stderr.write(`[grimoire-mcp] Server started (v${SERVER_VERSION})\n`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

startServer();
