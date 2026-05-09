import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { DM_Sans, Space_Grotesk } from "next/font/google";

import { AppShell } from "@/src/components/layout/AppShell";
import { authOptions } from "@/src/lib/auth";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniPlay",
  description: "UniPlay architecture foundation and sprint-ready baseline",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell userName={session?.user?.name}>{children}</AppShell>
      </body>
    </html>
  );
}
