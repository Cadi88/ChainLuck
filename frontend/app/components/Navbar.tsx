'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export function Navbar() {
    return (
        <nav className="w-full h-[72px] bg-[#27262c] border-b border-[#383241] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2">
                    {/* Sleek ChainLuck Logo Placeholder */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7645d9] to-[#1fc7d4] flex items-center justify-center shadow-[0_0_10px_rgba(31,199,212,0.5)]">
                        <span className="font-bold text-white text-lg">C</span>
                    </div>
                    <span className="font-bold text-xl text-[#f4eeff] hidden sm:block tracking-wide">ChainLuck</span>
                </Link>

                <div className="hidden md:flex items-center gap-6 font-semibold text-[#b8add2] ml-4">
                    <Link href="#" className="hover:text-[#1fc7d4] transition-colors">Buy CLK</Link>
                    <Link href="#" className="text-[#1fc7d4]">Lottery</Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ConnectButton
                    chainStatus="icon"
                    showBalance={true}
                />
            </div>
        </nav>
    );
}
