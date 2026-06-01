import { useToast } from '@/hooks/useToast'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

const ICONS = {
  success: <CheckCircle2 size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
}

const STYLES = {
  success: 'bg-pine text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-ocean text-white',
}

export default function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lift animate-fade-in',
            STYLES[t.variant]
          )}
        >
          {ICONS[t.variant]}
          <span className="flex-1 text-sm font-medium">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded p-1 transition-colors hover:bg-white/10"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
