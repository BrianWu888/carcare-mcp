# CarCare MCP

CarCare MCP is a small WebMCP Challenge demo: a vehicle maintenance dashboard for a 2011 Toyota Sienna where a human can review service history, and an AI agent can use explicit WebMCP tools to add or edit service records and calculate upcoming maintenance.

## Why WebMCP

Traditional browser agents must inspect the page and guess which fields or buttons to use. CarCare MCP exposes structured tools directly from the web app with `document.modelContext.registerTool`, so the agent can complete a full maintenance workflow reliably:

> My Sienna just got an oil change at 169,500 miles. Add it to my maintenance history and tell me when the next one is due.

The agent can call:

1. `get_vehicle()`
2. `add_maintenance_record({ service: "Engine Oil", mileage: 169500, date: "2026-09-04" })`
3. `edit_maintenance_record({ id: "engine-oil-169500-2026-09-04", notes: "Synthetic oil and filter" })`
4. `calculate_next_service({ service: "Engine Oil" })`

The website updates immediately and reports the next oil service at **174,500 miles**.

## WebMCP tools

- `get_vehicle()` — returns year, make, model, engine, and mileage.
- `get_maintenance_history()` — returns maintenance records sorted by recent mileage.
- `add_maintenance_record(service, mileage, date, notes)` — adds or updates a service record and refreshes the dashboard.
- `edit_maintenance_record(id, service, mileage, date, notes)` — edits an existing maintenance record by id and refreshes the dashboard.
- `calculate_next_service(service)` — calculates next mileage and due status for a service.
- `search_maintenance_records(query)` — searches records by service, mileage, date, or notes.

## Demo data

- Vehicle: 2011 Toyota Sienna, 3.5L V6, 165,200 miles
- Maintenance:
  - Transmission Fluid — 160,000 miles
  - Engine Oil — 163,000 miles
  - Air Filter — 155,000 miles
  - Brake Pads — 150,000 miles

## Storage model

CarCare MCP is intentionally backend-free for the demo. It stores records in the current browser profile's `localStorage` under `carcare-mcp-state-v1`.

- Persists after page refresh and normal browser restart.
- Does not sync across devices, browsers, or Chrome profiles.
- Can be restored to the seeded Toyota Sienna history with the **Reset demo data** button.
- Keeps the WebMCP workflow privacy-friendly and easy to judge without database credentials.

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
Look up my vehicle, review the maintenance history, then add one combined visit record: I changed the engine oil at 2026-09-05 at 175,500 miles using 0W-20 full synthetic oil and Tire Rotation. Add this to my maintenance history, keep same-date same-mileage services together, and tell me when the next oil change and tire rotation are due.
```

```text
Show me my maintenance history.
```

```text
My Sienna just got an oil change at 169,500 miles on September 4, 2026. Add it to my maintenance history and tell me when the next oil change is due.
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

CarCare MCP is an agent-native vehicle maintenance dashboard. It lets people track car service history while exposing WebMCP tools so AI agents can read vehicle records, add or edit maintenance, search history, and calculate next service intervals without guessing UI controls.

## License

MIT
