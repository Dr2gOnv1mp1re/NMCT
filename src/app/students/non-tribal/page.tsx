import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import StudentsRegistry from "@/components/StudentsRegistry";

export const dynamic = "force-dynamic";

export default async function NonTribalStudentsPage() {
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

  const officerId = officerDbUser?.id || "demo_officer_id";
  const officerName = officerDbUser?.name || "Demo Officer";
  const officerDistrict = officerDbUser?.district || "Nilgiris";

  // 4. Fetch assigned non-tribal students
  const { data: studentsData } = await supabase
    .from("Student")
    .select("*")
    .eq("assignedOfficerId", officerId)
    .eq("isTribal", false);

  const students = studentsData || [];

  // Sort alphabetically case-insensitively
  students.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return (
    <StudentsRegistry
      students={students}
      officerId={officerId}
      officerName={officerName}
      officerDistrict={officerDistrict}
    />
  );
}
