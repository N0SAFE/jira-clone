'use client'

import Link from 'next/link'
import { Bell, Settings, User as UserIcon } from 'lucide-react'
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
import { useRouter } from 'next/navigation'
import nProgress from 'nprogress'

export function TopNav() {
    const { data: session } = useSession()
    const router = useRouter()

    return (
        <div className="border-b">
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="text-lg font-semibold">
                        Jira Clone
                    </Link>
                    <Separator orientation="vertical" />
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <Link href="/projects" legacyBehavior passHref>
                                    <NavigationMenuLink
                                        className={navigationMenuTriggerStyle()}
                                    >
                                        Projects
                                    </NavigationMenuLink>
                                </Link>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                <div className="flex items-center space-x-4">
                    {session ? (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative"
                                    >
                                        <Bell className="h-5 w-5" />
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center p-0"
                                        >
                                            3
                                        </Badge>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-80"
                                >
                                    <DropdownMenuLabel>
                                        Notifications
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm">
                                                New comment on PROJ-123
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                2 minutes ago
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-8 w-8 rounded-full"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src="/avatars/01.png"
                                                alt={
                                                    session.user?.name ||
                                                    '@user'
                                                }
                                            />
                                            <AvatarFallback>
                                                {session.user?.name?.[0]?.toUpperCase() ||
                                                    'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-56"
                                    align="end"
                                >
                                    <DropdownMenuLabel>
                                        My Account
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            Profile.immediate(router)
                                        }
                                    >
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            SettingsRouter.immediate(router)
                                        }
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() =>
                                            nProgress.start() && signOut()
                                        }
                                    >
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Authlogin.Link>
                            <Button>Sign In</Button>
                        </Authlogin.Link>
                    )}
                </div>
            </div>
        </div>
    )
}
