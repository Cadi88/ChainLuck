import { Navbar } from './components/Navbar';
import { SwapCard } from './components/SwapCard';
import { LotteryCard } from './components/LotteryCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#08060b] flex flex-col font-sans">
      <Navbar />

      {/* Hero Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7645d9]/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-[#1fc7d4]/10 blur-[120px]" />
      </div>

      <main className="flex-1 flex flex-col items-center p-4 sm:p-8 relative z-10 w-full max-w-6xl mx-auto mt-6 lg:mt-12">

        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-6xl font-black text-[#1fc7d4] drop-shadow-[0_0_15px_rgba(31,199,212,0.4)] mb-4">
            ChainLuck
          </h1>
          <p className="text-lg sm:text-xl text-[#b8add2] font-semibold max-w-2xl mx-auto px-4">
            Trade tokens, enter the decentralized lottery, and win big in the Arbitrum ecosystem.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full justify-center items-center lg:items-start mt-4">
          <div className="w-full flex justify-center lg:justify-end lg:w-1/2">
            <SwapCard />
          </div>

          <div className="w-full flex justify-center lg:justify-start lg:w-1/2">
            <LotteryCard />
          </div>
        </div>
      </main>
    </div>
  );
}
