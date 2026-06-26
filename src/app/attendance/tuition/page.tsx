import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import TuitionAttendanceForm from "./TuitionAttendanceForm";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function TuitionAttendancePage() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "officer@nmct.org";

  const officerDbUser = await db.user.findFirst({
    where: { email },
  });

  const officerId = officerDbUser?.id || "demo_officer_id";
  const officerName = officerDbUser?.name || "Demo Officer";
  const officerDistrict = officerDbUser?.district || "Nilgiris";

  // Fetch tuition going students assigned to this officer
  const students = await db.student.findMany({
    where: {
      assignedOfficerId: officerId,
      goesToTuition: true,
    },
    select: {
      id: true,
      name: true,
      village: true,
      school: true,
    },
  });

  // Sort alphabetically
  students.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const studentIds = students.map((s) => s.id);

  // Fetch tuition attendance logs for these students
  const initialLogs = await db.tuitionAttendance.findMany({
    where: {
      studentId: {
        in: studentIds,
      },
    },
    select: {
      studentId: true,
      date: true,
      status: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar officerName={officerName} />

        {/* Content Body */}
        <main className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-7xl w-full mx-auto">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0B1329]">
              Tuition Program Attendance
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Mark and review daily tutoring session attendance records for enrolled students.
            </p>
          </div>

          <TuitionAttendanceForm
            students={students}
            recordedById={officerId}
            initialLogs={initialLogs}
          />
        </main>
      </div>
    </div>
  );
}
