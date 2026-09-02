import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google"
import { ThemeProvider } from "@primer/react/next"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Actions Graph",
  description: "GitHub Actions workflow YAMLをグラフとして可視化するツール",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
      </head>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${notoSansJP.variable}
          antialiased
        `}
      >
        <ThemeProvider colorMode="day">{children}</ThemeProvider>
      </body>
    </html>
  )
}
