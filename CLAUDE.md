# Populator (Figma plugin)

Fills copies of a selected instance or component with data. It clones the
selection once per record, stacks the clones vertically, and writes values into
text layers whose names match the mapped fields.

Plain JS, no build step: `manifest.json`, `code.js` (sandbox), `ui.html` (UI,
inline CSS and script). Load it in Figma via Plugins > Development > Import
plugin from manifest.

The UI looks like Figma's own UI3, the same look as
`~/Documents/GitHub/figma-variable-studio`: Figma's `--color-*` tokens
(resolved from that repo's captured `src/ui/figma.css`; light on `:root`,
dark on `html.figma-dark`), its Inter build subset to Latin with the weight
axis kept and inlined as base64, and UI3 geometry (24px inputs and md
buttons, 32px lg Populate, 5px radius, 11/16 type at 450 and 550, dialog
style tabs). Type sizes are rem against the browser's 16px root, so never
set a font size on `html`.

## Modes (tabs in ui.html)

- **Manual**: one item per line, written into the first text layer.
- **Google Sheet**: a sheet URL (with optional `#gid=` for a tab), fetched as
  CSV through gviz. The first row is the column names.
- **JSON API**: any URL that returns JSON. The plugin finds every list of
  objects in the response; when there is more than one it shows a tab per
  list and opens the longest. The picked list path is saved as `apiListPath`.
  Before this, it took the FIRST array, which broke on responses like
  `{ categories: [...], products: [...] }`.

Field-to-layer mapping auto-matches when a field name equals a layer name
(case-insensitive). Only text layers are filled; image fills are not supported
yet.

## Networking: what is and is not possible

- Every fetch goes through `code.js` (`fetch-url` message, `fetchViaPlugin` in
  the UI). The UI iframe has a `null` origin.
- **CORS still decides.** An endpoint must send `Access-Control-Allow-Origin`
  or the plugin cannot read it. Verified 2026-10-13:
  - `api.digikala.com` sends NO CORS header, so the plugin cannot call
    Digikala directly. Only Digikala's API team adding the header would change
    that.
  - `dkstatics-public.digikala.com` (product images) sends
    `access-control-allow-origin: *`, so image URLs can be used as they are.
- The Sheets tab currently routes through five PUBLIC CORS proxies
  (codetabs, corsproxy.io, allorigins, cors.sh, thingproxy) listed in
  `proxied()` in ui.html. They see the sheet URL. This is undisclosed in the
  manifest and a likely Community review problem; it is not resolved yet.
- `proxy/` holds an old Cloudflare Worker (`worker.js`, `wrangler.toml`) that
  the UI no longer uses.

## Design rule: server agnostic

The plugin must never hardcode a private server. The user types the endpoint
into the JSON API tab and it is saved per user in `figma.clientStorage`
(`populator-inputs`). That is what lets it be published publicly while the
owner points it at a private endpoint.

The sheet URL, tab and list path save on every change, with no debounce. The
API URL does not: it follows compliance-audit's "connect, verify, lock"
(`connectApi` in ui.html). Only a URL that answered with at least one record
is saved; a rejected one leaves the saved URL and the last good preview
intact. A saved URL opens locked (disabled field, quiet Edit inside it,
Refresh beside it) and is read at once on launch. Edit puts the caret at the
end, never select-all; Escape restores the saved URL; Enter connects. The
field freezes on "Checking…". Success is only a green dot left of the
label (amber while checking, red on a failed read), with no count or text;
the line under the field shows errors only. A bare
"Failed to fetch" is explained as the likely missing CORS header.

The restore is a handshake: the
UI posts `ui-ready` once its message listener exists and `code.js` replies with
`restore-inputs`. Never post the restore at launch, because the UI may not be
listening yet. The window resizes from an invisible bottom-right corner area
with no grip icon.

This is the same pattern as Pooya's other plugins in `~/Documents/GitHub`;
copy from them rather than inventing:

- `figma-uikit-catalog`: closest model. `code.js` owns the saved URL, and a
  public sample URL (`sirpooya/catalog-public-api` on GitHub) is prefilled so
  the plugin works for anyone, including Figma reviewers. Manifest uses
  `"allowedDomains": ["*"]` with a reasoning line.
- `figma-instance-migrator`: same, plus a "what should my endpoint return?"
  docs link, and it locks the URL once it answers with valid data.
- `figma-manshur-theme-builder`: recipe from any user URL; the manifest states
  nothing from the document is sent.
- `dds-dashboard/figma-plugins/compliance-audit`: private variant, empty
  default, one API base set in Settings, nothing fetched until set.

### Still to do before a Community release

- Add a public sample endpoint (a generic `sample-products.json` with made-up
  data, not Digikala's) to the `catalog-public-api` repo, and prefill it.
  That repo is outside this one: ask before editing it.
- Rewrite the manifest `reasoning` (it still mentions a CORS proxy).
- Decide what happens to the public CORS proxies in the Sheets tab.

## Private data source: Digikala mock products (dds-dashboard)

Product-card mock data is served by the DDS dashboard (separate repo,
`~/Documents/GitHub/dds-dashboard`), not by this plugin.

- Endpoint: `GET /api/figma/mock-products` (local dev:
  `http://localhost:3370/api/figma/mock-products`). Params: `category`
  (comma-separated codes), `limit` (default 20, max 100), `random=1`.
  It sends `Access-Control-Allow-Origin: *` and handles `OPTIONS`.
- Response: `{ currency: "toman", categories: [...], products: [...],
  lastSyncedAt }`. `categories[]` carries `code`, `title`, `count` and an
  `iconUrl` (`/api/figma/mock-products/icons/<name>.svg`). There is no
  separate `/categories` route.
- Data comes from a laptop crawl (`digikala:push` in dds-dashboard) into
  Postgres. The Alamut prod pod has NO external egress, so it can neither
  proxy nor crawl Digikala; it only serves what the laptop pushed.
- Digikala prices are in rial; the dashboard converts to toman.
- Do not edit dds-dashboard from this repo without asking. Its `.env.local`
  `DATABASE_URL` points at PRODUCTION Postgres, so its local dev server reads
  and writes prod.
- Known issue (2026-10-13): the endpoint returned 500 because dds-dashboard's
  uncommitted schema expects `mock_products.subcategory_code` /
  `subcategory_title_fa` from migration `0038`, which prod has not applied.

## Conventions

- pnpm only if packages are ever added; never npm or yarn.
- No em dashes or spaced en dashes in prose, UI copy, comments or commits.
- Ask before touching any repo other than this one.
