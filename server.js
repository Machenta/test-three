import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";

function loadDotenv(path = ".env") {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotenv();

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4000);
const serviceId = process.env.SERVICE_ID || "x4-test-three";
const displayName = process.env.SERVICE_NAME || "X4 Test Three";
const themeColor = process.env.THEME_COLOR || "#7c3aed";
const message = process.env.SERVICE_MESSAGE || "Hello from test three";
const featureBadge = "Feature workspace: leaf response updated; X4 linked issue smoke marker for test-three via test-one #10";

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body, null, 2));
}

function html() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${displayName}</title>
    <style>
      body { margin: 0; min-height: 100vh; font-family: Inter, system-ui, sans-serif; color: #f5f3ff; background: ${themeColor}; }
      main { max-width: 720px; padding: 48px; }
      section { background: rgba(17,24,39,0.72); border-radius: 8px; padding: 24px; }
      code { background: rgba(255,255,255,0.16); padding: 3px 6px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>${displayName}</h1>
        <p>${message}</p>
        <p><strong>${featureBadge}</strong></p>
        <p>This service has no downstream peer. Its API is <code>/api/status</code>.</p>
      </section>
    </main>
  </body>
</html>`;
}

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/health") return json(response, 200, { ok: true, serviceId });
  if (url.pathname === "/api/status") return json(response, 200, { serviceId, displayName, themeColor, message, featureBadge, peers: [] });
  if (url.pathname === "/api/flow") return json(response, 200, { serviceId, displayName, featureBadge, peers: [] });
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html());
}).listen(port, host, () => {
  console.log(`${serviceId} listening on ${host}:${port}`);
});
