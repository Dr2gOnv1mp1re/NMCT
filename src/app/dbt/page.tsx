/* eslint-disable @typescript-eslint/no-explicit-any */
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import DBTManager from "./DBTManager";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function DBTPage() {
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

  // Fetch all DBT Records in the system, joined with student and assigned officer
  const { data: dbtRecordsData } = await supabase
    .from("DBTRecord")
    .select("*, student:Student(*, assignedOfficer:User(*))")
    .order("createdAt", { ascending: false });

  const dbtRecords = dbtRecordsData || [];

  // Fetch all students to feed the student picker dropdown in the modal
  const { data: allStudentsData } = await supabase
    .from("Student")
    .select("id, name, currentClass")
    .order("name", { ascending: true });

  const allStudents = allStudentsData || [];

  // Calculate DBT metrics
  const totalDisbursed = dbtRecords
    .filter((r) => r.status === "DISBURSED" || r.status === "CONFIRMED")
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingVerificationCount = dbtRecords.filter(
    (r) => r.status === "ELIGIBLE" || r.status === "DOCUMENTS_PENDING"
  ).length;

  const eligibleCount = dbtRecords.filter((r) => r.status === "ELIGIBLE").length;

  // Format records for the Client Component
  const formattedRecords = dbtRecords.map((r: any) => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.student?.name || "Unknown",
    studentClass: r.student?.currentClass || "Unknown",
    officerName: r.student?.assignedOfficer?.name || "Unknown",
    scholarshipName: r.scholarshipName,
    amount: r.amount,
    status: r.status,
    remarks: r.remarks,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar officerName={officerName} />

        <main className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-7xl w-full mx-auto text-left">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0B1329]">
              DBT Scholarships
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Verify applications, track scholarship statuses, and manage fund disbursements.
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Disbursed
              </span>
              <span className="text-2xl font-bold text-emerald-600 mt-2">
                ₹{totalDisbursed.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pending Verification
              </span>
              <span className="text-2xl font-bold text-amber-500 mt-2">
                {pendingVerificationCount}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Eligible Count
              </span>
              <span className="text-2xl font-bold text-sky-500 mt-2">
                {eligibleCount}
              </span>
            </div>
          </div>

          {/* DBT Management Panel */}
          <DBTManager
            records={formattedRecords}
            students={allStudents}
            officerId={officerId}
          />
        </main>
      </div>
    </div>
  );
}
