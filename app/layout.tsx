import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DevMind',
  description: 'AI-powered development workflow orchestration platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}