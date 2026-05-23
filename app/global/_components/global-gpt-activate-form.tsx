"use client"

import { useState } from "react"
import { ArrowRight, Check, ExternalLink, Loader2, RotateCcw, ShieldAlert } from "lucide-react"

type ActivationStep = "code" | "details" | "result"
type StatusMessage = { type: "error" | "info" | "success"; text: string }

type VerifiedCode = {
  existing: boolean
  allowSubmission: boolean
  boundEmail?: string
  sessionCookie?: string
}

async function requestActivation(action: string, body: Record<string, string>) {
  const response = await fetch("/api/gpt-activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  })
  return response.json()
}

function validateSessionData(value: string) {
  try {
    const data = JSON.parse(value)
    if (!data.user?.id || !data.account?.id || !data.accessToken) {
      return { error: "Session data must include user.id, account.id and accessToken." }
    }
    if (data.account?.planType === "team") {
      return { error: "Team accounts are not supported by this activation route." }
    }
    return { email: data.user?.email || "" }
  } catch {
    return { error: "The session data is not valid JSON." }
  }
}

export function GlobalGptActivateForm() {
  const [step, setStep] = useState<ActivationStep>("code")
  const [code, setCode] = useState("")
  const [verified, setVerified] = useState<VerifiedCode | null>(null)
  const [sessionData, setSessionData] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [useUpdatedSession, setUseUpdatedSession] = useState(false)
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const verifyCode = async () => {
    if (!code.trim()) {
      setMessage({ type: "error", text: "Enter the activation code delivered with your order." })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const response = await requestActivation("check_cdk", { cdk: code.trim().toUpperCase() })
      if (!response.success || !response.data) {
        setMessage({ type: "error", text: response.error || response.message || "This activation code could not be verified." })
        return
      }
      const existing = Boolean(response.data.has_existing_record)
      const allowSubmission = Boolean(response.data.allow_new_submission)
      if (!existing && !allowSubmission) {
        setMessage({ type: "error", text: "This activation code is not available for a new activation." })
        return
      }
      setVerified({
        existing,
        allowSubmission,
        boundEmail: response.data.existing_record?.bound_email_masked,
        sessionCookie: response.sessionCookie,
      })
      setUseUpdatedSession(false)
      setStep("details")
      setMessage({
        type: "success",
        text: existing ? "Code verified. An existing account record is available." : "Code verified. Continue with activation details.",
      })
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setBusy(false)
    }
  }

  const submitSessionData = async () => {
    if (!acknowledged) {
      setMessage({ type: "error", text: "Please confirm that you understand how your session data will be used." })
      return
    }
    const validation = validateSessionData(sessionData.trim())
    if (validation.error) {
      setMessage({ type: "error", text: validation.error })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const response = await requestActivation("recharge", {
        cdk: code.trim().toUpperCase(),
        user_data: sessionData.trim(),
        sessionCookie: verified?.sessionCookie || "",
      })
      setResult({
        ok: Boolean(response.success),
        text: response.message || response.error || (response.success ? "Activation completed." : "Activation failed. Please contact support."),
      })
      setStep("result")
    } catch {
      setResult({ ok: false, text: "Network error. Please try again or contact support." })
      setStep("result")
    } finally {
      setBusy(false)
    }
  }

  const reuseExisting = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const response = await requestActivation("reuse_existing", {
        cdk: code.trim().toUpperCase(),
        sessionCookie: verified?.sessionCookie || "",
      })
      setResult({
        ok: Boolean(response.success),
        text: response.message || response.error || (response.success ? "Activation completed." : "Activation failed. Please contact support."),
      })
      setStep("result")
    } catch {
      setResult({ ok: false, text: "Network error. Please try again or contact support." })
      setStep("result")
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setStep("code")
    setCode("")
    setVerified(null)
    setSessionData("")
    setAcknowledged(false)
    setUseUpdatedSession(false)
    setMessage(null)
    setResult(null)
  }

  return (
    <div className="border border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#111] sm:p-7">
      <div className="mb-7 flex items-center justify-between border-b border-neutral-200 pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">Activation Desk</p>
          <p className="mt-2 text-xl font-semibold text-neutral-950">ChatGPT Plus Code</p>
        </div>
        <span className="border border-neutral-950 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-950">
          {step === "code" ? "01 / Code" : step === "details" ? "02 / Activate" : "03 / Result"}
        </span>
      </div>

      {message && (
        <div
          role="status"
          className={`mb-5 border p-4 text-sm leading-6 ${
            message.type === "error"
              ? "border-neutral-950 bg-neutral-950 text-white"
              : message.type === "success"
                ? "border-neutral-950 bg-[#f7f7f3] text-neutral-950"
                : "border-neutral-200 bg-[#f7f7f3] text-neutral-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {step === "code" && (
        <div>
          <label htmlFor="global-activation-code" className="mb-2 block text-sm font-medium text-neutral-950">
            Delivered activation code
          </label>
          <input
            id="global-activation-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Enter your activation code"
            autoComplete="off"
            className="w-full border border-neutral-300 bg-white px-4 py-4 font-mono text-sm text-neutral-950 outline-none focus:border-neutral-950"
          />
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Use the code received after your paid order has been delivered. This page does not accept USDT payment proof.
          </p>
          <button
            type="button"
            onClick={verifyCode}
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 py-4 text-sm font-medium text-white hover:bg-white hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Verify Code
          </button>
        </div>
      )}

      {step === "details" && verified?.existing && !useUpdatedSession && (
        <div>
          <div className="mb-6 border border-neutral-200 bg-[#f7f7f3] p-4 text-sm leading-6 text-neutral-700">
            This code already has a saved activation record
            {verified.boundEmail ? ` for ${verified.boundEmail}` : ""}. You can retry delivery to that same account.
          </div>
          <button
            type="button"
            onClick={reuseExisting}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 py-4 text-sm font-medium text-white hover:bg-white hover:text-neutral-950 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Retry Existing Activation
          </button>
          <button type="button" onClick={reset} className="mt-3 w-full border border-neutral-300 px-5 py-4 text-sm hover:border-neutral-950">
            Use Another Code
          </button>
          <button
            type="button"
            onClick={() => setUseUpdatedSession(true)}
            className="mt-3 w-full text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-950"
          >
            Use refreshed session data instead
          </button>
        </div>
      )}

      {step === "details" && ((verified?.allowSubmission && !verified.existing) || useUpdatedSession) && (
        <div>
          {useUpdatedSession && (
            <button
              type="button"
              onClick={() => setUseUpdatedSession(false)}
              className="mb-5 text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-950"
            >
              Back to saved activation record
            </button>
          )}
          <div className="mb-5 border border-neutral-950 bg-[#f7f7f3] p-4 text-sm leading-6 text-neutral-700">
            <div className="mb-2 flex items-center gap-2 font-medium text-neutral-950">
              <ShieldAlert className="h-4 w-4" />
              Session data required for activation
            </div>
            Your ChatGPT session JSON contains account access information. It will be sent to our activation provider only
            to complete this activation. Submit it only if you accept this risk. Never paste a password, wallet key or seed phrase.
          </div>
          <label htmlFor="global-session-json" className="mb-2 block text-sm font-medium text-neutral-950">
            ChatGPT session JSON
          </label>
          <textarea
            id="global-session-json"
            value={sessionData}
            onChange={(event) => setSessionData(event.target.value)}
            rows={8}
            placeholder='Paste JSON containing "user", "account" and "accessToken"'
            spellCheck={false}
            className="w-full resize-y border border-neutral-300 bg-white p-4 font-mono text-xs leading-6 text-neutral-950 outline-none focus:border-neutral-950"
          />
          <a
            href="https://chatgpt.com/api/auth/session"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-950 underline underline-offset-4"
          >
            Open ChatGPT session page
            <ExternalLink className="h-4 w-4" />
          </a>
          <label className="mt-5 flex cursor-pointer gap-3 border border-neutral-200 bg-white p-4 text-sm leading-6 text-neutral-700">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 accent-neutral-950"
            />
            <span>I understand this data grants account access and agree to submit it for this activation.</span>
          </label>
          <button
            type="button"
            onClick={submitSessionData}
            disabled={busy || !sessionData.trim()}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 py-4 text-sm font-medium text-white hover:bg-white hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Submit Activation
          </button>
          <button type="button" onClick={reset} className="mt-3 w-full border border-neutral-300 px-5 py-4 text-sm hover:border-neutral-950">
            Cancel
          </button>
        </div>
      )}

      {step === "result" && result && (
        <div>
          <div className={`border p-5 ${result.ok ? "border-neutral-950 bg-[#f7f7f3]" : "border-neutral-950 bg-white"}`}>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">{result.ok ? "Completed" : "Not completed"}</p>
            <h3 className="mt-3 text-2xl font-semibold text-neutral-950">
              {result.ok ? "Activation submitted successfully." : "Activation needs attention."}
            </h3>
            <p className="mt-4 text-sm leading-6 text-neutral-600">{result.text}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 py-4 text-sm font-medium text-white hover:bg-white hover:text-neutral-950"
          >
            Activate Another Code
          </button>
        </div>
      )}
    </div>
  )
}
