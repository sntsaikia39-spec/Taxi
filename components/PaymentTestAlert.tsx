'use client'

import { useState } from 'react'
import { X, FlaskConical, CreditCard } from 'lucide-react'

export default function PaymentTestAlert() {
  const [open, setOpen] = useState(true)

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2">
      {open && (
        <div className="w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 text-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FlaskConical size={14} className="text-amber-400" />
              <span className="text-amber-400 font-bold text-xs uppercase tracking-widest">Test Credentials</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3 text-zinc-300">
            <div className="bg-zinc-800 rounded-xl p-3 space-y-1">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                <CreditCard size={10} /> Card
              </p>
              <p className="font-mono text-white text-xs tracking-widest">4111 1111 1111 1111</p>
              <p className="text-zinc-400 text-[11px]">Expiry: any future date · CVV: any 3 digits</p>
              <p className="text-zinc-400 text-[11px]">OTP: <span className="font-mono text-amber-400">1234</span></p>
            </div>

            <div className="bg-zinc-800 rounded-xl p-3 space-y-1">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">Wallet</p>
              <p className="text-zinc-400 text-[11px]">Mobikwik · OTP: <span className="font-mono text-amber-400">1234</span></p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-amber-400 text-zinc-900 font-bold text-xs px-3 py-2 rounded-full shadow-lg hover:bg-amber-300 transition-colors"
      >
        <FlaskConical size={13} />
        Test Creds
      </button>
    </div>
  )
}
