"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Habit, Completion } from "@/lib/types";

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");
  const displayDate = format(new Date(), "EEEE, MMMM d");

  const fetchData = useCallback(async () => {
    const [habitsRes, completionsRes] = await Promise.all([
      supabase.from("habits").select("*").eq("is_active", true).order("created_at"),
      supabase.from("completions").select("habit_id").eq("completed_date", today),
    ]);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (completionsRes.data) {
      setCompletions(new Set(completionsRes.data.map((c: Pick<Completion, "habit_id">) => c.habit_id)));
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

  const doneCount = completions.size;
  const total = habits.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  if (loading) return <div className="text-gray-500 text-center pt-20">Loading…</div>;

  return (
    <div>
      <div className="mb-8">
        <p className="text-gray-400 text-sm mb-1">{displayDate}</p>
        <h1 className="text-3xl font-bold mb-4">Today&apos;s Habits</h1>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 bg-gray-800 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#10b981" : "#6366f1" }}
            />
          </div>
          <span className="text-sm text-gray-400 shrink-0">{doneCount}/{total}</span>
        </div>
        {pct === 100 && (
          <p className="text-emerald-400 text-sm font-medium">All done! Keep the streak alive. 🔥</p>
        )}
      </div>

      <div className="grid gap-3">
        {habits.map(habit => {
          const done = completions.has(habit.id);
          return (
            <button
              key={habit.id}
              onClick={() => toggle(habit.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                ${done
                  ? "bg-gray-800 border-gray-700 opacity-70"
                  : "bg-gray-900 border-gray-700 hover:border-gray-500"
                }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: done ? "#374151" : habit.color + "22", border: `2px solid ${done ? "#4b5563" : habit.color}` }}
              >
                {done ? "✓" : habit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${done ? "line-through text-gray-500" : ""}`}>{habit.name}</p>
                {habit.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{habit.description}</p>
                )}
              </div>
              <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
                ${done ? "bg-emerald-500 border-emerald-500" : "border-gray-600"}`}>
                {done && <span className="text-white text-xs">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-lg">No habits yet.</p>
          <a href="/habits" className="text-indigo-400 hover:underline text-sm mt-1 inline-block">Add your first habit →</a>
        </div>
      )}
    </div>
  );
}
