import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/lib/auth";
import {
  clearNotifications,
  checkAndCreateReminders,
  listNotifications,
} from "@/src/services/notification.service";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await checkAndCreateReminders(userID);

  const notifications = await listNotifications({ recipientID: userID });
  return NextResponse.json({ notifications });
}

export async function DELETE(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearNotifications(userID);
  return NextResponse.json({ ok: true });
}
