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
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', cursor: 'zoom-out',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
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

            {/* Image — takes up 70% of available height */}
            <div style={{
              flex: '0 0 auto',
              maxHeight: alt ? '68vh' : '85vh',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
            }}>
              <img
                src={src}
                alt={alt}
                style={{
                  maxWidth: '88vw',
                  maxHeight: alt ? '68vh' : '85vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            {/* Caption — separate scrollable area below image */}
            {alt && (
              <div style={{
                flex: '0 1 auto',
                overflowY: 'auto',
                maxHeight: '20vh',
                padding: '12px 24px 16px',
                fontSize: '13.5px',
                lineHeight: 1.65,
                color: '#475569',
                textAlign: 'center',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontStyle: 'italic',
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