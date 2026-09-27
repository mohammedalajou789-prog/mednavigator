'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Responsive dialog used by the subject page.
 *  - Phone (<640px): bottom sheet that slides up, with a grabber.
 *  - Tablet / desktop: centered popup.
 * Handles: portal, Escape to close, backdrop click, body scroll lock,
 * focus on open, focus trap, and focus restore on close.
 */
interface SubjectDialogProps {
  open: boolean
  onClose: () => void
  /** Accessible name of the dialog */
  label: string
  /** Max width on tablet / desktop (px) */
  maxWidth?: number
  /** Content of the tinted header area (title, chips, progress…) */
  header: ReactNode
  /** Scrollable body */
  children: ReactNode
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function SubjectDialog({ open, onClose, label, maxWidth = 720, header, children }: SubjectDialogProps) {
  const [mounted, setMounted] = useState(false)
  const panelRef   = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement as HTMLElement | null
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevPadding  = body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    const t = window.setTimeout(() => panelRef.current?.focus(), 0)

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (nodes.length === 0) { e.preventDefault(); return }
      const first = nodes[0]
      const last  = nodes[nodes.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPadding
      prevFocus?.focus?.()
    }
  }, [open])

  if (!mounted || !open) return null

  return createPortal(
    <div className="sd-root">
      <style>{`
        @keyframes sdFade { from{opacity:0} to{opacity:1} }
        @keyframes sdUp   { from{transform:translateY(100%)} to{transform:none} }
        @keyframes sdPop  { from{opacity:0;transform:translateY(12px) scale(.985)} to{opacity:1;transform:none} }

        .sd-root { position:fixed; inset:0; z-index:1000; display:flex; align-items:flex-end; justify-content:center;
          font-family:"Plus Jakarta Sans",system-ui,sans-serif; color:#3C4661; }
        .sd-backdrop { position:absolute; inset:0; background:rgba(21,32,58,.45);
          -webkit-backdrop-filter:blur(3px); backdrop-filter:blur(3px); animation:sdFade .2s ease; }
        .sd-panel { position:relative; width:100%; max-height:92vh; max-height:92dvh; display:flex; flex-direction:column;
          background:#fff; border-radius:24px 24px 0 0; overflow:hidden; outline:none;
          box-shadow:0 -20px 50px -20px rgba(21,32,58,.5); animation:sdUp .32s cubic-bezier(.2,.8,.2,1); }
        .sd-grabber { position:absolute; top:8px; left:50%; margin-left:-20px; width:40px; height:5px; border-radius:99px; background:#C7D3EA; z-index:2; }
        .sd-head { flex-shrink:0; position:relative; padding:24px 18px 16px;
          background:linear-gradient(120deg,#EDF3FF 0%,#F3F7FF 52%,#FCFDFF 100%); border-bottom:1px solid #E2EAFB; }
        .sd-close { position:absolute; top:16px; right:12px; width:44px; height:44px; z-index:2;
          display:flex; align-items:center; justify-content:center; border-radius:12px;
          border:1px solid #E2EAFB; background:rgba(255,255,255,.85); color:#55617D; cursor:pointer; transition:background .2s ease; }
        .sd-close:hover { background:#fff; }
        .sd-close:focus-visible { outline:2px solid #2F6BFF; outline-offset:2px; }
        .sd-body { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch;
          padding:12px 12px calc(24px + env(safe-area-inset-bottom)); }

        @media (min-width:640px) {
          .sd-root  { align-items:flex-start; padding:clamp(24px,7vh,72px) 24px; }
          .sd-panel { max-width:var(--sd-max); max-height:calc(100vh - 2 * clamp(24px,7vh,72px));
            max-height:calc(100dvh - 2 * clamp(24px,7vh,72px)); border-radius:24px;
            box-shadow:0 40px 90px -30px rgba(21,32,58,.6); animation:sdPop .24s cubic-bezier(.2,.8,.2,1); }
          .sd-grabber { display:none; }
          .sd-head  { padding:26px 28px 22px; }
          .sd-close { top:18px; right:18px; width:40px; height:40px; }
          .sd-body  { padding:18px 20px 22px; }
        }
        @media (prefers-reduced-motion: reduce) { .sd-backdrop, .sd-panel { animation:none; } }
      `}</style>

      <div className="sd-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="sd-panel"
        style={{ ['--sd-max' as string]: `${maxWidth}px` }}
      >
        <span className="sd-grabber" aria-hidden="true" />
        <div className="sd-head">
          <button type="button" className="sd-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {header}
        </div>
        <div className="sd-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}