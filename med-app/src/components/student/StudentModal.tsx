'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface StudentModalProps {
  open: boolean
  onClose: () => void
  /** Read aloud by screen readers when the popup opens */
  label: string
  children: ReactNode
  maxWidth?: number
}

/**
 * Shared popup for student pages.
 * - Desktop / tablet: centered card.
 * - Mobile (< 640px): sheet that slides up from the bottom.
 * - Closes with: the × button, the Esc key, or a tap on the dark background.
 * - Rendered into <body> (portal) so hover transforms on parent cards
 *   can never break its position.
 */
export default function StudentModal({ open, onClose, label, children, maxWidth = 720 }: StudentModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const onCloseRef  = useRef(onClose)

  // Keep the latest onClose without re-running the open/close effect on every render
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow      = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="smd-root">
      <style>{`
        @keyframes smdFade { from{opacity:0} to{opacity:1} }
        @keyframes smdUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes smdPop  { from{opacity:0;transform:translateY(12px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }

        .smd-root { position:fixed; inset:0; z-index:1000; display:flex; align-items:flex-end; justify-content:center; font-family:"Plus Jakarta Sans",system-ui,sans-serif; color:#3C4661; }
        .smd-backdrop { position:absolute; inset:0; background:rgba(15,23,42,.45); animation:smdFade .2s ease; }
        .smd-panel { position:relative; width:100%; max-height:88vh; max-height:88dvh; display:flex; flex-direction:column; background:#F5F7FC; border-radius:22px 22px 0 0; box-shadow:0 -10px 40px -12px rgba(15,23,42,.35); animation:smdUp .28s cubic-bezier(.2,.8,.2,1); padding-bottom:env(safe-area-inset-bottom,0px); }
        .smd-handle { width:40px; height:5px; border-radius:99px; background:#CBD5E1; margin:10px auto 0; flex-shrink:0; }
        .smd-body { overflow-y:auto; overscroll-behavior:contain; padding:18px 16px 24px; }
        .smd-close { position:absolute; top:8px; right:8px; z-index:2; width:44px; height:44px; border-radius:12px; border:none; background:rgba(255,255,255,.92); color:#55617D; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s ease; }
        .smd-close:hover { background:#fff; color:#15203A; }
        .smd-close:focus-visible { outline:2px solid #2F6BFF; outline-offset:2px; }

        @media (min-width:640px) {
          .smd-root  { align-items:center; padding:24px; }
          .smd-panel { border-radius:22px; max-height:85vh; max-height:85dvh; box-shadow:0 30px 70px -20px rgba(15,23,42,.45); animation:smdPop .22s ease; }
          .smd-handle { display:none; }
          .smd-body  { padding:28px; }
          .smd-close { top:14px; right:14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .smd-backdrop, .smd-panel { animation:none; }
        }
      `}</style>

      <div className="smd-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="smd-panel" role="dialog" aria-modal="true" aria-label={label} style={{ maxWidth }}>
        <div className="smd-handle" aria-hidden="true" />
        <button ref={closeBtnRef} type="button" className="smd-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className="smd-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}