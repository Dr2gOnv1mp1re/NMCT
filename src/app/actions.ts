"use server";

import { db } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

export async function inviteFieldOfficer(formData: {
  name: string;
  email: string;
  district: string;
  phone?: string;
  adminUserId: string;
}) {
  try {
    const { name, email, district, phone, adminUserId } = formData;

    if (!name || !email || !district) {
      throw new Error("Missing required fields");
    }

    // 1. Create Clerk invitation
    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role: "FIELD_OFFICER",
      },
    });

    // 2. Create the User row in the database
    // We use the unique invitation.id as a temporary placeholder for clerkUserId
    const user = await db.user.create({
      data: {
        clerkUserId: invitation.id,
        name,
        email,
        role: Role.FIELD_OFFICER,
        district,
        phone: phone || null,
        isActive: true,
      },
    });

    // 3. Log the activity in the audit trail
    await db.activityLog.create({
      data: {
        userId: adminUserId,
        action: `Invited field officer ${name}`,
        metadata: JSON.stringify({
          officerEmail: email,
          district,
          invitationId: invitation.id,
        }),
      },
    });

    revalidatePath("/admin");
    return { success: true, user };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to invite field officer:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function addStudent(data: {
  name: string;
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  tribe: string;
  aadhaarLast4?: string;
  guardianName: string;
  guardianPhone?: string;
  school: string;
  currentClass: string;
  district: string;
  village: string;
  assignedOfficerId: string;
  isTribal?: boolean;
  goesToTuition?: boolean;
  photoBase64?: string;
  photoName?: string;
}) {
  try {
    const {
      name,
      dob,
      gender,
      tribe,
      aadhaarLast4,
      guardianName,
      guardianPhone,
      school,
      currentClass,
      district,
      village,
      assignedOfficerId,
      isTribal = true,
      goesToTuition = false,
      photoBase64,
    } = data;

    if (
      !name ||
      !dob ||
      !gender ||
      !tribe ||
      !guardianName ||
      !school ||
      !currentClass ||
      !district ||
      !village ||
      !assignedOfficerId
    ) {
      throw new Error("Missing required fields");
    }

    let photoUrl = null;
    if (photoBase64) {
      const matches = photoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const fileType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = fileType.split('/')[1] || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        photoUrl = `/uploads/${fileName}`;
      }
    }

    // 1. Create the student in database
    const student = await db.student.create({
      data: {
        name,
        dob: new Date(dob),
        gender,
        tribe,
        aadhaarLast4: aadhaarLast4 || null,
        guardianName,
        guardianPhone: guardianPhone || null,
        school,
        currentClass,
        district,
        village,
        assignedOfficerId,
        status: "ACTIVE",
        isTribal,
        goesToTuition,
        photoUrl,
      },
    });

    // 2. Log activity in audit trail
    await db.activityLog.create({
      data: {
        userId: assignedOfficerId,
        action: `Added student ${name}`,
        studentId: student.id,
        metadata: JSON.stringify({
          school,
          currentClass,
          district,
          village,
          isTribal,
          goesToTuition,
        }),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/students");
    revalidatePath("/students/tribal");
    revalidatePath("/students/non-tribal");
    return { success: true, student };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to add student:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function importStudents(data: {
  students: {
    name: string;
    dob: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    tribe: string;
    aadhaarLast4?: string;
    guardianName: string;
    guardianPhone?: string;
    school: string;
    currentClass: string;
    district: string;
    village: string;
  }[];
  assignedOfficerId: string;
}) {
  try {
    const { students, assignedOfficerId } = data;

    if (!students || students.length === 0 || !assignedOfficerId) {
      throw new Error("No student records provided");
    }

    // Insert all records in a batch
    const createdStudents = await Promise.all(
      students.map(async (s) => {
        return await db.student.create({
          data: {
            name: s.name,
            dob: new Date(s.dob),
            gender: s.gender,
            tribe: s.tribe,
            aadhaarLast4: s.aadhaarLast4 || null,
            guardianName: s.guardianName,
            guardianPhone: s.guardianPhone || null,
            school: s.school,
            currentClass: s.currentClass,
            district: s.district,
            village: s.village,
            assignedOfficerId,
            status: "ACTIVE",
          },
        });
      }),
    );

    // Log the batch import activity in the audit trail
    await db.activityLog.create({
      data: {
        userId: assignedOfficerId,
        action: `Imported ${students.length} students via Excel/CSV`,
        metadata: JSON.stringify({
          count: students.length,
          officerId: assignedOfficerId,
        }),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true, count: createdStudents.length };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to import students:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function logAttendance(data: {
  studentId: string;
  month: number;
  year: number;
  daysPresent: number;
  daysTotal: number;
  recordedById: string;
}) {
  try {
    const { studentId, month, year, daysPresent, daysTotal, recordedById } =
      data;
    const percentage = daysTotal > 0 ? (daysPresent / daysTotal) * 100 : 0;

    const record = await db.attendanceRecord.create({
      data: {
        studentId,
        month,
        year,
        daysPresent,
        daysTotal,
        percentage,
        recordedById,
      },
    });

    // Recalculate risk level based on simple criteria (e.g. attendance < 80% increases risk)
    const recentRecords = await db.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    const avgAttendance =
      recentRecords.reduce((acc, curr) => acc + curr.percentage, 0) /
      (recentRecords.length || 1);
    let level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let status: "ACTIVE" | "AT_RISK" | "DROPPED_OUT" = "ACTIVE";

    if (avgAttendance < 75) {
      level = "CRITICAL";
      status = "AT_RISK";
    } else if (avgAttendance < 85) {
      level = "HIGH";
      status = "AT_RISK";
    } else if (avgAttendance < 90) {
      level = "MEDIUM";
      status = "AT_RISK";
    }

    await db.student.update({
      where: { id: studentId },
      data: { status },
    });

    await db.dropoutRiskScore.upsert({
      where: { studentId },
      create: {
        studentId,
        score: 100 - avgAttendance,
        level,
        factors: JSON.stringify({
          avgAttendance,
          recentPercentage: percentage,
        }),
      },
      update: {
        score: 100 - avgAttendance,
        level,
        factors: JSON.stringify({
          avgAttendance,
          recentPercentage: percentage,
        }),
      },
    });

    await db.activityLog.create({
      data: {
        userId: recordedById,
        action: `Logged attendance for student (ID: ${studentId})`,
        studentId: studentId,
        metadata: JSON.stringify({ month, year, percentage }),
      },
    });

    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true, record };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to log attendance";
    console.error("Failed to log attendance:", error);
    return { success: false, error: errorMessage };
  }
}

export async function addDBTRecord(data: {
  studentId: string;
  scholarshipName: string;
  amount: number;
  status:
    | "ELIGIBLE"
    | "DOCUMENTS_PENDING"
    | "VERIFIED"
    | "DISBURSED"
    | "CONFIRMED"
    | "REJECTED";
  updatedById: string;
}) {
  try {
    const { studentId, scholarshipName, amount, status, updatedById } = data;

    // Duplicate Check: check if student already has this scholarship scheme record
    const existingRecord = await db.dBTRecord.findFirst({
      where: {
        studentId,
        scholarshipName,
      },
    });

    if (existingRecord) {
      return {
        success: false,
        error: `A scholarship application for "${scholarshipName}" already exists for this student.`,
      };
    }

    const record = await db.dBTRecord.create({
      data: {
        studentId,
        scholarshipName,
        amount,
        status,
        updatedById,
      },
    });

    await db.activityLog.create({
      data: {
        userId: updatedById,
        action: `Added DBT record for scholarship "${scholarshipName}"`,
        studentId: studentId,
        metadata: JSON.stringify({ amount, status }),
      },
    });

    revalidatePath("/dbt");
    revalidatePath("/dashboard");
    return { success: true, record };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add DBT record";
    console.error("Failed to add DBT record:", error);
    return { success: false, error: errorMessage };
  }
}

export async function updateDBTStatus(data: {
  recordId: string;
  status:
    | "ELIGIBLE"
    | "DOCUMENTS_PENDING"
    | "VERIFIED"
    | "DISBURSED"
    | "CONFIRMED"
    | "REJECTED";
  remarks?: string;
  updatedById: string;
}) {
  try {
    const { recordId, status, remarks, updatedById } = data;
    const updateData: Record<string, unknown> = {
      status,
      remarks,
      updatedById,
    };

    if (status === "VERIFIED") {
      updateData.verifiedDate = new Date();
    } else if (status === "DISBURSED") {
      updateData.disbursedDate = new Date();
    } else if (status === "CONFIRMED") {
      updateData.confirmedDate = new Date();
    } else if (status === "ELIGIBLE") {
      updateData.appliedDate = new Date();
    }

    const record = await db.dBTRecord.update({
      where: { id: recordId },
      data: updateData,
    });

    await db.activityLog.create({
      data: {
        userId: updatedById,
        action: `Updated DBT scholarship status of "${record.scholarshipName}" to ${status}`,
        studentId: record.studentId,
        metadata: JSON.stringify({ recordId, status, remarks }),
      },
    });

    revalidatePath("/dbt");
    revalidatePath("/dashboard");
    return { success: true, record };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update DBT status";
    console.error("Failed to update DBT status:", error);
    return { success: false, error: errorMessage };
  }
}

export async function addAchievement(data: {
  studentId: string;
  title: string;
  event: string;
  award?: string;
  date?: string;
}) {
  try {
    const { studentId, title, event, award, date } = data;
    if (!studentId || !title || !event) {
      throw new Error("Missing required fields");
    }

    const achievement = await db.achievement.create({
      data: {
        studentId,
        title,
        event,
        award: award || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/achievements");
    return { success: true, achievement };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to add achievement:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function deleteAchievement(id: string) {
  try {
    const achievement = await db.achievement.delete({
      where: { id },
    });
    revalidatePath(`/students/${achievement.studentId}`);
    revalidatePath("/achievements");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to delete achievement:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function logTuitionAttendance(data: {
  date: string;
  records: { studentId: string; status: "PRESENT" | "ABSENT" }[];
  recordedById: string;
}) {
  try {
    const { date, records, recordedById } = data;
    if (!date || !records || records.length === 0 || !recordedById) {
      throw new Error("Missing required fields");
    }

    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const results = await Promise.all(
      records.map(async (record) => {
        return await db.tuitionAttendance.upsert({
          where: {
            studentId_date: {
              studentId: record.studentId,
              date: parsedDate,
            },
          },
          create: {
            studentId: record.studentId,
            date: parsedDate,
            status: record.status,
            recordedById,
          },
          update: {
            status: record.status,
            recordedById,
          },
        });
      })
    );

    revalidatePath("/attendance/tuition");
    return { success: true, count: results.length };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to log tuition attendance:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function verifyDBTRecord(recordId: string, officerId: string) {
  try {
    return await updateDBTStatus({
      recordId,
      status: "VERIFIED",
      updatedById: officerId,
      remarks: "Status updated to VERIFIED via Quick Action.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to verify DBT record:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function disburseDBTRecord(recordId: string, officerId: string) {
  try {
    return await updateDBTStatus({
      recordId,
      status: "DISBURSED",
      updatedById: officerId,
      remarks: "Status updated to DISBURSED via Quick Action.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to disburse DBT record:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function toggleTuitionEnrollment(studentId: string) {
  try {
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Student not found");

    const updated = await db.student.update({
      where: { id: studentId },
      data: { goesToTuition: !student.goesToTuition },
    });

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/attendance/tuition");
    return { success: true, goesToTuition: updated.goesToTuition };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to toggle tuition enrollment:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function logBulkAttendance(data: {
  records: { studentId: string; daysPresent: number; daysTotal: number }[];
  month: number;
  year: number;
  recordedById: string;
}) {
  try {
    const { records, month, year, recordedById } = data;

    const results = await Promise.all(
      records.map(async (rec) => {
        const percentage = rec.daysTotal > 0 ? (rec.daysPresent / rec.daysTotal) * 100 : 0;

        const record = await db.attendanceRecord.create({
          data: {
            studentId: rec.studentId,
            month,
            year,
            daysPresent: rec.daysPresent,
            daysTotal: rec.daysTotal,
            percentage,
            recordedById,
          },
        });

        const recentRecords = await db.attendanceRecord.findMany({
          where: { studentId: rec.studentId },
          orderBy: { createdAt: "desc" },
          take: 3,
        });
        const avgAttendance =
          recentRecords.reduce((acc, curr) => acc + curr.percentage, 0) /
          (recentRecords.length || 1);
        let level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
        let status: "ACTIVE" | "AT_RISK" | "DROPPED_OUT" = "ACTIVE";

        if (avgAttendance < 75) {
          level = "CRITICAL";
          status = "AT_RISK";
        } else if (avgAttendance < 85) {
          level = "HIGH";
          status = "AT_RISK";
        } else if (avgAttendance < 90) {
          level = "MEDIUM";
          status = "AT_RISK";
        }

        await db.student.update({
          where: { id: rec.studentId },
          data: { status },
        });

        await db.dropoutRiskScore.upsert({
          where: { studentId: rec.studentId },
          create: {
            studentId: rec.studentId,
            score: 100 - avgAttendance,
            level,
            factors: JSON.stringify({
              avgAttendance,
              recentPercentage: percentage,
            }),
          },
          update: {
            score: 100 - avgAttendance,
            level,
            factors: JSON.stringify({
              avgAttendance,
              recentPercentage: percentage,
            }),
          },
        });

        return record;
      })
    );

    await db.activityLog.create({
      data: {
        userId: recordedById,
        action: `Logged bulk attendance for ${records.length} students`,
        metadata: JSON.stringify({ month, year, studentIds: records.map((r) => r.studentId) }),
      },
    });

    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true, count: results.length };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to log bulk attendance:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}


