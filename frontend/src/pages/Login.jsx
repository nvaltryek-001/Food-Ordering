import { useState } from "react";
import { navigate } from "../lib/router.jsx";
import { useApp } from "../lib/store.jsx";
import { api } from "../lib/api.js";
import { Icon } from "../components/icons.jsx";
import { Field } from "../components/ui.jsx";

const DEMO = [
  { label: "Restaurant admin", email: "admin@foodsense.ai", password: "admin123", to: "/admin" },
  { label: "Kitchen staff", email: "kitchen@foodsense.ai", password: "kitchen123", to: "/kitchen" },
  { label: "Diner", email: "guest@foodsense.ai", password: "guest123", to: "/menu" },
];

export default function Login() {
  const { user, signIn, signOut, toast } = useApp();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const go = (u) => navigate(u.role === "admin" ? "/admin" : u.role === "kitchen" ? "/kitchen" : "/menu");

  const submit = async (e, override) => {
    e?.preventDefault();
    const body = override || form;
    setBusy(true); setErrors({}); setMessage(null);
    try {
      const data = await api(mode === "signup" && !override ? "/auth/register" : "/auth/login", { method: "POST", body });
      signIn(data);
      toast(`Signed in as ${data.user.name}`, "success");
      go(data.user);
    } catch (err) {
      setErrors(err.details || {});
      setMessage(err.message);
    } finally { setBusy(false); }
  };

  if (user) {
    return (
      <div className="container auth">
        <div className="panel auth-card">
          <span className="avatar" aria-hidden="true">{user.name[0]}</span>
          <h1 className="page-title">{user.name}</h1>
          <p className="muted">{user.email} · {user.role === "customer" ? "Diner" : user.role === "admin" ? "Restaurant admin" : "Kitchen staff"}</p>
          <div className="stack">
            <button className="btn btn-primary btn-block" onClick={() => go(user)}>Continue</button>
            <button className="btn btn-ghost btn-block" onClick={() => { signOut(); toast("Signed out"); }}><Icon name="logout" size={18} /> Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth">
      <form className="panel auth-card" onSubmit={submit} noValidate>
        <div className="segmented segmented-block" role="tablist">
          <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "is-on" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "is-on" : ""} onClick={() => setMode("signup")}>Create account</button>
        </div>
        <h1 className="page-title">{mode === "signin" ? "Welcome back" : "Save your orders"}</h1>
        <p className="muted">{mode === "signin" ? "Sign in to see your orders on any device." : "You can always order as a guest — an account just keeps your history."}</p>
        {mode === "signup" && (
          <Field label="Name" error={errors.name} id="au-name"><input id="au-name" value={form.name} onChange={set("name")} autoComplete="name" /></Field>
        )}
        <Field label="Email" error={errors.email} id="au-email"><input id="au-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" /></Field>
        <Field label="Password" error={errors.password} hint={mode === "signup" ? "At least 6 characters" : null} id="au-pass">
          <input id="au-pass" type="password" value={form.password} onChange={set("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </Field>
        {message && <p className="form-error" role="alert">{message}</p>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? <span className="spinner" /> : mode === "signin" ? "Sign in" : "Create account"}</button>

        <div className="demo-accounts">
          <p className="muted small">Exploring the demo? Sign in as:</p>
          <div className="row gap-8 wrap">
            {DEMO.map((d) => (
              <button key={d.email} type="button" className="chip-btn" onClick={() => { setMode("signin"); setForm({ ...form, email: d.email, password: d.password }); submit(null, { email: d.email, password: d.password }); }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
