"use client";

import React, { useState } from "react";
import { addStudent } from "@/app/actions";

interface AddStudentButtonProps {
  assignedOfficerId: string;
  defaultDistrict: string;
  className?: string;
  children?: React.ReactNode;
}

export default function AddStudentButton({
  assignedOfficerId,
  defaultDistrict,
  className,
  children,
}: AddStudentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [tribe, setTribe] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [school, setSchool] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState(defaultDistrict || "Nilgiris");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [state, setState] = useState("Tamil Nadu");

  // New States
  const [isTribal, setIsTribal] = useState(true);
  const [goesToTuition, setGoesToTuition] = useState(false);
  const [photoBase64, setPhotoBase64] = useState("");
  const [photoName, setPhotoName] = useState("");

  // Extended fields
  const [address, setAddress] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [fatherAlive, setFatherAlive] = useState(true);
  const [fatherDifferentlyAbled, setFatherDifferentlyAbled] = useState(false);
  const [motherAlive, setMotherAlive] = useState(true);
  const [motherDifferentlyAbled, setMotherDifferentlyAbled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setName("");
    setDob("");
    setGender("MALE");
    setTribe("");
    setAadhaarLast4("");
    setSchool("");
    setCurrentClass("");
    setVillage("");
    setGuardianName("");
    setGuardianPhone("");
    setIsTribal(true);
    setGoesToTuition(false);
    setPhotoBase64("");
    setPhotoName("");
    setAddress("");
    setMotherName("");
    setMotherOccupation("");
    setFatherName("");
    setFatherOccupation("");
    setFatherAlive(true);
    setFatherDifferentlyAbled(false);
    setMotherAlive(true);
    setMotherDifferentlyAbled(false);
    setState("Tamil Nadu");
    setError("");
    setSuccess(false);
  };

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
      const result = await addStudent({
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
        assignedOfficerId,
        isTribal,
        goesToTuition,
        photoBase64: photoBase64 || undefined,
        photoName: photoName || undefined,
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
          setIsOpen(false);
          resetForm();
        }, 1000);
      } else {
        setError(result.error || "Failed to add student.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          resetForm();
          setIsOpen(true);
        }}
        className={
          className ||
          "bg-[#1F3D2B] hover:bg-[#2A5038] text-white text-xs font-semibold py-1.5 px-3 rounded transition"
        }
      >
        {children || "+ Add Student"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-[#24241F]">
            {/* Header */}
            <div className="bg-[#1F3D2B] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Add Student to Registry</h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Enter the details below to register a new student.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
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
                  <span>Student registered successfully! Registry updated.</span>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A6741] border-b border-slate-100 pb-1">
                  Personal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="e.g. Kavitha Murugan"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] cursor-pointer"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="e.g. Irulas / Badagas"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="e.g. 5678"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] cursor-pointer"
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
                      Student Profile Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      onChange={handlePhotoChange}
                      disabled={loading}
                    />
                    {photoName && (
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        Selected: {photoName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="goesToTuition"
                      checked={goesToTuition}
                      onChange={(e) => setGoesToTuition(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500 cursor-pointer"
                      disabled={loading}
                    />
                    <label htmlFor="goesToTuition" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Attends Tuition Program?
                    </label>
                  </div>
                </div>
              </div>

              {/* Grid 2: School & Location */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A6741] border-b border-slate-100 pb-1">
                  Academic & Location
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      School Name *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="e.g. Govt Tribal Residential School"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="e.g. 5th Standard"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="e.g. Anaikatti or Residential Colony"
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
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                        placeholder="e.g. Nilgiris"
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
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                        placeholder="e.g. Tamil Nadu"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="Enter address details..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Grid 3: Parent & Family Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A6741] border-b border-slate-100 pb-1">
                  Parent Details & Relationship Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {"Father's Name"}
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="Mother's occupation"
                      value={motherOccupation}
                      onChange={(e) => setMotherOccupation(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#4A6741] uppercase tracking-wider">Father status</p>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fatherAlive}
                            onChange={(e) => setFatherAlive(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm cursor-pointer"
                            disabled={loading}
                          />
                          Father is Alive
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fatherDifferentlyAbled}
                            onChange={(e) => setFatherDifferentlyAbled(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm cursor-pointer"
                            disabled={loading}
                          />
                          Differently Abled
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#4A6741] uppercase tracking-wider">Mother status</p>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={motherAlive}
                            onChange={(e) => setMotherAlive(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm cursor-pointer"
                            disabled={loading}
                          />
                          Mother is Alive
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={motherDifferentlyAbled}
                            onChange={(e) => setMotherDifferentlyAbled(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm cursor-pointer"
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A6741] border-b border-slate-100 pb-1">
                  Guardian Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Guardian Name *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="e.g. Murugan Velu"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                      placeholder="e.g. +91 98765 43210"
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
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1F3D2B] hover:bg-[#2A5038] text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Student"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
