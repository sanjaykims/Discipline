"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { WorkoutLog } from "@/lib/types";
import { MuscleDiagram, MUSCLE_GROUPS, mixColor, type MuscleKey } from "@/components/MuscleDiagram";

const todayStr = () => format(new Date(), "yyyy-MM-dd");
const FADE_DAYS = 7; // color fades from full green (today) to neutral gray over this many days

// Text needs a lighter neutral floor than the body-diagram fill so faded
// dates stay readable against the dark background.
function textColor(t: number) {
  const NEUTRAL: [number, number, number] = [156, 163, 175]; // gray-400
  const ACCENT: [number, number, number] = [52, 211, 153]; // emerald-400
  const clamped = Math.max(0, Math.min(1, t));
  const [r, g, b] = NEUTRAL.map((n, i) => Math.round(n + (ACCENT[i] - n) * clamped));
  return `rgb(${r},${g},${b})`;
}

export default function WorkoutPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [content, setContent] = useState("");
  const [muscles, setMuscles] = useState<MuscleKey[]>([]);
  const [saving, setSaving] = useState(false);

  async function fetchLogs() {
    const { data } = await supabase
      .from("workout_logs")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setLogs(data);
    setLoading(false);
  }

  useEffect(() => { fetchLogs(); }, []);

  // logs are fetched ordered by entry_date desc, so the first log that
  // touches a muscle is that muscle's most recent worked date.
  const muscleLastDate = useMemo(() => {
    const map = {} as Record<MuscleKey, string | null>;
    for (const g of MUSCLE_GROUPS) map[g.key] = null;
    for (const log of logs) {
      for (const m of log.muscles ?? []) {
        const key = m as MuscleKey;
        if (!map[key]) map[key] = log.entry_date;
      }
    }
    return map;
  }, [logs]);

  // Color intensity fades continuously from 1 (worked today) to 0 (never
  // worked, or last worked FADE_DAYS+ ago) rather than snapping between buckets.
  const muscleIntensity = useMemo(() => {
    const result = {} as Record<MuscleKey, number>;
    for (const g of MUSCLE_GROUPS) {
      const last = muscleLastDate[g.key];
      if (!last) { result[g.key] = 0; continue; }
      const daysAgo = differenceInCalendarDays(new Date(todayStr()), parseISO(last));
      result[g.key] = daysAgo <= 0 ? 1 : Math.max(0, 1 - daysAgo / FADE_DAYS);
    }
    return result;
  }, [muscleLastDate]);

  function openNew() {
    setDate(todayStr());
    setContent("");
    setMuscles([]);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(log: WorkoutLog) {
    setDate(log.entry_date);
    setContent(log.content);
    setMuscles((log.muscles ?? []) as MuscleKey[]);
    setEditId(log.id);
    setShowForm(true);
  }

  function toggleMuscle(key: MuscleKey) {
    setMuscles(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  }

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("workout_logs").update({ entry_date: date, content, muscles }).eq("id", editId);
    } else {
      await supabase.from("workout_logs").insert({ entry_date: date, content, muscles });
    }
    await fetchLogs();
    setShowForm(false);
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this workout entry?")) return;
    await supabase.from("workout_logs").delete().eq("id", id);
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  if (loading) return <div className="text-gray-500 text-center pt-20">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Workout</h1>
        <button
          onClick={openNew}
          className="bg-indigo-600 active:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Muscle map */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-5">
        <MuscleDiagram intensity={muscleIntensity} />

        <div className="mt-3">
          <div
            className="h-2 rounded-full"
            style={{ background: `linear-gradient(to right, ${mixColor(1)}, ${mixColor(0)})` }}
          />
          <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
            <span>Today</span>
            <span>{FADE_DAYS}+ days ago</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-4">
          {MUSCLE_GROUPS.map(g => {
            const last = muscleLastDate[g.key];
            return (
              <div key={g.key} className="bg-gray-800/60 rounded-lg px-2 py-1.5 text-center">
                <p className="text-[10px] text-gray-400 truncate">{g.label}</p>
                <p
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: last ? textColor(muscleIntensity[g.key]) : "#6b7280" }}
                >
                  {last ? format(parseISO(last), "MMM d") : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form bottom sheet / modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editId ? "Edit entry" : "New workout entry"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 text-xl leading-none p-1">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-base focus:outline-none focus:border-indigo-500"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">What you did *</label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-base focus:outline-none focus:border-indigo-500 min-h-[120px] resize-y"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={"e.g.\n35min treadmill\n2 sets chest press\n2 sets pull (back work)"}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wide">Muscles worked</label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map(g => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => toggleMuscle(g.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95
                        ${muscles.includes(g.key)
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400"
                        }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl text-sm transition-colors active:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !content.trim()}
                className="flex-1 bg-indigo-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors active:bg-indigo-700"
              >
                {saving ? "Saving…" : editId ? "Save" : "Add entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {logs.map(log => (
          <div
            key={log.id}
            className="bg-gray-900 border border-gray-700 rounded-xl p-3.5"
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                {format(parseISO(log.entry_date), "EEE, MMM d")}
              </p>
              <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                <button
                  onClick={() => openEdit(log)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 active:bg-gray-700 transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => remove(log.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 active:bg-gray-700 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">{log.content}</p>
            {log.muscles?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {log.muscles.map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {MUSCLE_GROUPS.find(g => g.key === m)?.label ?? m}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {logs.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <p className="text-4xl mb-3">🏋️</p>
          <p>No workout entries yet. Tap + Add above.</p>
        </div>
      )}
    </div>
  );
}
