"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format, subDays, eachDayOfInterval, startOfWeek, isToday, isYesterday,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import type { CigaretteLog } from "@/lib/types";
import { cigaretteTargetFor, type CigaretteTargetRule } from "@/lib/cigaretteTarget";

const HISTORY_DAYS = 10;

type Entry = Pick<CigaretteLog, "id" | "smoked_at">;

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
}

// Builds a Date for a given day at a given HH:mm, defaulting new entries to
// "now" for today (most common case) or noon for past days, since a past
// day has no meaningful "now" — the time is expected to be corrected right after.
function defaultTimeFor(day: Date): Date {
  const d = new Date(day);
  if (isToday(day)) return new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

export default function SmokePage() {
  const [logs, setLogs] = useState<Entry[]>([]);
  const [schedule, setSchedule] = useState<CigaretteTargetRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [dayDraft, setDayDraft] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryTimeDraft, setEntryTimeDraft] = useState("");

  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, HISTORY_DAYS - 1), end: today }).reverse();

  const fetchData = useCallback(async () => {
    const since = format(subDays(today, HISTORY_DAYS), "yyyy-MM-dd");
    const [logsRes, scheduleRes] = await Promise.all([
      supabase.from("cigarette_logs").select("id, smoked_at").gte("smoked_at", since).order("smoked_at", { ascending: true }),
      supabase.from("cigarette_target_schedule").select("effective_date, daily_target"),
    ]);
    if (logsRes.data) setLogs(logsRes.data);
    if (scheduleRes.data) setSchedule(scheduleRes.data as CigaretteTargetRule[]);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const byDay = new Map<string, Entry[]>();
  for (const log of logs) {
    const key = format(new Date(log.smoked_at), "yyyy-MM-dd");
    byDay.set(key, [...(byDay.get(key) ?? []), log]);
  }

  function toggleExpanded(key: string) {
    setExpanded(prev => {
      const s = new Set(prev);
      if (s.has(key)) s.delete(key); else s.add(key);
      return s;
    });
  }

  // Bulk-set a day's count: inserts new timestamped rows or removes the most
  // recent ones for that day to match, same convention as the Today page.
  async function saveDayCount(day: Date, raw: string) {
    setEditingDay(null);
    const key = dayKey(day);
    const current = byDay.get(key) ?? [];
    const parsed = parseInt(raw, 10);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : current.length;
    const diff = value - current.length;
    if (diff === 0) return;
    if (diff > 0) {
      const rows = Array.from({ length: diff }, () => ({ smoked_at: defaultTimeFor(day).toISOString() }));
      await supabase.from("cigarette_logs").insert(rows);
    } else {
      const idsToRemove = current.slice(diff).map(e => e.id);
      if (idsToRemove.length) await supabase.from("cigarette_logs").delete().in("id", idsToRemove);
    }
    await fetchData();
  }

  async function addEntry(day: Date) {
    const { data } = await supabase
      .from("cigarette_logs")
      .insert({ smoked_at: defaultTimeFor(day).toISOString() })
      .select("id, smoked_at")
      .single();
    await fetchData();
    setExpanded(prev => new Set(prev).add(dayKey(day)));
    if (data) {
      setEditingEntryId(data.id);
      setEntryTimeDraft(format(new Date(data.smoked_at), "HH:mm"));
    }
  }

  async function deleteEntry(id: string) {
    await supabase.from("cigarette_logs").delete().eq("id", id);
    await fetchData();
  }

  function startEditEntryTime(entry: Entry) {
    setEditingEntryId(entry.id);
    setEntryTimeDraft(format(new Date(entry.smoked_at), "HH:mm"));
  }

  async function saveEntryTime(entry: Entry, timeStr: string) {
    setEditingEntryId(null);
    const match = /^(\d{2}):(\d{2})$/.exec(timeStr);
    if (!match) return;
    const [, hh, mm] = match;
    const newDate = new Date(entry.smoked_at);
    newDate.setHours(Number(hh), Number(mm), 0, 0);
    await supabase.from("cigarette_logs").update({ smoked_at: newDate.toISOString() }).eq("id", entry.id);
    await fetchData();
  }

  // Week-to-date rollup, using the same Sunday-start convention as the Today page.
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekDaysSoFar = eachDayOfInterval({ start: weekStart, end: today });
  const weekCount = weekDaysSoFar.reduce((sum, d) => sum + (byDay.get(dayKey(d))?.length ?? 0), 0);
  const weekTarget = weekDaysSoFar.reduce((sum, d) => sum + cigaretteTargetFor(d, schedule), 0);
  const todayTarget = cigaretteTargetFor(today, schedule);

  if (loading) return <div className="text-gray-500 text-center pt-20">Loading…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Smoking Tracker</h1>
        <p className="text-xs text-gray-500 mt-0.5">Tap a count to edit it — including past days</p>
      </div>

      {/* Week-to-date rollup */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-gray-400">This week so far</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: weekCount > weekTarget ? "#f87171" : "#fbbf24" }}>
            {weekCount}<span className="text-gray-500 font-normal text-sm"> / {weekTarget}</span>
          </p>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, weekTarget ? (weekCount / weekTarget) * 100 : 0)}%`,
              backgroundColor: weekCount > weekTarget ? "#f87171" : "#fbbf24",
            }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-2">today&apos;s target: {todayTarget}/day</p>
      </div>

      {/* Editable day-by-day log */}
      <div className="space-y-2">
        {days.map(day => {
          const key = dayKey(day);
          const entries = byDay.get(key) ?? [];
          const target = cigaretteTargetFor(day, schedule);
          const over = entries.length > target;
          const color = over ? "#f87171" : "#fbbf24";
          const isOpen = expanded.has(key);

          return (
            <div key={key} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3.5">
                <button
                  onClick={() => toggleExpanded(key)}
                  className="flex-1 min-w-0 text-left flex items-center gap-2"
                >
                  <span className={`text-xs ${isOpen ? "rotate-90" : ""} transition-transform text-gray-600 w-3 shrink-0`}>▸</span>
                  <span className={`text-sm font-medium ${isToday(day) ? "text-indigo-400" : "text-gray-300"}`}>
                    {dayLabel(day)}
                  </span>
                </button>

                {editingDay === key ? (
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    autoFocus
                    defaultValue={entries.length}
                    onChange={e => setDayDraft(e.target.value)}
                    onBlur={e => saveDayCount(day, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingDay(null);
                    }}
                    className="w-16 bg-gray-800 border border-amber-500 rounded-lg px-2 py-1 text-base font-bold tabular-nums text-amber-400 text-right focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => { setDayDraft(String(entries.length)); setEditingDay(key); }}
                    className="text-base font-bold tabular-nums px-1"
                    style={{ color }}
                  >
                    {entries.length}<span className="text-gray-500 font-normal text-sm"> / {target}</span>
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-gray-800 bg-gray-950/40">
                  {entries.length === 0 ? (
                    <p className="text-xs text-gray-600 mt-3 mb-2">No entries this day.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
                      {entries.map(entry => (
                        <div key={entry.id} className="flex items-center gap-1 bg-gray-800 rounded-lg pl-2 pr-1 py-1">
                          {editingEntryId === entry.id ? (
                            <input
                              type="time"
                              autoFocus
                              value={entryTimeDraft}
                              onChange={e => setEntryTimeDraft(e.target.value)}
                              onBlur={e => saveEntryTime(entry, e.target.value)}
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
                            onClick={() => deleteEntry(entry.id)}
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
                    onClick={() => addEntry(day)}
                    className="text-xs text-indigo-400 active:text-indigo-300"
                  >
                    + Add {isToday(day) ? "now" : "entry"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3">
        <p className="text-xs text-gray-500">
          <span className="text-gray-300 font-medium">Step-down plan</span>
          {" "}· target drops from 8/day to 7/day starting Sep 28, part of the Chuseok-week wind-down.
        </p>
      </div>
    </div>
  );
}
