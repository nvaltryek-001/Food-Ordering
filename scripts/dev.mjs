/** Runs the API (with --watch) and the frontend dev server together. Ctrl+C stops both. */
import { spawn } from "node:child_process";

const procs = [
  ["api", ["--prefix", "backend", "run", "dev"], "\x1b[32m"],
  ["web", ["--prefix", "frontend", "run", "dev"], "\x1b[33m"],
].map(([name, args, color]) => {
  const p = spawn(process.platform === "win32" ? "npm.cmd" : "npm", args, { stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  const tag = `${color}[${name}]\x1b[0m `;
  const pipe = (s, out) => s.on("data", (d) => out.write(d.toString().split("\n").filter(Boolean).map((l) => tag + l).join("\n") + "\n"));
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stderr);
  p.on("exit", (code) => { console.log(`${tag}exited (${code})`); shutdown(); });
  return p;
});

function shutdown() {
  for (const p of procs) if (!p.killed) p.kill();
  process.exit();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
