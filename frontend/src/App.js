import React, { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import HabitDashboard from "./components/HabitDashboard";
import JournalPage from "./components/JournalPage";
import { api } from "./api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("habitflow_token"));
  const [tab, setTab] = useState("habits");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return;
    api.me(token)
      .then(setUser)
      .catch(() => logout());
  }, [token]);

  function onAuthed(nextToken) {
    localStorage.setItem("habitflow_token", nextToken);
    setToken(nextToken);
  }

  function logout() {
    localStorage.removeItem("habitflow_token");
    setToken(null);
    setUser(null);
  }

  if (!token) {
    return (
      <main className="container">
        <LoginPage onAuthed={onAuthed} />
      </main>
    );
  }

  return (
    <main className="container">
      <header className="card header-row">
        <div>
          <h1>HabitFlow</h1>
          <p>{user?.email}</p>
        </div>
        <div className="row">
          <button onClick={() => setTab("habits")}>Habits</button>
          <button onClick={() => setTab("journal")}>Journal</button>
          <button className="danger" onClick={logout}>Logout</button>
        </div>
      </header>
      {tab === "habits" ? <HabitDashboard token={token} /> : <JournalPage token={token} />}
    </main>
  );
}
