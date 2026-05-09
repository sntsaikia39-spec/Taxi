export default function HeroBackground() {
  return (
    <>
      {/* Light ray — top right, matches homepage */}
      <div className="absolute top-0 right-0 w-[400px] h-[1px] bg-gradient-to-l from-secondary-500/30 to-transparent" />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.7) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
      />
      {/* Mountain silhouette */}
      <div className="absolute bottom-10 sm:bottom-0 -left-[34%] w-[168%] sm:left-0 sm:w-full pointer-events-none select-none opacity-[0.09]">
        <svg
          className="w-full h-auto"
          viewBox="0 0 1440 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax meet"
        >
          <path
            d="M0 160L110 72L260 120L410 48L580 110L740 18L890 90L1070 38L1260 95L1440 34V160H0Z"
            fill="#ffda00"
          />
        </svg>
      </div>
    </>
  )
}
