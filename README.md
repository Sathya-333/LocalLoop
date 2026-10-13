# LocalLoop — prototype

## Run it

For the connected local API, open the project folder in a terminal and run `node server.js`, then visit `http://127.0.0.1:4173`. The root URL opens the original Stitch welcome/onboarding screen. The server uses only Node's built-in modules; no package install or account is needed. You can also open any screen's HTML file directly or with Live Server, where browser-side demo filtering remains available.

## Connected demo journeys

- **Explorer:** Welcome → role selection → home feed → search/category/radius filters → cafe details/menu or lake detail.
- **Business owner demo:** Role selection or the home feed’s “Owner Demo” controls → generic Sample Business insights. It is not connected to your business or account.
- **Community:** Home feed → campus community, where seeded posts can be searched, voted on and joined.

`server.js` provides read-only `/api/places`, `/api/posts`, `/api/analytics` and `/api/health` endpoints. The shared `localloop-demo.js` connects the Stitch screens to those endpoints and uses local browser storage for saved-place interactions. Distances and analytics are illustrative. This prototype does not use live GPS, PostGIS, a production database, authentication, payments or real merchant accounts. Original Stitch `index.html`, `code.html`, and reference image files are retained.
