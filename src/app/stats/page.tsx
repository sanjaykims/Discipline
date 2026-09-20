"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, getDay, getDaysInMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Habit, Completion, CigaretteLog } from "@/lib/types";
import { CIGARETTE_TARGET } from "@/lib/constants";

type ViewMode = "week" | "month";

function computeStreak(habitId: string, completions: Completion[]): number {
  const dates = new Set(completions.filter(c => c.habit_id === habitId).map(c => c.completed_date));
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
  const [cigaretteLogs, setCigaretteLogs] = useState<Pick<CigaretteLog, "smoked_at">[]>([]);
  const [view, setView] = useState<ViewMode>("week");
  const [loading, setLoading] = useState(true);
  const today = new Date();

  const fetchData = useCallback(async () => {
    const since = format(subDays(today, 60), "yyyy-MM-dd");
    const [hRes, cRes, cigRes] = await Promise.all([
      supabase.from("habits").select("*").eq("is_active", true).order("created_at"),
      supabase.from("completions").select("*").gte("completed_date", since),
      supabase.from("cigarette_logs").select("smoked_at").gte("smoked_at", since),
    ]);
    if (hRes.data) setHabits(hRes.data);
    if (cRes.data) setCompletions(cRes.data);
    if (cigRes.data) setCigaretteLogs(cigRes.data);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const weekDays = eachDayOfInterval({ start: subDays(today, 6), end: today });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  function isDone(habitId: string, date: Date): boolean {
    const key = format(date, "yyyy-MM-dd");
    return completions.some(c => c.habit_id === habitId && c.completed_date === key);
  }

  const cigByDate = new Map<string, number>();
  for (const log of cigaretteLogs) {
    const key = format(new Date(log.smoked_at), "yyyy-MM-dd");
    cigByDate.set(key, (cigByDate.get(key) ?? 0) + 1);
  }
  function cigCount(date: Date): number {
    return cigByDate.get(format(date, "yyyy-MM-dd")) ?? 0;
  }

  if (loading) return <div className="text-gray-500 text-center pt-20">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Stats</h1>
        <div className="flex rounded-xl overflow-hidden border border-gray-700 text-sm">
          <button
            onClick={() => setView("week")}
            className={`px-4 py-2 transition-colors ${view === "week" ? "bg-indigo-600 text-white" : "bg-gray-900 text-gray-400"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-4 py-2 transition-colors ${view === "month" ? "bg-indigo-600 text-white" : "bg-gray-900 text-gray-400"}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Streak cards — all habits, 2 col */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {habits.map(h => {
          const streak = computeStreak(h.id, completions);
          return (
            <div key={h.id} className="bg-gray-900 border border-gray-700 rounded-xl p-3">
              <div className="text-xl mb-1">{h.icon}</div>
              <p className="text-xs text-gray-400 truncate mb-1">{h.name}</p>
              <p className="text-xl font-bold tabular-nums" style={{ color: h.color }}>{streak}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">day streak</p>
            </div>
          );
        })}
      </div>

      <CigaretteCard view={view} today={today} cigCount={cigCount} />

      {view === "week" ? (
        <WeekView habits={habits} days={weekDays} isDone={isDone} today={today} />
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

function WeekView({
  habits, days, isDone, today,
}: {
  habits: Habit[];
  days: Date[];
  isDone: (id: string, d: Date) => boolean;
  today: Date;
}) {
  const todayStr = format(today, "yyyy-MM-dd");
  return (
    <div className="space-y-2">
      {/* Day header row */}
      <div className="flex items-center gap-2 pl-12 pr-12">
        {days.map(d => {
          const isToday = format(d, "yyyy-MM-dd") === todayStr;
          return (
            <div key={d.toISOString()} className="flex-1 flex flex-col items-center">
              <span className="text-[9px] text-gray-500 uppercase">{format(d, "EEE").charAt(0)}</span>
              <span className={`text-xs font-bold ${isToday ? "text-indigo-400" : "text-gray-500"}`}>
                {format(d, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* One row per habit */}
      {habits.map(h => {
        const weekDone = days.filter(d => isDone(h.id, d)).length;
        return (
          <div key={h.id} className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5">
            <span className="text-lg shrink-0 w-7 text-center">{h.icon}</span>
            <div className="flex flex-1 gap-2 min-w-0">
              {days.map(d => {
                const done = isDone(h.id, d);
                return (
                  <div
                    key={d.toISOString()}
                    className="flex-1 aspect-square rounded-full"
                    style={done ? { backgroundColor: h.color } : { backgroundColor: "#1f2937" }}
                  />
                );
              })}
            </div>
            <span className="text-xs font-bold tabular-nums shrink-0 w-7 text-right" style={{ color: h.color }}>
              {weekDone}/7
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  habits, days, firstDayOfWeek, daysInMonth, isDone, today,
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
      {/* Scrollable habit pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
        {habits.map(h => (
          <button
            key={h.id}
            onClick={() => setSelected(h)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border shrink-0 snap-start
              ${selected.id === h.id ? "text-white border-transparent" : "bg-gray-900 border-gray-700 text-gray-400"}`}
            style={selected.id === h.id ? { backgroundColor: selected.color, borderColor: selected.color } : {}}
          >
            <span>{h.icon}</span>
            <span className="whitespace-nowrap">{h.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">{format(today, "MMMM yyyy")}</p>
          <p className="text-sm text-gray-400 tabular-nums">{monthDone}/{daysInMonth} days</p>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <span key={d} className="text-[10px] text-gray-500">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {days.map(d => {
            const done = isDone(selected.id, d);
            const isToday = format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
            return (
              <div
                key={d.toISOString()}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium
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

function CigaretteCard({
  view, today, cigCount,
}: {
  view: ViewMode;
  today: Date;
  cigCount: (d: Date) => number;
}) {
  const weekDays = eachDayOfInterval({ start: subDays(today, 6), end: today });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const todayStr = format(today, "yyyy-MM-dd");

  function cellFill(count: number) {
    if (count === 0) return undefined;
    if (count > CIGARETTE_TARGET) return { backgroundColor: "#f87171" };
    const alpha = 0.25 + Math.min(1, count / CIGARETTE_TARGET) * 0.65;
    return { backgroundColor: `rgba(251, 191, 36, ${alpha})` };
  }

  if (view === "week") {
    const total = weekDays.reduce((sum, d) => sum + cigCount(d), 0);
    const target = CIGARETTE_TARGET * weekDays.length;
    const maxDay = Math.max(CIGARETTE_TARGET, ...weekDays.map(cigCount));
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚬</span>
            <p className="font-semibold">Cigarettes</p>
          </div>
          <p className="text-sm tabular-nums" style={{ color: total > target ? "#f87171" : "#fbbf24" }}>
            {total}<span className="text-gray-500 font-normal"> / {target}</span>
          </p>
        </div>
        <div className="flex items-end gap-2 h-24">
          {weekDays.map(d => {
            const count = cigCount(d);
            const over = count > CIGARETTE_TARGET;
            const heightPct = count > 0 ? Math.max(8, (count / maxDay) * 100) : 3;
            const isToday = format(d, "yyyy-MM-dd") === todayStr;
            return (
              <div key={d.toISOString()} className="flex-1 flex flex-col items-center gap-1 h-full">
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: count > 0 ? (over ? "#f87171" : "#fbbf24") : "#4b5563" }}
                >
                  {count}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: over ? "#f87171" : "#fbbf24",
                      opacity: count > 0 ? 1 : 0.2,
                    }}
                  />
                </div>
                <span className={`text-[9px] uppercase ${isToday ? "text-indigo-400" : "text-gray-500"}`}>
                  {format(d, "EEE").charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const monthTotal = monthDays.reduce((sum, d) => sum + cigCount(d), 0);
  const monthTarget = CIGARETTE_TARGET * monthDays.length;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚬</span>
          <p className="font-semibold">Cigarettes</p>
        </div>
        <p className="text-sm tabular-nums" style={{ color: monthTotal > monthTarget ? "#f87171" : "#fbbf24" }}>
          {monthTotal}<span className="text-gray-500 font-normal"> / {monthTarget}</span>
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <span key={d} className="text-[10px] text-gray-500">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`ce-${i}`} />)}
        {monthDays.map(d => {
          const count = cigCount(d);
          const isToday = format(d, "yyyy-MM-dd") === todayStr;
          const fill = cellFill(count);
          return (
            <div
              key={d.toISOString()}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                ${count > 0 ? "text-white" : isToday ? "border-2 text-gray-300" : "text-gray-600"}`}
              style={fill ?? (isToday ? { borderColor: "#fbbf24" } : { backgroundColor: "#1f2937" })}
            >
              {count > 0 ? count : format(d, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

