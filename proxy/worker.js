/**
 * Populator Worker, a Cloudflare Worker. Two routes, nothing else:
 *
 *   GET /?url=<sheet export>   Google Sheets proxy. Figma plugins run with
 *     origin "null" and Google's gviz endpoint sends no CORS header, so the
 *     plugin can't read a sheet directly. This fetches the export server side
 *     and re-serves it with Access-Control-Allow-Origin: *. Only
 *     https://docs.google.com/spreadsheets/d/<id>/gviz/tq is accepted, so it
 *     can't be used as an open relay. Nothing is logged or stored.
 *
 *   GET /sample-products.json   Made-up products for the JSON API tab, so the
 *     plugin works for anyone (Figma reviewers included) without a server.
 *
 * Deploy from this folder: pnpm dlx wrangler deploy
 *
 * Populator's own deployment sets SAMPLE_ONLY (wrangler.toml), so it serves
 * only the sample and never proxies sheets. A user who deploys this as their
 * own sheet proxy removes that var and pastes the Worker URL into Settings.
 */
import sample from "./sample-products.json";

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
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "GET") return reply("Method not allowed", 405);

    const url = new URL(request.url);

    if (url.pathname === "/sample-products.json") {
      return reply(JSON.stringify(sample), 200, "application/json; charset=utf-8");
    }

    if (url.pathname !== "/" || (env && env.SAMPLE_ONLY)) return reply("Not found", 404);

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
