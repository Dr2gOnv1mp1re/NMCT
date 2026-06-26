import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import StudentsRegistry from "@/components/StudentsRegistry";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
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

  const officerId = officerDbUser?.id || "demo_officer_id";
  const officerName = officerDbUser?.name || "Demo Officer";
  const officerDistrict = officerDbUser?.district || "Nilgiris";

  // 4. Fetch assigned students
  const students = await db.student.findMany({
    where: { assignedOfficerId: officerId },
  });

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
