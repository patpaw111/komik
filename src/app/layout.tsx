// import type { Metadata } from "next";
// import "./globals.css";

// export const metadata: Metadata = {
//   title: "SSSS Komik",
//   description: "SSSS Komik - Platform komik digital",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="id">
//       <body className="bg-base-dark transition-all duration-300 min-h-[100dvh] flex flex-col mb-83 lg:mb-0">
        
//         {children}
//       </body>
//     </html>
//   );
// }

import type { Metadata } from "next";
// 1. Import Font bawaan Next.js (WAJIB ADA)
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 2. Konfigurasi Font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SSSS Komik",
  description: "SSSS Komik - Platform komik digital",
  icons: {
    icon: "/logo/logo.png",
    shortcut: "/logo/logo.png",
    apple: "/logo/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      {/* 3. Masukkan variable font di sini & hapus bg-base-dark */}
      <body
        suppressHydrationWarning
        className={`
          ${geistSans.variable} ${geistMono.variable} 
          antialiased 
          min-h-screen 
          flex flex-col 
          pb-20 lg:pb-0 
          transition-colors duration-300
        `}
      >
        {children}
      </body>
    </html>
  );
}