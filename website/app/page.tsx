import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import SystemsShowcase from '@/components/SystemsShowcase';
import Philosophy from '@/components/Philosophy';
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
        <SystemsShowcase />
        <Philosophy />
        <ComparisonTable />
        <QuickStart />
        <Ecosystem />
      </main>
      <Footer />
    </>
  );
}
