import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import AchievementsSection from "./AchievementsSection";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleTuitionEnrollment } from "@/app/actions";
import { UserButton, Show } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params if it is a Promise (Next.js 15 routing rule)
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "officer@nmct.org";

  const officerDbUser = await db.user.findFirst({
    where: { email },
  });

  const officerName = officerDbUser?.name || "Demo Officer";
  const officerDistrict = officerDbUser?.district || "Nilgiris";

  // Fetch student details with relations
  const student = await db.student.findUnique({
    where: { id },
    include: {
      attendanceRecords: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
      achievements: {
        orderBy: { date: "desc" },
      },
      tuitionAttendance: {
        orderBy: { date: "desc" },
        take: 30, // Show last 30 daily logs
      },
    },
  });

  if (!student) {
    notFound();
  }

  // Calculate age from DOB
  const getAge = (dob: Date) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const totalMonthlyRecords = student.attendanceRecords.length;
  const averageAttendance = totalMonthlyRecords > 0
    ? Math.round(student.attendanceRecords.reduce((acc, curr) => acc + curr.percentage, 0) / totalMonthlyRecords)
    : null;

  // Compute tuition attendance statistics
  const totalTuitionSessions = student.tuitionAttendance.length;
  const presentTuitionSessions = student.tuitionAttendance.filter(
    (a) => a.status === "PRESENT"
  ).length;
  const tuitionAttendanceRate = totalTuitionSessions > 0
    ? Math.round((presentTuitionSessions / totalTuitionSessions) * 100)
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 lg:px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <label
              htmlFor="sidebar-toggle"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer lg:hidden flex items-center justify-center text-xl select-none"
              aria-label="Toggle navigation menu"
            >
              ☰
            </label>
            <Link
              href="/students"
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold transition"
            >
              ← Back to Students
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-6xl w-full mx-auto">
          {/* Student Header Profile Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
            {/* Student Photo */}
            <div className="flex-shrink-0">
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-slate-100 text-slate-400 border-4 border-slate-200 flex items-center justify-center text-5xl font-bold shadow-xs">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h2 className="text-3xl font-bold tracking-tight text-[#0B1329]">
                    {student.name}
                  </h2>
                  <span
                    className={`text-xs font-bold py-1 px-3 rounded-full ${
                      student.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : student.status === "AT_RISK"
                        ? "bg-amber-50 text-amber-700"
                        : student.status === "DROPPED_OUT"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {student.status}
                  </span>
                  <span
                    className={`text-xs font-bold py-1 px-3 rounded-full ${
                      student.isTribal
                        ? "bg-teal-50 text-teal-700"
                        : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {student.isTribal ? "Tribal Student" : "Non-Tribal Student"}
                  </span>
                </div>
                <p className="text-slate-500 font-medium mt-1">
                  {student.tribe} · {getAge(student.dob)} years old (DOB:{" "}
                  {new Date(student.dob).toLocaleDateString()})
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    School
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {student.school}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Class/Grade
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {student.currentClass}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Village
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {student.village}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    District
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {student.district}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Contact and Secondary details */}
            <div className="lg:col-span-1 space-y-6">
              {/* Guardian Info */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-left space-y-4">
                <h3 className="font-bold text-base text-[#0B1329] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span>👪</span> Guardian Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      Name
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {student.guardianName}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      Phone Number
                    </span>
                    <span className="text-sm font-mono text-slate-700">
                      {student.guardianPhone || "No Phone Number Provided"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      Aadhaar Last 4 Digits
                    </span>
                    <span className="text-sm font-mono text-slate-700">
                      {student.aadhaarLast4 || "Not Provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Programs Details */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-left space-y-4">
                <h3 className="font-bold text-base text-[#0B1329] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span>📝</span> Program Enrolment
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Tuition Attendance</p>
                      <p className="text-[10px] text-slate-400">Marked separately for tutoring</p>
                    </div>
                    <form action={async () => {
                      "use server";
                      await toggleTuitionEnrollment(student.id);
                    }}>
                      <button
                        type="submit"
                        className={`text-[10px] font-bold py-1 px-3 rounded-full hover:opacity-85 active:scale-95 transition cursor-pointer ${
                          student.goesToTuition
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Click to toggle tuition program enrollment"
                      >
                        {student.goesToTuition ? "Enrolled" : "Not Enrolled"}
                      </button>
                    </form>
                  </div>

                  {student.goesToTuition && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-2 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">
                          Tuition Rate
                        </span>
                        <span className={`font-bold ${
                          tuitionAttendanceRate !== null && tuitionAttendanceRate < 75
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }`}>
                          {tuitionAttendanceRate !== null ? `${tuitionAttendanceRate}%` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">
                          Sessions Attended
                        </span>
                        <span className="font-semibold text-slate-700">
                          {presentTuitionSessions} / {totalTuitionSessions} days
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 italic mt-1 leading-normal">
                        * Stats calculated from the last 30 daily logs.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Achievements and Attendance matrices */}
            <div className="lg:col-span-2 space-y-6">
              {/* Achievements Section Client Component */}
              <AchievementsSection
                studentId={student.id}
                initialAchievements={student.achievements}
              />

              {/* Attendance Matrix Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-[#0B1329] flex items-center gap-2">
                    <span>📅</span> School Attendance Matrix
                  </h3>
                  {averageAttendance !== null && (
                    <span className="text-xs font-semibold bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full">
                      Avg: {averageAttendance}%
                    </span>
                  )}
                </div>

                {student.attendanceRecords.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    No regular school attendance records logged yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="py-2.5">Academic Period</th>
                          <th className="py-2.5">Days Attended</th>
                          <th className="py-2.5">Total Days</th>
                          <th className="py-2.5">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {student.attendanceRecords.map((rec) => (
                          <tr key={rec.id} className="text-slate-700">
                            <td className="py-3 font-semibold text-xs">
                              {new Date(0, rec.month - 1).toLocaleString("en", {
                                month: "long",
                              })}{" "}
                              {rec.year}
                            </td>
                            <td className="py-3 font-mono text-xs">{rec.daysPresent} days</td>
                            <td className="py-3 font-mono text-xs">{rec.daysTotal} days</td>
                            <td className="py-3">
                              <span
                                className={`text-xs font-mono font-bold ${
                                  rec.percentage >= 90
                                    ? "text-emerald-600"
                                    : rec.percentage >= 75
                                    ? "text-amber-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {Math.round(rec.percentage)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tuition Attendance Section */}
              {student.goesToTuition && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-left space-y-4">
                  <h3 className="font-bold text-base text-[#0B1329] border-b border-slate-100 pb-3 flex items-center gap-2">
                    <span>📖</span> Tuition Log (Last 30 entries)
                  </h3>

                  {student.tuitionAttendance.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                      No tuition attendance logs saved yet. Mark daily logs on the Tuition Attendance page.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {student.tuitionAttendance.map((ta) => (
                        <div
                          key={ta.id}
                          className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                            ta.status === "PRESENT"
                              ? "bg-emerald-50/40 border-emerald-100 text-emerald-800"
                              : "bg-rose-50/40 border-rose-100 text-rose-800"
                          }`}
                        >
                          <span className="font-medium">
                            {new Date(ta.date).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wide">
                            {ta.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
