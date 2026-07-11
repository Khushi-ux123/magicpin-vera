# magicpin-vera
VERA AI – A production-ready AI merchant engagement engine built for the Magicpin VERA AI Challenge. Uses merchant, customer, category, and trigger context to generate personalized, explainable, and high-impact engagement messages through scalable REST APIs.

## Deployment / Health checks

When deploying to Render (or similar hosts), ensure the TypeScript build runs so `dist/index.js` exists. The project includes a `postinstall` script that runs `npm run build` during install.

- Health endpoint: `/v1/healthz` — returns service status and uptime.
- Readiness endpoint: `/v1/readiness` — returns `ready: true` when basic checks (memory store) are healthy.
- Metadata: `/v1/metadata` — service metadata and version.

Render settings suggestion:

- Build Command: `npm ci && npm run build` or rely on `postinstall`.
- Start Command: `npm start` (which runs `node dist/index.js`).
- Health Check Path: `/v1/healthz`

Local quick checks:
```
npm install
npm run build
node dist/index.js
curl http://localhost:8080/v1/healthz
curl http://localhost:8080/v1/readiness
```
