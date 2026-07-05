import Navbar from "@/components/navbar"
import Hero from "@/components/hero"
import WhoAreWe from "@/components/who-are-we"
import Purpose from "@/components/purpose"
import TechStack from "@/components/tech-stack"
import FeaturedProjects from "@/components/featured-projects"
import Achievements from "@/components/achievements"
import FAQ from "@/components/faq"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <Navbar />
      <Hero />
      <WhoAreWe />
      <Purpose />
      <TechStack />
      <FeaturedProjects />
      <Achievements />
      <FAQ />
      <Footer />
    </main>
  )
}
