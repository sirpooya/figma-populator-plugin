# Figma Community research: data populator plugins

Collected on 2026-10-13 as input for publishing this plugin to the Figma
Community. Everything below comes from the live Community: names, taglines,
descriptions, tags, user counts, likes, prices and version history.

The raw data for every plugin profiled here, including its full description
text, is in [community-plugins.json](community-plugins.json).

## How it was gathered

- **46 searches** on the Community plugin search (populate, data, json, api,
  rest api, json api, endpoint, fetch data, google sheets, airtable, csv,
  notion, cms, dynamic data, real data, live data, data sync, bind data, mock
  data, fake data, content reel, and more). That returned **1,300 unique
  plugins**.
- Filtered by hand to the **53 plugins** that actually put data into layers.
  Code exporters, chart makers, icon packs and table generators were dropped.
- Each plugin's Community page was rendered to read what search does not
  return: tags, the full About text and version history.
- User counts are Figma's own "users" number on the day of collection. Figma's
  `created_at` field is a 2024 migration timestamp for almost every plugin, so
  age is judged from version history instead.

## The market at a glance

**Biggest plugins in the space (by users)**

| Plugin | Users | What it is |
|---|--:|---|
| Lorem Ipsum by ‹div›RIOTS | 1,218,237 | Placeholder text, images and fake data |
| Content Reel | 1,124,752 | Shared libraries of text, images, icons |
| Google Sheets Sync | 222,682 | Sheets to layers by `#Column` name |
| CopyDoc Text & Image Sync | 127,717 | Text import and export via XLSX, CSV, JSON |
| JSON to Figma | 91,646 | JSON file or URL to layers ($17 one-time) |
| Contento | 58,252 | Your own content libraries, matched by layer name |
| data.to.design by ‹div›RIOTS | 42,404 | Sheets, CSV, JSON, Airtable, Notion, API to layers |

**The direct lane (any URL, API or JSON)** has only two big players: JSON to
Figma (92k, paid) and data.to.design (42k, free, cross-promoted from the 1.2M
user Lorem Ipsum plugin). After them come JSON → Content (17k), GraphQL Data
Fill (13k), Data Sync (8k), Data Populator (6.6k) and JSON Populate (6.5k).

**Most of the direct lane is abandoned.**

| Plugin | Users | Last update |
|---|--:|---|
| GraphQL Data Fill | 12,867 | Dec 2019 (only version) |
| Data Populator | 6,565 | Feb 2020 |
| JSON Populate | 6,510 | Jan 2020 |
| My Mock Data | 1,848 | Jun 2020 |
| TEMPLATE & TABLE GENERATOR FROM API | 4,326 | Sep 2020 |
| Airtable to Figma | 8,661 | Nov 2020 (says "not actively maintained") |
| Data Sync | 8,053 | May 2022 |
| JSON → Content | 17,086 | Oct 2022 |

Data Populator's own demo data source (`api.myjson.com`) is a dead service, so
its "try it out" steps no longer work.

**New entrants pitching "any REST endpoint" barely get installed.** Paint by
JSON (20 users), Data Sync - live REST data (9), DataFlow (31), Fetch n Set
(32) and another-data-populator (621) all launched in 2025 or 2026 with
similar pitches. The pitch alone does not win. Name, search ranking and a
working first run do.

**Free is the norm.** The paid ones: JSON to Figma ($17 one-time), Datapaw
($10), Populate ($3/mo), Data Grid Master ($5/mo), Data Lab (Pro $2/mo) and
Data Sync - live REST (paid).

## Naming patterns

| Pattern | Examples | Notes |
|---|---|---|
| `<Source> to Figma` | JSON to Figma, Sheets to Figma, Airtable to Figma, Contentful to Figma, Notion to Figma, Table To Figma | Strongest pattern. JSON to Figma is the top direct plugin. |
| `<Thing> Sync` | Google Sheets Sync, Spreadsheet Sync, Data Sync (two of them), CopyDoc Text & Image Sync, Sync Text with Notion | Says "it stays updated". Google Sheets Sync is the biggest data plugin. |
| `Populate` family | Populate, Data Populator, JSON Populate, CSV Populate, another-data-populator, Populate JSON data, Lightning • Content populator | All the short forms are taken. |
| `Data <X>` | Data Lab, Data Merge, Data Roulette, Data Sync, DataPocket, DataFlow, Datapaw, Data Grid Master, data.to.design | Crowded, mostly small. |
| `<X> Fill` / `Filler` | GraphQL Data Fill, RealFill, MagicFill, AI Content Filler, JSON Data Auto-Filler | "Fill" reads as placeholder or AI tools. |
| Long keyword names | `data.to.design — by ‹div›RIOTS — Google Sheets, CSV, JSON, Airtable or Notion to Figma` (86 chars), `MKitCreator - „Real Data Filler“ use your JSON endpoints (REST APIs, GraphQL, Google Sheets)` (92), `Datapaw (Google Sheets, JSON, API, String, Currency, Number, AI, Fake Data, and more)` (85) | They rank for many terms but install poorly (MKit 419, Datapaw 653). data.to.design is the exception, carried by its sister plugin. |

What the big names have in common: **short, literal, two or three words**,
and they name the source or the action (Google Sheets Sync, JSON to Figma,
Content Reel, Populate). Clever brand names are rare among the leaders.

**Exact names already taken** (avoid): Populate, Data Populator, JSON
Populate, CSV Populate, Data Sync, JSON to Figma, Google Sheets Sync,
Spreadsheet Sync, Sheets to Figma, Data Lab, Data Merge, Dynamic Data, JSON
data, Real Data Filler, Data Fill (two small ones, 71 and 15 users), Content
Fill, Live Content, Data Mapper.

## How search ranks

The plugin name is the strongest ranking signal. For the query `populate`,
the top six results all have "populate" in their name. A 9-user plugin ranks
**#1 for `live data`** because its name is "Data Sync - live REST data in
your designs".

| Query | Top results |
|---|---|
| populate | Populate, Lightning • Content populator, CSV Populate, JSON Populate, Data Populator |
| populate data | Data Populator, another-data-populator, Populate JSON data |
| json | data.to.design, JSON to Figma, JSON to Figma Import |
| api | FigAct (code export), Run Plugin API (dev tool), TEMPLATE & TABLE GENERATOR FROM API, Datapaw, MKitCreator |
| rest api | MKitCreator, then unrelated code exporters |
| json api | Datapaw, MKitCreator, DataFlow, Paint by JSON |
| endpoint | MKitCreator, then unrelated plugins |
| live data | Data Sync - live REST data (9 users), FigmaCharts, GraphQL Data Fill |
| fetch data | JSON to Figma, Dynamic Data |
| data sync | Data Sync, Data Sync - live REST data, Table To Figma |

**Takeaway:** `api`, `rest api`, `endpoint` and `live data` are weakly held.
The best data plugin for `api` is TEMPLATE & TABLE GENERATOR FROM API (4.3k
users, one version from 2020); the next ones have 653 and 419 users. A plugin with "API" in its name
and "JSON", "endpoint" and "REST" in its tagline would rank near the top for
all of them.

## Taglines

- Longest observed: 99 characters. Median: 75. Treat **100 characters** as
  the limit.
- 8 of the 53 plugins have no tagline at all, including older big ones
  (Data Populator, JSON Populate, Dynamic Data). An empty tagline is a
  wasted ranking slot.

Formulas that recur:

| Formula | Example |
|---|---|
| Verb + source + "into Figma" | "Sync content from Google Sheets directly into your Figma file." (Google Sheets Sync) |
| "Populate your designs with ..." | "Populate your designs with real, live API data - saved once, applied in a click." (Paint by JSON) |
| "Design with your data from ..." | "Design with your data from Google Sheets, CSV, JSON, Airtable, Notion, or generate using AI" (data.to.design) |
| Benefit first | "Load your actual data in your designs!" (Airtable to Figma) |
| Source list | "Real data in designs: REST, Sheets, Airtable, Contentful, Firebase. Bind one card, fill the grid" (Data Sync - live REST) |

Words that show up again and again: *real data*, *your designs*, *populate*,
*sync*, *directly*, *instead of placeholders*.

## Descriptions: what the good ones contain

Taken from the leaders (Google Sheets Sync, JSON to Figma, data.to.design,
Spreadsheet Sync, Data Populator, Contento):

1. **One-line hook.** Usually anti-placeholder: "Say goodbye to Lorem Ipsum"
   appears in MKitCreator, EasyContent, RealContent and JSON to Canvas Ninja.
2. **Three numbered steps.** Google Sheets Sync's "1. share link, 2. name your
   layers `#Title`, 3. run and Sync" is the most copied structure in the
   space, and it is the biggest data plugin.
3. **The layer-naming rule with one concrete example**, stated near the top.
4. **A feature list**, usually with emoji bullets.
5. **Something to try instantly:** a playground file (Populate, MKitCreator),
   a demo JSON URL (Data Populator, now dead), or built-in sample APIs (Data
   Sync - live REST ships five; another-data-populator ships dummyjson.com
   presets).
6. **Docs link, video, support contact.**
7. **Disclaimers:** "Not affiliated with Google" (Google Sheets Sync,
   Spreadsheet Sync) and privacy notes (CopyDoc: "no data or content ever
   leaves your Figma file").

## Layer binding conventions in the wild

| Convention | Used by | Notes |
|---|---|---|
| `#Field` prefix | Google Sheets Sync (223k), Spreadsheet Sync, Data Roulette, Scribe, CSV Populate, Data Sync - live REST, Fetch n Set | De facto standard, set by Google Sheets Sync. Most designers who have done this before know it. |
| Plain name equals key | JSON → Content (17k), Contento (58k), FIGMAJSON, jsonToLayers, JSON data, Data Merge, Data Grid Master | What this plugin does today (case-insensitive). |
| `{field}` with dot paths | Data Populator | Inherited from Sketch Data Populator. |
| `{{field}}` inside text | another-data-populator, Populate JSON data, FeedLabs, Populate (use JSON, CSV...) | Template style, lets one text layer mix several fields. |
| Mapping in the UI only | JSON to Figma, data.to.design, Airtable to Figma, Datapaw | No naming needed, but the mapping lives in the plugin. |

Accepting both `price` and `#price` as the same binding would make people
coming from Google Sheets Sync feel at home without breaking plain names.

## Tags

- At most **12 tags**. Eight plugins use exactly 12.
- Half of the plugins (26 of 52) have no tags at all, including JSON to
  Figma, Google Sheets Sync, Content Reel and Contento. Tags are an open
  lever.

Most used tags across the 52 plugins whose tags were captured (26 have any):

| Tag | Plugins using it |
|---|--:|
| `json` | 15 |
| `data` | 11 |
| `content` | 10 |
| `populate` | 8 |
| `csv` | 5 |
| `sync` | 5 |
| `spreadsheet` | 5 |
| `automate` | 5 |
| `google sheets` | 4 |
| `import` | 4 |
| `lorem ipsum` | 4 |
| `api` | 4 |
| `placeholder` | 4 |
| `duplicate` | 4 |
| `sheets` | 4 |
| `text` | 4 |
| `table` | 3 |
| `image` | 3 |
| `figma` | 3 |
| `json data` | 3 |

**Relevant but almost unused:** `api` (4 plugins), `rest api` (1), `endpoint`
(0), `api to figma` (1), `fetch` (1), `live` (1), `dynamic` (2). These match how a
developer-minded designer would search, and almost no one competes for them.

## Gaps this plugin can own

- **Any endpoint, remembered per user.** The URL is saved in client storage,
  and a public sample is prefilled so a first run works with no setup. Only
  two direct competitors ship built-in samples, and Data Populator's demo is
  dead.
- **Picks the right list in nested responses.** Competitors either make you
  choose the array by hand ("You need to manually select which arrays to loop
  through" in Data Sync and My Mock Data) or just take the first element
  (DataFlow). This plugin finds every list of objects and opens the longest.
- **Clones the selected card once per record and stacks the copies.** Many
  direct competitors only fill layers you already duplicated yourself.
- **Free, no account, no API key, no AI.**
- **Maintained.** The direct-lane veterans stopped updating in 2020 to 2022.

Close or disclose before launch:

- **Images.** JSON to Figma, Data Populator, Data Sync and data.to.design all
  fill image layers from URLs. Text-only will read as a step behind.
- **CORS.** State plainly that the endpoint must allow cross-origin requests.
  Few competitors mention it; JSON to Figma offers a custom proxy URL
  setting for this.
- **The public CORS proxies in the Sheets tab** are a likely review problem
  (see CLAUDE.md).

## Draft listing (ready to edit)

**Tagline** (75 characters):

> Fill layers with data from any API or JSON endpoint, matched by layer name.

**Tags** (12):

`json`, `api`, `data`, `populate`, `content`, `endpoint`, `rest api`,
`google sheets`, `sync`, `real data`, `placeholder`, `automate`

**Description outline:**

1. Hook: real data from your own API in place of lorem ipsum.
2. Three steps: paste your endpoint URL, name your text layers after the
   fields (`title`, `price`), select a card and click Populate.
3. One example: a JSON response and the layer names it fills.
4. Features: any URL that returns JSON, automatic list detection in nested
   responses, clones and stacks one card per record, Google Sheets and manual
   modes, endpoint remembered per user.
5. Try it now: the prefilled sample endpoint.
6. Requirements: the endpoint must send `Access-Control-Allow-Origin`.
7. Privacy: nothing from your document is sent anywhere; the plugin only
   makes GET requests to the URL you enter. (Only true once the Sheets tab
   stops routing through public proxies.)
8. Docs and support links.

## Name shortlist

You asked for generic, public names. All of these were checked against
Community search on 2026-10-13 and **no plugin uses them exactly**.

| Name | Why |
|---|---|
| **API Populator** | Keeps the current name, Populator, and adds the word people search for. Ranks for both `api` and `populate`. |
| **API to Figma** | Follows the strongest naming pattern in the space (JSON to Figma, Sheets to Figma, Airtable to Figma). Small risk: a name containing "Figma" can read as official, though many approved plugins use "to Figma". |
| **API Data** | Shortest and plainest. Both words are top searches. |
| **Live Data** | Generic, easy to remember, and currently held by a 9-user plugin in search. |
| **Data Connect** | Plain and source-neutral. Only a 0-user "Data connector" is close. |

**Recommendation: API Populator.** It keeps your existing identity, matches
the most-searched action word in this category (every top `populate` result
has it in the name) and owns the weakly held `api` lane. Pair it with the
tagline above so `JSON`, `endpoint` and `layer name` are indexed too.

## Appendix: every plugin profiled

Sorted by users within each group. "Layer binding" is how the plugin
decides which layer gets which value, taken from its own description.

### A. Any URL, API or JSON (direct competitors)

| Plugin | Users | Likes | Price | Last update | Sources | Layer binding | Tags |
|---|--:|--:|---|---|---|---|---|
| [JSON to Figma](https://www.figma.com/community/plugin/789839703871161985) | 91,646 | 947 | $17 | v61, Apr 2026 | JSON file or URL, images | Pick keys in the UI | none |
| [data.to.design — by ‹div›RIOTS — Google Sheets, CSV, JSON, Airtable or Notion to Figma](https://www.figma.com/community/plugin/1133729773197702197) | 42,404 | 1,253 | Free | v131, Mar 2026 | Sheets, CSV, JSON, Airtable, Notion, API, AI | Saved mappings per component | chatgpt, content, csv, data, google sheets, import, json, lorem ipsum, populate, sync, table, unsplash |
| [JSON → Content](https://www.figma.com/community/plugin/797778700190966062) | 17,086 | 228 | Free | v10, Oct 2022 | JSON datasets | Layer name equals key | none |
| [GraphQL Data Fill](https://www.figma.com/community/plugin/778614812931099944) | 12,867 | 75 | Free | v1, Dec 2019 | GraphQL server | Not documented | none |
| [Data Sync](https://www.figma.com/community/plugin/784880696244762700) | 8,053 | 341 | Free | v47, May 2022 | JSON, XML, CSV from URL, Google Sheets, request headers | Connect in the UI | none |
| [Data Populator](https://www.figma.com/community/plugin/787488293482536319) | 6,565 | 181 | Free | v7, Feb 2020 | JSON URL | `{name.first}` in layer name or inline text | api, content, data, image, information, json, live, lorem, populate, replace, spreadsheet, sync |
| [JSON Populate](https://www.figma.com/community/plugin/749195619095691211) | 6,510 | 61 | Free | v3, Jan 2020 | JSON URL | One button per key | import_data, json, json_data, json_import, json_sample, json_text, sample_text |
| [TEMPLATE & TABLE GENERATOR FROM API](https://www.figma.com/community/plugin/889856823267627662) | 4,326 | 14 | Free | v1, Sep 2020 | JSON API | Not documented | none |
| [JSON to Canvas Ninja - fastest way from data to figma Design](https://www.figma.com/community/plugin/1446126423438050035) | 2,834 | 20 | Free | v2, Feb 2025 | JSON | Not documented | data import, data visualization, figma, generate, json, json data, jsonextractor, json import, json to frames, lorem ipsum, populate |
| [DataPocket](https://www.figma.com/community/plugin/1166257732700308854) | 2,535 | 63 | Free | v40, Mar 2025 | Data feeds, WooCommerce, Shopify | Connect in the UI | none |
| [My Mock Data](https://www.figma.com/community/plugin/841598567171283996) | 1,848 | 26 | Free | v2, Jun 2020 | JSON, YAML, CSV (API planned) | Connect in the UI | none |
| [JSON data](https://www.figma.com/community/plugin/1274730324745467593) | 1,465 | 16 | Free | v2, Aug 2023 | Pasted JSON | Layer name equals key | none |
| [jsonToLayers – Apply JSON Data to Figma Text Layers](https://www.figma.com/community/plugin/1527174284711291633) | 987 | 3 | Free | v5, Sep 2025 | JSON file | Layer name equals key | none |
| [Datapaw (Google Sheets, JSON, API, String, Currency, Number, AI, Fake Data, and more)](https://www.figma.com/community/plugin/1434312636542908147) | 653 | 42 | $10 | v74, Jul 2026 | JSON, URL, API with params, Sheets, AI, fake data | Pick in the UI | none |
| [another-data-populator](https://www.figma.com/community/plugin/1507375345145522305) | 621 | 3 | Free | v2, Jul 2025 | JSON file, dummyjson.com presets | `{{field}}`, `{{items}}` + `{{template}}` groups | data, dummy data, json, json import, placeholder |
| [MKitCreator - „Real Data Filler“ use your JSON endpoints (REST APIs, GraphQL, Google Sheets)](https://www.figma.com/community/plugin/1372536573202855869) | 419 | 6 | Free | v1, Oct 2024 | REST, GraphQL, JSON, Sheets | Not documented | api to figma, google sheets, graphql, json, real data |
| [FigPop](https://www.figma.com/community/plugin/1166707377352468434) | 399 | 2 | Free | v5, Mar 2024 | JSON | Not documented | none |
| [JSON Data Auto-Filler](https://www.figma.com/community/plugin/1433994397515642940) | 315 | 1 | Free | v1, Nov 2024 | JSON file or clipboard | Pick keys in the UI | auto, data, fill, import, json |
| [Populate JSON data](https://www.figma.com/community/plugin/1439631439048985870) | 288 | 2 | Free | v2, Jan 2025 | JSON file | `{{name}}` in text, arrays clone the design | automation, duplicate, duplicatedesign, json, populate |
| [FIGMAJSON](https://www.figma.com/community/plugin/1366469161957463273) | 241 | 3 | Free | v2, May 2024 | JSON file | Layer name equals key | automate, convert, json, json data, populate, workflow |
| [Populate - use JSON, CSV and AI-generated data to create design with real data](https://www.figma.com/community/plugin/1508085034287600469) | 112 | 4 | $4/mo | v2, Jan 2026 | JSON, CSV, URL, AI | `{{.name}}` | none |
| [Fetch n Set 🐶 🦴](https://www.figma.com/community/plugin/1600007642713762381) | 32 | 1 | Free | v2, Feb 2026 | JSON file or REST URL | `#name`, flattened `files.0.url` | api, fetch, json |
| [DataFlow — JSON & API Data Mapper](https://www.figma.com/community/plugin/1609592638053249656) | 31 | 0 | Free | v1, Mar 2026 | Pasted JSON | Auto-maps similar names | content, json data, mapping, populate, productivity tool |
| [Paint by JSON \| Real API Data](https://www.figma.com/community/plugin/1638686423435443789) | 20 | 3 | Free | v5, May 2026 | Any REST URL with headers and body | Bind fields to layer names, saved as Palettes | api, content, json, populate, real data |
| [Data Sync - live REST data in your designs](https://www.figma.com/community/plugin/1669111717769551804) | 9 | 0 | $19 | v6, Aug 2026 | REST, Sheets, Airtable, Contentful, Firebase | `#name`, `#user.email` | airtable, contentful, data import, json to variables, rest api |

### B. Spreadsheet, database or CMS

| Plugin | Users | Likes | Price | Last update | Sources | Layer binding | Tags |
|---|--:|--:|---|---|---|---|---|
| [Google Sheets Sync](https://www.figma.com/community/plugin/735770583268406934) | 222,682 | 5,949 | Free | v25, Apr 2026 | Google Sheets | `#Title` | none |
| [CopyDoc Text & Image Sync](https://www.figma.com/community/plugin/900893606648879767) | 127,717 | 1,305 | Free | v370, Oct 2026 | XLSX, DOCX, CSV, JSON, Airtable | Text import and export | none |
| [Table To Figma](https://www.figma.com/community/plugin/1196444588254898329) | 33,566 | 595 | Free | v51, Oct 2025 | Notion, Sheets, Airtable, CSV, XLSX | Generates tables | none |
| [RealContent - Design with Structured Content](https://www.figma.com/community/plugin/1141884871389632438) | 14,947 | 141 | Free | v37, May 2026 | CMS (Contentful, Kontent.ai), Sheets | Map in the UI | cms, contentful, kontent ai, lorem ipsum, sheets |
| [Spreadsheet Sync](https://www.figma.com/community/plugin/966291261554174793) | 10,469 | 188 | Free | v17, Oct 2021 | Google Sheets | `#Title`, `#A#B`, `/#hex`, `/Show` | api, automate, content, data, duplicate, google, json, populate, sheets, spreadsheet, sync, text |
| [Dynamic Data](https://www.figma.com/community/plugin/954021564250730610) | 8,903 | 189 | Free | v5, May 2022 | CSV, XLSX | `variable1` to `variable9` | automate, content, csv, data, duplicate, dynamic, import, sheets, spreadsheet, sync, text, xlsx |
| [Airtable to Figma](https://www.figma.com/community/plugin/741940457537193498) | 8,661 | 238 | Free | v8, Nov 2020 | Airtable | Map in the UI | airtable, data, database, design, figma, integration, spreadsheet, table |
| [CSV Populate](https://www.figma.com/community/plugin/875365065394448755) | 8,287 | 179 | Free | v8, Aug 2020 | CSV | `#` on header names | none |
| [Sync Text with Notion](https://www.figma.com/community/plugin/1116202373222780315) | 5,612 | 213 | Free | v21, Mar 2025 | Notion | Keys | none |
| [Sheets to Figma](https://www.figma.com/community/plugin/1561013628973320605) | 5,331 | 71 | Free | v16, May 2026 | Google Sheets, Excel | Markers | none |
| [Data Merge](https://www.figma.com/community/plugin/1308577896517145604) | 3,114 | 83 | Free | v2, Jan 2025 | Pasted CSV | Layer name equals column | none |
| [Data Roulette](https://www.figma.com/community/plugin/802301551610616662) | 3,067 | 74 | Free | v3, Sep 2023 | Google Sheets | `#Column`, `#First + #Last` | none |
| [Contentful to Figma](https://www.figma.com/community/plugin/789594601370719857) | 2,906 | 57 | Free | v17, Feb 2026 | Contentful | Map in the UI | none |
| [Scribe - Dynamic data in seconds](https://www.figma.com/community/plugin/952689592792995578) | 2,491 | 89 | Free | v10, Mar 2023 | CSV, Google Sheets | `#name` (case-sensitive) | automate, csv, data, drive, duplicate, dynamic, json, mail merge, placeholder, sheets, spreadsheet, sync |
| [Bulk component instancer](https://www.figma.com/community/plugin/1218095779709857260) | 1,265 | 22 | Free | v9, Mar 2023 | CSV | Component properties | none |
| [Plato](https://www.figma.com/community/plugin/1220625048523881652) | 974 | 21 | Free | v10, Apr 2023 | Notion, AI | Map in the UI | ai, automate, database, fill, i18n, icons, notion, stablediffusion, table |
| [FeedLabs](https://www.figma.com/community/plugin/1085928256238166159) | 914 | 16 | Free | v15, Mar 2023 | CSV, feeds | `{{price}}` in text | creative automation, dynamic ads, dynamic templates, facebook dynamic ads, feed, feed ads, feedlabs, feeds, feed templates, spreadsheets, template builder |
| [Google Sheets & EasyContent Sync](https://www.figma.com/community/plugin/1437976334370162029) | 902 | 6 | Free | v4, Jun 2026 | Google Sheets, EasyContent CMS | Map in the UI | cms, content, content design, google sheets, google sheets sync |
| [NavigateData](https://www.figma.com/community/plugin/1318209044911639908) | 422 | 14 | Free | v3, Sep 2024 | Excel | Column name equals element name | components, data, design, excel, figma, free, image, instagram, social media, template, text, trendy |
| [Data Grid Master](https://www.figma.com/community/plugin/1514043352863701057) | 338 | 6 | $5/mo | v9, May 2026 | CSV, pasted spreadsheet | Same cell name | csv, csv import, data table, excel, excel import |

### C. Placeholder and content libraries

| Plugin | Users | Likes | Price | Last update | Sources | Layer binding | Tags |
|---|--:|--:|---|---|---|---|---|
| [Lorem Ipsum — by ‹div›RIOTS](https://www.figma.com/community/plugin/736000994034548392) | 1,218,237 | 10,936 | Free | v39, Feb 2026 | Lorem ipsum, Unsplash, fake data | Selection | auto, content, generation, image, ipsum, lorem, lorem ipsum, mockup, placeholder, quick, text, text generator |
| [Content Reel](https://www.figma.com/community/plugin/731627216655469013) | 1,124,752 | 16,663 | Free | v99, Aug 2026 | Shared text, image, icon collections | Selection | none |
| [Contento](https://www.figma.com/community/plugin/1010552515551148469) | 58,252 | 844 | Free | v58, Oct 2026 | Own content libraries | Layer name equals library name | none |
| [Data Lab](https://www.figma.com/community/plugin/740286071386014712) | 28,764 | 483 | Free | v31, Dec 2023 | Generators plus Sheets, CSV, API, JSON | Query with variables | content, csv, data, google sheet, import, integration, json |
| [Populate](https://www.figma.com/community/plugin/1240181312791888696) | 19,780 | 211 | $3/mo | v10, Jul 2025 | 130+ built-in properties, Sheets (Pro) | Property codes | content, content reel, custom, data, fake, generator, google sheets, json, movie, placeholder, random, user |
| [Content Master](https://www.figma.com/community/plugin/1105107567350255361) | 5,845 | 76 | Free | n/a | Generators | Find and replace text | not captured |
| [Lightning • Content populator](https://www.figma.com/community/plugin/1170435953164718580) | 5,678 | 73 | Free | v2, Nov 2022 | Generators, form errors | Selection | none |
| [RealFill: Context-Aware Data Injector](https://www.figma.com/community/plugin/1570292644416159075) | 131 | 0 | Free | v1, Nov 2025 | Generated personas | Reads layer names | none |

