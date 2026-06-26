"use client";

import { useState } from "react";
import { inviteFieldOfficer } from "@/app/actions";

interface InviteOfficerFormProps {
  adminUserId: string;
  onSuccess?: () => void;
}

const DISTRICTS = [
  "Nilgiris",
  "Coimbatore",
  "Erode",
  "Salem",
  "Dharmapuri",
  "Krishnagiri",
  "Vellore",
  "Tiruvannamalai",
  "Namakkal",
  "Karur",
  "Dindigul",
  "Theni",
];

export default function InviteOfficerForm({ adminUserId, onSuccess }: InviteOfficerFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || !email.trim() || !district) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await inviteFieldOfficer({
        name,
        email,
        district,
        phone: phone.trim() || undefined,
        adminUserId,
      });

      if (result.success) {
        setSuccess(true);
        setName("");
        setEmail("");
        setDistrict("");
        setPhone("");
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || "Failed to send invitation.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-[#D8CFC0] shadow-sm max-w-md w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#1F3D2B] font-serif">Add Field Officer</h3>
        <p className="text-xs text-gray-500">An invitation email will be sent via Clerk to register.</p>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md flex items-center gap-2">
          <span>✅</span>
          <span>Invitation sent successfully to the officer!</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#24241F] mb-1">Full Name *</label>
          <input
            type="text"
            className="w-full p-2 bg-[#F5F0E8] border border-[#D8CFC0] rounded-md text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741]"
            placeholder="e.g. Rajan Subramanian"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#24241F] mb-1">Email Address *</label>
          <input
            type="email"
            className="w-full p-2 bg-[#F5F0E8] border border-[#D8CFC0] rounded-md text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741]"
            placeholder="officer@nmct.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#24241F] mb-1">District *</label>
          <select
            className="w-full p-2 bg-[#F5F0E8] border border-[#D8CFC0] rounded-md text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741] cursor-pointer"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Select district…</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#24241F] mb-1">Phone Number (Optional)</label>
          <input
            type="tel"
            className="w-full p-2 bg-[#F5F0E8] border border-[#D8CFC0] rounded-md text-sm text-[#24241F] focus:outline-none focus:border-[#4A6741]"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="submit"
            className="w-full py-2 bg-[#1F3D2B] hover:bg-[#2A5038] text-white text-sm font-semibold rounded-md transition duration-150 disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Sending Invitation…" : "Send Invitation →"}
          </button>
        </div>
      </form>
    </div>
  );
}
