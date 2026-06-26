import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import AddStudentButton from "@/components/AddStudentButton";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "officer@nmct.org";

  // 1. Find user in the local database by email
  let officerDbUser = await db.user.findFirst({
    where: { email: email },
  });

  // 2. If the user was invited and is logging in for the first time,
  // we update their temporary invitation clerkUserId with their real Clerk ID
  if (officerDbUser && officerDbUser.clerkUserId.startsWith("inv_") && clerkUser) {
    officerDbUser = await db.user.update({
      where: { id: officerDbUser.id },
      data: { clerkUserId: clerkUser.id },
    });
  }

  // 3. Fallback: if the user does not exist in DB, create them as FIELD_OFFICER
  if (!officerDbUser && clerkUser) {
    officerDbUser = await db.user.create({
      data: {
        clerkUserId: clerkUser.id,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Field Officer",
        email: email,
        role: "FIELD_OFFICER",
        district: "Nilgiris",
        isActive: true,
      },
    });
  }

  // 4. Default mock user if not logged in and no DB user exists
  const officerId = officerDbUser?.id || "demo_officer_id";
  const officerName = officerDbUser?.name || "Demo Officer";
  const officerDistrict = officerDbUser?.district || "Nilgiris";

  // 5. Fetch assigned students including dbtRecords and riskScore
  const students = await db.student.findMany({
    where: { assignedOfficerId: officerId },
    include: {
      dbtRecords: true,
      riskScore: true,
    },
  });

  // Sort alphabetically case-insensitively
  students.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  // 6. Calculate stats
  const totalStudents = students.length;
  const activeEnrolled = students.filter((s) => s.status === "ACTIVE").length;
  const atDropoutRisk = students.filter((s) => s.status === "AT_RISK").length;

  let totalDisbursedAmount = 0;
  let pendingDBTCount = 0;

  students.forEach((student) => {
    student.dbtRecords.forEach((record) => {
      if (record.status === "DISBURSED" || record.status === "CONFIRMED") {
        totalDisbursedAmount += record.amount;
      } else if (
        record.status === "ELIGIBLE" ||
        record.status === "DOCUMENTS_PENDING" ||
        record.status === "VERIFIED"
      ) {
        pendingDBTCount++;
      }
    });
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      {/* 1. Left Sidebar (Client Component) */}
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <Topbar officerName={officerName} />

        {/* Inner Main Dashboard */}
        <main className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl w-full mx-auto">
          {/* Welcome Header */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">
              Live overview of tribal student educational tracking and welfare distribution.
            </p>
          </div>

          {/* Ingestion & List Area */}
          {totalStudents === 0 ? (
            /* Empty State Card exactly matching the screenshot */
            <div className="border-2 border-dashed border-slate-200 bg-slate-50/40 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-3xl text-slate-400 shadow-xs">
                🎓
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">No students enrolled yet</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Add your first tribal student to begin lifecycle tracking.
                </p>
              </div>
              <AddStudentButton
                assignedOfficerId={officerId}
                defaultDistrict={officerDistrict}
                className="bg-[#1E3A8A] hover:bg-[#152e72] text-white text-sm font-semibold py-2 px-6 rounded-lg shadow-xs transition"
              >
                Add Student
              </AddStudentButton>
            </div>
          ) : (
            /* Registered Students registry table when students exist */
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">My Students Registry</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Actively tracked student lifecycle data for {officerDistrict}
                  </p>
                </div>
                <AddStudentButton
                  assignedOfficerId={officerId}
                  defaultDistrict={officerDistrict}
                  className="bg-[#1F3D2B] hover:bg-[#2A5038] text-white text-xs font-semibold py-1.5 px-3 rounded transition"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">Tribe</th>
                      <th className="py-3 px-6">School</th>
                      <th className="py-3 px-6">Class</th>
                      <th className="py-3 px-6">Village</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition duration-150">
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{student.name}</td>
                        <td className="py-3.5 px-6 text-slate-600">{student.tribe}</td>
                        <td className="py-3.5 px-6 text-slate-500 font-medium">{student.school}</td>
                        <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">
                          {student.currentClass}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">{student.village}</td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`text-[10px] font-bold py-1 px-2.5 rounded-full ${
                              student.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : student.status === "AT_RISK"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats Cards (matching grid layout) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Students */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Students
                </p>
                <p className="text-3xl font-bold mt-1.5">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center text-xl shadow-xs">
                👥
              </div>
            </div>

            {/* Active Enrolled */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Enrolled
                </p>
                <p className="text-3xl font-bold mt-1.5">{activeEnrolled}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-xs">
                📈
              </div>
            </div>

            {/* At Dropout Risk */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  At Dropout Risk
                </p>
                <p className="text-3xl font-bold mt-1.5 text-rose-600">{atDropoutRisk}</p>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl shadow-xs">
                ⚠️
              </div>
            </div>

            {/* DBT Disbursed */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  DBT Disbursed
                </p>
                <p className="text-3xl font-bold mt-1.5">₹{totalDisbursedAmount.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-1">{pendingDBTCount} pending</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl shadow-xs">
                🏦
              </div>
            </div>
          </div>

          {/* Lower Section (Charts placeholders) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Chart: Students by Education Level */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800">Students by Education Level</h3>
              <div className="h-64 flex items-end justify-around gap-4 pt-6 border-b border-slate-200 font-mono text-xs text-slate-500 pb-2">
                <div className="flex flex-col items-center gap-2 w-12">
                  <div className="bg-[#1F3D2B] rounded-t w-full h-40 flex items-center justify-center text-[10px] text-white font-bold">
                    Primary
                  </div>
                  <span>Std 1-5</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <div className="bg-[#4A6741] rounded-t w-full h-24 flex items-center justify-center text-[10px] text-white font-bold">
                    Middle
                  </div>
                  <span>Std 6-8</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <div className="bg-[#D9A02C] rounded-t w-full h-16 flex items-center justify-center text-[10px] text-white font-bold">
                    Secondary
                  </div>
                  <span>Std 9-10</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <div className="bg-[#C15B3D] rounded-t w-full h-8 flex items-center justify-center text-[10px] text-white font-bold">
                    Higher
                  </div>
                  <span>College</span>
                </div>
              </div>
            </div>

            {/* Right Chart: Dropout Risk Distribution */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800">Dropout Risk</h3>
              <div className="h-64 flex flex-col justify-center space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span>Low Risk</span>
                  </div>
                  <span className="font-semibold">85%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-amber-500 rounded-full" />
                    <span>Medium Risk</span>
                  </div>
                  <span className="font-semibold">10%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-rose-500 rounded-full" />
                    <span>High Risk</span>
                  </div>
                  <span className="font-semibold">5%</span>
                </div>
                <div className="border-t border-slate-100 pt-4 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    All high risk alerts are logged & flagged for coordinator visit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
