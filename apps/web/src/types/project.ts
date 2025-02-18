export type Project = {
  id: string
  name: string
  description: string
  status: 'active' | 'archived' | 'completed'
  createdAt: Date
  updatedAt: Date
}
