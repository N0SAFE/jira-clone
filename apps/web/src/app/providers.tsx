import { Monitoring } from 'react-scan/monitoring/next'
import NextAuthProviders from '@/utils/providers/NextAuthProviders/index'
import NextTopLoader from 'nextjs-toploader'
import ReactQueryProviders from '@/utils/providers/ReactQueryProviders'
import Validate from '@/lib/auth/validate'
import ThemeProvider from '@repo/ui/components/theme-provider'
import { type JSX } from 'react'
import { validateEnv } from '#/env'

export function Providers({
    children,
}: React.PropsWithChildren<{}>): JSX.Element {
    const env = validateEnv(process.env)

    return (
        <>
            {process.env.NODE_ENV === 'development' &&
                env.REACT_SCAN &&
                env.REACT_SCAN_TOKEN && (
                    <Monitoring
                        apiKey={env.REACT_SCAN_TOKEN} // Safe to expose publically
                        url="https://monitoring.react-scan.com/api/v1/ingest"
                        commit={env.REACT_SCAN_GIT_COMMIT_HASH} // optional but recommended
                        branch={env.REACT_SCAN_GIT_BRANCH} // optional but recommended
                    />
                )}
            <NextAuthProviders>
                <Validate>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <NextTopLoader showSpinner={false} />
                        <ReactQueryProviders>{children}</ReactQueryProviders>
                    </ThemeProvider>
                </Validate>
            </NextAuthProviders>
        </>
    )
}
