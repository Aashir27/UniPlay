"use client";

import { FormEvent, useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type VerifyResponse = { ok?: boolean; error?: string };

export function VerifyEmailClient({ initialUserID }: { initialUserID: string }) {
  const router = useRouter();
  const [userID] = useState(initialUserID);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = digits.join("");

  function handleDigit(index: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKey(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function onVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, otp }),
    });
    const data = (await res.json()) as VerifyResponse;

    if (!res.ok) {
      setError(data.error ?? "Verification failed. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setBusy(false);
      return;
    }

    setSuccess(true);
    setBusy(false);
    setTimeout(() => router.push("/login"), 2000);
  }

  async function onResend() {
    setBusy(true);
    setError(null);

    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID }),
    });
    const data = (await res.json()) as VerifyResponse;

    if (!res.ok) {
      setError(data.error ?? "Resend failed.");
    } else {
      let secs = 60;
      setResendCooldown(secs);
      const t = setInterval(() => {
        secs--;
        setResendCooldown(secs);
        if (secs === 0) clearInterval(t);
      }, 1000);
    }
    setBusy(false);
  }

  if (success) {
    return (
      <div style={styles.root}>
        <div style={styles.centeredCard}>
          <div style={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={styles.successHeading}>Email verified!</h2>
          <p style={styles.successSub}>Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <aside style={styles.brand}>
        <div style={styles.brandInner}>
          <Logo />
          <div>
            <h2 style={styles.brandHeading}>Almost there.</h2>
            <p style={styles.brandSub}>
              We've sent a 6-digit code to your university email. It expires in
              15 minutes.
            </p>
          </div>
          <div style={styles.infoBox}>
            <InfoIcon />
            <p style={styles.infoText}>
              Can't find it? Check your spam folder or request a new code.
            </p>
          </div>
        </div>
        <div style={styles.brandGlow} aria-hidden />
      </aside>

      <main style={styles.formPanel}>
        <div style={styles.formCard}>
          <div style={styles.mobileLogo}><Logo /></div>

          <p style={styles.eyebrow}>Step 2 of 3</p>
          <h1 style={styles.heading}>Verify your email</h1>
          <p style={styles.subheading}>
            Enter the 6-digit code we sent to your university address.
          </p>

          <form onSubmit={onVerify} style={styles.form}>
            <div style={styles.otpRow}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKey(i, e)}
                  onPaste={handlePaste}
                  style={{
                    ...styles.otpInput,
                    ...(d ? styles.otpInputFilled : {}),
                    ...(error ? styles.otpInputError : {}),
                  }}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorDot} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || otp.length < 6}
              style={{ ...styles.btn, opacity: busy || otp.length < 6 ? 0.5 : 1 }}
            >
              {busy ? <Spinner /> : "Verify code"}
            </button>
          </form>

          <div style={styles.resendWrap}>
            <p style={styles.resendLabel}>Didn't receive it?</p>
            <button
              type="button"
              onClick={onResend}
              disabled={busy || resendCooldown > 0}
              style={{
                ...styles.resendBtn,
                opacity: resendCooldown > 0 || busy ? 0.5 : 1,
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>

          <div style={styles.backWrap}>
            <Link href="/login" style={styles.backLink}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function Logo() {
  return (
    <div style={styles.logo}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="8" fill="#a3e635" />
        <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="#0b0f1a" />
        <circle cx="14" cy="14" r="3" fill="#a3e635" />
      </svg>
      <span style={styles.logoText}>UniPlay</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="9" cy="9" r="7" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" fill="none" />
      <path d="M9 2 A7 7 0 0 1 16 9" stroke="#0b0f1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "1px" }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", display: "flex", background: "var(--up-bg)" },
  brand: {
    position: "relative",
    width: "42%",
    background: "var(--up-surface)",
    borderRight: "1px solid var(--up-border)",
    display: "flex",
    flexDirection: "column",
    padding: "3rem",
    overflow: "hidden",
  },
  brandInner: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
    height: "100%",
    justifyContent: "center",
  },
  brandGlow: {
    position: "absolute",
    bottom: "-60px",
    right: "-60px",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(163,230,53,0.1) 0%, transparent 65%)",
    pointerEvents: "none",
  },
  brandHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "2.4rem",
    fontWeight: 700,
    lineHeight: 1.15,
    color: "var(--up-text)",
  },
  brandSub: { marginTop: "0.75rem", fontSize: "0.95rem", color: "var(--up-muted)", lineHeight: 1.7 },
  infoBox: {
    display: "flex",
    gap: "0.6rem",
    alignItems: "flex-start",
    background: "var(--up-accent-bg)",
    border: "1px solid rgba(163,230,53,0.15)",
    borderRadius: "10px",
    padding: "0.85rem 1rem",
  },
  infoText: { fontSize: "0.85rem", color: "var(--up-muted)", lineHeight: 1.6, margin: 0 },
  formPanel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" },
  formCard: { width: "100%", maxWidth: "420px" },
  mobileLogo: { display: "none", marginBottom: "2rem" },
  eyebrow: {
    fontSize: "0.78rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--up-accent)",
    marginBottom: "0.5rem",
  },
  heading: {
    fontFamily: "var(--font-display)",
    fontSize: "1.85rem",
    fontWeight: 700,
    color: "var(--up-text)",
    marginBottom: "0.5rem",
  },
  subheading: {
    fontSize: "0.9rem",
    color: "var(--up-muted)",
    lineHeight: 1.6,
    marginBottom: "2rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  otpRow: { display: "flex", gap: "0.6rem", justifyContent: "center" },
  otpInput: {
    width: "52px",
    height: "64px",
    textAlign: "center",
    fontSize: "1.5rem",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    background: "var(--up-surface)",
    border: "1.5px solid var(--up-border-mid)",
    borderRadius: "12px",
    color: "var(--up-text)",
    outline: "none",
    caretColor: "var(--up-accent)",
    transition: "border-color 0.15s",
  },
  otpInputFilled: {
    border: "1.5px solid rgba(163,230,53,0.5)",
    background: "var(--up-accent-bg)",
  },
  otpInputError: {
    border: "1.5px solid rgba(248,113,113,0.5)",
    background: "var(--up-danger-bg)",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.85rem",
    color: "var(--up-danger)",
    background: "var(--up-danger-bg)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: "8px",
    padding: "0.65rem 0.9rem",
  },
  errorDot: { width: "6px", height: "6px", borderRadius: "50%", background: "var(--up-danger)", flexShrink: 0 },
  btn: {
    height: "48px",
    background: "var(--up-accent)",
    color: "#0b0f1a",
    border: "none",
    borderRadius: "10px",
    fontFamily: "var(--font-display)",
    fontSize: "0.95rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  resendWrap: { marginTop: "1.25rem", textAlign: "center" },
  resendLabel: { fontSize: "0.85rem", color: "var(--up-muted)", marginBottom: "0.4rem" },
  resendBtn: {
    background: "none",
    border: "none",
    color: "var(--up-accent)",
    fontSize: "0.875rem",
    fontWeight: 600,
    padding: 0,
    fontFamily: "var(--font-body)",
  },
  backWrap: { marginTop: "1.5rem", textAlign: "center" },
  backLink: { fontSize: "0.85rem", color: "var(--up-muted)" },
  centeredCard: {
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "3rem",
  },
  successIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "var(--up-accent-bg)",
    border: "1.5px solid rgba(163,230,53,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--up-text)",
  },
  successSub: { fontSize: "0.9rem", color: "var(--up-muted)" },
  logo: { display: "flex", alignItems: "center", gap: "0.6rem" },
  logoText: { fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--up-text)" },
};
