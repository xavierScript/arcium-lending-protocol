import { Navbar } from "@/components/landing-page-components/Navbar";
import { Hero } from "@/components/landing-page-components/Hero";
import { Stats } from "@/components/landing-page-components/Stats";
import { Features } from "@/components/landing-page-components/Features";
import { Partners } from "@/components/landing-page-components/Partners";
import { FAQ } from "@/components/landing-page-components/FAQ";
import { Footer } from "@/components/landing-page-components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-white selection:bg-[#00ff9d]/30 relative overflow-hidden">
      <div className="ambient-glow-blue" />
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <FAQ />
      <Partners />
      <Footer />
    </main>
  );
}