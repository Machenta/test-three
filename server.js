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
const featureBadge = "Feature workspace: leaf response updated";
const counterCoordinatorUrl = (process.env.COUNTER_COORDINATOR_URL || "").replace(/\/$/, "");

let universalCounter = 0;

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function incrementUniversalCounter() {
  if (!counterCoordinatorUrl) {
    universalCounter += 1;
    return universalCounter;
  }
  const response = await fetch(`${counterCoordinatorUrl}/api/counter/increment`, { method: "POST" });
  const data = await response.json();
  universalCounter = data.count;
  return universalCounter;
}

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
      .counter-panel { display: flex; align-items: center; gap: 16px; margin: 16px 0; }
      .counter-value { font-size: 2rem; font-weight: 800; min-width: 3ch; }
      button.counter-btn {
        border: 0;
        border-radius: 6px;
        background: #dc2626;
        color: white;
        font-weight: 700;
        padding: 12px 16px;
        cursor: pointer;
      }
      button.counter-btn:hover { background: #b91c1c; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>${displayName}</h1>
        <p>${message}</p>
        <p><strong>${featureBadge}</strong></p>
        <div class="counter-panel">
          <p class="counter-value" id="counter-value">0</p>
          <button class="counter-btn" id="counter-btn" type="button">Increment universal counter</button>
        </div>
        <p>This service has no downstream peer. Its API is <code>/api/status</code>.</p>
      </section>
    </main>
    <script>
      const counterValue = document.getElementById("counter-value");

      async function refreshCounter() {
        const response = await fetch("./api/counter");
        const data = await response.json();
        counterValue.textContent = String(data.count);
      }

      document.getElementById("counter-btn").addEventListener("click", async () => {
        const response = await fetch("./api/counter/increment", { method: "POST" });
        const data = await response.json();
        counterValue.textContent = String(data.count);
      });

      refreshCounter();
      setInterval(refreshCounter, 1000);
    </script>
  </body>
</html>`;
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/health") return json(response, 200, { ok: true, serviceId });
  if (url.pathname === "/api/status") return json(response, 200, { serviceId, displayName, themeColor, message, featureBadge, peers: [] });
  if (url.pathname === "/api/flow") return json(response, 200, { serviceId, displayName, featureBadge, peers: [] });
  if (url.pathname === "/api/counter" && request.method === "GET") {
    return json(response, 200, { count: universalCounter, serviceId });
  }
  if (url.pathname === "/api/counter/increment" && request.method === "POST") {
    const count = await incrementUniversalCounter();
    return json(response, 200, { count, serviceId });
  }
  if (url.pathname === "/api/counter/sync" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (typeof body.count === "number") universalCounter = body.count;
    return json(response, 200, { count: universalCounter, serviceId });
  }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html());
}).listen(port, host, () => {
  console.log(`${serviceId} listening on ${host}:${port}`);
});
