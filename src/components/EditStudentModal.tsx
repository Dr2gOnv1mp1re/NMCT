"use client";

import React, { useState } from "react";
import { updateStudent } from "@/app/actions";

interface StudentProps {
  id: string;
  name: string;
  dob: Date | string;
  gender: "MALE" | "FEMALE" | "OTHER";
  tribe: string;
  aadhaarLast4: string | null;
  guardianName: string;
  guardianPhone: string | null;
  school: string;
  currentClass: string;
  district: string;
  village: string;
  status: "ACTIVE" | "AT_RISK" | "DROPPED_OUT" | "MIGRATED" | "GRADUATED";
  isTribal?: boolean;
  goesToTuition?: boolean;
  photoUrl?: string | null;
  address?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  fatherName?: string | null;
  fatherOccupation?: string | null;
  fatherAlive?: boolean;
  fatherDifferentlyAbled?: boolean;
  motherAlive?: boolean;
  motherDifferentlyAbled?: boolean;
  state?: string | null;
}

interface EditStudentModalProps {
  student: StudentProps;
  editorOfficerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditStudentModal({
  student,
  editorOfficerId,
  isOpen,
  onClose,
}: EditStudentModalProps) {
  const [name, setName] = useState(student.name);
  const [dob, setDob] = useState(
    student.dob
      ? new Date(student.dob).toISOString().split("T")[0]
      : ""
  );
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">(student.gender);
  const [tribe, setTribe] = useState(student.tribe);
  const [aadhaarLast4, setAadhaarLast4] = useState(student.aadhaarLast4 || "");
  const [school, setSchool] = useState(student.school);
  const [currentClass, setCurrentClass] = useState(student.currentClass);
  const [village, setVillage] = useState(student.village);
  const [district, setDistrict] = useState(student.district);
  const [guardianName, setGuardianName] = useState(student.guardianName);
  const [guardianPhone, setGuardianPhone] = useState(student.guardianPhone || "");
  const [state, setState] = useState(student.state || "Tamil Nadu");
  const [status, setStatus] = useState<"ACTIVE" | "AT_RISK" | "DROPPED_OUT" | "MIGRATED" | "GRADUATED">(
    student.status
  );

  // States
  const [isTribal, setIsTribal] = useState(!!student.isTribal);
  const [goesToTuition, setGoesToTuition] = useState(!!student.goesToTuition);
  const [photoBase64, setPhotoBase64] = useState("");
  const [photoName, setPhotoName] = useState("");

  // Extended fields
  const [address, setAddress] = useState(student.address || "");
  const [motherName, setMotherName] = useState(student.motherName || "");
  const [motherOccupation, setMotherOccupation] = useState(student.motherOccupation || "");
  const [fatherName, setFatherName] = useState(student.fatherName || "");
  const [fatherOccupation, setFatherOccupation] = useState(student.fatherOccupation || "");
  const [fatherAlive, setFatherAlive] = useState(student.fatherAlive !== false);
  const [fatherDifferentlyAbled, setFatherDifferentlyAbled] = useState(!!student.fatherDifferentlyAbled);
  const [motherAlive, setMotherAlive] = useState(student.motherAlive !== false);
  const [motherDifferentlyAbled, setMotherDifferentlyAbled] = useState(!!student.motherDifferentlyAbled);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Photo size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
        setPhotoName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !name.trim() ||
      !dob ||
      !gender ||
      !tribe.trim() ||
      !school.trim() ||
      !currentClass.trim() ||
      !village.trim() ||
      !guardianName.trim()
    ) {
      setError("Please fill out all required fields.");
      return;
    }

    if (aadhaarLast4 && !/^\d{4}$/.test(aadhaarLast4)) {
      setError("Aadhaar must be exactly 4 digits.");
      return;
    }

    setLoading(true);

    try {
      const result = await updateStudent(student.id, {
        name: name.trim(),
        dob,
        gender,
        tribe: tribe.trim(),
        aadhaarLast4: aadhaarLast4.trim() || undefined,
        school: school.trim(),
        currentClass: currentClass.trim(),
        village: village.trim(),
        district,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim() || undefined,
        status,
        isTribal,
        goesToTuition,
        photoBase64: photoBase64 || undefined,
        photoName: photoName || undefined,
        editorOfficerId,
        address: address.trim() || undefined,
        motherName: motherName.trim() || undefined,
        motherOccupation: motherOccupation.trim() || undefined,
        fatherName: fatherName.trim() || undefined,
        fatherOccupation: fatherOccupation.trim() || undefined,
        fatherAlive,
        fatherDifferentlyAbled,
        motherAlive,
        motherDifferentlyAbled,
        state: state.trim() || undefined,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(result.error || "Failed to update student.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-[#24241F]">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-serif">Edit Student Profile</h3>
            <p className="text-xs text-sky-200 mt-0.5">
              Update details for {student.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded text-xl"
          >
            ✕
          </button>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-left"
        >
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
              <span>✅</span>
              <span>Student profile updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Grid 1: Personal Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-755 border-b border-slate-100 pb-1">
              Personal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender *
                </label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value as "MALE" | "FEMALE" | "OTHER")
                  }
                  required
                  disabled={loading}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tribe *
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={tribe}
                  onChange={(e) => setTribe(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aadhaar Card (Last 4 Digits)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={aadhaarLast4}
                  onChange={(e) =>
                    setAadhaarLast4(e.target.value.replace(/\D/g, ""))
                  }
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Category *
                </label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  value={isTribal ? "true" : "false"}
                  onChange={(e) => setIsTribal(e.target.value === "true")}
                  required
                  disabled={loading}
                >
                  <option value="true">Tribal Student</option>
                  <option value="false">Non-Tribal Student</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lifecycle Status *
                </label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  onChange={(e) =>
                    setStatus(e.target.value as "ACTIVE" | "AT_RISK" | "DROPPED_OUT" | "MIGRATED" | "GRADUATED")
                  }
                  required
                  disabled={loading}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="DROPPED_OUT">Dropped Out</option>
                  <option value="MIGRATED">Migrated</option>
                  <option value="GRADUATED">Graduated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                  onChange={handlePhotoChange}
                  disabled={loading}
                />
                {photoName ? (
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Selected: {photoName}
                  </p>
                ) : student.photoUrl ? (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Has existing photo (Upload to replace)
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="editGoesToTuition"
                  checked={goesToTuition}
                  onChange={(e) => setGoesToTuition(e.target.checked)}
                  className="w-4 h-4 text-sky-600 border-slate-300 rounded-sm focus:ring-sky-500 cursor-pointer"
                  disabled={loading}
                />
                <label htmlFor="editGoesToTuition" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Attends Tuition Program?
                </label>
              </div>
            </div>
          </div>

          {/* Grid 2: School & Location */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-755 border-b border-slate-100 pb-1">
              Academic & Location
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Class / Standard *
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={currentClass}
                  onChange={(e) => setCurrentClass(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Village / Town / Street / Area (Residential Colony) *
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Enter address details..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Grid 3: Parent Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-755 border-b border-slate-100 pb-1">
              Parent Details & Relationship Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {"Father's Name"}
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Father's full name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {"Father's Occupation"}
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Father's occupation"
                  value={fatherOccupation}
                  onChange={(e) => setFatherOccupation(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {"Mother's Name"}
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Mother's full name"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {"Mother's Occupation"}
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Mother's occupation"
                  value={motherOccupation}
                  onChange={(e) => setMotherOccupation(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-sky-755 uppercase tracking-wider">Father status</p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fatherAlive}
                        onChange={(e) => setFatherAlive(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-300 rounded-sm cursor-pointer"
                        disabled={loading}
                      />
                      Father is Alive
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fatherDifferentlyAbled}
                        onChange={(e) => setFatherDifferentlyAbled(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-300 rounded-sm cursor-pointer"
                        disabled={loading}
                      />
                      Differently Abled
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-sky-755 uppercase tracking-wider">Mother status</p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={motherAlive}
                        onChange={(e) => setMotherAlive(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-300 rounded-sm cursor-pointer"
                        disabled={loading}
                      />
                      Mother is Alive
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={motherDifferentlyAbled}
                        onChange={(e) => setMotherDifferentlyAbled(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-300 rounded-sm cursor-pointer"
                        disabled={loading}
                      />
                      Differently Abled
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid 4: Guardian Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-755 border-b border-slate-100 pb-1">
              Guardian Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guardian Name *
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guardian Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3 bg-white sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#152e72] text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
