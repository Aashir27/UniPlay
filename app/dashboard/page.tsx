import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <DashboardClient
      userName={session.user.name ?? "UniPlay member"}
      userRole={session.user.role}
      userID={session.user.id}
    />
  );
}
