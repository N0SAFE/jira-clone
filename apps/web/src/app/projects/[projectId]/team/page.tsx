"use client"

import { BoardHeader } from '@/components/organisms/BoardHeader'
import { Button } from '@repo/ui/components/shadcn/button'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar'
import { Plus } from 'lucide-react'

const mockTeamMembers = [
  { id: '1', name: 'John Doe', role: 'Developer', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', role: 'Designer', email: 'jane@example.com' },
  { id: '3', name: 'Mike Johnson', role: 'Product Manager', email: 'mike@example.com' },
]

export default function TeamPage() {
  return (
    <div className="space-y-4 p-8 pt-6">
      <BoardHeader>
        <h2 className="text-3xl font-bold tracking-tight">Team Members</h2>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </BoardHeader>

      <div className="rounded-md border">
        {mockTeamMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${member.name}`} />
                <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
