import { connectDB } from './db'
import { upsertSectionContent } from './models/site-content'

const sections: Record<string, Record<string, any>> = {
  navbar: {
    logo: { text: "MNNIT", subtitle: "EST. 2016" },
    links: [
      { name: "Home", href: "/" },
      { name: "About", href: "#who-are-we" },
      { name: "Projects", href: "/projects" },
      { name: "Events", href: "/events" },
    ],
  },

  hero: {
    tagline: "IDEATE. INNOVATE. AUTOMATE.",
    heading: "Forging the Future,",
    headingLine2: "One Bot at a Time",
    subheading: "The official Robotics Club of MNNIT. We bridge the gap between imagination and engineering, fostering a community of creators, makers, and innovators.",
    ctaPrimary: { text: "INITIALIZE PROTOCOL", href: "/events" },
    ctaSecondary: { text: "EXPLORE PROJECTS", href: "/projects" },
  },

  "who-are-we": {
    badge: "Identity_Module",
    heading: "Architects of the",
    headingAccent: "Future",
    description: [
      "Robotics Club MNNIT is a dynamic ecosystem of innovators operating under the Student Activity Centre.",
      "We don't just build robots; we bridge the gap between software intelligence and hardware reality. Since our inception, we have been the breeding ground for interdisciplinary engineering.",
    ],
    stats: [
      { label: "Established", value: "2016" },
      { label: "Projects Shipped", value: "50+" },
    ],
    competencies: [
      { title: "Computer Vision", icon: "Target" },
      { title: "ROS & Simulation", icon: "Globe" },
      { title: "Embedded Systems", icon: "Cpu" },
      { title: "CAD & Design", icon: "PenTool" },
      { title: "Machine Learning", icon: "Code" },
      { title: "Kinematics", icon: "Zap" },
    ],
  },

  purpose: {
    badge: "Mission Protocols",
    heading: "Our",
    headingAccent: "Core Purpose",
    cards: [
      {
        title: "Unite Curious Minds",
        description: "A convergence point for multidisciplinary engineering. We bridge the gap between theoretical curiosity and practical application.",
        icon: "Users",
        color: "blue",
      },
      {
        title: "Hands-on Experience",
        description: "Deployment of real-world scenarios. Mastering embedded systems, mechanical design, and control theory through direct fabrication.",
        icon: "Lightbulb",
        color: "cyan",
      },
      {
        title: "Compete & Excel",
        description: "High-performance bot development for national arenas. Pushing the limits of torque, speed, and autonomous navigation.",
        icon: "Rocket",
        color: "red",
      },
      {
        title: "Inspire & Educate",
        description: "Knowledge transfer protocols. Workshops and outreach programs designed to ignite the next generation of roboticists.",
        icon: "Zap",
        color: "amber",
      },
    ],
  },

  "tech-stack": {
    heading: "Tech",
    headingAccent: "Arsenal",
    technologies: [
      { name: "AI/ML", icon: "🧠", description: "Neural networks & autonomous decision making.", span: "col-span-2 md:col-span-2 md:row-span-2", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800" },
      { name: "Aerial Robots", icon: "🚁", description: "Swarm intelligence and UAV flight dynamics.", span: "col-span-2 md:col-span-2 md:row-span-1", image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=800" },
      { name: "ROS", icon: "🤖", description: "The backbone of our robotic communication.", span: "col-span-1 md:col-span-1 md:row-span-1", image: "https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&q=80&w=400" },
      { name: "Image Processing", icon: "📸", description: "Computer vision for real-time tracking.", span: "col-span-1 md:col-span-1 md:row-span-1", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400" },
      { name: "Underwater Robots", icon: "🌊", description: "Navigating the complexities of AUVs.", span: "col-span-2 md:col-span-2 md:row-span-2", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800" },
      { name: "Path Planning & SLAM", icon: "🗺️", description: "Localization in unknown environments.", span: "col-span-2 md:col-span-2 md:row-span-1", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800" },
      { name: "Electronics", icon: "⚡", description: "PCB design and power management.", span: "col-span-1 md:col-span-1 md:row-span-1", image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=400" },
      { name: "3D Printing & CAD", icon: "🖨️", description: "From digital models to physical prototypes.", span: "col-span-1 md:col-span-1 md:row-span-1", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400" },
      { name: "Internet of Things", icon: "🌐", description: "Connecting hardware to the cloud.", span: "col-span-2 md:col-span-2 md:row-span-1", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800" },
      { name: "Kinematics & Control", icon: "⚙️", description: "The physics of motion and precision.", span: "col-span-1 md:col-span-1 md:row-span-1", image: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=400" },
      { name: "Simulation Software", icon: "🖥️", description: "Gazebo and Webots testing environments.", span: "col-span-1 md:col-span-1 md:row-span-1", image: "https://images.unsplash.com/photo-1558494949-ef010ccdcc39?auto=format&fit=crop&q=80&w=400" },
    ],
  },

  achievements: {
    heading: "In The",
    headingAccent: "Headlines",
    items: [
      { title: "MNNIT students develop first self-driving car prototype", source: "Times of India", date: "Dec 2019", category: "Automotive", rank: "01" },
      { title: "Breakthrough innovation in Prosthetic Arm technology", source: "Dainik Bhaskar", date: "Aug 2021", category: "Biomedical", rank: "02" },
      { title: "Vision Guided Rover deployed for advanced surveillance", source: "Jagran News", date: "Feb 2023", category: "Defense", rank: "03" },
    ],
  },

  faq: {
    heading: "Common",
    headingAccent: "Queries",
    items: [
      { question: "Do I need prior coding experience?", answer: "Not at all! Our programs are designed for beginners. We provide the necessary knowledge base and mentorship to get you started." },
      { question: "Does the club provide components?", answer: "Yes. We allocate hardware resources for all sanctioned club projects and R&D initiatives." },
      { question: "Can students from any branch join?", answer: "Absolutely. Robotics is an interdisciplinary field. We welcome diverse skill sets including mechanical, electrical, and computer science." },
    ],
  },

  footer: {
    brandName: "MNNIT ROBOTICS",
    brandDescription: "Forging the future through innovation, engineering, and automation. The official autonomous systems body of MNNIT Allahabad.",
    address: "Student Activity Centre, MNNIT Allahabad, Prayagraj",
    socialLinks: [
      { platform: "Instagram", url: "https://www.instagram.com/roboticsclubmnnit", icon: "Instagram" },
      { platform: "LinkedIn", url: "https://www.linkedin.com/company/robotics-club-mnnit-allahabad", icon: "Linkedin" },
      { platform: "Email", url: "mailto:roboticsclub@mnnit.ac.in", icon: "Mail" },
    ],
    navLinks: [
      { label: "Projects", href: "/projects" },
      { label: "Tech Stack", href: "#tech-stack" },
      { label: "Achievements", href: "#achievements" },
      { label: "Team", href: "/team" },
    ],
  },

  "car-timeline": {
    heading: "The Self-Driving Car Journey",
    milestones: [
      { title: "Project Inception", date: "2018-01", description: "Initial concept and team formation for the autonomous vehicle project.", contributors: [] },
      { title: "First Prototype", date: "2019-06", description: "Successfully built and tested the first hardware prototype with basic sensor integration.", contributors: [] },
      { title: "Media Recognition", date: "2019-12", description: "Featured in Times of India for the self-driving car prototype demonstration.", contributors: [] },
      { title: "V2 Development", date: "2021-03", description: "Second generation with improved SLAM, path planning, and computer vision capabilities.", contributors: [] },
      { title: "Campus Demo", date: "2023-02", description: "Live autonomous navigation demonstration on MNNIT campus roads.", contributors: [] },
    ],
  },
}

async function seed() {
  await connectDB()
  console.log('Seeding site_content collection...')

  for (const [sectionId, content] of Object.entries(sections)) {
    await upsertSectionContent(sectionId, content)
    console.log(`  Seeded: ${sectionId}`)
  }

  console.log('Done! All sections seeded.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
