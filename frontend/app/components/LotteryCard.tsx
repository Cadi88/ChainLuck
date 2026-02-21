'use client';

export function LotteryCard() {
    return (
        <div className="w-full max-w-[328px] sm:max-w-[436px] overflow-hidden bg-[#27262c] rounded-3xl border border-[#383241] shadow-xl relative z-10 transition-transform duration-300 hover:scale-[1.01]">
            <div className="bg-gradient-to-r from-[#7645d9] to-[#4a2b8e] p-6 text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#1fc7d4] opacity-20 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 blur-2xl rounded-full"></div>

                <h2 className="text-2xl font-bold text-white drop-shadow-md relative z-10">The ChainLuck Lottery</h2>
                <p className="text-[#1fc7d4] font-bold mt-1 text-sm relative z-10">Get your tickets now!</p>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-center mb-2 text-[#b8add2] font-semibold">
                    <span>Current Pot</span>
                    <span className="text-[#1fc7d4] text-sm border border-[#1fc7d4]/30 bg-[#1fc7d4]/10 px-2 py-0.5 rounded-md">Draw in: 2h 15m</span>
                </div>

                <div className="text-5xl font-black text-[#1fc7d4] mb-1 drop-shadow-[0_0_10px_rgba(31,199,212,0.3)] tabular-nums">
                    15,000 CLK
                </div>
                <p className="text-[#b8add2] font-semibold mb-6">~ $150.00 USD</p>

                <div className="bg-[#08060b] rounded-2xl p-4 mb-6 border border-[#383241]">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[#b8add2] font-semibold">Ticket Price:</span>
                        <span className="text-[#f4eeff] font-bold bg-[#27262c] px-3 py-1 rounded-lg border border-[#383241]">100 CLK</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[#b8add2] font-semibold">Players:</span>
                        <span className="text-[#f4eeff] font-bold">42</span>
                    </div>
                </div>

                <button className="w-full bg-[#7645d9] hover:bg-[#8e60e8] text-[#f4eeff] font-bold text-base py-4 rounded-2xl transition-all shadow-[0_4px_0_#5820bd] active:translate-y-1 active:shadow-none">
                    Approve CLK to Buy Tickets
                </button>
            </div>
        </div>
    );
}
