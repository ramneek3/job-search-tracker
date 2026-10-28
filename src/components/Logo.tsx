export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#4f46e5" />
        <rect x="7" y="8" width="5" height="16" rx="1.5" fill="#fff" />
        <rect x="13.5" y="8" width="5" height="11" rx="1.5" fill="#fff" opacity=".8" />
        <rect x="20" y="8" width="5" height="6" rx="1.5" fill="#fff" opacity=".6" />
      </svg>
      {withText && <span className="hidden sm:inline">Pipeline</span>}
    </span>
  )
}
