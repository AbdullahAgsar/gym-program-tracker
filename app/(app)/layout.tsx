import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/shared/Navbar";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={session.username} role={session.role} />
      <div className="flex-1 pb-16 sm:pb-0">{children}</div>
    </div>
  );
}
