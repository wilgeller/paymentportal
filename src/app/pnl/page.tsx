"use client";

import { useState } from "react";
import { PnlDashboard } from "./pnl-dashboard";

export default function PnlPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-black">
              P&L Viewer
            </h1>
            <p className="mt-1 text-sm text-black/50">
              Enter the password to view financials.
            </p>
            <form
              className="mt-6 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                setAuthed(true);
              }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm text-black outline-none placeholder:text-black/30 focus:border-brand focus:ring-1 focus:ring-brand"
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-brand-dark"
              >
                View P&L
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <PnlDashboard password={password} onAuthError={() => { setAuthed(false); setError("Invalid password"); }} />;
}
