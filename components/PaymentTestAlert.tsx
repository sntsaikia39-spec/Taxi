'use client'

import { useState, useEffect, useRef } from 'react'
import { X, FlaskConical, CreditCard, Wallet } from 'lucide-react'
import gsap from 'gsap'

export default function PaymentTestAlert() {
  const [open, setOpen] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { y: 24, opacity: 0, scale: 0.88 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.8)', delay: 0.6 }
      )
    }
  }, [])

  useEffect(() => {
    if (!panelRef.current) return
    if (open) {
      gsap.fromTo(
        panelRef.current,
        { y: 12, opacity: 0, scale: 0.94 },
        { y: 0, opacity: 1, scale: 1, duration: 0.38, ease: 'back.out(1.5)' }
      )
    }
  }, [open])

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2.5">
      {open && (
        <div
          ref={panelRef}
          className="w-72 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(22,17,14,0.97)',
            border: '1px solid rgba(255,218,0,0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,218,0,0.14)' }}
              >
                <FlaskConical size={12} className="text-secondary-500" />
              </div>
              <span className="text-secondary-500 font-bold text-[11px] uppercase tracking-widest">
                Test Credentials
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <X size={12} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Card */}
            <div
              className="rounded-xl p-3.5 space-y-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-1.5">
                <CreditCard size={11} className="text-gray-500" />
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-semibold">Card</p>
              </div>
              <p className="font-mono text-white text-xs tracking-widest">4111 1111 1111 1111</p>
              <div className="space-y-0.5">
                <p className="text-gray-500 text-[11px]">Expiry: any future date · CVV: any 3 digits</p>
                <p className="text-gray-500 text-[11px]">
                  OTP:{' '}
                  <span
                    className="font-mono font-bold"
                    style={{ color: '#ffda00' }}
                  >
                    1234
                  </span>
                </p>
              </div>
            </div>

            {/* Wallet */}
            <div
              className="rounded-xl p-3.5 space-y-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-1.5">
                <Wallet size={11} className="text-gray-500" />
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-semibold">Wallet</p>
              </div>
              <p className="text-gray-400 text-[11px]">
                Mobikwik · OTP:{' '}
                <span className="font-mono font-bold" style={{ color: '#ffda00' }}>
                  1234
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle badge */}
      <button
        ref={badgeRef}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 font-bold text-xs px-3.5 py-2.5 rounded-full transition-all"
        style={{
          background: 'rgba(255,218,0,0.92)',
          color: '#1a1512',
          boxShadow: '0 8px 24px rgba(255,218,0,0.25)',
        }}
      >
        <FlaskConical size={12} />
        Test Creds
      </button>
    </div>
  )
}
