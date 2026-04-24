import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'

// Configure the Poppins font
const poppins = Poppins({
  weight: ['400', '600', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Creamos Quiz Game',
  description: 'A multiplayer trivia game about our creative agency.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}