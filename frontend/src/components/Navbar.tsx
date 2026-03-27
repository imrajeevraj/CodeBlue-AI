import { NavLink } from 'react-router-dom'
import { Activity, FlaskConical, GitCompare } from 'lucide-react'
import { cn } from '../lib/ui'

const links = [
  { to: '/', label: 'Home', icon: Activity },
  { to: '/model-lab', label: 'Model Lab', icon: FlaskConical },
  { to: '/what-if', label: 'What-If', icon: GitCompare },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/55 backdrop-blur-xl after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-sky-400/20 after:to-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.22),rgba(59,130,246,0.32))] text-sm font-semibold text-white shadow-[0_12px_40px_rgba(14,165,233,0.2)]">
            CB
          </div>
          <div>
            <span className="block font-display text-lg font-semibold tracking-tight text-white">
              CodeBlue AI
            </span>
            <span className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Clinical Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition duration-300',
                  isActive
                    ? 'bg-white/10 text-white shadow-[0_10px_24px_rgba(15,23,42,0.3)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
