import ResetPasswordClient from "./ResetPasswordClient";

export default async function Page({ searchParams }: { searchParams?: Promise<{ token?: string; uid?: string }> }) {
  const params = searchParams ? await searchParams : undefined;
  const token = params?.token;
  const uid = params?.uid;
  return <ResetPasswordClient token={token} uid={uid} />;
}
