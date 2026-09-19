"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Habit, Completion, WaterLog, CigaretteLog } from "@/lib/types";

const CIGARETTE_TARGET = 9;
const WATER_TARGET_LITERS = 3.0;

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [waterLiters, setWaterLiters] = useState(0);
  const [cigaretteCount, setCigaretteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editingWater, setEditingWater] = useState(false);
  const [waterDraft, setWaterDraft] = useState("");
  const [editingCigarettes, setEditingCigarettes] = useState(false);
  const [cigaretteDraft, setCigaretteDraft] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");
  const displayDate = format(new Date(), "EEEE, MMMM d");

  const fetchData = useCallback(async () => {
    const since = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const [habitsRes, completionsRes, waterRes, cigaretteRes] = await Promise.all([
      supabase.from("habits").select("*").eq("is_active", true).order("created_at"),
      supabase.from("completions").select("habit_id").eq("completed_date", today),
      supabase.from("water_logs").select("liters").eq("entry_date", today),
      supabase.from("cigarette_logs").select("id, smoked_at").gte("smoked_at", since),
    ]);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (completionsRes.data) {
      setCompletions(new Set(completionsRes.data.map((c: Pick<Completion, "habit_id">) => c.habit_id)));
    }
    if (waterRes.data) {
      setWaterLiters(waterRes.data.reduce((sum: number, w: Pick<WaterLog, "liters">) => sum + Number(w.liters), 0));
    }
    if (cigaretteRes.data) {
      const todayCount = cigaretteRes.data.filter(
        (c: Pick<CigaretteLog, "smoked_at">) => format(new Date(c.smoked_at), "yyyy-MM-dd") === today
      ).length;
      setCigaretteCount(todayCount);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggle(habitId: string) {
    const done = completions.has(habitId);
    if (done) {
      await supabase.from("completions").delete()
        .eq("habit_id", habitId).eq("completed_date", today);
      setCompletions(prev => { const s = new Set(prev); s.delete(habitId); return s; });
    } else {
      await supabase.from("completions").insert({ habit_id: habitId, completed_date: today });
      setCompletions(prev => new Set([...prev, habitId]));
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
      const since = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const { data } = await supabase
        .from("cigarette_logs")
        .select("id, smoked_at")
        .gte("smoked_at", since)
        .order("smoked_at", { ascending: false });
      const todayRows = (data || []).filter(
        (r: Pick<CigaretteLog, "id" | "smoked_at">) => format(new Date(r.smoked_at), "yyyy-MM-dd") === today
      );
      const idsToRemove = todayRows.slice(0, -diff).map((r: Pick<CigaretteLog, "id">) => r.id);
      if (idsToRemove.length) {
        await supabase.from("cigarette_logs").delete().in("id", idsToRemove);
      }
    }
    setCigaretteCount(value);
  }

  const doneCount = completions.size;
  const total = habits.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

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

      <div className="grid grid-cols-2 gap-2.5 mb-5">
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

        <button
          onClick={() => { setCigaretteDraft(String(cigaretteCount)); setEditingCigarettes(true); }}
          className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-left active:border-gray-500"
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
              style={{ color: cigaretteCount > CIGARETTE_TARGET ? "#f87171" : "#fbbf24" }}
            >
              {cigaretteCount}<span className="text-sm text-gray-500 font-normal"> / {CIGARETTE_TARGET}</span>
            </p>
          )}
        </button>
      </div>

      <div className="grid gap-2.5">
        {habits.map(habit => {
          const done = completions.has(habit.id);
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
