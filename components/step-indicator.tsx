import { CheckCircle } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "验证激活码" },
    { number: 2, label: "用户信息" },
    { number: 3, label: "完成" },
  ]

  return (
    <div className="flex items-center justify-center mb-6 md:mb-8 px-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all duration-500 transform hover:scale-105 ${
                currentStep > step.number
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : currentStep === step.number
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/20 animate-pulse"
                    : "bg-muted text-muted-foreground border-2 border-border hover:bg-muted/80"
              }`}
            >
              {currentStep > step.number ? <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5" /> : step.number}
            </div>
            <span
              className="mt-1.5 sm:mt-2 text-xs font-medium transition-all duration-300 text-center max-w-[60px] sm:max-w-none leading-tight"
              style={{
                color: currentStep >= step.number ? "#000000" : "#6b7280",
                fontWeight: currentStep >= step.number ? "600" : "500",
                backgroundColor: "transparent",
              }}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 mt-[-16px] sm:mt-[-20px] transition-all duration-500 ${
                currentStep > step.number ? "bg-primary shadow-sm" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
