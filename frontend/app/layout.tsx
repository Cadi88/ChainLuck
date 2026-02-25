import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

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
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#27262c',
              color: '#f4eeff',
              border: '1px solid #383241',
            },
            success: {
              iconTheme: {
                primary: '#1fc7d4',
                secondary: '#08060b',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
