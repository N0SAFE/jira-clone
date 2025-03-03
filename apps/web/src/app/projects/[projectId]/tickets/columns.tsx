import { cn, formatDate } from '@/lib/utils'
import { Collections } from '@repo/directus-sdk/client'
import { ApplyFields } from '@repo/directus-sdk/utils'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { ColumnDef } from '@tanstack/react-table'
import { Bug, CheckCircle, Bookmark, Target, AlertTriangle, FileSpreadsheet, LayoutGrid, GitBranch, Calendar, Tag, MessageCircle, Clock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/shadcn/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar'

// Enhanced type definition with more fields and nested relationships
export type DType = ApplyFields<
    Collections.Tickets,
    [
        'id',
        'title',
        {
            status: ['id', 'name', 'color']
        },
        {
            priority: ['id', 'name', 'color', 'level']
        },
        {
            type: ['id', 'name', 'icon']
        },
        'description',
        {
            parent: [
                'id', 
                'title', 
                { type: ['id', 'name', 'icon'] }
            ]
        },
        {
            childs: [
                'id', 
                'title',
                { type: ['id', 'name', 'icon'] }
            ]
        },
        'count(childs)',
        'date_created',
        'date_updated',
        {
            user_created: ['id', 'first_name', 'last_name', 'avatar']
        },
        {
            assignee: ['id', 'first_name', 'last_name', 'avatar']
        },
        'count(comments)',
    ]
>

export type ColumnOptions = {
    colors: ApplyFields<Collections.TicketsStatuses, ['id', 'color', 'name', 'order']>[]
    priorities: ApplyFields<Collections.TicketsPriorities, ['id', 'color', 'name', 'level']>[]
    types: ApplyFields<Collections.TicketsTypes, ['id', 'name', 'icon', 'level', 'description']>[]
}

/**
 * User avatar component that works with or without image
 */
const UserAvatar = ({ user, className = "" }: { user: any, className?: string }) => {
    if (!user) return null;
    
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;
    
    return (
        <Avatar className={cn("h-8 w-8", className)}>
            {user.avatar ? (
                <AvatarImage src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />
            ) : null}
            <AvatarFallback>{initials || '?'}</AvatarFallback>
        </Avatar>
    );
};

/**
 * Component for displaying relationship with parent/child tickets
 */
const TicketRelationship = ({ ticket, isParent = false }: { ticket: any, isParent?: boolean }) => {
    if (!ticket) return null;
    
    // Get the icon directly from the API response
    const iconName = ticket.type?.icon || '';
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        <GitBranch className="h-3 w-3" />
                        <span>{isParent ? 'Parent' : 'Child'}: </span>
                        {iconName && (
                            <span className="text-muted-foreground">
                                <img src={iconName} alt="" className="h-3 w-3 inline" />
                            </span>
                        )}
                        <span>{ticket.key || ticket.id}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-sm">
                    <div className="font-medium">{ticket.title}</div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export const useColumns = (options?: ColumnOptions) => [
    {
        accessorKey: 'id',
        header: 'ID',
        size: 80,
        enableSorting: false,
        enableHiding: true,
    },
    {
        accessorKey: 'type',
        header: 'Type',
        size: 60,
        filterFn: 'equals',
        cell: ({ row }) => {
            const type = row.original.type;
            // Handle both nested and id-only cases
            const typeId = typeof type === 'object' ? type?.id : type;
            
            // First try to get the type from the ticket data
            let typeObj = typeof type === 'object' ? type : null;
            
            // If not found in the ticket data, try to find it in the options
            if (!typeObj && typeId && options?.types) {
                typeObj = options.types.find(t => t.id === typeId);
            }
            
            if (!typeObj) return null;
            
            const iconUrl = typeObj.icon || '';
            const typeName = typeObj.name || 'Unknown';
            
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center" title={typeName}>
                                <div style={{ color: "#555" }}>
                                    {iconUrl ? (
                                        <img src={iconUrl} alt={typeName} className="h-4 w-4" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4" />
                                    )}
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            {typeName}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        accessorKey: 'title',
        header: 'Title',
        size: 250,
        filterFn: 'includesString',
        cell: ({ row }) => {
            const data = row.original;
            const hasParent = !!data.parent;
            const hasChildren = Array.isArray(data.childs) && data.childs.length > 0;
            const childCount = data.childs_count || (data.childs?.length || 0);
            
            return (
                <div className="space-y-1">
                    <div className="font-medium">{data.title}</div>
                    
                    {/* Show parent/child relationships */}
                    <div className="space-y-0.5">
                        {/* Parent ticket relationship */}
                        {hasParent && (
                            <TicketRelationship 
                                ticket={data.parent} 
                                isParent={true} 
                            />
                        )}
                        
                        {/* Child tickets relationships */}
                        {hasChildren && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                            <GitBranch className="h-3 w-3" />
                                            <span>{childCount} child ticket{childCount !== 1 ? 's' : ''}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="start" className="max-w-md">
                                        <div className="space-y-1">
                                            {data.childs.slice(0, 5).map((child: any) => (
                                                <div key={child.id} className="flex items-center gap-1">
                                                    {/* Show type icon if available */}
                                                    {child.type?.icon && (
                                                        <span className="text-muted-foreground">
                                                            <img src={child.type.icon} alt="" className="h-3 w-3 inline" />
                                                        </span>
                                                    )}
                                                    <span>{child.key || child.id}: {child.title}</span>
                                                </div>
                                            ))}
                                            
                                            {data.childs.length > 5 && (
                                                <div className="text-xs text-muted-foreground">
                                                    +{data.childs.length - 5} more
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            );
        }
    },
    {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        filterFn: 'equals',
        cell: ({ row }) => {
            const status = row.original.status;
            // Handle both nested and id-only cases
            const statusId = typeof status === 'object' ? status?.id : status;
            
            // First try to get status from ticket data
            let statusObj = typeof status === 'object' ? status : null;
            
            // If not found in the ticket data, try to find it in the options
            if (!statusObj && statusId && options?.colors) {
                statusObj = options.colors.find(s => s.id === statusId);
            }
            
            const statusName = statusObj?.name || 'Unknown';
            const statusColor = statusObj?.color || '#ccc';
            
            return (
                <Badge
                    variant="secondary"
                    style={{
                        backgroundColor: statusColor,
                        color: '#fff',
                    }}
                    className="whitespace-nowrap text-xs font-medium"
                >
                    {statusName}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'priority',
        header: 'Priority',
        size: 120,
        filterFn: 'equals',
        cell: ({ row }) => {
            const priority = row.original.priority;
            // Handle both nested and id-only cases
            const priorityId = typeof priority === 'object' ? priority?.id : priority;
            
            // First try to get priority from ticket data
            let priorityObj = typeof priority === 'object' ? priority : null;
            
            // If not found in the ticket data, try to find it in the options
            if (!priorityObj && priorityId && options?.priorities) {
                priorityObj = options.priorities.find(p => p.id === priorityId);
            }
            
            const priorityName = priorityObj?.name || 'None';
            const priorityColor = priorityObj?.color || '#ccc';
            
            return (
                <div className="flex items-center gap-2">
                    <div
                        className={cn('h-2 w-2 rounded-full')}
                        style={{
                            backgroundColor: priorityColor,
                        }}
                    />
                    <span>{priorityName}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'assignee',
        header: 'Assignee',
        size: 150,
        cell: ({ row }) => {
            const assignee = row.original.assignee;
            if (!assignee) return <span className="text-muted-foreground text-sm italic">Unassigned</span>;
            
            return (
                <div className="flex items-center gap-2">
                    <UserAvatar user={assignee} className="h-6 w-6" />
                    <span className="truncate">{assignee.first_name} {assignee.last_name}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'reporter',
        header: 'Reporter',
        size: 150,
        enableHiding: true,
        cell: ({ row }) => {
            const reporter = row.original.reporter;
            if (!reporter) return <span className="text-muted-foreground text-sm italic">Unknown</span>;
            
            return (
                <div className="flex items-center gap-2">
                    <UserAvatar user={reporter} className="h-6 w-6" />
                    <span className="truncate">{reporter.first_name} {reporter.last_name}</span>
                </div>
            );
        },
    },
    {
        id: 'attachments_and_comments',
        header: 'Activity',
        size: 100,
        enableHiding: true,
        cell: ({ row }) => {
            const comments = row.original.comments_count || 0;
            
            if (!comments) return null;
            
            return (
                <div className="flex items-center gap-2">
                    {comments > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageCircle className="h-3 w-3" />
                            <span className="text-xs">{comments}</span>
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'date_created',
        header: 'Created',
        size: 120,
        enableHiding: true,
        cell: ({ row }) => {
            const date = row.original.date_created;
            return (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{date ? formatDate(date) : 'Never'}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'date_updated',
        header: 'Updated',
        size: 120,
        cell: ({ row }) => {
            const date = row.original.date_updated;
            return (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{date ? formatDate(date) : 'Never'}</span>
                </div>
            );
        },
    },
] satisfies ColumnDef<DType>[]

const DataTableFilter = ({ mode, config, filterManager, initialState }) => {
    return (
        <>
            {mode === 'basic' ? (
                <BasicFilterComponent 
                    config={config}
                    filterManager={filterManager}
                    state={filterManager.getState()}
                />
            ) : (
                <AdvancedFilterComponent 
                    config={config}
                    filterManager={filterManager}
                    initialActive={!!initialState?.advancedFilter}
                />
            )}
        </>
    );
};
