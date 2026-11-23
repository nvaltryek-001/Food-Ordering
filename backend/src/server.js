import { loadEnv } from "./lib/env.js";
loadEnv();
const { createApp } = await import("./app.js");

const PORT = Number(process.env.PORT || 5000);
const { server } = createApp();

server.listen(PORT, () => {
  console.log(`\n🍛  FoodSense AI running → http://localhost:${PORT}`);
  console.log(`    API health          → http://localhost:${PORT}/api/health`);
  console.log(`    Admin login         → admin@foodsense.ai / admin123\n`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
    server.closeAllConnections?.();
  });
}
