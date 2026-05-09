"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="rounded-lg border border-[var(--up-border-mid)] px-4 py-2 font-medium text-[var(--up-text)] hover:bg-[var(--up-accent-bg)]"
    >
      Back to Home
    </button>
  );
}
