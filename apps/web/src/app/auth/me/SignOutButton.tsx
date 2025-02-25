'use client'

import { Button } from '@repo/ui/components/shadcn/button'
import { signOut } from '@/lib/auth/actions'
import { useRouter } from 'next/navigation'
import { Home } from '@/routes'

const SignOutButton: React.FC = () => {
    const router = useRouter()
    
    return (
        <Button
            variant={'destructive'}
            onClick={async () => {
                await signOut({ redirect: false })
                Home.immediate(router)
                router.refresh()
            }}
        >
            Sign out
        </Button>
    )
}

export default SignOutButton
