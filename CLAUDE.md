# Populator (Figma plugin)

Fills the selected layers with data, in place: one record per selected layer,
in reading order (order in an auto-layout parent, otherwise top to bottom,
then left to right). Extra records are unused and extra layers are left as
they were. It makes copies only for a selected auto-layout frame named `@...`
(below), never otherwise. Values go into text layers whose names match the
mapped fields, and into layers named with the syntax below.

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
set a font size on `html`. The tab body (`.tab`) is the only vertical
scroller, its scrollbar at the window edge and Populate sticky at its
bottom; never give a section inside it its own `overflow-y`.

## Modes (tabs in ui.html)

- **Manual**: one item per line, written into the first text layer.
- **Google Sheet**: a sheet URL (with optional `#gid=` for a tab), fetched as
  CSV through gviz. The first row is the column names.
- **JSON API**: any URL that returns JSON. The plugin finds every list of
  objects in the response; when there is more than one it shows a List
  dropdown and opens the longest. When another list groups the records
  (`findFacet`: its `code`/`slug`/`key`/`id`/`value` matches a record field
  on every record, like `categories[].code` and `products[].category`), a
  picker shows "All" plus each group with its title, icon (`iconUrl`, drawn
  as a CSS mask so it follows the theme) and count. Picking one re-reads the
  saved URL with `?<field>=<code>` and keeps only matching records, so a
  server that ignores the parameter still works. The pick saves as
  `apiFacet`; the saved URL stays the unfiltered one. A list that only
  groups another (categories) is left out of the List dropdown
  (`recordLists`) but still feeds the picker and `// name` layers. Numbers
  only match in fields named like `category_id`, since `categories[].count`
  happened to line up with `products[].id`. The picker menu has a search box
  (Enter picks the first match, arrows move) that ignores Arabic/Persian
  letter forms and the zero-width non-joiner. The picked list path is saved as `apiListPath`.
  Before this, it took the FIRST array, which broke on responses like
  `{ categories: [...], products: [...] }`.

Field-to-layer mapping auto-matches when a field name equals a layer name
(case-insensitive). A field that a selected layer's name already binds
(`boundFields` in selection-state) shows "Linked" instead of a dropdown.
The mapping dropdowns and the category picker are one component,
`makePicker` in ui.html: a button like `.select` opening Figma's dark menu
with a search box (Enter picks the first match, arrows move, Escape or a
click outside closes, only one open at a time, opens upward when there is no
room below). `readMapping` reads `data-field` / `data-value` off the pickers.

Under a fetched sheet or API, the mapping and the data preview are two tabs
(`.subtabs`: "Data mapping" and "Preview"); the table
grows with the window. The data preview table sets `font: inherit` because Figma can load the UI in
quirks mode, where tables fall back to 16px instead of the body's 11px.

## Layer-name syntax (Sheet and API modes)

Covers every feature in Google Sheets Sync's docs (docs.sheetssync.app) plus
Spreadsheet Sync's variants, strokes and text placeholders. `parseName` and
`fillNode` in code.js; the full reference is the comment above `parseName`.

- `{field}` or `#field` binds a layer. A text layer gets the value as text,
  any other layer reads it as a special value (below), and a boolean shows or
  hides any layer. On an instance, `Size=Large, State=Default` sets variants
  and a component name swaps it. A field can be a dot path (`colors.0.hex`,
  `colors.length`); several bindings can share a name.
- `{Property:field}` on an instance sets a component property: boolean (on
  when filled, off for empty, false, `no`, `hide`, `[]`), variant (matched to
  an option), text, or instance swap (preferred values, then local
  components). On any layer, `visible`, `hidden`, `fill`, `stroke`, `opacity`,
  `image` and `text` work as property names, e.g. `{visible:discountPercent}`.
- Special values (Google Sheets Sync): `Show`, `Hide`, `#hex` fill,
  `2|#hex` stroke, `50%` opacity, `100s`/`100w`/`100h` size, `20x`/`40y`,
  `20xx`/`40yy` page position, `30º` rotation, `text-align:`,
  `text-align-vertical:`, `font-size:`, `line-height:`, `letter-spacing:`,
  and an image URL. Several per value, split by spaces or commas. Text layers
  and instances need a leading `/` (`/Hide`) so text is never misread.
- Images are fetched by code.js. PNG, JPEG and GIF go straight to
  `figma.createImage`; WebP (what Digikala's CDN serves), AVIF, SVG and
  anything over 4096px are redrawn as PNG by a canvas in the UI
  (`convert-image` message). An existing image fill keeps its scale mode.
- Indexes: `{field}.3` / `#field.x` per binding, or a trailing ` .3` on a
  layer for it and its children. `.n` next (default), `.i` next with the field
  filled, `.x`/`.rand` random, `.r` random with the field filled,
  `.randsave` one random record per target.
- `// name` on a layer, a frame above it or the page picks another list: an
  API list path (last segment is enough) or a sheet tab, which the UI fetches
  by name through gviz `&sheet=` on Populate (`listNames` in selection-state).
- `@` at the start of a selected auto-layout frame: its first child is
  duplicated until there is one child per record, then each child is filled.
- `-` at the start skips the layer and its children; main components, selected
  or inside the selection, are skipped unless named with a leading `+`, and
  a selection of only main components leaves Populate disabled.
- Text whose content holds `{field}` placeholders is filled in place; the
  original is kept in plugin data (`template`, `filled`) so a second run still
  works, unless the text was edited since.
- Names match loosely (case, spaces, symbols, the `#id` suffix on property
  keys ignored). Properties apply top down before children are read, because
  a variant or swap replaces the layers inside. Misses are skipped and named
  in the notify toast; a run that changes nothing says so.

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
intact. A saved URL opens locked (disabled field, quiet Edit inside it, no
button beside it) and is read at once on every launch, so there is no
Refresh; Edit brings back Save. Edit puts the caret at the
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
  separate `/categories` route. Products also carry `stock` (only when
  Digikala reports low stock; missing means not sent, not out of stock) and
  `isAd` (always present). The Product Card binds them as `{Ads:isAd}` on
  the title instance and `{visible:stock}` on List View's `middle-label`,
  whose text should read `{stock} عدد در انبار باقی‌مانده` (the Digikala
  font is not available to the Figma MCP, so that text is edited by hand).
- Gotcha: a layer renamed only as an override inside an instance loses that
  name when the plugin switches the instance's variant, because the new
  variant brings its own layers. So `{title}` and `ads-label` are named in
  the `Product Card/Title` component set's variants themselves, not only in
  the Product Card. Name binding layers in the component that owns them
  whenever a variant property is also bound.
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
