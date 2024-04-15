import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DevMind - AI-Powered Development Workflow Orchestration',
  description: 'Intelligent workflow automation for development teams powered by AI agents. Automate code review, testing, and deployment with cutting-edge LLM technology.',
  keywords: ['AI', 'development', 'workflow', 'automation', 'agents', 'LLM', 'code review', 'testing', 'deployment'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}