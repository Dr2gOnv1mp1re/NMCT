/* eslint-disable @typescript-eslint/no-explicit-any */
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import DashboardContent from "@/components/DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "officer@nmct.org";

  // 1. Find user in the local database by email
  let { data: officerDbUser } = await supabase
    .from("User")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  // 2. If the user was invited and is logging in for the first time,
  // we update their temporary invitation clerkUserId with their real Clerk ID
  if (officerDbUser && officerDbUser.clerkUserId.startsWith("inv_") && clerkUser) {
    const { data: updatedUser } = await supabase
      .from("User")
      .update({ clerkUserId: clerkUser.id })
      .eq("id", officerDbUser.id)
      .select()
      .single();
    if (updatedUser) officerDbUser = updatedUser;
  }

  // 3. Fallback: if the user does not exist in DB, create them as FIELD_OFFICER
  if (!officerDbUser && clerkUser) {
    const { data: createdUser } = await supabase
      .from("User")
      .insert({
        clerkUserId: clerkUser.id,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Field Officer",
        email: email,
        role: "FIELD_OFFICER",
        district: "Nilgiris",
        isActive: true,
      })
      .select()
      .single();
    if (createdUser) officerDbUser = createdUser;
  }

  // 4. Default mock user if not logged in and no DB user exists
  const officerId = officerDbUser?.id || "demo_officer_id";
  const officerName = officerDbUser?.name || "Demo Officer";
  const officerDistrict = officerDbUser?.district || "Nilgiris";

  // 5. Fetch assigned students including dbtRecords and riskScore
  const { data: studentsData } = await supabase
    .from("Student")
    .select("*, dbtRecords:DBTRecord(*), riskScore:DropoutRiskScore(*)")
    .eq("assignedOfficerId", officerId);

  const students = (studentsData || []).map((s: any) => ({
    ...s,
    // Supabase returns 1-to-1 relation as array or single. We normalize it.
    riskScore: Array.isArray(s.riskScore) ? s.riskScore[0] : s.riskScore,
  }));

  // Sort alphabetically case-insensitively
  students.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  // 6. Calculate stats
  const totalStudents = students.length;
  const activeEnrolled = students.filter((s) => s.status === "ACTIVE").length;
  const atDropoutRisk = students.filter((s) => s.status === "AT_RISK").length;

  let totalDisbursedAmount = 0;
  let pendingDBTCount = 0;

  students.forEach((student) => {
    student.dbtRecords.forEach((record: any) => {
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
    <DashboardContent
      students={students}
      officerId={officerId}
      officerName={officerName}
      officerDistrict={officerDistrict}
      overallStats={{
        totalStudents,
        activeEnrolled,
        atDropoutRisk,
        totalDisbursedAmount,
        pendingDBTCount,
      }}
    />
  );
}
