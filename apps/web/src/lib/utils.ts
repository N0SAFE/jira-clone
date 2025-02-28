import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const handleError = (error: string, cause: unknown) => {
    throw new Error(error, { cause })
}

export function toAbsoluteUrl(path: string) {
    return `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')}${path}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
