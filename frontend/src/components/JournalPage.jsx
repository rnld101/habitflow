import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function JournalPage({ token }) {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function load() {
    const res = await api.listJournals(token);
    setEntries(res);
  }

  useEffect(() => {
    load();
  }, []);

  async function addEntry(e) {
    e.preventDefault();
    await api.createJournal({ title, content }, token);
    setTitle("");
    setContent("");
    load();
  }

  async function editEntry(entry) {
    const newTitle = window.prompt("Edit title", entry.title);
    if (!newTitle) return;
    const newContent = window.prompt("Edit content", entry.content);
    if (!newContent) return;
    await api.updateJournal(entry.id, { title: newTitle, content: newContent }, token);
    load();
  }

  async function removeEntry(id) {
    if (!window.confirm("Delete this entry?")) return;
    await api.deleteJournal(id, token);
    load();
  }

  return (
    <div className="card">
      <h2>Journal Timeline</h2>
      <form onSubmit={addEntry} className="journal-form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title" required />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your thoughts" required />
        <button>Add Entry</button>
      </form>
      <div className="timeline">
        {entries.map((entry) => (
          <div key={entry.id} className="timeline-item">
            <h3>{entry.title}</h3>
            <small>{new Date(entry.created_at).toLocaleString()}</small>
            <p>{entry.content}</p>
            <button className="small" onClick={() => editEntry(entry)}>Edit</button>
            <button className="small danger" onClick={() => removeEntry(entry.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
