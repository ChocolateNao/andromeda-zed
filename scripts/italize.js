const path = require("path");
const fs = require("fs");

/**
 * @typedef {Object<string, any>} ThemeParsed
 */

const KEYS = [
  "themes.0.style.syntax.attribute.font_style",
  "themes.0.style.syntax.comment.font_style",
  "themes.0.style.syntax.comment.doc.font_style",
  "themes.0.style.syntax.comment.documentation.font_style",
  "themes.0.style.syntax.keyword.font_style",
  "themes.0.style.syntax.keyword.import.font_style",
  "themes.0.style.syntax.keyword.return.font_style",
  "themes.0.style.syntax.module.font_style",
  "themes.0.style.syntax.string.special.url.font_style",
  "themes.0.style.syntax.tag.attribute.font_style",
  "themes.0.style.syntax.link_uri.font_style",
  "themes.0.style.syntax.namespace.font_style",
  "themes.0.style.syntax.type.builtin.font_style",
  "themes.0.style.syntax.type.interface.font_style",
  "themes.0.style.syntax.type.super.font_style",
  "themes.0.style.syntax.variable.special.font_style",
];

/**
 * Transforms null values to "italic" for specified keys
 * @param {ThemeParsed} obj - The theme to transform
 * @param {string[]} keysToTransform - Array of keys (can be dot-notation for nested)
 * @returns {ThemeParsed} The transformed theme
 */
function transformSelectedKeys(obj, keysToTransform) {
  const normalizedKeys = keysToTransform.map((key) =>
    key.includes(".") ? key : `.${key}`,
  );

  /**
   * Recursive helper to process nested objects
   * @param {ThemeParsed} obj - Current object being processed
   * @param {string} currentPath - Dot-notation path to current object
   */
  function processObject(obj, currentPath = "") {
    for (const key in obj) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;

      const shouldTransform = normalizedKeys.some(
        (targetKey) =>
          fullPath.endsWith(targetKey) || targetKey.startsWith(`${fullPath}.`),
      );

      if (obj[key] === null && shouldTransform) {
        obj[key] = "italic";
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        processObject(obj[key], fullPath);
      }
    }
  }

  processObject(obj);
  return obj;
}

/**
 * Processes a theme file, transforming specified keys
 * @param {string} inputFilePath - Path to input JSON file
 * @param {string[]} keysToTransform - Array of keys to transform
 * @returns {void}
 */
function processThemeFile(inputFilePath, keysToTransform) {
  try {
    const rawData = fs.readFileSync(inputFilePath, "utf8");
    /** @type {ThemeParsed} */
    const themeData = JSON.parse(rawData);

    if (themeData === null || typeof themeData !== "object") {
      console.error("Invalid theme data");
      return;
    }

    if (!themeData["themes"]["0"]["name"].endsWith("Italic")) {
      themeData["themes"]["0"]["name"] += " Italic";
    }

    const transformedData = transformSelectedKeys(themeData, keysToTransform);

    const parsedPath = path.parse(inputFilePath);
    const outputFilePath = path.join(
      parsedPath.dir,
      `${parsedPath.name}-italic${parsedPath.ext}`,
    );

    fs.writeFileSync(outputFilePath, JSON.stringify(transformedData, null, 2));
    fs.appendFileSync(outputFilePath, "\n")

    console.log(`Created ${outputFilePath}`);
  } catch (error) {
    console.error("Error processing theme file:", error.message);
  }
}

(function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node transform-theme.js <filename>");
    console.log("Example: node scripts/italize.js andromeda.json");
    return;
  }

  const inputFileName = process.argv[2];
  const themesFolder = "themes";
  const inputFilePath = path.join(themesFolder, inputFileName);

  if (!fs.existsSync(inputFilePath)) {
    console.error(`File not found: ${inputFilePath}`);
    return;
  }

  processThemeFile(inputFilePath, KEYS);
})();
