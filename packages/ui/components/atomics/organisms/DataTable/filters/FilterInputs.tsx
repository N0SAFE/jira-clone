/** @jsxImportSource react */
'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Input } from '@repo/ui/components/shadcn/input'
import { Button } from '@repo/ui/components/shadcn/button'
import { Calendar } from '@repo/ui/components/shadcn/calendar'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/shadcn/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/shadcn/popover'
import { cn } from '@repo/ui/lib/utils'

import { FilterConfig } from './types'

// Base interface for all filter input components
interface FilterInputBaseProps {
  filterId: string;
  config: FilterConfig;
  value: any;
  onChange: (id: string, value: any) => void;
  placeholder?: string;
}

// Text input component
export function TextFilterInput({ 
  filterId, 
  config, 
  value, 
  onChange,
  placeholder,
}: FilterInputBaseProps) {
  return (
    <Input
      className="h-8 w-[150px]"
      placeholder={placeholder || config.placeholder || `Filter by ${config.label}...`}
      onChange={(e) => onChange(filterId, e.target.value)}
      value={value || ''}
    />
  );
}

// Select input component
export function SelectFilterInput({ 
  filterId, 
  config, 
  value, 
  onChange,
}: FilterInputBaseProps) {
  return (
    <Select
      onValueChange={(selectedValue) => onChange(filterId, selectedValue)}
      value={value || '__all__'}
    >
      <SelectTrigger className="h-8 w-[150px]">
        <SelectValue placeholder={`Select ${config.label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All</SelectItem>
        {config.options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Date input component
export function DateFilterInput({ 
  filterId, 
  config, 
  value, 
  onChange,
}: FilterInputBaseProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? 
            format(new Date(value), "PPP") : 
            "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => {
            const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
            onChange(filterId, formattedDate);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Factory function to get the appropriate filter input component
export function getFilterInputComponent(type: string) {
  switch (type) {
    case 'text':
    case 'number':
      return TextFilterInput;
    case 'select':
      return SelectFilterInput;
    case 'date':
      return DateFilterInput;
    default:
      return TextFilterInput;
  }
}