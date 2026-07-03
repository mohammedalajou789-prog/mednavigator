'use client'

import { useState } from 'react'

interface ImageLightboxProps {
  src: string
  alt: string
  className?: string
}

export default function ImageLightbox({ src, alt, className }: ImageLightboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ cursor: 'zoom-in' }}
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', cursor: 'zoom-out',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw', maxHeight: '88vh',
              background: '#fff', borderRadius: '16px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none',
                color: '#fff', cursor: 'pointer', fontSize: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, fontWeight: 300,
              }}
            >×</button>

            {/* Image */}
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: '88vw',
                maxHeight: alt ? 'calc(85vh - 44px)' : '85vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />

            {/* Caption */}
            {alt && (
              <div style={{
                padding: '10px 20px',
                fontSize: '13px', color: '#475569',
                textAlign: 'center',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontStyle: 'italic',
                flexShrink: 0,
              }}>
                {alt}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
