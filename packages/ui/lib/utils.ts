import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { cva as class_variant_authority } from 'class-variance-authority'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function cva(...inputs: Parameters<typeof class_variant_authority>) {
    return class_variant_authority(...inputs)
}