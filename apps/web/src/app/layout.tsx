import { Monitoring } from 'react-scan/monitoring/next'
import '@repo/ui/styles/globals.css' // ! load the local stylesheets first to allow for overrides of the ui package components
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@repo/ui/lib/utils'
import { type JSX } from 'react'
import Script from 'next/script'
import { validateEnv } from '#/env'
import { Providers } from './providers'
import { TopNav } from '@/components/layout/TopNav'

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
    title: 'Jira Clone',
    description: 'A Jira clone built with Next.js and shadcn/ui',
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}): Promise<JSX.Element> {
    const env = validateEnv(process.env)

    return (
        <html lang="en" className="h-full">
            <head>
                {env.REACT_SCAN && (
                    <Script
                        src="https://unpkg.com/react-scan/dist/auto.global.js"
                        strategy="beforeInteractive"
                        async
                    />
                )}
            </head>
            <body
                className={cn(
                    fontSans.variable,
                    'bg-background font-sans antialiased h-full'
                )}
            >
                {env.REACT_SCAN &&
                    env.REACT_SCAN_TOKEN && (
                        <Monitoring
                            apiKey={env.REACT_SCAN_TOKEN} // Safe to expose publically
                            url="https://monitoring.react-scan.com/api/v1/ingest"
                            commit={env.REACT_SCAN_GIT_COMMIT_HASH} // optional but recommended
                            branch={env.REACT_SCAN_GIT_BRANCH} // optional but recommended
                        />
                    )}
                <Providers>
                    <div className="bg-background flex flex-col h-screen">
                        <TopNav />
                        <main className="flex-1 overflow-y-auto">{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    )
}
