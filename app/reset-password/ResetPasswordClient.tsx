"use client";

import dynamic from "next/dynamic";
import { ResetPasswordScreen } from "@/src/components/auth/ResetPasswordScreen";

export default function ResetPasswordClient({ token, uid }: { token?: string; uid?: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl">
        <ResetPasswordScreen token={token} uid={uid} />
      </div>
    </main>
  );
}
