'use client';

export function SwapCard() {
    return (
        <div className="w-full max-w-[328px] sm:max-w-[436px] bg-[#27262c] rounded-3xl p-4 sm:p-6 border border-[#383241] shadow-xl relative z-10 transition-transform duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#f4eeff]">Swap</h2>
                <button className="text-[#b8add2] hover:text-[#f4eeff] transition-colors">
                    ⚙️
                </button>
            </div>

            <div className="space-y-2">
                {/* Input */}
                <div className="bg-[#08060b] rounded-2xl p-4 border border-[#383241] hover:border-[#7645d9]/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-[#b8add2] font-semibold">Pay</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <input type="text" placeholder="0.0" className="bg-transparent text-2xl outline-none w-full text-[#f4eeff] font-semibold" />
                        <button className="flex items-center justify-center gap-1 bg-[#27262c] hover:bg-[#383241] px-3 py-1.5 rounded-xl font-bold transition-colors text-[#f4eeff]">
                            <div className="w-5 h-5 rounded-full bg-blue-500 mr-1 flex items-center justify-center text-[10px] text-white">E</div>
                            ETH <span className="text-[#b8add2] ml-1">▾</span>
                        </button>
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center -my-3 relative z-10">
                    <button className="bg-[#383241] p-1.5 rounded-full border-4 border-[#27262c] hover:bg-[#1fc7d4] transition-colors group cursor-pointer focus:outline-none">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#27262c] rounded-full group-hover:bg-[#1fc7d4] transition-colors">
                            <span className="text-[#1fc7d4] group-hover:text-[#08060b] block transform rotate-90 font-bold transition-colors">↓</span>
                        </div>
                    </button>
                </div>

                {/* Output */}
                <div className="bg-[#08060b] rounded-2xl p-4 border border-[#383241] hover:border-[#7645d9]/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-[#b8add2] font-semibold">Receive</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <input type="text" placeholder="0.0" className="bg-transparent text-2xl outline-none w-full text-[#f4eeff] font-semibold" readOnly />
                        <button className="flex items-center justify-center gap-1 bg-[#27262c] px-3 py-1.5 rounded-xl font-bold cursor-default text-[#f4eeff]">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#7645d9] to-[#1fc7d4] mr-1 flex items-center justify-center text-[10px] text-white">C</div>
                            CLK
                        </button>
                    </div>
                </div>
            </div>

            <button className="w-full mt-4 bg-[#1fc7d4] hover:bg-[#31d0dd] text-[#08060b] font-bold text-base py-4 rounded-2xl transition-all shadow-[0_4px_0_rgba(20,150,160,1)] active:translate-y-1 active:shadow-none">
                Connect Wallet
            </button>
        </div>
    );
}
