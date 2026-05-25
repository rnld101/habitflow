import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";

export default function HabitDashboard({ token }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [newHabit, setNewHabit] = useState("");
  const [data, setData] = useState({ habits: [], days: 30 });

  const monthName = useMemo(() => new Date(year, month - 1, 1).toLocaleString("default", { month: "long" }), [year, month]);

  async function load() {
    const res = await api.monthHabits(year, month, token);
    setData(res);
  }

  useEffect(() => {
    load();
  }, [year, month]);

  async function addHabit(e) {
    e.preventDefault();
    if (!newHabit.trim()) return;
    await api.createHabit({ name: newHabit }, token);
    setNewHabit("");
    load();
  }

  async function renameHabit(habit) {
    const name = window.prompt("Rename habit", habit.name);
    if (!name) return;
    await api.renameHabit(habit.habit_id, { name }, token);
    load();
  }

  async function removeHabit(habitId) {
    if (!window.confirm("Delete this habit?")) return;
    await api.deleteHabit(habitId, token);
    load();
  }

  async function toggle(habitId, day, current) {
    const d = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await api.trackHabit(habitId, { date: d, completed: !current }, token);
    load();
  }

  return (
    <div className="card">
      <h2>Habit Dashboard</h2>
      <div className="row">
        <label>Month:</label>
        <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
        <input type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <span>{monthName}</span>
      </div>
      <form onSubmit={addHabit} className="row">
        <input value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="Add habit" />
        <button>Add</button>
      </form>
      <div className="table-wrap">
        {data.habits.map((habit) => (
          <div key={habit.habit_id} className="habit-row">
            <div className="habit-name">
              <strong>{habit.name}</strong>
              <button className="small" onClick={() => renameHabit(habit)}>Rename</button>
              <button className="small danger" onClick={() => removeHabit(habit.habit_id)}>Delete</button>
            </div>
            <div className="grid">
              {habit.grid.map((entry) => (
                <button
                  key={entry.day}
                  className={`day ${entry.completed ? "done" : ""}`}
                  onClick={() => toggle(habit.habit_id, entry.day, entry.completed)}
                  title={`Day ${entry.day}`}
                >
                  {entry.completed ? "?" : "?"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
