import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SectionProps {
  children: ReactNode
  className?: string
  id?: string
  tight?: boolean
}

export default function Section({ children, className, id, tight = false }: SectionProps) {
  return (
    <section
      id={id}
      className={cn('container-edge', tight ? 'py-8' : 'py-10 md:py-14', className)}
    >
      {children}
    </section>
  )
}
