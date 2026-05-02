interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  nameClass?: string
}

const APP_LOGO_URL = 'https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/sign/internal/image-removebg-preview%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMjA1YjRkYi0wMDA4LTQyOWUtYTFmZi02NzBjZTE1OWJhOTkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbnRlcm5hbC9pbWFnZS1yZW1vdmViZy1wcmV2aWV3ICgxKS5wbmciLCJpYXQiOjE3Nzc3NTQ5NzksImV4cCI6MTkzNTQzNDk3OX0.FR2fYD_zRiEMwQcrMja4J1PCZI6o6EFZ-_-8i6T0dy8'

const sizes = {
  sm: 32,
  md: 44,
  lg: 64,
}

export default function Logo({ size = 'md', showName = true, nameClass = '' }: LogoProps) {
  const px = sizes[size]

  return (
    <span className="flex items-center gap-2.5">
      <span
        style={{ width: px, height: px, minWidth: px }}
        className="rounded-full bg-secondary-500 flex items-center justify-center overflow-hidden shadow-md border-2 border-secondary-400"
      >
        <img
          src={APP_LOGO_URL}
          alt="Rina's Tours and Travels"
          width={px}
          height={px}
          className="w-full h-full object-contain"
        />
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
