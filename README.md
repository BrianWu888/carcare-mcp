# CarCare MCP

CarCare MCP is a small WebMCP Challenge demo: a vehicle maintenance dashboard for a 2011 Toyota Sienna where a human can review service history, and an AI agent can use explicit WebMCP tools to add service records and calculate upcoming maintenance.

## Why WebMCP

Traditional browser agents must inspect the page and guess which fields or buttons to use. CarCare MCP exposes structured tools directly from the web app with `document.modelContext.registerTool`, so the agent can complete a full maintenance workflow reliably:

> My Sienna just got an oil change at 165,200 miles. Add it to my maintenance history and tell me when the next one is due.

The agent can call:

1. `get_vehicle()`
2. `add_maintenance_record({ service: "Engine Oil", mileage: 165200, date: "2026-09-03" })`
3. `calculate_next_service({ service: "Engine Oil" })`

The website updates immediately and reports the next oil service at **170,200 miles**.

## WebMCP tools

- `get_vehicle()` — returns year, make, model, engine, and mileage.
- `get_maintenance_history()` — returns maintenance records sorted by recent mileage.
- `add_maintenance_record(service, mileage, date, notes)` — adds or updates a service record and refreshes the dashboard.
- `calculate_next_service(service)` — calculates next mileage and due status for a service.
- `search_maintenance_records(query)` — searches records by service, mileage, date, or notes.

## Demo data

- Vehicle: 2011 Toyota Sienna, 3.5L V6, 165,200 miles
- Maintenance:
  - Transmission Fluid — 160,000 miles
  - Engine Oil — 163,000 miles
  - Air Filter — 155,000 miles
  - Brake Pads — 150,000 miles

## Run locally

```bash
npm install
npm test
npm run serve
```

Then open <http://127.0.0.1:4173/>.

## Test WebMCP

Use a WebMCP-capable browser/client:

- ChatGPT in-app browser, or
- Chrome with `chrome://flags/#enable-webmcp-testing` enabled.

Suggested demo prompts:

```text
Show me my maintenance history.
```

```text
My Sienna just got an oil change at 165,200 miles on September 3, 2026. Add it to my maintenance history and tell me when the next oil change is due.
```

```text
What maintenance should I do next?
```

## Deployment

This is a static app. Deploy the repository root to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

For quick local static hosting:

```bash
python3 -m http.server 4173
```

## Demo video outline

- 0:00 — Problem: people forget car maintenance.
- 0:20 — Show the normal maintenance dashboard.
- 0:40 — Ask ChatGPT/WebMCP agent to add an oil change.
- 1:10 — Show the website updated automatically.
- 1:30 — Ask what maintenance is coming next.
- 2:00 — Explain the WebMCP tools and why they are better than button guessing.

## Devpost short description

CarCare MCP is an agent-native vehicle maintenance dashboard. It lets people track car service history while exposing WebMCP tools so AI agents can read vehicle records, add new maintenance, search history, and calculate next service intervals without guessing UI controls.

## License

MIT
