// Restore the last window size the user dragged to, if any.
const SAVED_SIZE_KEY = "populator-window-size";
figma.showUI(__html__, { width: 340, height: 520, title: "Populator", themeColors: true });

figma.clientStorage.getAsync(SAVED_SIZE_KEY).then((size) => {
  if (size && size.width && size.height) {
    figma.ui.resize(size.width, size.height);
  }
});

// Restore the user's saved field values (sheet URL, tab, API URL).
const SAVED_INPUTS_KEY = "populator-inputs";
figma.clientStorage.getAsync(SAVED_INPUTS_KEY).then((inputs) => {
  if (inputs) {
    figma.ui.postMessage({ type: "restore-inputs", inputs });
  }
});

function getSelectedSourceNode() {
  const selection = figma.currentPage.selection;

  if (
    selection.length !== 1 ||
    (selection[0].type !== "INSTANCE" && selection[0].type !== "COMPONENT")
  ) {
    return null;
  }

  return selection[0];
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

function getTextLayerNames(node) {
  const seen = [];
  for (const textNode of findAllTextNodes(node)) {
    if (seen.indexOf(textNode.name) === -1) {
      seen.push(textNode.name);
    }
  }
  return seen;
}

function postSelectionState() {
  const node = getSelectedSourceNode();
  figma.ui.postMessage({
    type: "selection-state",
    hasValidSelection: Boolean(node),
    textLayers: node ? getTextLayerNames(node) : []
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

// Clone the source node `records.length` times, stacking vertically.
// Each record is either a plain string (single-text mode) or an object
// of { layerName: value } pairs (mapped mode).
async function populate(records) {
  const sourceNode = getSelectedSourceNode();

  if (!sourceNode) {
    figma.notify("Select one instance or main component to populate.");
    return { ok: false, message: "Select one instance or main component." };
  }

  if (!findFirstTextNode(sourceNode)) {
    figma.notify("The selected node does not contain a text layer.");
    return { ok: false, message: "No text layer found inside the selected node." };
  }

  const duplicates = [];
  const sizes = [];
  const work = [];
  let previousNode = sourceNode;
  const spacing = 0;

  for (const record of records) {
    const duplicate = sourceNode.clone();
    duplicate.x = sourceNode.x;
    duplicate.y = previousNode.y + previousNode.height + spacing;
    sourceNode.parent.appendChild(duplicate);
    duplicates.push(duplicate);
    sizes.push({ width: duplicate.width, height: duplicate.height });

    if (typeof record === "string") {
      const textNode = findFirstTextNode(duplicate);
      if (textNode) {
        work.push({ node: textNode, value: record });
      }
    } else {
      // Mapped record: set each text layer matching a key in the record.
      for (const textNode of findAllTextNodes(duplicate)) {
        if (Object.prototype.hasOwnProperty.call(record, textNode.name)) {
          work.push({ node: textNode, value: String(record[textNode.name]) });
        }
      }
    }

    previousNode = duplicate;
  }

  for (const item of work) {
    await loadFontsForTextNode(item.node);
    item.node.characters = item.value;
  }

  // Restore original sizes in case auto-layout / text resized the clones.
  duplicates.forEach((duplicate, index) => {
    if ("resizeWithoutConstraints" in duplicate) {
      duplicate.resizeWithoutConstraints(sizes[index].width, sizes[index].height);
    }
  });

  figma.currentPage.selection = duplicates;
  figma.notify(`Populated ${records.length} instance${records.length === 1 ? "" : "s"}.`);

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

  // Persist the field values so they survive plugin restarts.
  if (message.type === "save-inputs") {
    figma.clientStorage.setAsync(SAVED_INPUTS_KEY, message.inputs || {});
    return;
  }

  // Mode #1: paste — one item per line.
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

    const result = await populate(mapped);
    figma.ui.postMessage({ type: "populate-result", ok: result.ok, message: result.message });
    return;
  }
};

figma.on("selectionchange", postSelectionState);
postSelectionState();
