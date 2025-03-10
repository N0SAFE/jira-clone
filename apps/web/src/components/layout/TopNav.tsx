'use client'

import Link from 'next/link'
import { Bell, HelpCircle, LayoutDashboard, LogOut, Search, Settings, User, User as UserIcon } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@repo/ui/components/shadcn/dropdown-menu'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@repo/ui/components/shadcn/avatar'
import { Badge } from '@repo/ui/components/shadcn/badge'
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@repo/ui/components/shadcn/navigation-menu'
import { Separator } from '@repo/ui/components/shadcn/separator'
import { Authlogin, Profile, Settings as SettingsRouter } from '@/routes'
import { signOut } from '@/lib/auth/actions'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import nProgress from 'nprogress'
import Image from 'next/image'
import React, { useState } from 'react'
import { CommandMenu } from '../CommandMenu'
import { NotificationCenter } from '../notifications/NotificationCenter'

export function TopNav({
    children
}: React.PropsWithChildren<{}>) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    return (
        <div className="bg-background flex h-screen overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/public/download-removebg-preview.png"
                            alt="Logo"
                            width={32}
                            height={32}
                        />
                        <Link href="/" className="text-lg font-semibold">
                            Jira Clone
                        </Link>

                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden items-center gap-2 md:flex"
                            onClick={() => setIsSearchOpen(true)}
                        >
                            <Search className="h-4 w-4" />
                            <span>Search...</span>
                            <kbd className="bg-muted text-muted-foreground pointer-events-none ml-2 inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none">
                                <span>⌘</span>K
                            </kbd>
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Help Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <HelpCircle className="h-5 w-5" />
                                    <span className="sr-only">Help</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    Documentation
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    Keyboard Shortcuts
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    Report a Bug
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    About Jira Clone
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Notification Center */}
                        <NotificationCenter />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative h-8 w-8 rounded-full"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={
                                                session?.user?.image ||
                                                undefined
                                            }
                                            alt={session?.user?.name || 'User'}
                                        />
                                        <AvatarFallback>
                                            {session?.user?.name
                                                ? session.user.name[0].toUpperCase()
                                                : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                    {session?.user?.name || 'User'}
                                    <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                                        {session?.user?.email || ''}
                                    </p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/api/auth/signout">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">{children}</main>
            </div>

            {/* Command Menu (Global Search) */}
            <CommandMenu open={isSearchOpen} onOpenChange={setIsSearchOpen} />
        </div>
    )
}
