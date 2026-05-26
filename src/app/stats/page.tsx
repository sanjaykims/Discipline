"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, getDay, getDaysInMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Habit, Completion } from "@/lib/types";

type ViewMode = "week" | "month";

function computeStreak(habitId: string, completions: Completion[]): number {
  const dates = new Set(
    completions.filter(c => c.habit_id === habitId).map(c => c.completed_date)
  );
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = format(cursor, "yyyy-MM-dd");
    if (!dates.has(key)) break;
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export default function StatsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [view, setView] = useState<ViewMode>("week");
  const [loading, setLoading] = useState(true);
  const today = new Date();

  const fetchData = useCallback(async () => {
    const since = format(subDays(today, 60), "yyyy-MM-dd");
    const [hRes, cRes] = await Promise.all([
      supabase.from("habits").select("*").eq("is_active", true).order("created_at"),
      supabase.from("completions").select("*").gte("completed_date", since),
    ]);
    if (hRes.data) setHabits(hRes.data);
    if (cRes.data) setCompletions(cRes.data);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build week columns (last 7 days)
  const weekDays = eachDayOfInterval({ start: subDays(today, 6), end: today });

  // Build month grid
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  function isDone(habitId: string, date: Date): boolean {
    const key = format(date, "yyyy-MM-dd");
    return completions.some(c => c.habit_id === habitId && c.completed_date === key);
  }

  if (loading) return <div className="text-gray-500 text-center pt-20">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Stats</h1>
        <div className="flex rounded-lg overflow-hidden border border-gray-700 text-sm">
          <button
            onClick={() => setView("week")}
            className={`px-4 py-2 transition-colors ${view === "week" ? "bg-indigo-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-4 py-2 transition-colors ${view === "month" ? "bg-indigo-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {habits.slice(0, 4).map(h => {
          const streak = computeStreak(h.id, completions);
          return (
            <div key={h.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="text-2xl mb-1">{h.icon}</div>
              <p className="text-xs text-gray-400 truncate mb-1">{h.name}</p>
              <p className="text-2xl font-bold" style={{ color: h.color }}>{streak}</p>
              <p className="text-xs text-gray-500">day streak</p>
            </div>
          );
        })}
      </div>

      {view === "week" ? (
        <WeekView habits={habits} days={weekDays} isDone={isDone} />
      ) : (
        <MonthView
          habits={habits}
          days={monthDays}
          firstDayOfWeek={firstDayOfWeek}
          daysInMonth={getDaysInMonth(today)}
          isDone={isDone}
          today={today}
        />
      )}
    </div>
  );
}

function WeekView({ habits, days, isDone }: { habits: Habit[]; days: Date[]; isDone: (id: string, d: Date) => boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-gray-400 font-normal pb-3 pr-4 whitespace-nowrap">Habit</th>
            {days.map(d => (
              <th key={d.toISOString()} className="text-center text-gray-400 font-normal pb-3 px-2 whitespace-nowrap">
                <span className="block text-xs">{format(d, "EEE")}</span>
                <span className={`block text-base font-bold ${format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "text-indigo-400" : "text-gray-300"}`}>
                  {format(d, "d")}
                </span>
              </th>
            ))}
            <th className="text-center text-gray-400 font-normal pb-3 px-2">Streak</th>
          </tr>
        </thead>
        <tbody>
          {habits.map(h => {
            const weekDone = days.filter(d => isDone(h.id, d)).length;
            const streak = days.reduceRight((acc, d) => {
              if (!isDone(h.id, d)) return acc === 7 ? 0 : acc; // simple visual streak
              return acc;
            }, 0);
            void streak;
            return (
              <tr key={h.id} className="border-t border-gray-800">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span>{h.icon}</span>
                    <span className="text-gray-200 whitespace-nowrap">{h.name}</span>
                  </div>
                </td>
                {days.map(d => {
                  const done = isDone(h.id, d);
                  return (
                    <td key={d.toISOString()} className="text-center py-3 px-2">
                      <span
                        className={`inline-block w-7 h-7 rounded-full text-xs flex items-center justify-center
                          ${done ? "text-white" : "bg-gray-800 text-gray-600"}`}
                        style={done ? { backgroundColor: h.color } : {}}
                      >
                        {done ? "✓" : "·"}
                      </span>
                    </td>
                  );
                })}
                <td className="text-center py-3 px-2">
                  <span className="font-bold" style={{ color: h.color }}>{weekDone}/7</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MonthView({
  habits, days, firstDayOfWeek, daysInMonth, isDone, today
}: {
  habits: Habit[];
  days: Date[];
  firstDayOfWeek: number;
  daysInMonth: number;
  isDone: (id: string, d: Date) => boolean;
  today: Date;
}) {
  const [selected, setSelected] = useState<Habit>(habits[0]);

  if (!selected) return null;

  const monthDone = days.filter(d => isDone(selected.id, d)).length;

  return (
    <div>
      {/* Habit selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {habits.map(h => (
          <button
            key={h.id}
            onClick={() => setSelected(h)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border
              ${selected.id === h.id ? "text-white border-transparent" : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white"}`}
            style={selected.id === h.id ? { backgroundColor: h.color, borderColor: h.color } : {}}
          >
            <span>{h.icon}</span> {h.name}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">{format(today, "MMMM yyyy")}</p>
          <p className="text-sm text-gray-400">{monthDone}/{daysInMonth} days</p>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {days.map(d => {
            const done = isDone(selected.id, d);
            const isToday = format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
            return (
              <div
                key={d.toISOString()}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all
                  ${done ? "text-white" : isToday ? "border-2 text-gray-300" : "text-gray-600"}`}
                style={
                  done
                    ? { backgroundColor: selected.color }
                    : isToday
                    ? { borderColor: selected.color }
                    : { backgroundColor: "#1f2937" }
                }
              >
                {format(d, "d")}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
