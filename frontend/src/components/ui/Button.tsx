import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/ui'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: Variant
  size?: Size
  className?: string
}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-55',
    variant === 'primary' &&
      'bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(59,130,246,0.92),rgba(125,211,252,0.88))] text-slate-950 shadow-[0_18px_40px_rgba(56,189,248,0.22)] hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(56,189,248,0.28)]',
    variant === 'secondary' &&
      'border border-white/10 bg-white/[0.06] text-white hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/10',
    variant === 'ghost' && 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
    size === 'sm' && 'px-3.5 py-2 text-sm',
    size === 'md' && 'px-[18px] py-2.5 text-sm',
    size === 'lg' && 'px-5 py-3 text-sm',
    className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : leftIcon}
      <span>{children}</span>
      {!loading ? rightIcon : null}
    </button>
  )
}
