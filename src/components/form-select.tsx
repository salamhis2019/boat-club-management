'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Option = {
  value: string
  label: string
}

type FormSelectProps = {
  name: string
  placeholder?: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormSelect({
  name,
  placeholder = 'Select...',
  options,
  value,
  onChange,
  required,
  disabled,
  className,
}: FormSelectProps) {
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={onChange} required={required} disabled={disabled}>
        <SelectTrigger className={`!h-11 w-full ${className ?? ''}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
