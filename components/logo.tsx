interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="小黑丸 Logo"
      role="img"
    >
      <defs>
        <radialGradient id="logo-sphere" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#404040" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <radialGradient id="logo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="logo-highlight" cx="35%" cy="30%" r="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="256" cy="260" r="140" fill="url(#logo-glow)" opacity="0.5" />
      <circle cx="256" cy="256" r="120" fill="url(#logo-sphere)" />
      <circle cx="256" cy="256" r="120" fill="url(#logo-highlight)" />
      <ellipse cx="230" cy="226" rx="40" ry="25" fill="#ffffff" opacity="0.12" transform="rotate(-20 230 226)" />
    </svg>
  )
}
