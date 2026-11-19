# The Home Bar

A browser-local React and TypeScript beta, built with Vite.

## Use the beta

Open [The Home Bar](https://aetuzun.github.io/bar/) to manage your own inventory. Edit a row to confirm ownership or change its status. The Planned section holds purchases until you mark them available or low. Match the ingredient type when adding a substitute bottle. Recipe availability includes ice and excludes optional garnishes. Low stock counts as usable.

In Recipes, use the circle beside Menu to select ready drinks. Measures retain the original millilitres and show approximate ounces using 30 ml per oz, rounded to two decimal places. In Menu, edit the title, arrange the selection, and choose Publish. Resolve any missing ingredients or remove unavailable drinks first. Copy guest link shares the last published snapshot, including its title. Changes require publishing and sharing a new link. Older links keep working. The [public demo](https://aetuzun.github.io/bar/#guest) opens a seeded four-drink menu.

Browser storage is specific to the browser, device and site. Clearing site data removes edits. All visitors start with example inventory. Public guest views read only the snapshot title and allowlisted library recipe IDs in order. Legacy links use the title Menu. Browser-local V1 inventory migrates to the new categories with its existing IDs, kinds and statuses. The beta has no accounts, shared inventory, private notes, or server credentials.

## Run and update

Use Node 22.12+ and npm. Run `npm ci` followed by `npm run dev`. Run `npm run build` for type checking and the static output in dist. Use `npm run preview` to check that build.

Edit src/data.ts for the cocktail library, new-browser seed inventory and public demo selection. Keep public recipe IDs stable for shared links. Existing browser inventories retain their edits. src/store.ts owns persistence and snapshot decoding. A future shared backend should authenticate managers, authorize their writes on the server, and expose only explicitly published recipe projections to guests.

Set Settings → Pages → Source to GitHub Actions. Push changes to main to build and deploy through .github/workflows/pages.yml. Check the Deploy The Home Bar workflow for the deployment result.
