"use client"

import { useSiteContent } from "@/lib/use-site-content"
import { Instagram, Linkedin, Mail } from "lucide-react"

const iconMap: Record<string, any> = { Instagram, Linkedin, Mail }

const defaults = {
  brandName: "MNNIT Robotics",
  brandDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
  address: "Student Activity Centre, MNNIT Allahabad, Prayagraj",
  socialLinks: [
    { platform: "Instagram", url: "https://www.instagram.com/roboticsclubmnnit", icon: "Instagram" },
    { platform: "LinkedIn", url: "https://www.linkedin.com/company/robotics-club-mnnit-allahabad", icon: "Linkedin" },
    { platform: "Email", url: "mailto:roboticsclub@mnnit.ac.in", icon: "Mail" },
  ],
  navLinks: [
    { label: "About", href: "#who-are-we" },
    { label: "Projects", href: "/projects" },
    { label: "Events", href: "/events" },
    { label: "Team", href: "/team" },
  ],
}

export default function Footer() {
  const { content } = useSiteContent("footer", defaults)
  const data = content ?? defaults

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-1">
            <p className="font-display font-bold text-lg text-[var(--fg)] mb-3">{data.brandName}</p>
            <p className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-6">{data.brandDescription}</p>
            <div className="flex gap-3">
              {(data.socialLinks ?? []).map((s: any) => {
                const Icon = iconMap[s.icon] || Mail
                return (
                  <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:border-[var(--border-hover)] transition-colors"
                    aria-label={s.platform}>
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--fg)] mb-4">Links</p>
            <ul className="space-y-2">
              {(data.navLinks ?? []).map((link: any) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--fg)] mb-4">Location</p>
            <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{data.address}</p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] text-xs text-[var(--fg-tertiary)]">
          &copy; {new Date().getFullYear()} MNNIT Robotics Club
        </div>
      </div>
    </footer>
  )
}
