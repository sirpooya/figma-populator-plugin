/**
 * Google Sheets proxy template, a Cloudflare Worker for USERS to deploy on
 * their own Cloudflare account. Populator itself runs no server.
 *
 *   GET /?url=<sheet export>   Figma plugins run with origin "null" and
 *     Google's gviz endpoint sends no CORS header, so the plugin can't read a
 *     sheet directly. This fetches the export server side and re-serves it
 *     with Access-Control-Allow-Origin: *. Only
 *     https://docs.google.com/spreadsheets/d/<id>/gviz/tq is accepted, so it
 *     can't be used as an open relay. Nothing is logged or stored.
 *
 * Deploy from this folder (pnpm dlx wrangler deploy), then paste the Worker
 * URL into Populator's Settings as the Cloudflare Worker proxy.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

const SHEET_EXPORT = /^\/spreadsheets\/d\/[A-Za-z0-9_-]+\/gviz\/tq$/;

function reply(body, status, type) {
  return new Response(body, { status, headers: { ...CORS, "Content-Type": type || "text/plain; charset=utf-8" } });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "GET") return reply("Method not allowed", 405);

    const url = new URL(request.url);

    if (url.pathname !== "/") return reply("Not found", 404);

    const target = url.searchParams.get("url");
    if (!target) return reply("Missing ?url=", 400);

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return reply("Bad url", 400);
    }
    if (parsed.protocol !== "https:" || parsed.hostname !== "docs.google.com" || !SHEET_EXPORT.test(parsed.pathname)) {
      return reply("Only Google Sheets exports are allowed", 403);
    }

    const upstream = await fetch(parsed.toString(), { redirect: "follow" });
    return reply(await upstream.text(), upstream.status, upstream.headers.get("Content-Type"));
  }
};
