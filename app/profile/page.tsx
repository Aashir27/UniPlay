import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";
import { ProfileClient } from "@/app/profile/ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="rounded-xl border p-5">
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Auth-required area (FR-39). Session user id: {session.user.id}
        </p>
      </header>

      <ProfileClient />
    </main>
  );
}
