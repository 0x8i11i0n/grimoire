import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import DriftTicker from '@/components/DriftTicker';
import SystemsShowcase from '@/components/SystemsShowcase';
import CoreEngine from '@/components/CoreEngine';
import Philosophy from '@/components/Philosophy';
import SoulGallery from '@/components/SoulGallery';
import ComparisonTable from '@/components/ComparisonTable';
import QuickStart from '@/components/QuickStart';
import Ecosystem from '@/components/Ecosystem';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <DriftTicker />
        <SystemsShowcase />
        <CoreEngine />
        <Philosophy />
        <SoulGallery />
        <ComparisonTable />
        <QuickStart />
        <Ecosystem />
      </main>
      <Footer />
    </>
  );
}
