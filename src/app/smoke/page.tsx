"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  isToday, getDay, differenceInMinutes,
} from "date-fns";
import { supabase } from "@/lib/supabase";

const WEEKLY_TARGET = 56;

interface CigaretteLog {
  id: string;
  logged_at: string;
}

function getWeekBounds(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

function computePace(count: number, weekStart: Date, now: Date): number {
  const minutesElapsed = differenceInMinutes(now, weekStart);
  const minutesInWeek = 7 * 24 * 60;
  if (minutesElapsed <= 0) return 0;
  return Math.round((count / minutesElapsed) * minutesInWeek);
}

export default function SmokePage() {
  const [logs, setLogs] = useState<CigaretteLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const now = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(now);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from("cigarettes")
      .select("id, logged_at")
      .gte("logged_at", weekStart.toISOString())
      .lte("logged_at", weekEnd.toISOString())
      .order("logged_at", { ascending: true });
    if (data) setLogs(data);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function logOne() {
    setLogging(true);
    const { data } = await supabase
      .from("cigarettes")
      .insert({ logged_at: new Date().toISOString() })
      .select("id, logged_at")
      .single();
    if (data) setLogs(prev => [...prev, data]);
    setLogging(false);
  }

  async function undoLast() {
    const last = logs[logs.length - 1];
    if (!last) return;
    await supabase.from("cigarettes").delete().eq("id", last.id);
    setLogs(prev => prev.slice(0, -1));
  }

  const count = logs.length;
  const remaining = Math.max(0, WEEKLY_TARGET - count);
  const pct = Math.min(100, Math.round((count / WEEKLY_TARGET) * 100));
  const pace = computePace(count, weekStart, now);
  const overBudget = count > WEEKLY_TARGET;
  const daysLeft = 7 - (getDay(now) === 0 ? 7 : getDay(now) === 1 ? 1 : getDay(now) - 1) - 1;

  // per-day counts
  const byDay = Object.fromEntries(
    weekDays.map(d => [
      format(d, "yyyy-MM-dd"),
      logs.filter(l => format(new Date(l.logged_at), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")).length,
    ])
  );

  const lastLog = logs[logs.length - 1];
  const barColor = overBudget ? "#ef4444" : pct > 75 ? "#f97316" : "#6366f1";

  if (loading) return <div className="text-gray-500 text-center pt-20">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Smoking Tracker</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Week of {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}
        </p>
      </div>

      {/* Big counter card */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 text-center">
        <div className="flex items-end justify-center gap-1 mb-1">
          <span
            className="text-6xl font-black tabular-nums leading-none"
            style={{ color: barColor }}
          >
            {count}
          </span>
          <span className="text-2xl text-gray-500 mb-1">/ {WEEKLY_TARGET}</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">this week</p>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>

        {/* Pace */}
        <p className={`text-sm font-medium ${overBudget ? "text-red-400" : pace > WEEKLY_TARGET ? "text-orange-400" : "text-emerald-400"}`}>
          {overBudget
            ? `${count - WEEKLY_TARGET} over budget this week`
            : pace > WEEKLY_TARGET
            ? `On pace for ${pace} — ${pace - WEEKLY_TARGET} over ⚠️`
            : `On pace for ${pace} — ${remaining} left · ${daysLeft}d to go ✓`}
        </p>
      </div>

      {/* Log button */}
      <button
        onClick={logOne}
        disabled={logging}
        className="w-full py-5 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.97] disabled:opacity-60"
        style={{ backgroundColor: barColor + "22", border: `2px solid ${barColor}`, color: barColor }}
      >
        {logging ? "Logging…" : "🚬  I smoked one"}
      </button>

      {/* Undo */}
      {lastLog && (
        <button
          onClick={undoLast}
          className="w-full py-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-500 text-sm transition-colors active:bg-gray-800 flex items-center justify-center gap-2"
        >
          <span>↩</span>
          <span>Undo last — {format(new Date(lastLog.logged_at), "h:mm a")}</span>
        </button>
      )}

      {/* Daily breakdown */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Daily breakdown</p>
        {weekDays.map(d => {
          const key = format(d, "yyyy-MM-dd");
          const n = byDay[key] ?? 0;
          const today = isToday(d);
          const future = d > now && !today;
          const maxDots = 8;
          return (
            <div key={key} className="flex items-center gap-2">
              <div className="w-14 shrink-0">
                <span className={`text-xs font-medium ${today ? "text-indigo-400" : future ? "text-gray-700" : "text-gray-400"}`}>
                  {format(d, "EEE d")}
                </span>
              </div>
              <div className="flex-1 flex gap-1 items-center">
                {Array.from({ length: Math.min(n, maxDots) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: barColor }}
                  />
                ))}
                {n > maxDots && (
                  <span className="text-xs text-gray-500">+{n - maxDots}</span>
                )}
                {n === 0 && !future && (
                  <span className="text-xs text-gray-700">—</span>
                )}
              </div>
              <span className={`text-sm tabular-nums font-semibold w-5 text-right ${future ? "text-gray-800" : today ? "text-white" : "text-gray-400"}`}>
                {future ? "" : n}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step-down context */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3">
        <p className="text-xs text-gray-500">
          <span className="text-gray-300 font-medium">Chuseok week plan</span>
          {" "}· 56 cigarettes = 8/day average. Flexible weekly pool — bank early days to use later, or quit days carry forward.
        </p>
      </div>
    </div>
  );
}
