import Link from "next/link"
import { ArrowLeft, Shield, Zap, Gem } from "lucide-react"

interface Feature {
  icon: React.ReactNode
  label: string
}

interface ActivateLayoutProps {
  /** Product brand color */
  brandColor: string
  /** Product icon JSX */
  icon?: React.ReactNode
  /** Page title */
  title?: string
  /** Page subtitle */
  subtitle?: string
  /** 3 feature badges */
  features?: Feature[]
  /** FAQ or help items */
  helpItems?: { q: string; a: React.ReactNode }[]
  /** Main form/step content */
  children: React.ReactNode
}

export default function ActivateLayout({
  brandColor,
  icon,
  title,
  subtitle,
  features,
  helpItems,
  children,
}: ActivateLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {"返回商城"}
        </Link>

        {/* Main card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          {(icon || title || subtitle || (features && features.length > 0)) && (
            <div className="relative px-6 sm:px-8 pt-8 pb-6 border-b border-border">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${brandColor}, transparent 70%)` }}
              />
              <div className="relative text-center">
                {icon && (
                  <div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    {icon}
                  </div>
                )}
                {title && <h1 className="text-lg sm:text-xl font-bold text-foreground mb-1">{title}</h1>}
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}

                {/* Feature badges */}
                {features && features.length > 0 && (
                  <div className="flex items-center justify-center gap-3 sm:gap-5 mt-5">
                    {features.map((f) => (
                      <div key={f.label} className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center">
                          {f.icon}
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground">{f.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help / FAQ section (collapsible on mobile, visible by default) */}
          {helpItems && helpItems.length > 0 && (
            <div className="px-6 sm:px-8 py-4 border-b border-border bg-secondary/30">
              <div className="space-y-2.5">
                {helpItems.map((item) => (
                  <div key={item.q}>
                    <p className="text-xs font-semibold text-foreground mb-0.5">{item.q}</p>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">{item.a}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body content */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">{children}</div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pb-4">
          {title && <p className="text-xs text-muted-foreground/60">{title}</p>}
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">
            {"官方渠道 \u00b7 安全保障 \u00b7 即时开通"}
          </p>
        </div>
      </div>
    </div>
  )
}

/* Shared step indicator component */
export function StepIndicator({
  steps,
  currentStep,
  brandColor,
}: {
  steps: { num: number; label: string }[]
  currentStep: number
  brandColor: string
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 ${
                currentStep > s.num
                  ? "text-white border-transparent"
                  : currentStep === s.num
                    ? "text-white border-transparent"
                    : "bg-secondary text-muted-foreground border-border"
              }`}
              style={
                currentStep >= s.num
                  ? { backgroundColor: brandColor, borderColor: brandColor }
                  : undefined
              }
            >
              {currentStep > s.num ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                s.num
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 sm:w-12 h-0.5 rounded-full mb-5 transition-colors duration-300 ${
                currentStep > s.num ? "" : "bg-border"
              }`}
              style={currentStep > s.num ? { backgroundColor: brandColor } : undefined}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/* Shared message/alert component */
export function AlertMessage({
  type,
  children,
}: {
  type: "success" | "error" | "warning" | "info"
  children: React.ReactNode
}) {
  const styles = {
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
  }

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium mb-5 ${styles[type]}`}>
      {children}
    </div>
  )
}

/* Shared styled input */
export function ActivateInput({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3.5 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-[15px] ${props.className || ""}`}
    />
  )
}

/* Shared styled textarea */
export function ActivateTextarea({
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-3.5 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-[15px] resize-none font-mono text-sm ${props.className || ""}`}
    />
  )
}

/* Shared primary action button */
export function ActivateButton({
  brandColor,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { brandColor: string }) {
  return (
    <button
      {...props}
      className={`w-full h-12 rounded-xl font-semibold text-[15px] text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${props.className || ""}`}
      style={{ backgroundColor: brandColor, ...props.style }}
    >
      {children}
    </button>
  )
}
