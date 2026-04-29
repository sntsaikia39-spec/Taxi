interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  nameClass?: string
}

const sizes = {
  sm: 32,
  md: 44,
  lg: 64,
}

export default function Logo({ size = 'md', showName = true, nameClass = '' }: LogoProps) {
  const px = sizes[size]
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'

  return (
    <span className="flex items-center gap-2.5">
      {/* Circular logo placeholder — replace src with real logo image when ready */}
      <span
        style={{ width: px, height: px, minWidth: px }}
        className="rounded-full bg-secondary-500 flex items-center justify-center overflow-hidden shadow-md border-2 border-secondary-400"
      >
        <svg viewBox="0 0 100 100" width={px} height={px} xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#ffda00" />
          {/* Stylised "R" for Rina's */}
          <text
            x="50"
            y="67"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontWeight="bold"
            fontSize="52"
            fill="#1a1a2e"
          >
            R
          </text>
        </svg>
      </span>

      {showName && (
        <span className={`font-bold leading-tight ${nameClass}`}>
          Rina&apos;s Tours
          <span className="block text-xs font-medium opacity-80 leading-none">
            &amp; Travels
          </span>
        </span>
      )}
    </span>
  )
}
