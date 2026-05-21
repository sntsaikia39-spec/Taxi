'use client'

import { useState, useRef, useEffect, forwardRef, memo } from 'react'
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js'
import { ChevronDown, X } from 'lucide-react'

type CountryEntry = {
  code: string
  name: string
  dial: string
  flag: string
}

function toFlag(cc: string): string {
  return [...cc].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
}

// Curated list: India first, then common tourist/traveller origins
const COUNTRIES: CountryEntry[] = [
  ['IN', 'India', '91'],
  ['US', 'United States', '1'],
  ['GB', 'United Kingdom', '44'],
  ['AU', 'Australia', '61'],
  ['CA', 'Canada', '1'],
  ['SG', 'Singapore', '65'],
  ['AE', 'United Arab Emirates', '971'],
  ['JP', 'Japan', '81'],
  ['DE', 'Germany', '49'],
  ['FR', 'France', '33'],
  ['NP', 'Nepal', '977'],
  ['BD', 'Bangladesh', '880'],
  ['BT', 'Bhutan', '975'],
  ['MM', 'Myanmar', '95'],
  ['CN', 'China', '86'],
  ['TH', 'Thailand', '66'],
  ['KR', 'South Korea', '82'],
  ['MY', 'Malaysia', '60'],
  ['LK', 'Sri Lanka', '94'],
  ['PK', 'Pakistan', '92'],
  ['ID', 'Indonesia', '62'],
  ['PH', 'Philippines', '63'],
  ['VN', 'Vietnam', '84'],
  ['KH', 'Cambodia', '855'],
  ['SA', 'Saudi Arabia', '966'],
  ['QA', 'Qatar', '974'],
  ['KW', 'Kuwait', '965'],
  ['IL', 'Israel', '972'],
  ['IT', 'Italy', '39'],
  ['ES', 'Spain', '34'],
  ['NL', 'Netherlands', '31'],
  ['CH', 'Switzerland', '41'],
  ['SE', 'Sweden', '46'],
  ['NO', 'Norway', '47'],
  ['RU', 'Russia', '7'],
  ['BR', 'Brazil', '55'],
  ['MX', 'Mexico', '52'],
  ['NZ', 'New Zealand', '64'],
  ['ZA', 'South Africa', '27'],
  ['KE', 'Kenya', '254'],
  ['HK', 'Hong Kong', '852'],
  ['MV', 'Maldives', '960'],
  ['MU', 'Mauritius', '230'],
  ['NG', 'Nigeria', '234'],
].map(([code, name, dial]) => ({ code, name, dial, flag: toFlag(code) }))

const INDIA = COUNTRIES[0]

function parseValue(value: string): { country: CountryEntry; local: string } {
  if (!value) return { country: INDIA, local: '' }
  const stripped = value.replace(/\s/g, '')
  if (!stripped.startsWith('+')) {
    // Legacy plain digits — assume India
    return { country: INDIA, local: stripped.replace(/\D/g, '') }
  }
  // Match longest dial code first to avoid +1 matching before +91
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (stripped.startsWith(`+${c.dial}`)) {
      return { country: c, local: stripped.slice(c.dial.length + 1) }
    }
  }
  return { country: INDIA, local: stripped.slice(1) }
}

interface PhoneInputProps {
  value: string
  onChange: (fullNumber: string) => void
  className?: string
  placeholder?: string
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className = '', placeholder }, ref) => {
    const parsed = parseValue(value)
    const [country, setCountry] = useState<CountryEntry>(parsed.country)
    const [local, setLocal] = useState(parsed.local)
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [touched, setTouched] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    // Sync when parent sets value externally (e.g. session restore or user profile)
    useEffect(() => {
      const p = parseValue(value)
      setCountry(p.country)
      setLocal(p.local)
    }, [value])

    // Close dropdown on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false)
          setSearch('')
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Focus search when dropdown opens
    useEffect(() => {
      if (open) {
        const t = setTimeout(() => searchRef.current?.focus(), 30)
        return () => clearTimeout(t)
      }
    }, [open])

    const digits = local.replace(/\D/g, '')
    // Reject all-same-digit numbers (9999999999, 8888888888, …) regardless of country
    const isObviouslyFake = digits.length >= 4 && /^(\d)\1+$/.test(digits)
    let isValid = false
    if (digits.length > 0 && !isObviouslyFake) {
      if (country.code === 'IN') {
        // TRAI rule: Indian mobile numbers start with 6–9, exactly 10 digits
        // More accurate than libphonenumber metadata which lags TRAI allocations
        isValid = /^[6-9]\d{9}$/.test(digits)
      } else {
        isValid = isValidPhoneNumber(`+${country.dial}${digits}`, country.code as CountryCode)
      }
    }
    // Only show error after user has blurred the field AND typed enough to form an opinion
    const showError = touched && !isValid && digits.length >= 5

    const emitChange = (newLocal: string, newCountry: CountryEntry = country) => {
      const d = newLocal.replace(/\D/g, '')
      onChange(d.length > 0 ? `+${newCountry.dial}${d}` : '')
    }

    const filtered = search.trim()
      ? COUNTRIES.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search.replace(/\+/g, '')) ||
          c.code.toLowerCase() === search.toLowerCase()
        )
      : COUNTRIES

    const borderCls = isValid
      ? 'border-green-500/50 focus-within:border-green-500/70'
      : showError
      ? 'border-red-500/50 focus-within:border-red-500/70'
      : 'border-primary-700 focus-within:border-secondary-500'

    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className={`flex rounded-xl border transition-colors overflow-hidden bg-primary-950/70 ${borderCls}`}>
          {/* Country selector */}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-2.5 border-r border-primary-700 bg-primary-950/50 hover:bg-primary-900/60 transition-colors shrink-0 select-none"
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className="text-gray-300 font-medium text-sm tabular-nums">+{country.dial}</span>
            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Number input */}
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            value={local}
            onChange={e => {
              // Allow digits, spaces, hyphens and parentheses for readability
              const v = e.target.value.replace(/[^\d\s\-()+]/g, '')
              setLocal(v)
              emitChange(v)
            }}
            onBlur={() => setTouched(true)}
            placeholder={placeholder ?? (country.code === 'IN' ? '9876543210' : 'Phone number')}
            className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-white placeholder:text-gray-500 text-sm focus:outline-none"
          />

          {/* Valid indicator */}
          {isValid && (
            <div className="flex items-center pr-3 text-green-400 text-sm font-bold select-none">✓</div>
          )}
        </div>

        {showError && (
          <p className="text-red-400 text-xs mt-1 pl-1">
            Invalid phone number for {country.name}
          </p>
        )}

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 left-0 top-[calc(100%+4px)] w-full min-w-[240px] max-w-xs bg-primary-900 border border-primary-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-primary-800">
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full pl-3 pr-8 py-1.5 bg-primary-950 border border-primary-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-secondary-500 transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Country list */}
            <div className="max-h-52 overflow-y-auto scrollbar-thin-modern">
              {filtered.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No results</p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c)
                      setOpen(false)
                      setSearch('')
                      emitChange(local, c)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary-800 transition-colors text-left ${
                      c.code === country.code ? 'bg-primary-800/60 text-secondary-400' : 'text-gray-200'
                    }`}
                  >
                    <span className="text-base leading-none shrink-0">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-gray-500 text-xs shrink-0 tabular-nums">+{c.dial}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput'
export default PhoneInput
