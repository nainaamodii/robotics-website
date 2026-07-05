"use client"

import { motion } from "framer-motion"
import { Instagram, Linkedin, Mail, MapPin, Code2, Cpu } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-neutral-950 pt-24 pb-8 px-4 border-t border-white/5 relative overflow-hidden">

      {/* --- BACKGROUND: High-Tech Oscilloscope Line (Deterministic) --- */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden opacity-20 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,100 L50,100 L60,50 L70,100 L120,100 L130,20 L140,100 L200,100 L210,60 L220,100 L300,100 L310,10 L320,100 L400,100"
            fill="none"
            stroke="#E55B5B"
            strokeWidth="2"
            className="animate-pulse"
            vectorEffect="non-scaling-stroke"
          />
          {/* Repeating pattern via CSS Mask or just a long SVG path for visual effect */}
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-[#E55B5B]/10 to-transparent" />
      </div>

      {/* Top Laser Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/50 to-transparent shadow-[0_0_10px_#00D4FF]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-20">

          {/* Column 1: Brand Identity */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-6 h-6 text-[#E55B5B]" />
                <span className="text-2xl font-bold tracking-tight text-white">
                  MNNIT <span className="text-neutral-600">ROBOTICS</span>
                </span>
              </div>
              <p className="text-neutral-500 max-w-sm leading-relaxed text-sm">
                Forging the future through innovation, engineering, and automation. The official autonomous systems body of MNNIT Allahabad.
              </p>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900 border border-white/5 rounded-sm w-fit group hover:border-[#00D4FF]/30 transition-colors">
              <Cpu className="w-4 h-4 text-[#00D4FF] animate-spin-slow" />
              <span className="text-xs font-mono text-neutral-400 tracking-widest group-hover:text-[#00D4FF] transition-colors">SYSTEM STATUS: ONLINE</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00D4FF]" />
              EXPLORE
            </h4>
            <ul className="space-y-3 text-sm text-neutral-400 font-mono">
              {['Projects', 'Tech Stack', 'Achievements', 'Team'].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-[#00D4FF] hover:pl-2 transition-all duration-300 flex items-center gap-1 group w-fit">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00D4FF]">{`>`}</span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Connectivity */}
          <div>
            <h4 className="font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#E55B5B]" />
              CONNECT
            </h4>
            <div className="flex gap-3 mb-6">
              <SocialButton
                href="https://www.instagram.com/roboticsclubmnnit"
                icon={Instagram}
                color="hover:text-pink-500 hover:border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
              />
              <SocialButton
                href="https://www.linkedin.com/company/robotics-club-mnnit-allahabad"
                icon={Linkedin}
                color="hover:text-blue-500 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              />
              <SocialButton
                href="mailto:roboticsclub@mnnit.ac.in"
                icon={Mail}
                color="hover:text-red-500 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              />
            </div>
            <div className="flex items-start gap-3 text-neutral-500 text-sm group cursor-default">
              <div className="p-2 bg-neutral-900 rounded-sm border border-white/5 group-hover:border-white/20 transition-colors">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <p className="mt-1">Student Activity Centre,<br />MNNIT Allahabad, Prayagraj</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-600 text-xs font-mono">
            © {new Date().getFullYear()} MNNIT ROBOTICS CLUB.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-neutral-700 text-xs font-mono hover:text-white cursor-pointer transition-colors">PRIVACY_PROTOCOL</span>
            <span className="text-neutral-700 text-xs font-mono hover:text-white cursor-pointer transition-colors">TERMS_OF_SERVICE</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialButton({ href, icon: Icon, color }: { href: string, icon: any, color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-10 h-10 rounded-sm bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 transition-all duration-300 ${color}`}
    >
      <Icon className="w-5 h-5" />
    </a>
  )
}