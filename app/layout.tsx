import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mia's Corner of the Internet",
  description: "A personal website by Mia Shen",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
