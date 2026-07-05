import type React from "react"
import type { Metadata } from "next"
import { Sora } from "next/font/google"
import "./globals.css"
import { AuthProvider } from '@/lib/auth-context'
const _sora = Sora({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MNNIT Robotics Club - Forging the Future",
  description: "The official Robotics Club of MNNIT Allahabad. We bridge the gap between imagination and engineering.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased bg-neutral-950 text-neutral-100`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
