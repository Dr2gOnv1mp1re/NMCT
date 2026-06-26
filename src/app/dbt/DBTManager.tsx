"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDBTRecord, verifyDBTRecord, disburseDBTRecord, updateDBTStatus } from "@/app/actions";

interface DBTRecordViewModel {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  officerName: string;
  scholarshipName: string;
  amount: number;
  status:
    | "ELIGIBLE"
    | "DOCUMENTS_PENDING"
    | "VERIFIED"
    | "DISBURSED"
    | "CONFIRMED"
    | "REJECTED";
  remarks: string | null;
  createdAt: string;
}

interface DBTManagerProps {
  records: DBTRecordViewModel[];
  students: { id: string; name: string; currentClass: string }[];
  officerId: string;
}

export default function DBTManager({
  records,
  students,
  officerId,
}: DBTManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State for Add DBT Record
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [scholarshipName, setScholarshipName] = useState("");
  const [amount, setAmount] = useState(10000);
  const [initialStatus, setInitialStatus] = useState<
    "ELIGIBLE" | "DOCUMENTS_PENDING" | "VERIFIED" | "DISBURSED"
  >("ELIGIBLE");
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Status mapping styles for status badges
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "DISBURSED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "VERIFIED":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      case "DOCUMENTS_PENDING":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  // Filter records based on search (student name) and dropdown status filter
  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.studentName
      .toLowerCase()
      .includes(searchName.toLowerCase());
    
    const matchesStatus =
      statusFilter === "ALL" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Verify Action (ELIGIBLE -> VERIFIED)
  const handleVerify = async (recordId: string) => {
    const confirmAction = window.confirm("Are you sure you want to verify this scholarship application?");
    if (!confirmAction) return;

    try {
      const res = await verifyDBTRecord(recordId, officerId);
      if (res.success) {
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error || "Failed to verify application");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
  };

  // Disburse Action (VERIFIED -> DISBURSED)
  const handleDisburse = async (recordId: string) => {
    const confirmAction = window.confirm("Are you sure you want to disburse the funds for this scholarship?");
    if (!confirmAction) return;

    try {
      const res = await disburseDBTRecord(recordId, officerId);
      if (res.success) {
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error || "Failed to disburse funds");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
  };

  // Standard/Reject Action wrappers (for general operations)
  const handleUpdateStatus = async (
    recordId: string,
    nextStatus: "DOCUMENTS_PENDING" | "CONFIRMED" | "REJECTED"
  ) => {
    const confirmChange = window.confirm(`Are you sure you want to update status to ${nextStatus}?`);
    if (!confirmChange) return;

    try {
      const res = await updateDBTStatus({
        recordId,
        status: nextStatus,
        updatedById: officerId,
        remarks: `Updated to ${nextStatus} via manual override.`,
      });
      if (res.success) {
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add DBT Record Submit Handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setModalError("Please select a student.");
      return;
    }
    if (!scholarshipName.trim()) {
      setModalError("Please enter a scholarship scheme name.");
      return;
    }
    if (amount <= 0) {
      setModalError("Please enter a valid entitled amount.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    try {
      const res = await addDBTRecord({
        studentId,
        scholarshipName: scholarshipName.trim(),
        amount,
        status: initialStatus,
        updatedById: officerId,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setStudentId("");
        setScholarshipName("");
        setAmount(10000);
        setInitialStatus("ELIGIBLE");
        startTransition(() => {
          router.refresh();
        });
      } else {
        setModalError(res.error || "Failed to initialize DBT record.");
      }
    } catch {
      setModalError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control / Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Search by student name */}
          <div className="relative w-full max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
            />
          </div>

          {/* Filter dropdown by status */}
          <div className="w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-white cursor-pointer font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ELIGIBLE">Eligible</option>
              <option value="VERIFIED">Verified</option>
              <option value="DISBURSED">Disbursed</option>
              <option value="DOCUMENTS_PENDING">Documents Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Add Record Trigger Button */}
        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setModalError("");
          }}
          className="bg-[#1E3A8A] hover:bg-[#152e72] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Add DBT Record</span>
        </button>
      </div>

      {/* DBT Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6">Student</th>
                <th className="py-3.5 px-6">Assigned Officer</th>
                <th className="py-3.5 px-6">Scheme</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-slate-400 text-sm font-medium"
                  >
                    No matching DBT records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50 transition duration-150"
                  >
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800">
                        {record.studentName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Class: {record.studentClass}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-700">
                        {record.officerName}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {record.scholarshipName}
                    </td>
                    <td className="py-4 px-6 font-mono text-sm font-bold text-slate-700">
                      ₹{record.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[9px] font-bold uppercase py-1 px-2.5 rounded-full ${getBadgeStyle(
                          record.status
                        )}`}
                      >
                        {record.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* Verify Button (ELIGIBLE -> VERIFIED) */}
                        {record.status === "ELIGIBLE" && (
                          <button
                            onClick={() => handleVerify(record.id)}
                            disabled={isPending}
                            className="text-xs text-sky-600 hover:text-sky-800 font-bold hover:underline transition"
                          >
                            Verify
                          </button>
                        )}

                        {/* Request Documents Option if Eligible */}
                        {record.status === "ELIGIBLE" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(record.id, "DOCUMENTS_PENDING")
                            }
                            disabled={isPending}
                            className="text-xs text-amber-600 hover:text-amber-700 font-semibold transition"
                          >
                            Request Docs
                          </button>
                        )}

                        {/* Verify button if documents pending */}
                        {record.status === "DOCUMENTS_PENDING" && (
                          <button
                            onClick={() => handleVerify(record.id)}
                            disabled={isPending}
                            className="text-xs text-sky-600 hover:text-sky-800 font-bold hover:underline transition"
                          >
                            Verify
                          </button>
                        )}

                        {/* Disburse Button (VERIFIED -> DISBURSED) */}
                        {record.status === "VERIFIED" && (
                          <button
                            onClick={() => handleDisburse(record.id)}
                            disabled={isPending}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-bold hover:underline transition"
                          >
                            Disburse
                          </button>
                        )}

                        {/* Confirm receipt option for disbursed payments */}
                        {record.status === "DISBURSED" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(record.id, "CONFIRMED")
                            }
                            disabled={isPending}
                            className="text-xs text-teal-600 hover:text-teal-700 font-semibold transition"
                          >
                            Confirm Receipt
                          </button>
                        )}

                        {/* Reject button for eligible/pending verification states */}
                        {record.status !== "CONFIRMED" &&
                          record.status !== "DISBURSED" &&
                          record.status !== "REJECTED" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(record.id, "REJECTED")
                              }
                              disabled={isPending}
                              className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition"
                            >
                              Reject
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add DBT Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-left animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-800">Add DBT Record</h3>
                <p className="text-xs text-slate-500 mt-0.5">Initialize a student scholarship application</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-semibold flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}

              {/* Student Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Student Name
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500 cursor-pointer transition text-slate-800 font-medium"
                  required
                >
                  <option value="">Select student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.currentClass})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scholarship Scheme Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Scholarship Scheme Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tribal Post-Matric Scholarship"
                  value={scholarshipName}
                  onChange={(e) => setScholarshipName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Entitled Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Entitled Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={Number.isNaN(amount) ? "" : amount}
                    onChange={(e) => setAmount(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50 font-mono"
                    required
                    min={1}
                  />
                </div>

                {/* Initial Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Initial Status
                  </label>
                  <select
                    value={initialStatus}
                    onChange={(e) =>
                      setInitialStatus(e.target.value as "ELIGIBLE" | "DOCUMENTS_PENDING" | "VERIFIED" | "DISBURSED")
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500 cursor-pointer transition text-slate-800"
                    required
                  >
                    <option value="ELIGIBLE">Eligible</option>
                    <option value="DOCUMENTS_PENDING">Docs Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="DISBURSED">Disbursed</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isPending}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#152e72] text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? "Saving..." : isPending ? "Refreshing..." : "Add Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
