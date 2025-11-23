import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: {
    default: "TRIVAI - 8-bit Arcade Style Trivia Games",
    template: "%s | TRIVAI"
  },
  description: "Experience the ultimate 8-bit arcade style trivia games. Challenge yourself with fun, retro-styled questions across various categories!",
  generator: "Next.js",
  applicationName: "TRIVAI",
  referrer: "origin-when-cross-origin",
  keywords: ["trivia games", "8-bit games", "arcade games", "retro games", "online quiz", "trivia challenge"],
  authors: [{ name: "Piyush Gaba" }],
  creator: "TRIVAI",
  publisher: "TRIVAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'),
  openGraph: {
    title: "TRIVAI - 8-bit Arcade Style Trivia Games",
    description: "Experience the ultimate 8-bit arcade style trivia games. Challenge yourself with fun, retro-styled questions!",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com',
    siteName: "TRIVAI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TRIVAI - 8-bit Arcade Style Trivia Games',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TRIVAI - 8-bit Arcade Style Trivia Games",
    description: "Experience the ultimate 8-bit arcade style trivia games. Challenge yourself with fun, retro-styled questions!",
    images: ['/twitter-image.jpg'],
    creator: "@trivai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      // Use your logo as a favicon alternative
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
      // Use your logo for Apple devices
      { url: '/logo.svg' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#5bbad5' },
      // Add a shortcut icon for better compatibility
      { rel: 'shortcut icon', url: '/favicon.ico' },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#da532c',
    'theme-color': '#ffffff',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" 
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "TRIVAI",
              "logo": `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/logo.png`,
              "url": process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com',
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              },
              "description": "8-bit arcade style trivia games for endless fun and challenge"
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-grid-pattern">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
