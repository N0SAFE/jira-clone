'use client'

import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@repo/ui/components/shadcn/card'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { useProject } from '@/context/ProjectContext'
import directus from '@/lib/directus'
import Link from 'next/link'
import { Button } from '@repo/ui/components/shadcn/button'
import { 
    Trash,
    Pencil,
    Send,
    ArrowUpRight, 
    ChevronRight, 
    GitMerge, 
    Plus, 
    Calendar, 
    CheckCircle2, 
    Flag, 
    GitFork, 
    MessageSquare, 
    Paperclip, 
    Clock, 
    User, 
    Tag, 
    Hash,
    BookOpen,
    AlertTriangle,
    FileSpreadsheet,
    LayoutGrid,
    Bug,
    Bookmark,
    Target
} from 'lucide-react'
import { useState, useCallback } from 'react'
import CreateTicketDialog from '@/components/tickets/CreateTicketDialog'
import { Collections } from '@repo/directus-sdk/client'
import { Separator } from '@repo/ui/components/shadcn/separator'
import { cn, formatDate, formatRelativeTime } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/shadcn/tooltip'
import { EditableField } from '@/components/tickets/EditableField'
import { useEditableField } from '@/hooks/useEditableField'
import { Textarea } from '@repo/ui/components/shadcn/textarea'
import { Input } from '@repo/ui/components/shadcn/input'
import { useSession } from 'next-auth/react'

// Dynamic icon component based on icon name from API
const DynamicIcon = ({ iconName }: { iconName?: string }) => {
    if (!iconName) return <CheckCircle2 className="h-4 w-4" />;
    
    // Use the icon directly from the API
    try {
        const Icon = require('lucide-react')[iconName];
        return Icon ? <Icon className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />;
    } catch (e) {
        // Fallback to default if icon not found in Lucide
        return <CheckCircle2 className="h-4 w-4" />;
    }
};

/**
 * User avatar component that works with or without image
 */
const UserAvatar = ({ user, size = "md" }: { user: any, size?: "sm" | "md" | "lg" }) => {
    if (!user) return null;
    
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;
    const sizeMap = {
        sm: "h-6 w-6 text-xs",
        md: "h-8 w-8 text-sm",
        lg: "h-10 w-10 text-base"
    };
    
    return (
        <Avatar className={cn(sizeMap[size])}>
            {user.avatar ? (
                <AvatarImage src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />
            ) : null}
            <AvatarFallback>{initials || '?'}</AvatarFallback>
        </Avatar>
    );
};

/**
 * Component for displaying a ticket in a parent/child relationship
 */
const RelatedTicket = ({ ticket, relationLabel }: { ticket: any, relationLabel: string }) => {
    if (!ticket) return null;
    
    const typeIcon = typeof ticket.type === 'object' ? ticket.type?.icon : null;
    
    return (
        <Card className="border-dashed">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-dashed">
                            {relationLabel}
                        </Badge>
                        
                        <div className="text-muted-foreground">
                            <DynamicIcon iconName={typeIcon} />
                        </div>
                        
                        <span className="font-medium text-sm">
                            {ticket.key || `#${ticket.id}`}
                        </span>
                    </div>
                    
                    {ticket.status && (
                        <Badge
                            variant="secondary"
                            style={{
                                backgroundColor: ticket.status?.color || '#ccc',
                                color: '#fff',
                            }}
                            className="text-xs"
                        >
                            {ticket.status?.name}
                        </Badge>
                    )}
                </div>
                
                <h4 className="mt-2 font-medium">
                    <Link 
                        href={`/projects/${ticket.project?.id || ticket.project}/tickets/${ticket.id}`}
                        className="hover:underline"
                    >
                        {ticket.title}
                    </Link>
                </h4>
                
                {ticket.assignee && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <UserAvatar user={ticket.assignee} size="sm" />
                        <span>{ticket.assignee.first_name} {ticket.assignee.last_name}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Add this new Comment component
const Comment = ({ comment, onEdit, canEdit }: { comment: any, onEdit: (id: number, text: string) => Promise<void>, canEdit: boolean }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    
    return (
        <div className="flex gap-4 py-4">
            <UserAvatar user={comment.user_created} size="sm" />
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.user_created?.first_name} {comment.user_created?.last_name}</span>
                        <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(comment.date_created)}
                        </span>
                    </div>
                    {canEdit && !isEditing && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </Button>
                    )}
                </div>
                
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditText(comment.text);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={async () => {
                                    await onEdit(comment.id, editText);
                                    setIsEditing(false);
                                }}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none">
                        {comment.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TicketPage() {
    const {data: session} = useSession()
    const params = useParams()
    const ticketId = params.ticketId as string
    const projectQuery = useProject()
    const projectId = projectQuery?.data?.id
    const [isCreateChildOpen, setIsCreateChildOpen] = useState(false)
    const queryClient = useQueryClient()
    const [newComment, setNewComment] = useState('');
    const [isCreateCommentOpen, setIsCreateCommentOpen] = useState(false)

    // Fetch the current ticket with parent_ticket and ticket_type fields
    const { data: ticket, isLoading } = useQuery({
        queryKey: ['projects', projectId, 'tickets', Number(ticketId)],
        queryFn: async () => {
            return directus.Ticket.get(Number(ticketId), {
                fields: [
                    '*',
                    'count(childs)',
                    {
                        user_created: ['id', 'first_name', 'last_name', 'avatar'],
                        assignee: ['id', 'first_name', 'last_name', 'avatar'],
                        reporter: ['id', 'first_name', 'last_name', 'avatar'],
                        priority: ['*'],
                        status: ['*'],
                        type: ['*'],
                        sprint: ['id', 'name', 'start_date', 'end_date'],
                        epic: ['id', 'title', 'key'],
                        parent: [
                            '*',
                            {
                                user_created: ['first_name', 'last_name'],
                                assignee: ['id', 'first_name', 'last_name', 'avatar'],
                                priority: ['*'],
                                status: ['*'],
                                type: ['*'],
                                project: ['id']
                            },
                        ],
                        childs: [
                            '*',
                            {
                                user_created: ['first_name', 'last_name'],
                                assignee: ['id', 'first_name', 'last_name', 'avatar'],
                                priority: ['*'],
                                status: ['*'],
                                type: ['*'],
                                project: ['id']
                            },
                        ],
                    },
                ],
            })
        },
        enabled: !!projectId && !!ticketId,
    })

    // Add comments query
    const { data: comments, refetch: refetchComments } = useQuery({
        queryKey: ['projects', projectId, 'tickets', Number(ticketId), 'comments'],
        queryFn: async () => {
            return directus.TicketsComments.query({
                filter: {
                    ticket: { _eq: Number(ticketId) }
                },
                fields: [
                    '*',
                    {
                        user_created: ['id', 'first_name', 'last_name', 'avatar'],
                    }
                ],
                sort: ['-date_created']
            });
        },
        enabled: !!projectId && !!ticketId,
    });

    // Function to create a new comment
    const createComment = useCallback(async (content: string) => {
        await directus.TicketsComment.create({
            content,
            ticket: Number(ticketId),
        })
        queryClient.invalidateQueries({queryKey: ['projects', projectId, 'tickets', Number(ticketId)]})
    }, [projectId, ticketId, queryClient])

    // Function to update a comment
    const updateComment = useCallback(async (commentId: number, content: string) => {
        await directus.TicketsComment.update(commentId, {
            content,
        })
        queryClient.invalidateQueries({queryKey: ['projects', projectId, 'tickets', Number(ticketId)]})
    }, [projectId, ticketId, queryClient])

    // Function to delete a comment
    const deleteComment = useCallback(async (commentId: number) => {
        await directus.TicketsComment.remove(commentId)
        queryClient.invalidateQueries({queryKey: ['projects', projectId, 'tickets', Number(ticketId)]})
    }, [projectId, ticketId, queryClient])

    // Refetch ticket data after updates
    const refreshTicket = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tickets', Number(ticketId)] })
    }, [queryClient, projectId, ticketId])

    if (isLoading || !ticket) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-muted-foreground">Loading ticket...</p>
                </div>
            </div>
        );
    }

    // Check if the ticket type level allows for children
    const canHaveChildren = ticket.type?.level !== 0;
    // Build a formatted key for the ticket
    const formattedKey = `${projectQuery?.data?.key}-${String(ticket.id).padStart(4, '0')}`;

    return (
        <div className="space-y-6 p-8 pt-6">
            {/* Ticket Navigation Header */}
            <div className="flex items-center text-sm text-muted-foreground">
                <Link href={`/projects/${projectId}/tickets`} className="hover:text-primary hover:underline transition-colors">
                    Tickets
                </Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="font-medium text-primary">{formattedKey}</span>
            </div>

            {/* Ticket Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        {ticket.type && (
                            <Badge
                                className="bg-background border cursor-pointer"
                                style={{ color: ticket.type.color || '#555' }}
                            >
                                <DynamicIcon iconName={ticket.type.icon} />
                                <EditableField
                                    value={ticket.type.id}
                                    type="select"
                                    selectOptions={ticket.available_types?.map((t: any) => ({
                                        value: t.id,
                                        label: t.name
                                    })) || []}
                                    onSave={async (value) => {
                                        await directus.Ticket.update(Number(ticketId), {
                                            type: value
                                        })
                                        refreshTicket()
                                    }}
                                />
                            </Badge>
                        )}
                        <h1 className="text-3xl font-bold tracking-tight">
                            <EditableField
                                value={ticket.title}
                                onSave={async (value) => {
                                    await directus.Ticket.update(Number(ticketId), {
                                        title: value
                                    })
                                    refreshTicket()
                                }}
                                className="text-3xl font-bold"
                            />
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground text-sm">{formattedKey}</span>
                        <span className="text-muted-foreground text-sm">•</span>
                        <span className="text-muted-foreground text-sm">Created {formatDate(ticket.date_created)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                                backgroundColor: ticket.status?.color
                            }}
                        />
                        <EditableField
                            value={ticket.status?.id}
                            type="select"
                            selectOptions={ticket.available_statuses?.map((s: any) => ({
                                value: s.id,
                                label: s.name
                            })) || []}
                            onSave={async (value) => {
                                await directus.Ticket.update(Number(ticketId), {
                                    status: value
                                })
                                refreshTicket()
                            }}
                        />
                    </div>
                    
                    {/* Create child ticket button - only show if ticket type can have children */}
                    {canHaveChildren && (
                        <Button variant="outline" size="sm" onClick={() => setIsCreateChildOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Subtask
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left column - Primary content */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Parent-Child Relationship Section */}
                    {(ticket.parent || ticket.childs_count > 0) && (
                        <div className="space-y-4">
                            {/* Parent ticket */}
                            {ticket.parent && (
                                <RelatedTicket 
                                    ticket={ticket.parent} 
                                    relationLabel="Parent" 
                                />
                            )}
                            
                            {/* Children tickets */}
                            {ticket.childs_count > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium">Subtasks ({ticket.childs_count})</h3>
                                        
                                        <Button variant="ghost" size="sm">
                                            <GitFork className="h-4 w-4 mr-1" />
                                            View all subtasks
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {ticket.childs.slice(0, 5).map((child: any) => (
                                            <RelatedTicket 
                                                key={child.id} 
                                                ticket={child}
                                                relationLabel="Subtask" 
                                            />
                                        ))}
                                        
                                        {ticket.childs.length > 5 && (
                                            <div className="text-center text-sm text-muted-foreground py-2">
                                                +{ticket.childs.length - 5} more subtasks
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Description Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EditableField
                                value={ticket.description}
                                type="textarea"
                                onSave={async (value) => {
                                    await directus.Ticket.update(Number(ticketId), {
                                        description: value
                                    })
                                    refreshTicket()
                                }}
                                placeholder="Add a description..."
                                className="w-full"
                            />
                        </CardContent>
                    </Card>

                    {/* Comments section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                Comments ({comments?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {comments?.map((comment: any) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <UserAvatar user={comment.user_created} size="sm" />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {comment.user_created.first_name} {comment.user_created.last_name}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(comment.date_created)}
                                                    </span>
                                                </div>
                                                {comment.user_created.id === session?.user?.id && (
                                                    <div className="flex items-center gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => {
                                                                const newContent = window.prompt('Edit comment', comment.content)
                                                                if (newContent) {
                                                                    updateComment(comment.id, newContent)
                                                                }
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to delete this comment?')) {
                                                                    deleteComment(comment.id)
                                                                }
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {comments?.length === 0 && (
                                    <p className="text-muted-foreground italic text-center">No comments yet</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <form 
                                className="flex items-center gap-2 w-full"
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    const form = e.target as HTMLFormElement
                                    const content = new FormData(form).get('content') as string
                                    if (content) {
                                        createComment(content)
                                        form.reset()
                                    }
                                }}
                            >
                                <Input 
                                    name="content" 
                                    placeholder="Write a comment..." 
                                    className="flex-1" 
                                />
                                <Button type="submit" size="sm">
                                    <Send className="h-4 w-4 mr-2" />
                                    Comment
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>

                {/* Right column - Details and metadata */}
                <div className="space-y-6">
                    {/* Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Assignee */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Assignee</span>
                                    <EditableField
                                        value={ticket.assignee?.id}
                                        type="select"
                                        selectOptions={ticket.available_assignees?.map((u: any) => ({
                                            value: u.id,
                                            label: `${u.first_name} ${u.last_name}`
                                        })) || []}
                                        onSave={async (value) => {
                                            await directus.Ticket.update(Number(ticketId), {
                                                assignee: value
                                            })
                                            refreshTicket()
                                        }}
                                        placeholder="Unassigned"
                                    />
                                </div>
                                
                                {/* Reporter */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Reporter</span>
                                    <EditableField
                                        value={ticket.reporter?.id}
                                        type="select"
                                        selectOptions={ticket.available_reporters?.map((u: any) => ({
                                            value: u.id,
                                            label: `${u.first_name} ${u.last_name}`
                                        })) || []}
                                        onSave={async (value) => {
                                            await directus.Ticket.update(Number(ticketId), {
                                                reporter: value
                                            })
                                            refreshTicket()
                                        }}
                                        placeholder="None"
                                    />
                                </div>
                                
                                {/* Priority */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Priority</span>
                                    <EditableField
                                        value={ticket.priority?.id}
                                        type="select"
                                        selectOptions={ticket.available_priorities?.map((p: any) => ({
                                            value: p.id,
                                            label: p.name
                                        })) || []}
                                        onSave={async (value) => {
                                            await directus.Ticket.update(Number(ticketId), {
                                                priority: value
                                            })
                                            refreshTicket()
                                        }}
                                        placeholder="None"
                                    />
                                </div>
                                
                                <Separator />
                                
                                {/* Epic Link */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Epic</span>
                                    <EditableField
                                        value={ticket.epic?.id}
                                        type="select"
                                        selectOptions={ticket.available_epics?.map((e: any) => ({
                                            value: e.id,
                                            label: e.title
                                        })) || []}
                                        onSave={async (value) => {
                                            await directus.Ticket.update(Number(ticketId), {
                                                epic: value
                                            })
                                            refreshTicket()
                                        }}
                                        placeholder="None"
                                    />
                                </div>
                                
                                {/* Sprint */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Sprint</span>
                                    <EditableField
                                        value={ticket.sprint?.id}
                                        type="select"
                                        selectOptions={ticket.available_sprints?.map((s: any) => ({
                                            value: s.id,
                                            label: s.name
                                        })) || []}
                                        onSave={async (value) => {
                                            await directus.Ticket.update(Number(ticketId), {
                                                sprint: value
                                            })
                                            refreshTicket()
                                        }}
                                        placeholder="None"
                                    />
                                </div>
                                
                                <Separator />
                                
                                {/* Story Points */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Story Points</span>
                                    <EditableField
                                        value={ticket.story_points}
                                        onSave={async (value) => {
                                            await directus.Ticket.update(Number(ticketId), {
                                                story_points: value
                                            })
                                            refreshTicket()
                                        }}
                                        placeholder="None"
                                    />
                                </div>
                                
                                {/* Due Date */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Due Date</span>
                                    <EditableField
                                        value={ticket.due_date}
                                        type="text"
                                        onSave={async (value) => {
                                            await directus.Ticket.update(Number(ticketId), {
                                                due_date: value
                                            })
                                            refreshTicket()
                                        }}
                                        placeholder="Set due date"
                                    />
                                </div>
                                
                                {/* Time Tracking */}
                                <div className="space-y-2">
                                    <span className="text-sm text-muted-foreground">Time Tracking</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-xs">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            <EditableField
                                                value={ticket.estimated_time}
                                                onSave={async (value) => {
                                                    await directus.Ticket.update(Number(ticketId), {
                                                        estimated_time: value
                                                    })
                                                    refreshTicket()
                                                }}
                                                placeholder="Set estimate"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            <EditableField
                                                value={ticket.spent_time}
                                                onSave={async (value) => {
                                                    await directus.Ticket.update(Number(ticketId), {
                                                        spent_time: value
                                                    })
                                                    refreshTicket()
                                                }}
                                                placeholder="Log time"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />
                                
                                {/* Labels */}
                                {ticket.labels && ticket.labels.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-sm text-muted-foreground">Labels</span>
                                        <div className="flex flex-wrap gap-2">
                                            {ticket.labels.map((label: string, index: number) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    {label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Metadata */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Created</span>
                                        <span>{formatDate(ticket.date_created)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Updated</span>
                                        <span>{formatDate(ticket.date_updated)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>ID</span>
                                        <span className="font-mono">{ticket.id}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Attachments Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                                Attachments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">No attachments yet</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" size="sm" className="w-full">
                                <Paperclip className="h-4 w-4 mr-2" />
                                Add Attachment
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Create child ticket dialog */}
            {projectId && (
                <CreateTicketDialog
                    open={isCreateChildOpen}
                    onOpenChange={setIsCreateChildOpen}
                    project={projectQuery?.data!}
                    parentTicket={ticket}
                />
            )}
        </div>
    )
}
