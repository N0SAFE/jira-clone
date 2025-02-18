interface BoardHeadersProps {
    className?: string;
  }
  
  export function BoardHeaders({ className }: BoardHeadersProps) {
    return (
      <div className={`grid grid-cols-6 gap-4 px-4 py-2 font-medium ${className}`}>
        <div>ID</div>
        <div>Title</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Assignee</div>
        <div>Created At</div>
      </div>
    );
  }
  