import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../../lib/ui'

type ToastTone = 'success' | 'info' | 'error'

interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'border-emerald-400/20 bg-emerald-400/[0.12] text-emerald-50',
  info: 'border-sky-400/20 bg-sky-400/[0.12] text-sky-50',
  error: 'border-rose-400/20 bg-rose-400/[0.12] text-rose-50',
}

const TONE_ICON = {
  success: CheckCircle2,
  info: Info,
  error: XCircle,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const item = { ...toast, id: Date.now() + Math.random() }
    setToasts((current) => [...current, item])
    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== item.id))
    }, 2800)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => {
            const Icon = TONE_ICON[toast.tone]
            return (
              <div
                key={toast.id}
                className={cn(
                  'pointer-events-auto animate-toast-in rounded-2xl border px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.45)] backdrop-blur-xl',
                  TONE_STYLES[toast.tone],
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.description ? (
                      <p className="mt-1 text-sm text-white/70">{toast.description}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }

  return {
    success: (title: string, description?: string) =>
      context.push({ tone: 'success', title, description }),
    info: (title: string, description?: string) =>
      context.push({ tone: 'info', title, description }),
    error: (title: string, description?: string) =>
      context.push({ tone: 'error', title, description }),
  }
}
