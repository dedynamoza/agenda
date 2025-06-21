import { redirect } from "next/navigation";

import { CalendarSection } from "@/components/calendar/calendar-section";
import { EmployeeFilterSelect } from "@/components/employee-filter-select";

import { getCurrentUser } from "@/lib/user";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen px-4 md:px-12 pt-20 font-[family-name:var(--font-geist-sans)] space-y-3">
      <EmployeeFilterSelect />
      <CalendarSection userId={user.id} />
    </div>
  );
}
