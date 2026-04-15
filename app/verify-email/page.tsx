import { VerifyEmailScreen } from "@/src/components/auth/VerifyEmailScreen";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ userID?: string }>;
}) {
  const params = await searchParams;
  return <VerifyEmailScreen initialUserID={params.userID ?? ""} />;
}
