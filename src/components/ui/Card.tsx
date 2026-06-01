import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  as?: 'div' | 'article' | 'li'
}

export default function Card({ children, className = '', hover = false, onClick, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      onClick={onClick}
      className={[
        'rounded-lg border border-line bg-white',
        hover && 'cursor-pointer transition-shadow duration-200 hover:shadow-soft',
        onClick && 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  )
}
