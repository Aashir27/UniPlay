import { VerifyEmailClient } from "./verify-email-client";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ userID?: string }>;
}) {
  const params = await searchParams;

  return <VerifyEmailClient initialUserID={params.userID ?? ""} />;
}
