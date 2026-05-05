figma.showUI(__html__, { width: 300, height: 400, title: "Populator" });

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

function postSelectionState() {
  figma.ui.postMessage({
    type: "selection-state",
    hasValidSelection: Boolean(getSelectedSourceNode())
  });
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

async function populate(lines) {
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
  const textNodes = [];
  let previousNode = sourceNode;
  const spacing = 0;

  for (const line of lines) {
    const duplicate = sourceNode.clone();
    const clonedSize = {
      width: duplicate.width,
      height: duplicate.height
    };
    duplicate.x = sourceNode.x;
    duplicate.y = previousNode.y + previousNode.height + spacing;
    sourceNode.parent.appendChild(duplicate);
    duplicates.push(duplicate);

    const textNode = findFirstTextNode(duplicate);
    textNodes.push({ node: textNode, value: line, container: duplicate, size: clonedSize });
    previousNode = duplicate;
  }

  for (const item of textNodes) {
    await loadFontsForTextNode(item.node);
    item.node.characters = item.value;

    if ("resizeWithoutConstraints" in item.container) {
      item.container.resizeWithoutConstraints(item.size.width, item.size.height);
    }
  }

  figma.currentPage.selection = duplicates;
  figma.notify(`Populated ${lines.length} instance${lines.length === 1 ? "" : "s"}.`);

  return { ok: true };
}

figma.ui.onmessage = async (message) => {
  if (message.type === "populate") {
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
  }
};

figma.on("selectionchange", postSelectionState);
postSelectionState();
