'use client'

interface WatermarkOverlayProps {
  userName: string
}

export default function WatermarkOverlay({ userName }: WatermarkOverlayProps) {
  if (!userName) return null

  const text = userName

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 80 }).map((_, i) => {
        const row = Math.floor(i / 8)
        const col = i % 8
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: `${row * 130 + (col % 2 === 0 ? 0 : 65)}px`,
              left: `${col * 14}%`,
              transform: 'rotate(-30deg)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(100, 116, 139, 0.18)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              letterSpacing: '0.05em',
            }}
          >
            {text}
          </span>
        )
      })}
    </div>
  )
}