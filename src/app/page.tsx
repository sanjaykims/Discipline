"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays, startOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Habit, Completion, WaterLog, CigaretteLog } from "@/lib/types";
import { WATER_TARGET_LITERS } from "@/lib/constants";
import { cigaretteTargetFor, type CigaretteTargetRule } from "@/lib/cigaretteTarget";

type WeekCompletion = Pick<Completion, "habit_id" | "completed_date">;

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [weekCompletions, setWeekCompletions] = useState<WeekCompletion[]>([]);
  const [weekOverrides, setWeekOverrides] = useState<Record<string, number>>({});
  const [waterLiters, setWaterLiters] = useState(0);
  const [cigaretteCount, setCigaretteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editingWater, setEditingWater] = useState(false);
  const [waterDraft, setWaterDraft] = useState("");
  const [editingCigarettes, setEditingCigarettes] = useState(false);
  const [cigaretteDraft, setCigaretteDraft] = useState("");
  const [cigaretteEntries, setCigaretteEntries] = useState<Pick<CigaretteLog, "id" | "smoked_at">[]>([]);
  const [showCigaretteList, setShowCigaretteList] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryTimeDraft, setEntryTimeDraft] = useState("");
  const [cigaretteSchedule, setCigaretteSchedule] = useState<CigaretteTargetRule[]>([]);

  const today = format(new Date(), "yyyy-MM-dd");
  const displayDate = format(new Date(), "EEEE, MMMM d");

  const fetchData = useCallback(async () => {
    const since = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd");
    const [habitsRes, completionsRes, waterRes, cigaretteRes, overridesRes, cigScheduleRes] = await Promise.all([
      supabase.from("habits").select("*").eq("is_active", true).order("created_at"),
      supabase.from("completions").select("habit_id, completed_date").gte("completed_date", weekStart),
      supabase.from("water_logs").select("liters").eq("entry_date", today),
      supabase.from("cigarette_logs").select("id, smoked_at").gte("smoked_at", since),
      supabase.from("habit_weekly_overrides").select("habit_id, target").eq("week_start", weekStart),
      supabase.from("cigarette_target_schedule").select("effective_date, daily_target"),
    ]);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (completionsRes.data) {
      const rows = completionsRes.data as WeekCompletion[];
      setCompletions(new Set(rows.filter(c => c.completed_date === today).map(c => c.habit_id)));
      setWeekCompletions(rows);
    }
    if (waterRes.data) {
      setWaterLiters(waterRes.data.reduce((sum: number, w: Pick<WaterLog, "liters">) => sum + Number(w.liters), 0));
    }
    if (cigaretteRes.data) {
      const todayRows = (cigaretteRes.data as Pick<CigaretteLog, "id" | "smoked_at">[])
        .filter(c => format(new Date(c.smoked_at), "yyyy-MM-dd") === today)
        .sort((a, b) => new Date(a.smoked_at).getTime() - new Date(b.smoked_at).getTime());
      setCigaretteCount(todayRows.length);
      setCigaretteEntries(todayRows);
    }
    if (overridesRes.data) {
      const map: Record<string, number> = {};
      for (const o of overridesRes.data as { habit_id: string; target: number }[]) map[o.habit_id] = o.target;
      setWeekOverrides(map);
    }
    if (cigScheduleRes.data) setCigaretteSchedule(cigScheduleRes.data as CigaretteTargetRule[]);
    setLoading(false);
  }, [today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggle(habitId: string) {
    const done = completions.has(habitId);
    if (done) {
      await supabase.from("completions").delete()
        .eq("habit_id", habitId).eq("completed_date", today);
      setCompletions(prev => { const s = new Set(prev); s.delete(habitId); return s; });
      setWeekCompletions(prev => prev.filter(c => !(c.habit_id === habitId && c.completed_date === today)));
    } else {
      await supabase.from("completions").insert({ habit_id: habitId, completed_date: today });
      setCompletions(prev => new Set([...prev, habitId]));
      setWeekCompletions(prev => [...prev, { habit_id: habitId, completed_date: today }]);
    }
  }

  // Water is stored as one or more rows per day; editing sets the day's total
  // by replacing today's rows with a single row holding the new value.
  async function saveWaterTotal(raw: string) {
    setEditingWater(false);
    const parsed = parseFloat(raw);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 10) / 10) : waterLiters;
    if (value === waterLiters) return;
    await supabase.from("water_logs").delete().eq("entry_date", today);
    if (value > 0) {
      await supabase.from("water_logs").insert({ entry_date: today, liters: value });
    }
    setWaterLiters(value);
  }

  // Cigarettes are individual timestamped rows; editing the count inserts new
  // rows (timestamped now) or deletes the most recent ones for today to match.
  async function saveCigaretteCount(raw: string) {
    setEditingCigarettes(false);
    const parsed = parseInt(raw, 10);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : cigaretteCount;
    const diff = value - cigaretteCount;
    if (diff === 0) return;
    if (diff > 0) {
      const rows = Array.from({ length: diff }, () => ({ smoked_at: new Date().toISOString() }));
      await supabase.from("cigarette_logs").insert(rows);
    } else {
      // cigaretteEntries is oldest-first; drop the most recent ones to hit the target.
      const idsToRemove = cigaretteEntries.slice(value).map(r => r.id);
      if (idsToRemove.length) {
        await supabase.from("cigarette_logs").delete().in("id", idsToRemove);
      }
    }
    await fetchData();
  }

  async function addCigaretteEntry() {
    await supabase.from("cigarette_logs").insert({ smoked_at: new Date().toISOString() });
    await fetchData();
  }

  async function deleteCigaretteEntry(id: string) {
    await supabase.from("cigarette_logs").delete().eq("id", id);
    await fetchData();
  }

  function startEditEntryTime(entry: Pick<CigaretteLog, "id" | "smoked_at">) {
    setEditingEntryId(entry.id);
    setEntryTimeDraft(format(new Date(entry.smoked_at), "HH:mm"));
  }

  // Time-only edit: keeps the entry on today's date, just moves the clock time.
  async function saveEntryTime(id: string, timeStr: string) {
    setEditingEntryId(null);
    const match = /^(\d{2}):(\d{2})$/.exec(timeStr);
    const original = cigaretteEntries.find(e => e.id === id);
    if (!match || !original) return;
    const [, hh, mm] = match;
    const newDate = new Date(original.smoked_at);
    newDate.setHours(Number(hh), Number(mm), 0, 0);
    await supabase.from("cigarette_logs").update({ smoked_at: newDate.toISOString() }).eq("id", id);
    await fetchData();
  }

  const doneCount = completions.size;
  const total = habits.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const cigaretteTarget = cigaretteTargetFor(new Date(), cigaretteSchedule);

  if (loading) return <div className="text-gray-500 text-center pt-20">Loading…</div>;

  return (
    <div>
      <div className="mb-5">
        <p className="text-gray-400 text-sm mb-0.5">{displayDate}</p>
        <h1 className="text-2xl font-bold mb-4">Today&apos;s Habits</h1>

        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#10b981" : "#6366f1" }}
            />
          </div>
          <span className="text-sm text-gray-400 shrink-0 tabular-nums">{doneCount}/{total}</span>
        </div>
        {pct === 100 && (
          <p className="text-emerald-400 text-sm font-medium">All done! Keep the streak alive. 🔥</p>
        )}
      </div>

      <div className="mb-5">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => { setWaterDraft(waterLiters.toFixed(1)); setEditingWater(true); }}
            className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-left active:border-gray-500"
          >
            <div className="text-xl mb-1">💧</div>
            <p className="text-xs text-gray-400 mb-1">Water</p>
            {editingWater ? (
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                autoFocus
                value={waterDraft}
                onChange={e => setWaterDraft(e.target.value)}
                onBlur={e => saveWaterTotal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setEditingWater(false);
                }}
                onClick={e => e.stopPropagation()}
                className="w-full bg-gray-800 border border-sky-500 rounded-lg px-2 py-1 text-lg font-bold tabular-nums text-sky-400 focus:outline-none"
              />
            ) : (
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: waterLiters >= WATER_TARGET_LITERS ? "#34d399" : "#38bdf8" }}
              >
                {waterLiters.toFixed(1)}
                <span className="text-sm text-gray-500 font-normal"> / {WATER_TARGET_LITERS.toFixed(1)} L</span>
              </p>
            )}
          </button>

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 relative">
            <button
              onClick={() => setShowCigaretteList(v => !v)}
              className="absolute top-2.5 right-2.5 text-[10px] text-gray-500 active:text-gray-300 z-10"
            >
              {showCigaretteList ? "hide" : "times ▾"}
            </button>
            <button
              onClick={() => { setCigaretteDraft(String(cigaretteCount)); setEditingCigarettes(true); }}
              className="w-full text-left"
            >
              <div className="text-xl mb-1">🚬</div>
              <p className="text-xs text-gray-400 mb-1">Cigarettes</p>
              {editingCigarettes ? (
                <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  autoFocus
                  value={cigaretteDraft}
                  onChange={e => setCigaretteDraft(e.target.value)}
                  onBlur={e => saveCigaretteCount(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingCigarettes(false);
                  }}
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-gray-800 border border-amber-500 rounded-lg px-2 py-1 text-lg font-bold tabular-nums text-amber-400 focus:outline-none"
                />
              ) : (
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{ color: cigaretteCount > cigaretteTarget ? "#f87171" : "#fbbf24" }}
                >
                  {cigaretteCount}<span className="text-sm text-gray-500 font-normal"> / {cigaretteTarget}</span>
                </p>
              )}
            </button>
          </div>
        </div>

        {showCigaretteList && (
          <div className="mt-2.5 bg-gray-900 border border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-2">Today&apos;s cigarettes</p>
            {cigaretteEntries.length === 0 ? (
              <p className="text-xs text-gray-600 mb-2">None yet today.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {cigaretteEntries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-1 bg-gray-800 rounded-lg pl-2 pr-1 py-1">
                    {editingEntryId === entry.id ? (
                      <input
                        type="time"
                        autoFocus
                        value={entryTimeDraft}
                        onChange={e => setEntryTimeDraft(e.target.value)}
                        onBlur={e => saveEntryTime(entry.id, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") setEditingEntryId(null);
                        }}
                        className="bg-gray-900 border border-amber-500 rounded px-1 text-xs text-amber-300 tabular-nums focus:outline-none w-[74px]"
                      />
                    ) : (
                      <button
                        onClick={() => startEditEntryTime(entry)}
                        className="text-xs text-gray-300 tabular-nums active:text-amber-300"
                      >
                        {format(new Date(entry.smoked_at), "h:mm a")}
                      </button>
                    )}
                    <button
                      onClick={() => deleteCigaretteEntry(entry.id)}
                      className="text-gray-600 active:text-red-400 text-xs w-5 h-5 flex items-center justify-center shrink-0"
                      aria-label="Delete entry"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={addCigaretteEntry}
              className="text-xs text-indigo-400 active:text-indigo-300"
            >
              + Add now
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-2.5">
        {habits.map(habit => {
          const done = completions.has(habit.id);
          const effectiveTarget = weekOverrides[habit.id] ?? habit.weekly_target;
          const weekCount = effectiveTarget
            ? weekCompletions.filter(c => c.habit_id === habit.id).length
            : null;
          return (
            <button
              key={habit.id}
              onClick={() => toggle(habit.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.98]
                ${done
                  ? "bg-gray-800/80 border-gray-700 opacity-60"
                  : "bg-gray-900 border-gray-700 active:border-gray-500"
                }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{
                  backgroundColor: done ? "#374151" : habit.color + "22",
                  border: `2px solid ${done ? "#4b5563" : habit.color}`
                }}
              >
                {done ? "✓" : habit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${done ? "line-through text-gray-500" : ""}`}>
                  {habit.name}
                </p>
                {habit.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{habit.description}</p>
                )}
              </div>
              {weekCount !== null && (
                <span
                  className="text-[11px] font-bold tabular-nums px-2 py-1 rounded-full shrink-0"
                  style={{
                    color: weekCount >= effectiveTarget! ? "#34d399" : "#9ca3af",
                    backgroundColor: weekCount >= effectiveTarget! ? "#34d39922" : "#37415199",
                  }}
                >
                  {weekCount}/{effectiveTarget} wk
                </span>
              )}
              <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
                ${done ? "bg-emerald-500 border-emerald-500" : "border-gray-600"}`}>
                {done && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-lg">No habits yet.</p>
          <a href="/habits" className="text-indigo-400 text-sm mt-1 inline-block">Add your first habit →</a>
        </div>
      )}
    </div>
  );
}
