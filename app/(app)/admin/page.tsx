import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PendingExercises } from "@/components/admin/PendingExercises";
import { UserTable } from "@/components/admin/UserTable";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/calendar");

  return (
    <main className="max-w-4xl mx-auto p-6 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Admin Paneli</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Onay Bekleyen Egzersizler</h2>
        <PendingExercises />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Kullanıcı Yönetimi</h2>
        <UserTable />
      </section>
    </main>
  );
}
