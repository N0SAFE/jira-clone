import { useState } from 'react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Input } from '@repo/ui/components/shadcn/input'
import { MessageSquare, Send, Pencil, Trash } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar'
import { formatDate } from '@/lib/utils'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Collections } from '@repo/directus-sdk/client'

type Comment = {
    id: number
    content: string
    user_created: {
        id: string
        first_name: string
        last_name: string
        avatar?: string
    }
    date_created: string
}

interface CommentsProps {
    ticketId: number
    comments: Comment[]
    onCreateComment: (content: string) => Promise<void>
    onUpdateComment: (id: number, content: string) => Promise<void>
    onDeleteComment: (id: number) => Promise<void>
}

export function Comments({ ticketId, comments, onCreateComment, onUpdateComment, onDeleteComment }: CommentsProps) {
    const { data: session } = useSession()
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editContent, setEditContent] = useState('')
    const [newComment, setNewComment] = useState('')

    // Setup real-time updates for comments
    useRealtimeUpdates({
        collection: Collections.TicketsComments,
        queryKey: ['comments', ticketId],
        showToast: true,
        toastMessages: {
            create: (data) => `${data.user_created.first_name} added a comment`,
            update: (data) => `${data.user_created.first_name} updated their comment`,
            delete: (data) => `A comment was deleted`
        }
    })

    const handleEditStart = (comment: Comment) => {
        setEditingId(comment.id)
        setEditContent(comment.content)
    }

    const handleEditCancel = () => {
        setEditingId(null)
        setEditContent('')
    }

    const handleEditSave = async (id: number) => {
        await onUpdateComment(id, editContent)
        setEditingId(null)
        setEditContent('')
    }

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        await onCreateComment(newComment)
        setNewComment('')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    Comments ({comments.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex gap-4">
                            <Avatar>
                                {comment.user_created.avatar && (
                                    <AvatarImage 
                                        src={comment.user_created.avatar} 
                                        alt={`${comment.user_created.first_name} ${comment.user_created.last_name}`} 
                                    />
                                )}
                                <AvatarFallback>
                                    {comment.user_created.first_name[0]}
                                    {comment.user_created.last_name[0]}
                                </AvatarFallback>
                            </Avatar>
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
                                                onClick={() => handleEditStart(comment)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this comment?')) {
                                                        onDeleteComment(comment.id)
                                                    }
                                                }}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {editingId === comment.id ? (
                                    <div className="space-y-2">
                                        <Input
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleEditCancel}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleEditSave(comment.id)}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm">{comment.content}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <p className="text-muted-foreground italic text-center">No comments yet</p>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <form 
                    className="flex items-center gap-2 w-full"
                    onSubmit={handleCommentSubmit}
                >
                    <Input 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
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
    )
}