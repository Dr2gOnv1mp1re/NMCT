/* eslint-disable @typescript-eslint/no-explicit-any */
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import AttendanceDashboard from "./AttendanceDashboard";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "officer@nmct.org";

  const { data: officerDbUser } = await supabase
    .from("User")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  const officerId = officerDbUser?.id || "demo_officer_id";
  const officerName = officerDbUser?.name || "Demo Officer";
  const officerDistrict = officerDbUser?.district || "Coimbatore";

  // Fetch assigned students with attendance records (or all if admin)
  let query = supabase.from("Student").select("*, attendanceRecords:AttendanceRecord(*)");
  if (officerDbUser?.role !== "ADMIN") {
    query = query.eq("assignedOfficerId", officerId);
  }
  const { data: studentsData } = await query;

  const students = (studentsData || []).map((student: any) => {
    const attendanceRecords = (student.attendanceRecords || []).sort((a: any, b: any) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    return {
      ...student,
      attendanceRecords,
    };
  });

  students.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar officerName={officerName} />

        <main className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-7xl w-full mx-auto text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0B1329]">Attendance Management</h2>
            <p className="text-sm text-slate-500 mt-1">Log and track educational attendance records for tribal students.</p>
          </div>

          <AttendanceDashboard students={students} officerId={officerId} />
        </main>
      </div>
    </div>
  );
}
