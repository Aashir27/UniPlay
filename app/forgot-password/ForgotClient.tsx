"use client";

import { ForgotPasswordScreen } from "@/src/components/auth/ForgotPasswordScreen";

export default function ForgotClient() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl">
        <ForgotPasswordScreen />
      </div>
    </main>
  );
}
