const required = ["REACT_APP_FRONTEND_URL", "REACT_APP_BACKEND_URL"];

const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === "");

if (missing.length) {
  // Keep this script dependency-free and very explicit.
  console.error("[e2e env] Missing required environment variables:");
  for (const k of missing) console.error(`- ${k}`);
  console.error("");
  console.error("Provide these via your CI environment or a local .env file.");
  console.error("See .env.example for the expected variables.");
  process.exit(1);
}

console.log("[e2e env] OK");
process.exit(0);
