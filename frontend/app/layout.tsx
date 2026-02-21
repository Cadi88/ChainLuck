import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const kanit = Kanit({
  weight: ['400', '600', '700'],
  subsets: ["latin"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "ChainLuck | Decentralized Lottery",
  description: "Buy CLK tokens and participate in the ChainLuck lottery on Arbitrum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${kanit.variable} font-sans antialiased text-[#f4eeff] bg-[#08060b]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
