import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import Stats from "../components/home/Stats";
import Features from "../components/home/Features";
import DashboardPreview from "../components/home/DashboardPreview";
import HowItWorks from "../components/home/HowItWorks";
import Testimonials from "../components/home/Testimonials";
import FAQ from "../components/home/FAQ";
import CTA from "../components/home/CTA";
import Footer from "../components/home/Footer";

function Home() {
  return (
    <div className="bg-slate-50 min-h-screen">

      <Navbar />

      <Hero />

      <Stats />

      <Features />

      <DashboardPreview />

      <HowItWorks />

      <Testimonials />

      <FAQ />

      <CTA />

      <Footer />

    </div>
  );
}

export default Home;