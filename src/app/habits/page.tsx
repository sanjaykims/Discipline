"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Habit } from "@/lib/types";

const COLORS = ["#6366f1", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#f97316", "#14b8a6", "#ef4444", "#64748b"];
const ICONS = ["⭐", "💪", "💧", "📵", "📚", "🌙", "🥗", "📝", "🏃", "🧘", "🎯", "🔥", "✍️", "😴", "🚫", "🎨"];

type FormState = { name: string; description: string; color: string; icon: string };
const EMPTY: FormState = { name: "", description: "", color: "#6366f1", icon: "⭐" };

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchHabits() {
    const { data } = await supabase.from("habits").select("*").order("created_at");
    if (data) setHabits(data);
    setLoading(false);
  }

  useEffect(() => { fetchHabits(); }, []);

  function openNew() { setForm(EMPTY); setEditId(null); setShowForm(true); }

  function openEdit(h: Habit) {
    setForm({ name: h.name, description: h.description ?? "", color: h.color, icon: h.icon });
    setEditId(h.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("habits").update({ ...form }).eq("id", editId);
    } else {
      await supabase.from("habits").insert({ ...form });
    }
    await fetchHabits();
    setShowForm(false);
    setSaving(false);
  }

  async function toggleActive(h: Habit) {
    await supabase.from("habits").update({ is_active: !h.is_active }).eq("id", h.id);
    setHabits(prev => prev.map(x => x.id === h.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function remove(id: string) {
    if (!confirm("Delete this habit and all its history?")) return;
    await supabase.from("habits").delete().eq("id", id);
    setHabits(prev => prev.filter(h => h.id !== id));
  }

  if (loading) return <div className="text-gray-500 text-center pt-20">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Habits</h1>
        <button
          onClick={openNew}
          className="bg-indigo-600 active:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Form bottom sheet / modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editId ? "Edit habit" : "New habit"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 text-xl leading-none p-1">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">Name *</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-base focus:outline-none focus:border-indigo-500"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Meditate"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">Note</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-base focus:outline-none focus:border-indigo-500"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional reminder"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wide">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all active:scale-95
                        ${form.icon === ic ? "bg-indigo-600 ring-2 ring-indigo-400" : "bg-gray-800"}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wide">Color</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-9 h-9 rounded-full transition-all active:scale-95
                        ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
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
                disabled={saving || !form.name.trim()}
                className="flex-1 bg-indigo-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors active:bg-indigo-700"
              >
                {saving ? "Saving…" : editId ? "Save" : "Add habit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {habits.map(h => (
          <div
            key={h.id}
            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all
              ${h.is_active ? "bg-gray-900 border-gray-700" : "bg-gray-900/40 border-gray-800"}`}
          >
            {/* Icon — tap to toggle active */}
            <button
              onClick={() => toggleActive(h)}
              className="shrink-0 active:scale-90 transition-transform"
              title={h.is_active ? "Pause habit" : "Resume habit"}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all
                  ${h.is_active ? "" : "opacity-30 grayscale"}`}
                style={{ backgroundColor: h.color + "22", border: `2px solid ${h.color}` }}
              >
                {h.icon}
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${h.is_active ? "" : "text-gray-500"}`}>{h.name}</p>
              {h.description && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{h.description}</p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => openEdit(h)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 active:bg-gray-700 transition-colors"
              >
                ✏️
              </button>
              <button
                onClick={() => remove(h.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 active:bg-gray-700 transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {habits.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <p className="text-4xl mb-3">📋</p>
          <p>No habits yet. Tap + Add above.</p>
        </div>
      )}
    </div>
  );
}
