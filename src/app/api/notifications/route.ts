import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function GET() {
  try {
    const notifications: {
      id: string;
      type: "critical" | "warning" | "success" | "info";
      message: string;
      time: string;
    }[] = [];

    // ── 1. Attendance warnings (last 3 months) ─────────────────────────
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: lowAttendanceData } = await supabase
      .from("AttendanceRecord")
      .select("*, student:Student(name)")
      .lt("percentage", 75)
      .gte("createdAt", threeMonthsAgo.toISOString())
      .order("createdAt", { ascending: false })
      .limit(5);

    const lowAttendance = lowAttendanceData || [];

    for (const rec of lowAttendance) {
      const pct = Math.round(rec.percentage);
      const isCritical = pct < 50;
      notifications.push({
        id: `att_${rec.id}`,
        type: isCritical ? "critical" : "warning",
        message: `Attendance ${isCritical ? "critical" : "warning"}: ${rec.student?.name} fell to ${pct}% (${isCritical ? "Critical" : "At Risk"})`,
        time: timeAgo(new Date(rec.createdAt)),
      });
    }

    // ── 2. Recent DBT disbursements (last 30 days) ─────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentDisbursementsData } = await supabase
      .from("DBTRecord")
      .select("*, student:Student(name)")
      .in("status", ["DISBURSED", "CONFIRMED"])
      .gte("createdAt", thirtyDaysAgo.toISOString())
      .order("createdAt", { ascending: false })
      .limit(3);

    const recentDisbursements = recentDisbursementsData || [];

    for (const rec of recentDisbursements) {
      notifications.push({
        id: `dbt_${rec.id}`,
        type: "success",
        message: `DBT ${rec.status === "CONFIRMED" ? "Confirmed" : "Disbursed"}: ₹${rec.amount.toLocaleString("en-IN")} for ${rec.student?.name}`,
        time: timeAgo(new Date(rec.createdAt)),
      });
    }

    // ── 3. AT_RISK students added recently (last 7 days) ──────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: atRiskStudentsData } = await supabase
      .from("Student")
      .select("id, name, updatedAt")
      .eq("status", "AT_RISK")
      .gte("updatedAt", sevenDaysAgo.toISOString())
      .order("updatedAt", { ascending: false })
      .limit(3);

    const atRiskStudents = atRiskStudentsData || [];

    for (const s of atRiskStudents) {
      notifications.push({
        id: `risk_${s.id}`,
        type: "warning",
        message: `${s.name} has been flagged as AT RISK`,
        time: timeAgo(new Date(s.updatedAt)),
      });
    }

    // ── 4. Fallback if no data ─────────────────────────────────────────
    if (notifications.length === 0) {
      notifications.push({
        id: "empty",
        type: "info",
        message: "No new alerts. All students are on track.",
        time: "now",
      });
    }

    // Sort: critical first, then warning, then success/info
    const order = { critical: 0, warning: 1, success: 2, info: 3 };
    notifications.sort((a, b) => order[a.type] - order[b.type]);

    return NextResponse.json({ notifications: notifications.slice(0, 10) });
  } catch (err) {
    console.error("Notifications API error:", err);
    return NextResponse.json({ notifications: [] }, { status: 500 });
  }
}
