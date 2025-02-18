import { ReactNode } from "react";

interface BoardHeaderProps {
  children: ReactNode;
}

export function BoardHeader({ children }: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex items-center gap-4">
        {children}
      </div>
    </div>
  );
}