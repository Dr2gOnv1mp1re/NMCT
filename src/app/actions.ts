/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { supabase } from "@/lib/supabase";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import fs from "fs";
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

    // 0. Check if user already exists in database
    const { data: existingDbUser } = await supabase
      .from("User")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existingDbUser) {
      throw new Error("A user with this email address already exists in the system.");
    }

    const clerk = await clerkClient();
    let invitation = null;
    let clerkUserId = null;

    // Check if user is already registered in Clerk
    const registeredUsers = await clerk.users.getUserList({
      emailAddress: [email],
    });

    if (registeredUsers.data && registeredUsers.data.length > 0) {
      clerkUserId = registeredUsers.data[0].id;
      console.log(`User ${email} already registered in Clerk with ID: ${clerkUserId}`);
    } else {
      // Create or recycle invitation
      try {
        invitation = await clerk.invitations.createInvitation({
          emailAddress: email,
          publicMetadata: {
            role: "FIELD_OFFICER",
          },
        });
        clerkUserId = invitation.id;
      } catch (e: any) {
        console.log("Error creating invitation, checking for duplicates...", e);
        const list = await clerk.invitations.getInvitationList();
        const existing = list.data.find(
          (inv: any) => inv.emailAddress === email && inv.status === "pending"
        );
        if (existing) {
          console.log(`Found pending invitation ${existing.id} for ${email}. Revoking and retrying...`);
          await clerk.invitations.revokeInvitation(existing.id);
          invitation = await clerk.invitations.createInvitation({
            emailAddress: email,
            publicMetadata: {
              role: "FIELD_OFFICER",
            },
          });
          clerkUserId = invitation.id;
        } else {
          throw e;
        }
      }
    }

    // 2. Create the User row in the database via Supabase Client
    const { data: user, error: userError } = await supabase
      .from("User")
      .insert({
        clerkUserId: clerkUserId,
        name,
        email,
        role: "FIELD_OFFICER",
        district,
        phone: phone || null,
        isActive: true,
      })
      .select()
      .single();

    if (userError) throw userError;

    // 3. Log the activity in the audit trail
    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: adminUserId,
        action: `Invited field officer ${name}`,
        metadata: {
          officerEmail: email,
          district,
          invitationId: invitation?.id || clerkUserId,
        },
      });

    if (logError) throw logError;

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
  address?: string;
  motherName?: string;
  motherOccupation?: string;
  fatherName?: string;
  fatherOccupation?: string;
  fatherAlive?: boolean;
  fatherDifferentlyAbled?: boolean;
  motherAlive?: boolean;
  motherDifferentlyAbled?: boolean;
  state?: string;
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
      address,
      motherName,
      motherOccupation,
      fatherName,
      fatherOccupation,
      fatherAlive = true,
      fatherDifferentlyAbled = false,
      motherAlive = true,
      motherDifferentlyAbled = false,
      state = "Tamil Nadu",
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

        try {
          // Attempt to upload to Supabase Storage bucket 'student-photos'
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("student-photos")
            .upload(fileName, buffer, {
              contentType: fileType,
              duplex: 'half',
              upsert: true
            } as any);

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from("student-photos")
              .getPublicUrl(fileName);
            photoUrl = urlData.publicUrl;
          } else {
            console.warn("Supabase storage upload failed, falling back to base64 database storage:", uploadError);
            photoUrl = photoBase64;
          }
        } catch (storageErr) {
          console.warn("Supabase storage upload exception, falling back to base64 database storage:", storageErr);
          photoUrl = photoBase64;
        }
      }
    }

    // 1. Create the student in database
    const now = new Date().toISOString();
    const { data: student, error: studentError } = await supabase
      .from("Student")
      .insert({
        id: crypto.randomUUID(),
        name,
        dob: new Date(dob).toISOString(),
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
        createdAt: now,
        updatedAt: now,
        address: address || null,
        motherName: motherName || null,
        motherOccupation: motherOccupation || null,
        fatherName: fatherName || null,
        fatherOccupation: fatherOccupation || null,
        fatherAlive,
        fatherDifferentlyAbled,
        motherAlive,
        motherDifferentlyAbled,
        state: state || null,
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // 2. Log activity in audit trail
    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: assignedOfficerId,
        action: `Added student ${name}`,
        studentId: student.id,
        metadata: {
          school,
          currentClass,
          district,
          village,
          isTribal,
          goesToTuition,
        },
      });

    if (logError) throw logError;

    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true, student };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to add student:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function updateStudent(id: string, data: {
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
  status: "ACTIVE" | "AT_RISK" | "DROPPED_OUT" | "MIGRATED" | "GRADUATED";
  isTribal: boolean;
  goesToTuition: boolean;
  photoBase64?: string;
  photoName?: string;
  editorOfficerId: string;
  address?: string;
  motherName?: string;
  motherOccupation?: string;
  fatherName?: string;
  fatherOccupation?: string;
  fatherAlive?: boolean;
  fatherDifferentlyAbled?: boolean;
  motherAlive?: boolean;
  motherDifferentlyAbled?: boolean;
  state?: string;
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
      status,
      isTribal,
      goesToTuition,
      photoBase64,
      editorOfficerId,
      address,
      motherName,
      motherOccupation,
      fatherName,
      fatherOccupation,
      fatherAlive = true,
      fatherDifferentlyAbled = false,
      motherAlive = true,
      motherDifferentlyAbled = false,
      state,
    } = data;

    if (
      !id ||
      !name ||
      !dob ||
      !gender ||
      !tribe ||
      !guardianName ||
      !school ||
      !currentClass ||
      !district ||
      !village ||
      !editorOfficerId
    ) {
      throw new Error("Missing required fields");
    }

    // Fetch existing student details to potentially preserve or compare
    const { data: existingStudent, error: fetchError } = await supabase
      .from("Student")
      .select("photoUrl")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let photoUrl = existingStudent?.photoUrl || null;

    if (photoBase64) {
      const matches = photoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const fileType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = fileType.split('/')[1] || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("student-photos")
            .upload(fileName, buffer, {
              contentType: fileType,
              duplex: 'half',
              upsert: true
            } as any);

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from("student-photos")
              .getPublicUrl(fileName);
            photoUrl = urlData.publicUrl;
          } else {
            console.warn("Supabase storage upload failed, falling back to base64 database storage:", uploadError);
            photoUrl = photoBase64;
          }
        } catch (storageErr) {
          console.warn("Supabase storage upload exception, falling back to base64 database storage:", storageErr);
          photoUrl = photoBase64;
        }
      }
    }

    const now = new Date().toISOString();
    const { data: updatedStudent, error: updateError } = await supabase
      .from("Student")
      .update({
        name,
        dob: new Date(dob).toISOString(),
        gender,
        tribe,
        aadhaarLast4: aadhaarLast4 || null,
        guardianName,
        guardianPhone: guardianPhone || null,
        school,
        currentClass,
        district,
        village,
        status,
        isTribal,
        goesToTuition,
        photoUrl,
        updatedAt: now,
        address: address || null,
        motherName: motherName || null,
        motherOccupation: motherOccupation || null,
        fatherName: fatherName || null,
        fatherOccupation: fatherOccupation || null,
        fatherAlive,
        fatherDifferentlyAbled,
        motherAlive,
        motherDifferentlyAbled,
        state: state || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log update activity
    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: editorOfficerId,
        action: `Updated student details for ${name}`,
        studentId: id,
        metadata: {
          school,
          currentClass,
          status,
          isTribal,
          goesToTuition,
        },
      });

    if (logError) throw logError;

    revalidatePath("/dashboard");
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    return { success: true, student: updatedStudent };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to update student:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function importStudents(data: {
  students: {
    name: string;
    dob: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    tribe: string;
    aadhaarLast4?: string | null;
    guardianName: string;
    guardianPhone?: string | null;
    school: string;
    currentClass: string;
    district: string;
    village: string;
    address?: string | null;
    motherName?: string | null;
    motherOccupation?: string | null;
    fatherName?: string | null;
    fatherOccupation?: string | null;
    fatherAlive?: boolean | null;
    fatherDifferentlyAbled?: boolean | null;
    motherAlive?: boolean | null;
    motherDifferentlyAbled?: boolean | null;
    state?: string | null;
    goesToTuition?: boolean | null;
  }[];
  assignedOfficerId: string;
  initialAttendance?: {
    month: number;
    year: number;
    daysPresent: number;
    daysTotal: number;
  };
}) {
  try {
    const { students, assignedOfficerId, initialAttendance } = data;

    if (!students || students.length === 0 || !assignedOfficerId) {
      throw new Error("No student records provided");
    }

    // Fetch all existing student names to prevent duplicates
    const { data: existingStudents, error: fetchError } = await supabase
      .from("Student")
      .select("name");

    if (fetchError) {
      console.warn("Failed to fetch existing students for duplication check:", fetchError);
    }

    const existingNamesSet = new Set(
      (existingStudents || []).map((s) => s.name.trim().toLowerCase())
    );

    // Keep track of names in the current batch to prevent duplicates inside the batch
    const seenInBatch = new Set<string>();

    const uniqueStudents = students.filter((s) => {
      const cleanName = s.name.trim().toLowerCase();
      if (existingNamesSet.has(cleanName)) {
        return false; // Skip since it already exists in the database
      }
      if (seenInBatch.has(cleanName)) {
        return false; // Skip since we already processed it in this batch
      }
      seenInBatch.add(cleanName);
      return true;
    });

    if (uniqueStudents.length === 0) {
      return { success: true, message: "All students already exist in the database." };
    }

    // Insert all records in a batch
    const batchNow = new Date().toISOString();
    const recordsToInsert = uniqueStudents.map((s) => {
      // Safe DOB fallback parsing
      let parsedDob = new Date("2015-01-01");
      if (s.dob) {
        const d = new Date(s.dob);
        if (!isNaN(d.getTime())) {
          parsedDob = d;
        }
      }

      return {
        id: crypto.randomUUID(),
        name: s.name,
        dob: parsedDob.toISOString(),
        gender: s.gender || "OTHER",
        tribe: s.tribe || "Not Recorded",
        aadhaarLast4: s.aadhaarLast4 || null,
        guardianName: s.guardianName || "Not Recorded",
        guardianPhone: s.guardianPhone || null,
        school: s.school || "Not Recorded",
        currentClass: s.currentClass || "Not Recorded",
        district: s.district || "Coimbatore",
        village: s.village || "Not Recorded",
        address: s.address || null,
        motherName: s.motherName || null,
        motherOccupation: s.motherOccupation || null,
        fatherName: s.fatherName || null,
        fatherOccupation: s.fatherOccupation || null,
        fatherAlive: s.fatherAlive !== false,
        fatherDifferentlyAbled: !!s.fatherDifferentlyAbled,
        motherAlive: s.motherAlive !== false,
        motherDifferentlyAbled: !!s.motherDifferentlyAbled,
        state: s.state || "Tamil Nadu",
        assignedOfficerId,
        status: "ACTIVE",
        goesToTuition: !!s.goesToTuition,
        createdAt: batchNow,
        updatedAt: batchNow,
      };
    });

    const { data: createdStudents, error: importError } = await supabase
      .from("Student")
      .insert(recordsToInsert)
      .select();

    if (importError) throw importError;

    // Batch insert attendance records if initialAttendance is specified
    if (initialAttendance && createdStudents && createdStudents.length > 0) {
      const percentage = initialAttendance.daysTotal > 0 ? (initialAttendance.daysPresent / initialAttendance.daysTotal) * 100 : 0;
      const attendanceRecordsToInsert = createdStudents.map((student) => ({
        id: crypto.randomUUID(),
        studentId: student.id,
        month: initialAttendance.month,
        year: initialAttendance.year,
        daysPresent: initialAttendance.daysPresent,
        daysTotal: initialAttendance.daysTotal,
        percentage,
        recordedById: assignedOfficerId,
        createdAt: batchNow,
      }));

      const { error: attendanceError } = await supabase
        .from("AttendanceRecord")
        .insert(attendanceRecordsToInsert);

      if (attendanceError) {
        console.error("Failed to insert initial attendance records:", attendanceError);
      }
    }

    // Log the batch import activity in the audit trail
    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: assignedOfficerId,
        action: `Imported ${students.length} students via Excel/CSV`,
        metadata: {
          count: students.length,
          officerId: assignedOfficerId,
        },
      });

    if (logError) throw logError;

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
    const { studentId, month, year, daysPresent, daysTotal, recordedById } = data;
    const percentage = daysTotal > 0 ? (daysPresent / daysTotal) * 100 : 0;

    const { data: record, error: recordError } = await supabase
      .from("AttendanceRecord")
      .insert({
        studentId,
        month,
        year,
        daysPresent,
        daysTotal,
        percentage,
        recordedById,
      })
      .select()
      .single();

    if (recordError) throw recordError;

    // Recalculate risk level based on simple criteria
    const { data: recentRecords, error: recentError } = await supabase
      .from("AttendanceRecord")
      .select("*")
      .eq("studentId", studentId)
      .order("createdAt", { ascending: false })
      .limit(3);

    if (recentError) throw recentError;

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

    const { error: studentUpdateError } = await supabase
      .from("Student")
      .update({ status })
      .eq("id", studentId);

    if (studentUpdateError) throw studentUpdateError;

    const { error: riskUpsertError } = await supabase
      .from("DropoutRiskScore")
      .upsert(
        {
          studentId,
          score: 100 - avgAttendance,
          level,
          factors: {
            avgAttendance,
            recentPercentage: percentage,
          },
        },
        { onConflict: "studentId" }
      );

    if (riskUpsertError) throw riskUpsertError;

    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: recordedById,
        action: `Logged attendance for student (ID: ${studentId})`,
        studentId: studentId,
        metadata: { month, year, percentage },
      });

    if (logError) throw logError;

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
    const { data: existingRecord, error: existError } = await supabase
      .from("DBTRecord")
      .select("*")
      .eq("studentId", studentId)
      .eq("scholarshipName", scholarshipName)
      .maybeSingle();

    if (existError) throw existError;

    if (existingRecord) {
      return {
        success: false,
        error: `A scholarship application for "${scholarshipName}" already exists for this student.`,
      };
    }

    const { data: record, error: recordError } = await supabase
      .from("DBTRecord")
      .insert({
        studentId,
        scholarshipName,
        amount,
        status,
        updatedById,
      })
      .select()
      .single();

    if (recordError) throw recordError;

    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: updatedById,
        action: `Added DBT record for scholarship "${scholarshipName}"`,
        studentId: studentId,
        metadata: { amount, status },
      });

    if (logError) throw logError;

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
      updateData.verifiedDate = new Date().toISOString();
    } else if (status === "DISBURSED") {
      updateData.disbursedDate = new Date().toISOString();
    } else if (status === "CONFIRMED") {
      updateData.confirmedDate = new Date().toISOString();
    } else if (status === "ELIGIBLE") {
      updateData.appliedDate = new Date().toISOString();
    }

    const { data: record, error: recordError } = await supabase
      .from("DBTRecord")
      .update(updateData)
      .eq("id", recordId)
      .select()
      .single();

    if (recordError) throw recordError;

    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: updatedById,
        action: `Updated DBT scholarship status of "${record.scholarshipName}" to ${status}`,
        studentId: record.studentId,
        metadata: { recordId, status, remarks },
      });

    if (logError) throw logError;

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

    const { data: achievement, error: achievementError } = await supabase
      .from("Achievement")
      .insert({
        studentId,
        title,
        event,
        award: award || null,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      })
      .select()
      .single();

    if (achievementError) throw achievementError;

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
    const { data: achievement, error: achievementError } = await supabase
      .from("Achievement")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (achievementError) throw achievementError;

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

    const upsertData = records.map((record) => ({
      studentId: record.studentId,
      date: parsedDate.toISOString(),
      status: record.status,
      recordedById,
    }));

    const { data: results, error: upsertError } = await supabase
      .from("TuitionAttendance")
      .upsert(upsertData, { onConflict: "studentId,date" })
      .select();

    if (upsertError) throw upsertError;

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
    const { data: student, error: studentError } = await supabase
      .from("Student")
      .select("*")
      .eq("id", studentId)
      .single();

    if (studentError || !student) throw new Error("Student not found");

    const { data: updated, error: updateError } = await supabase
      .from("Student")
      .update({ goesToTuition: !student.goesToTuition })
      .eq("id", studentId)
      .select()
      .single();

    if (updateError) throw updateError;

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

        const { data: record, error: recordError } = await supabase
          .from("AttendanceRecord")
          .insert({
            studentId: rec.studentId,
            month,
            year,
            daysPresent: rec.daysPresent,
            daysTotal: rec.daysTotal,
            percentage,
            recordedById,
          })
          .select()
          .single();

        if (recordError) throw recordError;

        const { data: recentRecords, error: recentError } = await supabase
          .from("AttendanceRecord")
          .select("*")
          .eq("studentId", rec.studentId)
          .order("createdAt", { ascending: false })
          .limit(3);

        if (recentError) throw recentError;

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

        const { error: studentUpdateError } = await supabase
          .from("Student")
          .update({ status })
          .eq("id", rec.studentId);

        if (studentUpdateError) throw studentUpdateError;

        const { error: riskUpsertError } = await supabase
          .from("DropoutRiskScore")
          .upsert(
            {
              studentId: rec.studentId,
              score: 100 - avgAttendance,
              level,
              factors: {
                avgAttendance,
                recentPercentage: percentage,
              },
            },
            { onConflict: "studentId" }
          );

        if (riskUpsertError) throw riskUpsertError;

        return record;
      })
    );

    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: recordedById,
        action: `Logged bulk attendance for ${records.length} students`,
        metadata: { month, year, studentIds: records.map((r) => r.studentId) },
      });

    if (logError) throw logError;

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

export async function deleteStudent(id: string, officerId: string, officerName: string) {
  try {
    if (!id || !officerId) {
      throw new Error("Missing required parameters for deletion.");
    }

    // 1. Fetch student details first
    const { data: student, error: fetchError } = await supabase
      .from("Student")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!student) {
      throw new Error("Student not found.");
    }

    // 2. Local Backup: Append details to deleted_students.json
    const backupPath = path.join(process.cwd(), "deleted_students.json");

    let deletedRecords: any[] = [];
    if (fs.existsSync(backupPath)) {
      try {
        const fileContent = fs.readFileSync(backupPath, "utf-8");
        deletedRecords = JSON.parse(fileContent);
      } catch (e) {
        console.warn("Failed to parse deleted_students.json, rewriting:", e);
      }
    }

    // Append the deleted record with metadata
    deletedRecords.push({
      deletedAt: new Date().toISOString(),
      deletedBy: {
        id: officerId,
        name: officerName
      },
      record: student
    });

    fs.writeFileSync(backupPath, JSON.stringify(deletedRecords, null, 2), "utf-8");
    console.log(`Deleted student backup written to ${backupPath}`);

    // 3. Delete student from Supabase
    const { error: deleteError } = await supabase
      .from("Student")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // 4. Log the action in ActivityLog
    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: officerId,
        action: `Deleted student ${student.name}`,
        metadata: {
          studentId: id,
          studentName: student.name,
          deletedBy: officerName
        }
      });

    if (logError) {
      console.warn("Failed to insert ActivityLog for deletion:", logError);
    }

    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to delete student:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function bulkDeleteStudents(ids: string[], officerId: string, officerName: string) {
  try {
    if (!ids || ids.length === 0 || !officerId) {
      throw new Error("Missing parameters for bulk deletion.");
    }

    // 1. Fetch details for all students to back up
    const { data: students, error: fetchError } = await supabase
      .from("Student")
      .select("*")
      .in("id", ids);

    if (fetchError) throw fetchError;
    if (!students || students.length === 0) {
      throw new Error("No students found to delete.");
    }

    // 2. Backup to deleted_students.json
    const backupPath = path.join(process.cwd(), "deleted_students.json");
    let deletedRecords: any[] = [];
    if (fs.existsSync(backupPath)) {
      try {
        const fileContent = fs.readFileSync(backupPath, "utf-8");
        deletedRecords = JSON.parse(fileContent);
      } catch (e) {
        console.warn("Failed to parse deleted_students.json:", e);
      }
    }

    students.forEach((student) => {
      deletedRecords.push({
        deletedAt: new Date().toISOString(),
        deletedBy: {
          id: officerId,
          name: officerName
        },
        record: student
      });
    });

    fs.writeFileSync(backupPath, JSON.stringify(deletedRecords, null, 2), "utf-8");

    // 3. Delete from Supabase
    const { error: deleteError } = await supabase
      .from("Student")
      .delete()
      .in("id", ids);

    if (deleteError) throw deleteError;

    // 4. Log in ActivityLog
    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: officerId,
        action: `Bulk deleted ${students.length} students`,
        metadata: {
          count: students.length,
          studentNames: students.map((s) => s.name),
          deletedBy: officerName
        }
      });

    if (logError) {
      console.warn("Failed to log bulk deletion:", logError);
    }

    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed bulk deletion:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function bulkUpdateStudentStatus(ids: string[], status: "ACTIVE" | "AT_RISK" | "DROPPED_OUT" | "MIGRATED" | "GRADUATED", officerId: string, officerName: string) {
  try {
    if (!ids || ids.length === 0 || !status || !officerId) {
      throw new Error("Missing parameters for bulk status update.");
    }

    const { error: updateError } = await supabase
      .from("Student")
      .update({ status })
      .in("id", ids);

    if (updateError) throw updateError;

    // Log in ActivityLog
    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: officerId,
        action: `Bulk updated status of ${ids.length} students to ${status}`,
        metadata: {
          count: ids.length,
          status,
          updatedBy: officerName
        }
      });

    if (logError) {
      console.warn("Failed to log bulk update:", logError);
    }

    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed bulk update:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function bulkRemoveFromTuition(ids: string[], officerId: string, officerName: string) {
  try {
    if (!ids || ids.length === 0 || !officerId) {
      throw new Error("Missing parameters for bulk tuition removal.");
    }

    const { error: updateError } = await supabase
      .from("Student")
      .update({ goesToTuition: false })
      .in("id", ids);

    if (updateError) throw updateError;

    // Log in ActivityLog
    const { error: logError } = await supabase
      .from("ActivityLog")
      .insert({
        userId: officerId,
        action: `Removed ${ids.length} students from Tuition Program`,
        metadata: {
          count: ids.length,
          updatedBy: officerName
        }
      });

    if (logError) {
      console.warn("Failed to log bulk tuition removal:", logError);
    }

    revalidatePath("/attendance/tuition");
    revalidatePath("/dashboard");
    revalidatePath("/students");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed bulk tuition removal:", err);
    return { success: false, error: err?.message || "Something went wrong" };
  }
}
