'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LOTTERY_ABI, LOTTERY_ADDRESS, CHAINLUCK_TOKEN_ABI, CHAINLUCK_TOKEN_ADDRESS } from '../config/contracts';

export function LotteryCard() {
    const { address: userAddress } = useAccount();
    const [ticketsToBuy, setTicketsToBuy] = useState(1);

    // Read Lottery State
    const { data: lotteryStateData } = useReadContract({
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LOTTERY_ABI,
        functionName: 'lotteryState',
        query: { refetchInterval: 5000 }
    });
    const isOpen = Number(lotteryStateData) === 1;

    // Read Ticket Price
    const { data: ticketPriceData } = useReadContract({
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LOTTERY_ABI,
        functionName: 'ticketPrice',
    });
    const ticketPrice = ticketPriceData ? BigInt(ticketPriceData as any) : 0n;

    // Read Current Pot
    const { data: currentPotData } = useReadContract({
        address: LOTTERY_ADDRESS as `0x${string}`,
        abi: LOTTERY_ABI,
        functionName: 'currentPot',
        query: { refetchInterval: 5000 }
    });
    const currentPot = currentPotData ? BigInt(currentPotData as any) : 0n;

    // Read Token Allowance
    const { data: allowanceData } = useReadContract({
        address: CHAINLUCK_TOKEN_ADDRESS as `0x${string}`,
        abi: CHAINLUCK_TOKEN_ABI,
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, LOTTERY_ADDRESS as `0x${string}`],
        query: { enabled: !!userAddress, refetchInterval: 3000 }
    });
    const allowance = allowanceData ? BigInt(allowanceData as any) : 0n;

    // Calculations
    const formattedPot = formatEther(currentPot);
    const formattedPrice = formatEther(ticketPrice);
    const totalCost = ticketPrice * BigInt(ticketsToBuy);
    const needsApproval = allowance < totalCost;

    // Players estimation
    const playersCount = (ticketPrice > 0n && currentPot > 0n) ? Number(currentPot / ticketPrice) : 0;

    // Writes
    const { data: writeHash, isPending: isWritePending, writeContract } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: writeHash,
    });

    const handleAction = () => {
        if (!isOpen) return;

        if (needsApproval) {
            writeContract({
                address: CHAINLUCK_TOKEN_ADDRESS as `0x${string}`,
                abi: CHAINLUCK_TOKEN_ABI,
                functionName: 'approve',
                args: [LOTTERY_ADDRESS as `0x${string}`, totalCost],
            });
        } else {
            writeContract({
                address: LOTTERY_ADDRESS as `0x${string}`,
                abi: LOTTERY_ABI,
                functionName: 'buyTicket',
                args: [totalCost],
            });
        }
    };

    return (
        <div className="w-full max-w-[328px] sm:max-w-[436px] overflow-hidden bg-[#27262c] rounded-3xl border border-[#383241] shadow-xl relative z-10 transition-transform duration-300 hover:scale-[1.01]">
            <div className="bg-gradient-to-r from-[#7645d9] to-[#4a2b8e] p-6 text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#1fc7d4] opacity-20 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 blur-2xl rounded-full"></div>

                <h2 className="text-2xl font-bold text-white drop-shadow-md relative z-10">The ChainLuck Lottery</h2>
                <p className="text-[#1fc7d4] font-bold mt-1 text-sm relative z-10">
                    {isOpen ? 'Get your tickets now!' : 'Lottery is currently closed'}
                </p>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-center mb-2 text-[#b8add2] font-semibold">
                    <span>Current Pot</span>
                    <span className="text-[#1fc7d4] text-sm border border-[#1fc7d4]/30 bg-[#1fc7d4]/10 px-2 py-0.5 rounded-md">Live</span>
                </div>

                <div className="text-5xl font-black text-[#1fc7d4] mb-4 drop-shadow-[0_0_10px_rgba(31,199,212,0.3)] tabular-nums truncate">
                    {Number(formattedPot).toLocaleString()} <span className="text-2xl">CLK</span>
                </div>

                <div className="bg-[#08060b] rounded-2xl p-4 mb-6 border border-[#383241]">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[#b8add2] font-semibold">Ticket Price:</span>
                        <span className="text-[#f4eeff] font-bold bg-[#27262c] px-3 py-1 rounded-lg border border-[#383241]">
                            {formattedPrice} CLK
                        </span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[#b8add2] font-semibold">Players:</span>
                        <span className="text-[#f4eeff] font-bold">{playersCount}</span>
                    </div>

                    {/* Quantity Selector */}
                    {isOpen && (
                        <div className="flex justify-between items-center border-t border-[#383241] pt-3 mt-3">
                            <span className="text-[#b8add2] font-semibold">Quantity:</span>
                            <div className="flex items-center gap-3 bg-[#27262c] rounded-lg p-1">
                                <button
                                    onClick={() => setTicketsToBuy(Math.max(1, ticketsToBuy - 1))}
                                    className="w-8 h-8 flex items-center justify-center bg-[#383241] hover:bg-[#1fc7d4] hover:text-[#08060b] rounded font-bold transition-colors text-[#f4eeff]"
                                >
                                    -
                                </button>
                                <span className="font-bold text-[#f4eeff] w-4 text-center">{ticketsToBuy}</span>
                                <button
                                    onClick={() => setTicketsToBuy(ticketsToBuy + 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-[#383241] hover:bg-[#1fc7d4] hover:text-[#08060b] rounded font-bold transition-colors text-[#f4eeff]"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <ConnectButton.Custom>
                    {({ account, chain, openChainModal, openConnectModal, mounted }) => {
                        const ready = mounted;
                        const connected = ready && account && chain;

                        if (!ready) {
                            return (
                                <button disabled className="w-full bg-[#383241] text-[#b8add2] font-bold text-base py-4 rounded-2xl transition-all shadow-none cursor-not-allowed">
                                    Cargando...
                                </button>
                            );
                        }

                        if (!connected) {
                            return (
                                <button
                                    onClick={openConnectModal}
                                    className="w-full bg-[#1fc7d4] hover:bg-[#31d0dd] text-[#08060b] font-bold text-base py-4 rounded-2xl transition-all shadow-[0_4px_0_rgba(20,150,160,1)] active:translate-y-1 active:shadow-none"
                                >
                                    Conectar Billetera para Jugar
                                </button>
                            );
                        }

                        if (chain.unsupported) {
                            return (
                                <button
                                    onClick={openChainModal}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-base py-4 rounded-2xl transition-all shadow-[0_4px_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none"
                                >
                                    Red Incorrecta (Cambiar)
                                </button>
                            );
                        }

                        return (
                            <button
                                onClick={handleAction}
                                disabled={!isOpen || isWritePending || isConfirming}
                                className="w-full disabled:bg-[#383241] disabled:text-[#b8add2] disabled:shadow-none disabled:cursor-not-allowed bg-[#7645d9] hover:bg-[#8e60e8] text-[#f4eeff] font-bold text-base py-4 rounded-2xl transition-all shadow-[0_4px_0_#5820bd] active:translate-y-1 active:shadow-none"
                            >
                                {!isOpen
                                    ? 'Cerrada'
                                    : isWritePending
                                        ? 'Confirmar en Billetera...'
                                        : isConfirming
                                            ? 'Procesando...'
                                            : needsApproval
                                                ? `Aprobar ${ticketsToBuy * Number(formattedPrice)} CLK`
                                                : `Comprar ${ticketsToBuy} Ticket(s)`}
                            </button>
                        );
                    }}
                </ConnectButton.Custom>

                {isSuccess && (
                    <div className="mt-4 p-3 bg-[#1fc7d4]/10 border border-[#1fc7d4]/30 rounded-xl text-[#1fc7d4] text-sm font-semibold text-center">
                        Transaction sent successfully!
                    </div>
                )}
            </div>
        </div>
    );
}
