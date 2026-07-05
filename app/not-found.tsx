"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { AlertTriangle, WifiOff, Home, Terminal } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden text-center px-4">

            {/* --- BACKGROUND: Error Grid --- */}
            <div className="absolute inset-0 opacity-[0.1] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#E55B5B 1px, transparent 1px), linear-gradient(90deg, #E55B5B 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Ambient Red Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E55B5B]/10 rounded-full blur-[120px] pointer-events-none" />

            {/* --- CONTENT --- */}
            <div className="relative z-10 max-w-2xl">

                {/* Animated Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mb-8 w-24 h-24 bg-[#E55B5B]/10 rounded-full flex items-center justify-center border border-[#E55B5B]/30 relative"
                >
                    <div className="absolute inset-0 rounded-full border border-[#E55B5B] border-dashed animate-[spin_10s_linear_infinite]" />
                    <WifiOff className="w-10 h-10 text-[#E55B5B]" />
                </motion.div>

                {/* Glitchy 404 Text */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-8xl md:text-9xl font-black text-white tracking-tighter mb-2 relative inline-block"
                >
                    <span className="relative z-10">404</span>
                    <span className="absolute top-0 left-1 -z-10 text-[#E55B5B] opacity-50 animate-pulse">404</span>
                    <span className="absolute top-0 -left-1 -z-10 text-[#00D4FF] opacity-50 animate-pulse delay-75">404</span>
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E55B5B]/20 border border-[#E55B5B]/50 rounded text-[#E55B5B] font-mono text-sm tracking-widest uppercase">
                        <AlertTriangle size={14} />
                        System_Critical_Error
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl md:text-3xl font-bold text-white mb-6 uppercase tracking-wide"
                >
                    Signal Lost in Void
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-neutral-400 font-mono text-sm md:text-base max-w-lg mx-auto mb-10 leading-relaxed"
                >
                    The coordinates you requested lie outside the operational grid.
                    The requested sector has either been decommissioned or never existed.
                </motion.p>

                {/* Fake Terminal Output */}
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.6 }}
                    className="bg-black/50 border-l-2 border-[#E55B5B] text-left p-4 max-w-md mx-auto mb-10 font-mono text-xs text-neutral-500"
                >
                    <p><span className="text-[#E55B5B]">{`>`}</span> ESTIMATING_LOCATION... [FAILED]</p>
                    <p><span className="text-[#E55B5B]">{`>`}</span> REROUTING_NAVIGATION... [PENDING]</p>
                    <p className="animate-pulse"><span className="text-[#00D4FF]">{`>`}</span> AWAITING_MANUAL_OVERRIDE_</p>
                </motion.div>

                {/* Action Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <Link href="/">
                        <button className="relative group px-8 py-3 bg-transparent overflow-hidden">
                            {/* Button Shape */}
                            <div
                                className="absolute inset-0 border border-[#00D4FF] bg-[#00D4FF]/5 transition-all duration-300 group-hover:bg-[#00D4FF] group-hover:scale-[1.02]"
                                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                            />

                            {/* Text */}
                            <span className="relative font-mono font-bold tracking-widest text-[#00D4FF] text-sm group-hover:text-black transition-colors z-10 flex items-center gap-2">
                                <Terminal size={16} />
                                RETURN_TO_BASE
                            </span>

                            {/* Accents */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-[#00D4FF] pointer-events-none" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-[#00D4FF] pointer-events-none" />
                        </button>
                    </Link>
                </motion.div>

            </div>
        </div>
    )
}