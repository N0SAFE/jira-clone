'use client'

import { useState, useEffect } from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@repo/ui/components/shadcn/popover'
import { Button } from '@repo/ui/components/shadcn/button'
import { Bell, Check, Clock, RefreshCw, X } from 'lucide-react'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@repo/ui/components/shadcn/tabs'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Card, CardContent } from '@repo/ui/components/shadcn/card'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@repo/ui/components/shadcn/avatar'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import directus from '@/lib/directus'
import Link from 'next/link'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Collections } from '@repo/directus-sdk/client'
import { ApplyFields } from '@repo/directus-sdk/utils'

export function NotificationCenter() {
    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<string>('all')
    const [unreadCount, setUnreadCount] = useState<number>(0)

    // Fetch notifications
    const {
        data: notifications = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            try {
                return await directus.Notifications.query({
                    sort: ['-date_updated'],
                    filter: {
                        users: {
                            directus_user: {
                                id: {
                                    _eq: session?.user?.id,
                                },
                            },
                            read: {
                                _eq: false,
                            },
                        },
                    },
                    fields: [
                        '*',
                        {
                            user_created: ['*'],
                            related: ['collection', { item: ['*'] }],
                            users: ['*'],
                        },
                    ],
                    deep: {
                        users: {
                            _filter: {
                                directus_user: {
                                    id: {
                                        _eq: session?.user?.id,
                                    },
                                },
                            },
                        },
                    },
                })
            } catch (error) {
                console.error('Error fetching notifications:', error)
                return []
            }
        },
        enabled: !!session?.user?.id,
    })

    console.log(notifications)

    // Setup real-time updates for notifications
    useRealtimeUpdates({
        collection: 'notifications',
        queryKey: ['notifications'],
        showToast: true,
        toastMessages: {
            create: (data) => `New notification: ${data.title}`,
            update: (data) => `Notification updated: ${data.title}`,
            delete: (data) => `Notification removed: ${data.title}`,
        },
    })

    // Filter notifications based on active tab
    const filteredNotifications = notifications.filter((notification) => {
        if (activeTab === 'all') return true
        // if (activeTab === 'unread') return !notification.read
        // return notification.type === activeTab
        return true
    })

    // Update unread count whenever notifications change
    // useEffect(() => {
    //     setUnreadCount(notifications.filter((n) => !n.read).length)
    // }, [notifications])

    // Mark single notification as read
    // const markAsRead = async (id: string | number) => {
    //     try {
    //         await directus.Notification.update(id, {
    //             read: true,
    //         })
    //         await refetch()
    //         setUnreadCount((prev) => Math.max(0, prev - 1))
    //     } catch (error) {
    //         console.error('Error marking notification as read:', error)
    //         toast.error('Failed to mark notification as read')
    //     }
    // }

    // Mark all notifications as read
    // const markAllAsRead = async () => {
    //     try {
    //         await directus.Items('notifications').updateMany(
    //             notifications.filter((n) => !n.read).map((n) => n.id),
    //             { read: true }
    //         )
    //         await refetch()
    //         setUnreadCount(0)
    //     } catch (error) {
    //         console.error('Error marking all notifications as read:', error)
    //         toast.error('Failed to mark all notifications as read')
    //     }
    // }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0">
                            {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">View notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 md:w-96" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">Notifications</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => refetch()}
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span className="sr-only">
                                    Refresh notifications
                                </span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                // onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                            >
                                Mark all read
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="unread">
                                Unread
                                {unreadCount > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="info">Info</TabsTrigger>
                            <TabsTrigger value="warning">Alerts</TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value={activeTab}
                            className="max-h-[70vh] overflow-y-auto"
                        >
                            <Card>
                                <CardContent className="divide-y p-0">
                                    {isLoading ? (
                                        Array(3)
                                            .fill(0)
                                            .map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-3 p-4"
                                                >
                                                    <Skeleton className="h-8 w-8 rounded-full" />
                                                    <div className="w-full space-y-2">
                                                        <Skeleton className="h-4 w-3/4" />
                                                        <Skeleton className="h-3 w-1/2" />
                                                    </div>
                                                </div>
                                            ))
                                    ) : filteredNotifications.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <p className="text-muted-foreground text-sm">
                                                No notifications
                                            </p>
                                        </div>
                                    ) : (
                                        filteredNotifications.map(
                                            (notification) => (
                                                <NotificationItem
                                                    key={notification.id}
                                                    notification={notification}
                                                    // onMarkAsRead={() =>
                                                    //     markAsRead(
                                                    //         notification.id
                                                    //     )
                                                    // }
                                                />
                                            )
                                        )
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="text-muted-foreground text-center text-xs">
                        <Link href="/notifications" className="hover:underline">
                            View all notifications
                        </Link>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function NotificationItem({
    notification,
    onMarkAsRead,
}: {
    notification: ApplyFields<
        Collections.Notifications,
        [
            fields: [
                '*',
                {
                    user_created: ['*']
                    related: ['collection', { item: ['*'] }]
                    users: ['*']
                },
            ],
        ]
    >
    onMarkAsRead: () => void
}) {
    // // Set appropriate icon based on notification type
    // const getIcon = () => {
    //     switch (notification.type) {
    //         case 'success':
    //             return <Check className="h-5 w-5 text-green-500" />
    //         case 'warning':
    //             return <Clock className="h-5 w-5 text-amber-500" />
    //         case 'error':
    //             return <X className="h-5 w-5 text-red-500" />
    //         default:
    //             return <Bell className="h-5 w-5 text-blue-500" />
    //     }
    // }

    // Format notification time
    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diff < 60) return 'just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    return (
        <div
            className={cn(
                'hover:bg-muted/50 flex items-start gap-3 p-4 transition-colors',
                // !notification.read && 'bg-muted/30'
            )}
        >
            {notification.user_created ? (
                <Avatar className="h-8 w-8">
                    {notification.user_created.avatar ? (
                        <AvatarImage
                            src={notification.user_created.avatar}
                            alt={notification.user_created.first_name || ''}
                        />
                    ) : null}
                    <AvatarFallback>
                        {notification.user_created.first_name?.charAt(0) || ''}
                    </AvatarFallback>
                </Avatar>
            ) : (
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                    {/* {getIcon()} */}
                </div>
            )}

            <div className="flex-1 space-y-1 text-sm">
                <p className="font-medium">{notification.title}</p>
                <p className="text-muted-foreground">{notification.message}</p>

                {/* {notification.project && (
                    <div className="pt-1">
                        <Badge variant="outline" className="text-xs">
                            {notification.project.key}
                        </Badge>
                    </div>
                )} */}

                <div className="flex items-center justify-between pt-1">
                    <span className="text-muted-foreground text-xs">
                        {formatTime(notification.date_created ? new Date(notification.date_created) : new Date())}
                    </span>

                    <div className="flex gap-2">
                        {/* {!notification.read && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    onMarkAsRead()
                                }}
                            >
                                Mark read
                            </Button>
                        )} */}

                        {/* {notification.actionUrl && (
                            <Button
                                variant="link"
                                size="sm"
                                className="h-6 p-0 text-xs"
                                asChild
                            >
                                <Link href={notification.actionUrl}>View</Link>
                            </Button>
                        )} */}
                    </div>
                </div>
            </div>
        </div>
    )
}
