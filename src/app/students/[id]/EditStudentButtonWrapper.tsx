"use client";

import React, { useState } from "react";
import EditStudentModal from "@/components/EditStudentModal";
import { deleteStudent } from "@/app/actions";
import { useRouter } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface EditStudentButtonWrapperProps {
  student: any;
  editorOfficerId: string;
  editorOfficerName: string;
}

export default function EditStudentButtonWrapper({
  student,
  editorOfficerId,
  editorOfficerName,
}: EditStudentButtonWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete ${student.name}? This will log a backup locally in deleted_students.json.`)) {
      setDeleting(true);
      try {
        const res = await deleteStudent(student.id, editorOfficerId, editorOfficerName);
        if (res.success) {
          alert("Student deleted successfully!");
          router.push("/students");
        } else {
          alert(res.error || "Failed to delete student.");
        }
      } catch (err) {
        console.error("Deletion error:", err);
        alert("An error occurred during deletion.");
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#152e72] text-white text-xs font-semibold rounded-lg shadow-xs transition duration-150 flex items-center gap-1.5 cursor-pointer font-sans"
        title="Edit student profile details"
        disabled={deleting}
      >
        <span>✏️</span>
        <span>Edit Profile</span>
      </button>

      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition duration-150 flex items-center gap-1.5 cursor-pointer font-sans"
        title="Delete student profile"
        disabled={deleting}
      >
        <span>🗑️</span>
        <span>{deleting ? "Deleting..." : "Delete Student"}</span>
      </button>

      <EditStudentModal
        student={student}
        editorOfficerId={editorOfficerId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
