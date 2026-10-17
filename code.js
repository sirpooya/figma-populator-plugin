// Restore the last window size the user dragged to, if any.
const SAVED_SIZE_KEY = "populator-window-size";
figma.showUI(__html__, { width: 340, height: 520, title: "Populator", themeColors: true });

figma.clientStorage.getAsync(SAVED_SIZE_KEY).then((size) => {
  if (size && size.width && size.height) {
    figma.ui.resize(size.width, size.height);
  }
});

// Saved field values (sheet URL, tab, API URL). Sent back when the UI says
// it is ready, so the message is never posted before the UI listens.
const SAVED_INPUTS_KEY = "populator-inputs";

// The selected layers, filled in place, one record each, in reading order:
// their order in an auto-layout parent, otherwise top to bottom and then left
// to right on the canvas. Main components count only when named "+...", so a
// selected component or component set alone leaves Populate disabled.
function getSelectedTargets() {
  const targets = figma.currentPage.selection.filter((node) => {
    const parsed = parseName(node.name);
    const isMain = node.type === "COMPONENT" || node.type === "COMPONENT_SET";
    return !parsed.ignore && (!isMain || parsed.include);
  });
  const parent = targets.length && targets[0].parent;
  const sameAutoLayout = parent && "layoutMode" in parent && parent.layoutMode !== "NONE" &&
    targets.every((node) => node.parent === parent);
  if (sameAutoLayout) {
    return targets.sort((a, b) => parent.children.indexOf(a) - parent.children.indexOf(b));
  }
  const at = (node) => node.absoluteTransform;
  return targets.sort((a, b) =>
    Math.round(at(a)[1][2]) - Math.round(at(b)[1][2]) || at(a)[0][2] - at(b)[0][2]
  );
}

function findFirstTextNode(node) {
  if (node.type === "TEXT") {
    return node;
  }

  if ("children" in node) {
    for (const child of node.children) {
      const textNode = findFirstTextNode(child);
      if (textNode) {
        return textNode;
      }
    }
  }

  return null;
}

// Collect every text layer inside a node, keyed by layer name.
// Used for field -> layer mapping in the Sheet / API modes.
function findAllTextNodes(node, acc) {
  acc = acc || [];
  if (node.type === "TEXT") {
    acc.push(node);
  }
  if ("children" in node) {
    for (const child of node.children) {
      findAllTextNodes(child, acc);
    }
  }
  return acc;
}

// Text layers offered in the UI's mapping dropdowns. A layer whose name binds
// a field (see parseName) fills itself, so it is left out.
function getTextLayerNames(node) {
  const seen = [];
  for (const textNode of findAllTextNodes(node)) {
    if (parseName(textNode.name).bindings.length) continue;
    if (seen.indexOf(textNode.name) === -1) {
      seen.push(textNode.name);
    }
  }
  return seen;
}

// ---------- Layer names ----------
// A layer's name says what it takes from each record, the way Google Sheets
// Sync and Spreadsheet Sync name layers. Text outside the syntax is ignored,
// so names stay readable ("Price Group {Old Price:oldPrice}").
//   {field} or #field   the value goes into the layer (see fillNode). A field
//                       may be a dot path: colors.0.hex, colors.length.
//   {Property:field}    sets a component property on an instance, or one of
//                       visible, hidden, fill, stroke, opacity, image or text
//                       on any layer.
//   {field}.3, #field.x a record index for that one binding (see pickIndex).
//   "Card .3"           a record index for the layer and everything inside.
//   "Card // products"  read from another list: an API list path or a sheet
//                       tab. Also works on a page name or a frame above.
//   "@Grid"             a selected auto-layout frame gets one child per
//                       record, duplicating its first child as needed.
//   "-Layer"            the layer and everything inside are skipped.
//   "+Component"        a main component, selected or inside the selection,
//                       is filled; it is skipped otherwise.
const BRACES = /\{[^{}]+\}/;
const INDEX = /^(\d+|n|i|x|r|rand|randsave)$/i;

function addBinding(parsed, body, index) {
  const clean = (text) => text.trim().replace(/^#/, "").trim();
  const colon = body.indexOf(":");
  const binding = colon === -1
    ? { field: clean(body) }
    : { prop: clean(body.slice(0, colon)), field: clean(body.slice(colon + 1)) };
  if (index && INDEX.test(index)) binding.index = index.toLowerCase();
  if (binding.field) parsed.bindings.push(binding);
}

function parseName(name) {
  const text = String(name);
  const parsed = {
    bindings: [],
    index: null,
    list: null,
    ignore: /^\s*-/.test(text),
    repeat: /^\s*@/.test(text),
    include: /^\s*\+/.test(text)
  };

  let rest = text.replace(/\{([^{}]+)\}(?:\.([a-z0-9]+))?/gi, (all, body, index) => {
    addBinding(parsed, body, index);
    return " ";
  });

  const slash = rest.indexOf("//");
  if (slash !== -1) {
    let list = rest.slice(slash + 2);
    rest = rest.slice(0, slash);
    // A #label or node index after the list name still belongs to the layer.
    const tail = list.search(/\s[#.]/);
    if (tail !== -1) {
      rest += list.slice(tail);
      list = list.slice(0, tail);
    }
    parsed.list = list.trim() || null;
  }

  rest = rest.replace(/#([^\s#.{}]+)(?:\.([a-z0-9]+))?/gi, (all, label, index) => {
    addBinding(parsed, label, index);
    return " ";
  });

  const nodeIndex = rest.match(/(?:^|\s)\.([a-z0-9]+)\s*$/i);
  if (nodeIndex && INDEX.test(nodeIndex[1])) parsed.index = nodeIndex[1].toLowerCase();
  return parsed;
}

// ---------- Values ----------

// Case, spaces and symbols are ignored when matching names, so "ratingbadge"
// finds "↳ Rating Badge" and "#4994ec" finds the variant "#4994EC".
function loose(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9À-ɏ؀-ۿ]+/g, "");
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

// Read a field, or a dot path through objects and arrays, from a record. Keys
// match loosely, so {product name} reads the sheet column "Product Name".
function resolveField(record, path) {
  if (record == null || typeof record !== "object") return undefined;
  if (hasOwn(record, path)) return record[path];
  let value = record;
  for (const part of path.split(".")) {
    if (value == null || typeof value !== "object") return undefined;
    if (hasOwn(value, part) || (Array.isArray(value) && part === "length")) {
      value = value[part];
      continue;
    }
    const key = Object.keys(value).find((k) => loose(k) === loose(part));
    if (key === undefined) return undefined;
    value = value[key];
  }
  return value;
}

// Whether a value turns a boolean property on. Empty lists and words like
// "false", "no" or "hide" count as off.
function isOn(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return !/^(|0|false|no|off|hide|hidden)$/i.test(value.trim());
  return Boolean(value);
}

function isFilled(value) {
  return value != null && value !== "" && typeof value !== "object";
}

// ---------- Records and indexes ----------
// A run fills one target per record: ctx.k is the target's position. An
// index changes which record a layer reads, as in Google Sheets Sync:
//   .3 the third record, .n the next one (the default), .i the next one with
//   the field filled, .x or .rand a random one, .r a random one with the field
//   filled, .randsave one random record shared by the whole target.

function findList(name, sources) {
  const want = loose(name);
  const key = Object.keys(sources).find((k) =>
    loose(k) === want || loose(k.split(".").pop()) === want
  );
  return key === undefined ? null : sources[key];
}

function pickIndex(spec, list, fields, ctx) {
  const count = list.length;
  if (!count) return -1;
  const random = (n) => Math.floor(Math.random() * n);
  if (/^\d+$/.test(spec)) return (Math.max(1, Number(spec)) - 1) % count;
  if (spec === "n") return ctx.k % count;
  if (spec === "x" || spec === "rand") return random(count);
  if (spec === "randsave") {
    if (ctx.saved == null) ctx.saved = random(count);
    return ctx.saved % count;
  }
  const filled = [];
  list.forEach((record, index) => {
    if (fields.every((field) => isFilled(resolveField(record, field)))) filled.push(index);
  });
  if (!filled.length) return -1;
  return spec === "i" ? filled[ctx.k % filled.length] : filled[random(filled.length)];
}

function valueFor(binding, scope, ctx) {
  const list = scope.list;
  if (!list || !list.length) return undefined;
  const index = binding.index
    ? pickIndex(binding.index, list, [binding.field], ctx)
    : scope.index != null ? scope.index : ctx.k % list.length;
  return index < 0 ? undefined : resolveField(list[index], binding.field);
}

// A layer's // list and node index narrow the scope for it and its children.
function enterScope(parsed, scope, ctx) {
  let next = scope;
  if (parsed.list) {
    const list = findList(parsed.list, ctx.sources);
    if (list) next = { list, index: null };
    else ctx.run.skip(`No list "${parsed.list}".`);
  }
  if (parsed.index) {
    const fields = parsed.bindings.map((b) => b.field);
    next = { list: next.list, index: pickIndex(parsed.index, next.list || [], fields, ctx) };
  }
  return next;
}

// ---------- Special values ----------
// A value can style the layer instead of filling it, as in Google Sheets Sync:
// Show, Hide, #1DA1F2 (fill), 2|#E24A08 (stroke, Spreadsheet Sync), 50%
// (opacity), 100s / 100w / 100h (size), 20x / 40y (position in the parent),
// 20xx / 40yy (position on the page), 30º (rotation), text-align:center,
// text-align-vertical:bottom, font-size:14, line-height:auto|40|120%,
// letter-spacing:2|10%, and an image URL. Several go in one value, separated
// by spaces or commas. Text layers and instances take them with a leading "/"
// ("/Hide"), so ordinary text is never mistaken for one.

function hexColor(text) {
  let hex = String(text).trim().replace(/^#/, "");
  if (!/^[0-9a-f]+$/i.test(hex)) return null;
  if (hex.length === 1) hex = hex.repeat(6);
  else if (hex.length === 2) hex = hex.repeat(3);
  else if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  else if (hex.length !== 6) return null;
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255
  };
}

function isUrl(text) {
  return /^https?:\/\/\S+$/i.test(String(text).trim());
}

function parseSpecial(token) {
  let m;
  if (/^show$/i.test(token)) return { kind: "visible", value: true };
  if (/^hide$/i.test(token)) return { kind: "visible", value: false };
  if (/^#[0-9a-f]+$/i.test(token)) {
    const color = hexColor(token);
    return color && { kind: "fill", value: color };
  }
  if ((m = token.match(/^(\d*\.?\d+)?\|(#[0-9a-f]+)$/i))) {
    const color = hexColor(m[2]);
    return color && { kind: "stroke", value: color, weight: m[1] != null ? Number(m[1]) : null };
  }
  if ((m = token.match(/^(-?\d*\.?\d+)%$/))) return { kind: "opacity", value: Number(m[1]) / 100 };
  if ((m = token.match(/^(-?\d*\.?\d+)(xx|yy|x|y)$/i))) return { kind: "position", axis: m[2].toLowerCase(), value: Number(m[1]) };
  if ((m = token.match(/^(\d*\.?\d+)(s|w|h)$/i))) return { kind: "size", axis: m[2].toLowerCase(), value: Number(m[1]) };
  if ((m = token.match(/^(-?\d*\.?\d+)[º°]$/))) return { kind: "rotation", value: Number(m[1]) };
  if ((m = token.match(/^text-align:(left|right|center|justified)$/i))) return { kind: "textAlignHorizontal", value: m[1].toUpperCase() };
  if ((m = token.match(/^text-align-ver?t?ical:(top|center|bottom)$/i))) return { kind: "textAlignVertical", value: m[1].toUpperCase() };
  if ((m = token.match(/^font-size:(\d*\.?\d+)(px)?$/i))) return { kind: "fontSize", value: Number(m[1]) };
  if ((m = token.match(/^line-height:(auto|(\d*\.?\d+)(px|%)?)$/i))) {
    return {
      kind: "lineHeight",
      value: m[1].toLowerCase() === "auto"
        ? { unit: "AUTO" }
        : { unit: m[3] === "%" ? "PERCENT" : "PIXELS", value: Number(m[2]) }
    };
  }
  if ((m = token.match(/^letter-spacing:(-?\d*\.?\d+)(px|%)?$/i))) {
    return { kind: "letterSpacing", value: { unit: m[2] === "%" ? "PERCENT" : "PIXELS", value: Number(m[1]) } };
  }
  return null;
}

// The special values in a cell, or null when any part is not one. An image
// URL is taken whole, because URLs can hold commas.
function parseSpecials(value) {
  const text = String(value).trim();
  if (isUrl(text)) return [{ kind: "image", value: text }];
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return null;
  const ops = [];
  for (const token of tokens) {
    const op = parseSpecial(token);
    if (!op) return null;
    ops.push(op);
  }
  return ops;
}

// {visible:field}, {fill:field} and the rest: the property names any layer
// takes. Returns null for a name that is not one, [] when the value is empty.
function namedSpecial(prop, value) {
  const name = loose(prop);
  if (name === "visible" || name === "show") return [{ kind: "visible", value: isOn(value) }];
  if (name === "hidden" || name === "hide") return [{ kind: "visible", value: !isOn(value) }];
  if (["fill", "color", "colour", "stroke", "image", "opacity", "text"].indexOf(name) === -1) return null;
  if (!isFilled(value)) return [];
  const text = String(value).trim();
  if (name === "text") return [{ kind: "text", value: text }];
  if (name === "image") return isUrl(text) ? [{ kind: "image", value: text }] : null;
  if (name === "opacity") {
    const number = parseFloat(text);
    if (isNaN(number)) return null;
    return [{ kind: "opacity", value: /%$/.test(text) || number > 1 ? number / 100 : number }];
  }
  const color = hexColor(text);
  if (!color) return null;
  return [name === "stroke" ? { kind: "stroke", value: color, weight: null } : { kind: "fill", value: color }];
}

const TEXT_STYLES = ["textAlignHorizontal", "textAlignVertical", "fontSize", "lineHeight", "letterSpacing", "text"];

async function applySpecials(node, ops, run) {
  if (node.type === "TEXT" && ops.some((op) => TEXT_STYLES.indexOf(op.kind) !== -1)) {
    await loadFontsForTextNode(node);
  }
  for (const op of ops) {
    try {
      await applySpecial(node, op, run);
    } catch (error) {
      run.skip(`${node.name}: ${(error && error.message) || error}`);
    }
  }
}

async function applySpecial(node, op, run) {
  const kind = op.kind;
  if (kind === "visible") {
    node.visible = op.value;
  } else if (kind === "fill") {
    // A group has no fill of its own, so its layers take it.
    if (node.type === "GROUP") {
      for (const child of node.children) await applySpecial(child, op, run);
      return;
    }
    if (!("fills" in node)) return run.skip(`${node.name} has no fill.`);
    node.fills = [{ type: "SOLID", color: op.value }];
  } else if (kind === "stroke") {
    if (!("strokes" in node)) return run.skip(`${node.name} has no stroke.`);
    node.strokes = [{ type: "SOLID", color: op.value }];
    if (op.weight != null) node.strokeWeight = op.weight;
  } else if (kind === "opacity") {
    node.opacity = Math.min(1, Math.max(0, op.value));
  } else if (kind === "position") {
    if (op.axis === "x" || op.axis === "y") {
      node[op.axis] = op.value;
    } else {
      // Page coordinates: subtract where the parent sits on the page.
      const parent = node.parent;
      const base = parent && parent.type !== "PAGE" && "absoluteTransform" in parent
        ? parent.absoluteTransform
        : [[1, 0, 0], [0, 1, 0]];
      if (op.axis === "xx") node.x = op.value - base[0][2];
      else node.y = op.value - base[1][2];
    }
  } else if (kind === "size") {
    if (!("resize" in node)) return run.skip(`${node.name} cannot be resized.`);
    const width = op.axis === "h" ? node.width : op.value;
    const height = op.axis === "w" ? node.height : op.value;
    node.resize(Math.max(0.01, width), Math.max(0.01, height));
  } else if (kind === "rotation") {
    node.rotation = op.value;
  } else if (kind === "image") {
    await setImage(node, op.value, run);
  } else if (TEXT_STYLES.indexOf(kind) !== -1) {
    if (node.type !== "TEXT") return run.skip(`${node.name} is not a text layer.`);
    if (kind === "text") node.characters = op.value;
    else node[kind] = op.value;
  }
  run.applied++;
}

// ---------- Images ----------
// The plugin fetches the URL itself (CORS still decides, see CLAUDE.md).
// figma.createImage takes PNG, JPEG and GIF up to 4096px; anything else (WebP,
// which Digikala's CDN serves, AVIF, SVG) or anything larger is redrawn as
// PNG by the UI, which has a canvas.

const pendingConversions = {};
let conversionSeq = 0;

function convertInUi(bytes) {
  const requestId = "img" + (++conversionSeq);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      delete pendingConversions[requestId];
      reject(new Error("the image took too long to convert"));
    }, 30000);
    pendingConversions[requestId] = { resolve, reject, timer };
    figma.ui.postMessage({ type: "convert-image", requestId, bytes });
  });
}

function isFigmaImage(b) {
  return (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) ||
    (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ||
    (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46);
}

function imageHash(url, run) {
  if (!hasOwn(run.images, url)) {
    run.images[url] = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (isFigmaImage(bytes)) {
          try {
            return figma.createImage(bytes).hash;
          } catch (error) {
            // Too large, most likely: let the UI scale it down.
          }
        }
        return figma.createImage(await convertInUi(bytes)).hash;
      } catch (error) {
        run.skip(`Image ${url.slice(0, 60)}: ${(error && error.message) || error}`);
        return null;
      }
    })();
  }
  return run.images[url];
}

// Put the image into the layer's image fill, keeping its scale mode, or make
// the image the layer's fill when it has none.
async function setImage(node, url, run) {
  if (node.type === "TEXT" || !("fills" in node)) {
    run.skip(`${node.name} cannot hold an image.`);
    return;
  }
  const hash = await imageHash(url, run);
  if (!hash) return;
  const fills = Array.isArray(node.fills) ? node.fills : [];
  const index = fills.findIndex((paint) => paint.type === "IMAGE");
  if (index === -1) {
    node.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: hash }];
  } else {
    const paint = JSON.parse(JSON.stringify(fills[index]));
    paint.imageHash = hash;
    node.fills = fills.map((p, i) => (i === index ? paint : p));
  }
}

// ---------- Text templates ----------
// Text whose content holds {field} placeholders ("Only {stock} left", as in
// Data Populator and Spreadsheet Sync) is filled in place. The original is kept
// in plugin data, so a second run still finds the placeholders, unless someone
// has since edited the text.
function templateText(node, scope, ctx) {
  let template = "";
  try {
    if (node.getPluginData("filled") === node.characters) template = node.getPluginData("template");
  } catch (error) {
    // Plugin data is unavailable on this layer; read the text as it is.
  }
  if (!template) {
    if (!BRACES.test(node.characters)) return null;
    template = node.characters;
  }
  let changed = false;
  const text = template.replace(/\{#?([^{}]+)\}/g, (all, field) => {
    const value = valueFor({ field: field.trim() }, scope, ctx);
    if (!isFilled(value)) return all;
    changed = true;
    return String(value);
  });
  if (!changed) return null;
  try {
    node.setPluginData("template", template);
    node.setPluginData("filled", text);
  } catch (error) {
    // Without plugin data the next run sees the filled text, not the template.
  }
  return text;
}

// ---------- Component properties ----------

// Find an instance's component property by its loose name. Non-variant
// property keys carry a "#id" suffix ("Old Price#2786:0") that is ignored.
function findProperty(instance, prop) {
  const properties = instance.componentProperties;
  const want = loose(prop);
  for (const key in properties) {
    if (loose(key.replace(/#[^#]*$/, "")) === want) {
      return { key, definition: properties[key] };
    }
  }
  return null;
}

// The options of a variant property, read from the instance's component set.
// A set with errors refuses componentPropertyDefinitions, so its variants'
// own values are collected instead.
async function variantOptions(instance, key) {
  const main = await instance.getMainComponentAsync();
  const set = main && main.parent && main.parent.type === "COMPONENT_SET" ? main.parent : null;
  if (!set) return [];
  try {
    const definition = set.componentPropertyDefinitions[key];
    if (definition && definition.variantOptions) return definition.variantOptions;
  } catch (error) {
    // Fall through to the variants themselves.
  }
  const options = [];
  for (const variant of set.children) {
    const value = variant.variantProperties && variant.variantProperties[key];
    if (value != null && options.indexOf(value) === -1) options.push(value);
  }
  return options;
}

async function pickVariantOption(instance, key, value) {
  const options = await variantOptions(instance, key);
  const text = String(value);
  return options.find((o) => o === text) ||
    options.find((o) => loose(o) === loose(text)) ||
    null;
}

// Every local component and component set, read once per populate run.
function localComponents(run) {
  if (!run.localComponents) {
    run.localComponents = figma.root.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] });
  }
  return run.localComponents;
}

// A preferred value of an instance-swap property, as a node: local when the
// file holds it, otherwise imported from its library.
function componentForKey(preferred, run) {
  if (!hasOwn(run.imported, preferred.key)) {
    run.imported[preferred.key] = (async () => {
      const local = localComponents(run).find((n) => n.key === preferred.key);
      if (local) return local;
      try {
        return preferred.type === "COMPONENT_SET"
          ? await figma.importComponentSetByKeyAsync(preferred.key)
          : await figma.importComponentByKeyAsync(preferred.key);
      } catch (error) {
        return null;
      }
    })();
  }
  return run.imported[preferred.key];
}

// The component a value names: first among the property's preferred values
// (which reach library components), then among the file's own components.
// A component set stands for its default variant.
async function findComponent(name, preferredValues, run) {
  const want = loose(name);
  if (!want) return null;
  const usable = (node) => (node.type === "COMPONENT_SET" ? node.defaultVariant : node);
  for (const preferred of preferredValues || []) {
    const node = await componentForKey(preferred, run);
    if (node && loose(node.name) === want) return usable(node);
  }
  const local = localComponents(run).find((node) =>
    loose(node.name) === want &&
    !(node.type === "COMPONENT" && node.parent && node.parent.type === "COMPONENT_SET")
  );
  return local ? usable(local) : null;
}

// Work out one property's new value and add it to `changes`, so each instance
// gets a single setProperties call. A text property flags run.needsFonts.
async function queuePropertyChange(instance, found, prop, value, changes, run) {
  const { key, definition } = found;
  if (definition.type === "BOOLEAN") {
    changes[key] = isOn(value);
  } else if (definition.type === "TEXT") {
    if (isFilled(value)) {
      changes[key] = String(value);
      run.needsFonts = true;
    }
  } else if (definition.type === "VARIANT") {
    if (!isFilled(value)) return;
    const option = await pickVariantOption(instance, key, value);
    if (option) changes[key] = option;
    else run.skip(`No "${value}" option for ${prop}.`);
  } else if (definition.type === "INSTANCE_SWAP") {
    if (!isFilled(value)) return;
    const component = await findComponent(String(value), definition.preferredValues, run);
    if (component) changes[key] = component.id;
    else run.skip(`No component named "${value}".`);
  }
}

async function commitChanges(instance, changes, run) {
  if (!Object.keys(changes).length) return;
  // A text property writes into text layers, whose fonts must be loaded.
  if (run.needsFonts) {
    for (const textNode of findAllTextNodes(instance)) await loadFontsForTextNode(textNode);
    run.needsFonts = false;
  }
  instance.setProperties(changes);
  run.applied++;
}

// ---------- Filling ----------

// "/Hide" on a text layer or instance, or any special value on another layer.
function specialsOrSkip(text, node, ops, run) {
  const specials = parseSpecials(text);
  if (specials) ops.push.apply(ops, specials);
  else run.skip(`Can't apply "${text.slice(0, 40)}" to ${node.name}.`);
}

// {field} values on an instance: a boolean shows or hides it, "/..." is a
// special value, "Size=Large, State=Default" sets variants (Spreadsheet Sync),
// a component name swaps it (Google Sheets Sync), and a special value without
// the "/" still applies when no component has that name.
async function fillInstance(node, plain, ops, scope, ctx) {
  const run = ctx.run;
  const variantChanges = {};
  for (const binding of plain) {
    const value = valueFor(binding, scope, ctx);
    if (typeof value === "boolean") {
      ops.push({ kind: "visible", value });
      continue;
    }
    if (!isFilled(value)) continue;
    const text = String(value).trim();
    if (text[0] === "/") {
      specialsOrSkip(text.slice(1), node, ops, run);
    } else if (text.indexOf("=") !== -1 && !isUrl(text)) {
      for (const pair of text.split(",")) {
        const eq = pair.indexOf("=");
        if (eq === -1) continue;
        const prop = pair.slice(0, eq).trim();
        const found = findProperty(node, prop);
        if (found) await queuePropertyChange(node, found, prop, pair.slice(eq + 1).trim(), variantChanges, run);
        else run.skip(`No property "${prop}" on ${node.name}.`);
      }
    } else {
      const component = await findComponent(text, null, run);
      if (component) {
        node.swapComponent(component);
        run.applied++;
      } else if (parseSpecials(text)) {
        ops.push.apply(ops, parseSpecials(text));
      } else {
        run.skip(`No component named "${text}".`);
      }
    }
  }
  await commitChanges(node, variantChanges, run);
}

// {field} values on a text layer: a boolean shows or hides it, "/..." is a
// special value, anything else is its text. With no {field} in its name, the
// text's own {field} placeholders or the UI's mapping fill it.
async function fillText(node, plain, ops, scope, ctx) {
  let text = null;
  for (const binding of plain) {
    const value = valueFor(binding, scope, ctx);
    if (typeof value === "boolean") {
      ops.push({ kind: "visible", value });
      continue;
    }
    if (!isFilled(value)) continue;
    const content = String(value);
    if (content[0] === "/") specialsOrSkip(content.slice(1), node, ops, ctx.run);
    else if (text === null) text = content;
  }
  if (text === null && !plain.length) {
    text = templateText(node, scope, ctx);
    if (text === null && ctx.mapped && hasOwn(ctx.mapped, node.name)) {
      text = String(ctx.mapped[node.name]);
    }
  }
  if (text !== null) {
    await loadFontsForTextNode(node);
    node.characters = text;
    ctx.run.applied++;
  }
}

// Fill one layer from its name, then its children, top down. Children are
// read after their parent changes, because a variant or swap replaces them.
async function fillNode(node, scope, ctx) {
  const run = ctx.run;
  const parsed = parseName(node.name);
  if (parsed.ignore) return;
  const isMain = node.type === "COMPONENT" || node.type === "COMPONENT_SET";
  if (isMain && !parsed.include) return;

  scope = enterScope(parsed, scope, ctx);
  const plain = parsed.bindings.filter((b) => !b.prop);
  const named = parsed.bindings.filter((b) => b.prop);
  const ops = [];

  try {
    run.needsFonts = false;
    if (node.type === "INSTANCE") {
      await fillInstance(node, plain, ops, scope, ctx);
    } else if (node.type === "TEXT") {
      await fillText(node, plain, ops, scope, ctx);
    } else {
      for (const binding of plain) {
        const value = valueFor(binding, scope, ctx);
        if (typeof value === "boolean") ops.push({ kind: "visible", value });
        else if (isFilled(value)) specialsOrSkip(String(value).trim().replace(/^\//, ""), node, ops, run);
      }
    }

    // {Property:field}: a component property first, then visible, fill, etc.
    const changes = {};
    for (const binding of named) {
      const value = valueFor(binding, scope, ctx);
      const found = node.type === "INSTANCE" ? findProperty(node, binding.prop) : null;
      if (found) {
        await queuePropertyChange(node, found, binding.prop, value, changes, run);
        continue;
      }
      const specials = namedSpecial(binding.prop, value);
      if (specials) ops.push.apply(ops, specials);
      else if (node.type === "INSTANCE") run.skip(`No property "${binding.prop}" on ${node.name}.`);
      else run.skip(`"${binding.prop}" needs an instance or is not a value ${node.name} takes.`);
    }
    if (node.type === "INSTANCE") await commitChanges(node, changes, run);

    if (ops.length) await applySpecials(node, ops, run);
  } catch (error) {
    run.skip(`${node.name}: ${(error && error.message) || error}`);
  }

  if ("children" in node) {
    for (const child of node.children) await fillNode(child, scope, ctx);
  }
}

// The // list a page or a frame above the target picks, if any.
function inheritedList(node, sources) {
  let list = null;
  const chain = [];
  for (let p = node.parent; p; p = p.parent) chain.unshift(p);
  for (const ancestor of chain) {
    const name = parseName(ancestor.name).list;
    if (name && findList(name, sources)) list = findList(name, sources);
  }
  return list;
}

// What the selection's layer names ask for: every // list (in the selection
// or above it), so the UI can fetch sheet tabs before a run, and every field
// a layer name or text placeholder binds, so the UI shows no mapping
// dropdown for those.
function scanSelection(targets) {
  const lists = [];
  const fields = [];
  const add = (array, value) => {
    if (value && array.indexOf(value) === -1) array.push(value);
  };
  const walk = (node) => {
    const parsed = parseName(node.name);
    add(lists, parsed.list);
    for (const binding of parsed.bindings) add(fields, binding.field);
    if (node.type === "TEXT") {
      let template = "";
      try {
        template = node.getPluginData("template");
      } catch (error) {
        // No plugin data here; the text itself is enough.
      }
      for (const token of (template || node.characters).match(/\{#?[^{}]+\}/g) || []) {
        add(fields, token.replace(/^\{#?|\}$/g, "").trim());
      }
    }
    if ("children" in node) node.children.forEach(walk);
  };
  for (const node of targets) {
    walk(node);
    for (let p = node.parent; p; p = p.parent) add(lists, parseName(p.name).list);
  }
  return { lists, fields };
}

function postSelectionState() {
  const targets = getSelectedTargets();
  const textLayers = [];
  for (const node of targets) {
    for (const name of getTextLayerNames(node)) {
      if (textLayers.indexOf(name) === -1) textLayers.push(name);
    }
  }
  const scan = scanSelection(targets);
  figma.ui.postMessage({
    type: "selection-state",
    hasValidSelection: targets.length > 0,
    textLayers,
    listNames: scan.lists,
    boundFields: scan.fields
  });
}

async function loadFontsForTextNode(textNode) {
  if (textNode.fontName !== figma.mixed) {
    await figma.loadFontAsync(textNode.fontName);
    return;
  }

  const fonts = new Map();
  for (let index = 0; index < textNode.characters.length; index++) {
    const fontName = textNode.getRangeFontName(index, index + 1);
    if (fontName !== figma.mixed) {
      fonts.set(`${fontName.family}::${fontName.style}`, fontName);
    }
  }

  for (const fontName of fonts.values()) {
    await figma.loadFontAsync(fontName);
  }
}

// Fill the selected layers in place, one record each in reading order. Extra
// records are left unused and extra layers untouched. The one exception is a
// selected auto-layout frame named "@...": it gets a child per record, its
// first child duplicated as needed (Google Sheets Sync's repeating frames).
// Each record is either a plain string (single-text mode) or an object
// of { layerName: value } pairs (mapped mode). `rawRecords`, in mapped mode,
// are the source rows that layer names read from; `sources` holds every list
// a // name can pick (API list paths, sheet tabs).
async function populate(records, rawRecords, sources) {
  const targets = getSelectedTargets();

  if (targets.length === 0) {
    figma.notify("Select the layers to populate.");
    return { ok: false, message: "Select the layers to populate." };
  }

  const run = {
    imported: {},
    images: {},
    applied: 0,
    skipped: [],
    skip(message) {
      if (this.skipped.indexOf(message) === -1) this.skipped.push(message);
    }
  };
  const lists = sources || {};
  const defaultList = rawRecords || records;

  // One job per layer to fill: the layer, its position k and its list.
  const jobs = [];
  let next = 0;
  for (const node of targets) {
    const parsed = parseName(node.name);
    if (parsed.repeat && "children" in node && node.type !== "INSTANCE" && node.children.length) {
      const list = parsed.list ? findList(parsed.list, lists) : defaultList;
      if (!list) {
        run.skip(`No list "${parsed.list}".`);
        continue;
      }
      while (node.children.length < list.length) node.appendChild(node.children[0].clone());
      node.children.slice(0, list.length).forEach((child, k) => {
        jobs.push({ node: child, k, list, mapped: list === defaultList ? records[k] : null });
      });
    } else if (next < defaultList.length) {
      jobs.push({ node, k: next, list: defaultList, mapped: records[next] });
      next++;
    }
  }
  const leftOver = targets.filter((node) => !parseName(node.name).repeat).length - next;

  for (const job of jobs) {
    if (typeof job.mapped === "string") {
      const textNode = findFirstTextNode(job.node);
      if (textNode) {
        await loadFontsForTextNode(textNode);
        textNode.characters = job.mapped;
        run.applied++;
      }
      continue;
    }
    const list = inheritedList(job.node, lists) || job.list;
    const ctx = { k: job.k, sources: lists, mapped: job.mapped, run, saved: null };
    await fillNode(job.node, { list, index: null }, ctx);
  }

  if (!run.applied) {
    const message = rawRecords
      ? "Nothing matched. Name layers {field} or #field, or map fields to text layers."
      : "The selected layers do not contain a text layer.";
    figma.notify(message);
    return { ok: false, message };
  }

  let notice = `Populated ${jobs.length} layer${jobs.length === 1 ? "" : "s"}.`;
  if (leftOver > 0) {
    notice += ` Only ${next} record${next === 1 ? "" : "s"}, so ${leftOver} left as they were.`;
  }
  if (run.skipped.length) {
    const more = run.skipped.length > 1 ? ` (+${run.skipped.length - 1} more)` : "";
    notice += ` Skipped: ${run.skipped[0]}${more}`;
    console.log("[Populator] skipped:", run.skipped);
  }
  figma.notify(notice);

  return { ok: true };
}

figma.ui.onmessage = async (message) => {
  // Window resize from the drag handle in the UI.
  if (message.type === "resize") {
    const width = Math.max(300, Math.round(message.width));
    const height = Math.max(380, Math.round(message.height));
    figma.ui.resize(width, height);
    figma.clientStorage.setAsync(SAVED_SIZE_KEY, { width, height });
    return;
  }

  if (message.type === "ui-ready") {
    const inputs = await figma.clientStorage.getAsync(SAVED_INPUTS_KEY);
    if (inputs) {
      figma.ui.postMessage({ type: "restore-inputs", inputs });
    }
    return;
  }

  // Persist the field values so they survive plugin restarts.
  if (message.type === "save-inputs") {
    figma.clientStorage.setAsync(SAVED_INPUTS_KEY, message.inputs || {});
    return;
  }

  // An image the UI redrew as PNG (see convertInUi).
  if (message.type === "converted-image") {
    const pending = pendingConversions[message.requestId];
    if (!pending) return;
    delete pendingConversions[message.requestId];
    clearTimeout(pending.timer);
    if (message.error) pending.reject(new Error(message.error));
    else pending.resolve(message.bytes);
    return;
  }

  // Network requests must run on the main thread, NOT the UI iframe: the
  // iframe has origin "null" and is blocked by CORS for cross-origin hosts
  // like Google Sheets. The main-thread fetch is governed only by
  // manifest.networkAccess, so it works. The UI sends a request id and gets
  // the raw response text back to parse.
  if (message.type === "fetch-url") {
    const requestId = message.requestId;
    console.log("[Populator] fetching:", message.url);
    try {
      const response = await fetch(message.url);
      const text = await response.text();
      // response.url is the FINAL url after redirects. A non-published sheet
      // bounces /export and /gviz to accounts.google.com or a ServiceLogin
      // page; surfacing finalUrl lets the UI report that precisely instead of
      // silently treating the login HTML as "bad data".
      const finalUrl = response.url || message.url;
      console.log("[Populator] fetch ok:", response.status, "bytes:", text.length, "final:", finalUrl);
      figma.ui.postMessage({
        type: "fetch-result",
        requestId,
        ok: response.ok,
        status: response.status,
        finalUrl,
        contentType: (response.headers && response.headers.get("content-type")) || "",
        text
      });
    } catch (error) {
      const messageText = (error && error.message) || "Network request failed.";
      console.log("[Populator] fetch error:", messageText);
      figma.ui.postMessage({
        type: "fetch-result",
        requestId,
        ok: false,
        status: 0,
        error: messageText
      });
    }
    return;
  }

  // Mode #1: paste, one item per line.
  if (message.type === "populate-lines") {
    const lines = message.text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      figma.notify("Paste at least one line of text.");
      figma.ui.postMessage({ type: "populate-result", ok: false });
      return;
    }

    const result = await populate(lines);
    figma.ui.postMessage({ type: "populate-result", ok: result.ok, message: result.message });
    return;
  }

  // Modes #2 & #3: structured records with field -> layer mapping.
  // message.records is an array of objects keyed by field name.
  // message.mapping maps fieldName -> layerName (only mapped fields applied).
  // message.sources holds the other lists a // name can pick.
  if (message.type === "populate-records") {
    const records = Array.isArray(message.records) ? message.records : [];
    const mapping = message.mapping || {};

    if (records.length === 0) {
      figma.notify("No rows to populate.");
      figma.ui.postMessage({ type: "populate-result", ok: false });
      return;
    }

    const mapped = records.map((row) => {
      const out = {};
      for (const field in mapping) {
        const layerName = mapping[field];
        if (layerName && Object.prototype.hasOwnProperty.call(row, field)) {
          out[layerName] = row[field];
        }
      }
      return out;
    });

    const result = await populate(mapped, records, message.sources || {});
    figma.ui.postMessage({ type: "populate-result", ok: result.ok, message: result.message });
    return;
  }
};

figma.on("selectionchange", postSelectionState);
postSelectionState();
