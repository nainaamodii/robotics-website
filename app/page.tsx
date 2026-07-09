import Navbar from "@/components/navbar"
import Hero from "@/components/hero"
import WhoAreWe from "@/components/who-are-we"
import Purpose from "@/components/purpose"
import TechStack from "@/components/tech-stack"
import BentoProjects from "@/components/bento-projects"
import CarTimeline from "@/components/car-timeline"
import Achievements from "@/components/achievements"
import FAQ from "@/components/faq"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-deep)]">
      <Navbar />
      <Hero />
      <div className="section-divider" />
      <WhoAreWe />
      <div className="section-divider" />
      <Purpose />
      <div className="section-divider" />
      <TechStack />
      <div className="section-divider" />
      <BentoProjects />
      <div className="section-divider" />
      <CarTimeline />
      <div className="section-divider" />
      <Achievements />
      <div className="section-divider" />
      <FAQ />
      <Footer />
    </main>
  )
}
