"use client"

import { XIcon } from "lucide-react"

interface AlertMessageProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export function AlertMessage({ message, type, onClose }: AlertMessageProps) {
  return (
    <div
      className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
        type === "success"
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-current hover:opacity-70">
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
