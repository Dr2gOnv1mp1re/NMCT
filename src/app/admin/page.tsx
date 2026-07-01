import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "";

  // Find or create the user in our local DB
  let adminDbUser = null;
  if (email) {
    const { data } = await supabase
      .from("User")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    adminDbUser = data;
  }

  if (!adminDbUser && clerkUser && email) {
    const { data } = await supabase
      .from("User")
      .insert({
        clerkUserId: clerkUser.id,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Admin User",
        email,
        role: "ADMIN",
        district: "Coimbatore",
        isActive: true,
      })
      .select()
      .single();
    adminDbUser = data;
  }

  const officerName = adminDbUser?.name || "Admin";
  const officerDistrict = adminDbUser?.district || "Coimbatore";

  // Fetch field officers
  const { data: officersData } = await supabase
    .from("User")
    .select("*")
    .eq("role", "FIELD_OFFICER")
    .order("createdAt", { ascending: false });

  const officers = officersData || [];

  // Fetch recent activity logs
  const { data: logsData, error: logsError } = await supabase
    .from("ActivityLog")
    .select("*, user:User(*)")
    .order("createdAt", { ascending: false })
    .limit(20);

  if (logsError) {
    console.error("ERROR FETCHING ACTIVITY LOGS:", logsError);
  }

  let logs = logsData || [];

  if (logs.length === 0 && adminDbUser) {
    await supabase.from("ActivityLog").insert({
      userId: adminDbUser.id,
      action: "System audit log initialized",
      metadata: { initializedAt: new Date().toISOString(), system: "EduTrack" }
    });

    const { data: freshLogs } = await supabase
      .from("ActivityLog")
      .select("*, user:User(*)")
      .order("createdAt", { ascending: false })
      .limit(20);
    if (freshLogs) logs = freshLogs;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar officerName={officerName} />

        <main className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-7xl w-full mx-auto text-left">
          {/* Page heading */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0B1329]">Officers &amp; Audit</h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage field officers, invite new members, and review the tamper-evident activity log.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Officers</span>
              <p className="text-3xl font-bold text-[#1E3A8A] mt-2">{officers.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Log Entries</span>
              <p className="text-3xl font-bold text-slate-700 mt-2">{logs.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Role</span>
              <p className="text-xl font-bold text-emerald-600 mt-2">🛡️ Admin</p>
            </div>
          </div>

          {/* Main layout grid */}
          <div className="space-y-6">

            {/* Officers table + Audit log */}
            <div className="space-y-6">

              {/* Officers table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Registered Field Officers
                  </span>
                  <span className="text-[10px] font-bold bg-[#1E3A8A] text-white py-1 px-2.5 rounded-full">
                    {officers.length} active
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3.5 px-6">Name</th>
                        <th className="py-3.5 px-6">Email</th>
                        <th className="py-3.5 px-6">District</th>
                        <th className="py-3.5 px-6">Phone</th>
                        <th className="py-3.5 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {officers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-medium">
                            No field officers registered yet. Use the form to invite one.
                          </td>
                        </tr>
                      ) : (
                        officers.map((officer) => (
                          <tr key={officer.id} className="hover:bg-slate-50 transition duration-150">
                            <td className="py-3.5 px-6 font-semibold text-slate-800">{officer.name}</td>
                            <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">{officer.email}</td>
                            <td className="py-3.5 px-6">
                              <span className="text-[10px] font-bold bg-sky-50 text-sky-700 py-1 px-2.5 rounded-full">
                                {officer.district}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">
                              {officer.phone || "—"}
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full ${
                                officer.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}>
                                {officer.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit log */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recent System Activity
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tamper-evident audit trail for data compliance</p>
                </div>
                <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm font-medium">
                      No activity recorded yet.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition duration-150"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                            📌
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              By <span className="font-semibold text-slate-700">{log.user.name}</span>
                              <span className="font-mono ml-1 text-[10px] text-slate-400">({log.user.email})</span>
                            </p>
                            {log.metadata && (
                              <pre className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-500 font-mono whitespace-pre-wrap max-w-sm">
                                {typeof log.metadata === "string"
                                  ? log.metadata
                                  : JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap pt-1">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
