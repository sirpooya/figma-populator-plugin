/**
 * Populator CORS proxy — Cloudflare Worker.
 *
 * Figma plugins run with origin "null" and Google's gviz endpoint sends no
 * CORS header, so the plugin can't read a sheet directly. This Worker fetches
 * the target URL server-side (servers have no CORS rules) and re-serves the
 * body with Access-Control-Allow-Origin: *, which Figma accepts.
 *
 * Deploy:
 *   1. npm i -g wrangler        (or use the Cloudflare dashboard editor)
 *   2. wrangler deploy          (from this folder; see wrangler.toml)
 *   3. Copy the printed https://populator-proxy.<you>.workers.dev URL
 *   4. In the plugin's Google Sheet tab, paste into "CORS proxy":
 *        https://populator-proxy.<you>.workers.dev/?url={URL}
 *
 * Only docs.google.com targets are allowed, so this can't be abused as an
 * open proxy.
 */
export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const target = new URL(request.url).searchParams.get("url");
    if (!target) {
      return new Response("Missing ?url=", { status: 400, headers: cors });
    }

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return new Response("Bad url", { status: 400, headers: cors });
    }

    // Lock to Google Sheets so this isn't an open relay.
    if (parsed.hostname !== "docs.google.com") {
      return new Response("Only docs.google.com is allowed", { status: 403, headers: cors });
    }

    const upstream = await fetch(target, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 PopulatorProxy" }
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...cors,
        "Content-Type": upstream.headers.get("Content-Type") || "text/plain; charset=utf-8"
      }
    });
  }
};
