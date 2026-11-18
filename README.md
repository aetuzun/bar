# The Home Bar

A browser-local React and TypeScript beta, built with Vite.

## Use the beta

Open [The Home Bar](https://aetuzun.github.io/bar/) to manage your own inventory. Edit a row to confirm ownership or change its status. The Planned section holds purchases until you mark them available or low. Match the ingredient type when adding a substitute bottle. Recipe availability includes ice and excludes optional garnishes. Low stock counts as usable.

In Recipes, filter the library and add cocktails to your menu. In Menu, reorder, remove, and preview the draft. Publish menu creates a shareable snapshot. Copy its link for guests. Changes require publishing and sharing a new link. Older links keep working. The [public demo](https://aetuzun.github.io/bar/#guest) opens a seeded four-drink menu.

Browser storage is specific to the browser, device and site. Clearing site data removes edits. All visitors start with example inventory. Public guest views read only allowlisted library recipe IDs and their order. The beta has no accounts, shared inventory, private notes, or server credentials.

## Run and update

Use Node 22.12+ and npm. Run `npm ci` followed by `npm run dev`. Run `npm run build` for type checking and the static output in dist. Use `npm run preview` to check that build.

Edit src/data.ts for the cocktail library, new-browser seed inventory and public demo selection. Keep public recipe IDs stable for shared links. Existing browser inventories retain their edits. src/store.ts owns persistence and snapshot decoding. A future shared backend should authenticate managers, authorize their writes on the server, and expose only explicitly published recipe projections to guests.

Set Settings → Pages → Source to GitHub Actions. Push changes to main to build and deploy through .github/workflows/pages.yml. Check the Deploy The Home Bar workflow for the deployment result.
