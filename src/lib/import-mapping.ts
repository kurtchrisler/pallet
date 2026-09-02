// Shared between the client-side mapping UI (ImportItemsForm) and the
// server action that commits the import — keeps the field list, defaults,
// and safety caps in exactly one place.

export const MAX_INPUT_ROWS = 1000;
export const MAX_QTY_PER_ROW = 200;
export const MAX_ITEMS = 2000;

export type TargetFieldKey =
  | "name"
  | "brand"
  | "category"
  | "condition"
  | "upc"
  | "item_number"
  | "quantity"
  | "est_value"
  | "retail_value"
  | "note"
  | "ignore";

export const TARGET_FIELDS: { key: TargetFieldKey; label: string; required?: boolean }[] = [
  { key: "name", label: "Item Name", required: true },
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "condition", label: "Condition" },
  { key: "item_number", label: "Item #" },
  { key: "upc", label: "UPC" },
  { key: "quantity", label: "Quantity" },
  { key: "est_value", label: "Estimated Value ($)" },
  { key: "retail_value", label: "Retail Value ($)" },
  { key: "note", label: "Note" },
  { key: "ignore", label: "— Ignore this column —" },
];

const GUESS_KEYS: Record<Exclude<TargetFieldKey, "ignore">, string[]> = {
  name: ["itemname", "item", "name", "description", "product", "productname"],
  brand: ["brand", "manufacturer", "make"],
  category: ["category", "cat"],
  condition: ["condition"],
  item_number: ["itemnumber", "itemno", "sku", "modelnumber", "model", "mfrpartnumber", "partnumber"],
  upc: ["upc", "upccode", "barcode", "ean", "gtin"],
  quantity: ["quantity", "qty", "count"],
  est_value: ["estvalue", "estimatedvalue", "estimatedresalevalue", "resalevalue", "resaleprice", "value", "price"],
  retail_value: ["retailvalue", "retailprice", "msrp", "listprice", "originalprice"],
  note: ["note", "notes", "comment", "comments"],
};

export function normalizeKey(key: string): string {
  // "#" is turned into "no" (so "Item #" reads the same as "Item No.") before
  // stripping punctuation, otherwise "Item #" and bare "Item" both collapse
  // to "item" and become indistinguishable.
  return key
    .toLowerCase()
    .replace(/#/g, "no")
    .replace(/[^a-z0-9]/g, "");
}

/** A spreadsheet column, keyed by its position — not its header text, since
 * two columns can share a label (or have none). Everything downstream maps
 * by `index` so duplicate/blank headers never collide. */
export type ImportColumn = { index: number; header: string };

/** Guesses a target field for each column, in column order. A target is
 * only assigned to the first column that matches it — later columns that
 * match the same target default to "ignore" so two columns never silently
 * collide; the user can still remap either one by hand. */
export function guessMapping(columns: ImportColumn[]): Record<number, TargetFieldKey> {
  const mapping: Record<number, TargetFieldKey> = {};
  const claimed = new Set<TargetFieldKey>();

  for (const col of columns) {
    const normalized = normalizeKey(col.header);
    let match: TargetFieldKey = "ignore";
    for (const [field, keys] of Object.entries(GUESS_KEYS) as [Exclude<TargetFieldKey, "ignore">, string[]][]) {
      if (claimed.has(field)) continue;
      if (keys.includes(normalized)) {
        match = field;
        break;
      }
    }
    mapping[col.index] = match;
    if (match !== "ignore") claimed.add(match);
  }

  return mapping;
}

export type MappedItem = {
  name: string;
  brand: string;
  category: string;
  condition: string;
  upc: string;
  item_number: string;
  est_value: number;
  retail_value: number;
  note: string;
};

/** Applies a column→field mapping across parsed spreadsheet rows (each row
 * an array aligned to the original column positions) and expands any
 * Quantity > 1 into that many copies. Shared so the preview count in the
 * browser matches exactly what the server ends up inserting. */
export function applyMapping(rows: unknown[][], mapping: Record<number, TargetFieldKey>): MappedItem[] {
  const colFor = (field: TargetFieldKey): number => {
    const entry = Object.entries(mapping).find(([, v]) => v === field);
    return entry ? Number(entry[0]) : -1;
  };
  const nameCol = colFor("name");
  if (nameCol === -1) return [];
  const brandCol = colFor("brand");
  const categoryCol = colFor("category");
  const conditionCol = colFor("condition");
  const upcCol = colFor("upc");
  const itemNumberCol = colFor("item_number");
  const quantityCol = colFor("quantity");
  const valueCol = colFor("est_value");
  const retailCol = colFor("retail_value");
  const noteCol = colFor("note");

  const cell = (row: unknown[], col: number) => (col === -1 ? "" : String(row[col] ?? "").trim());
  const money = (row: unknown[], col: number) => Number(cell(row, col).replace(/[^0-9.-]/g, "")) || 0;

  const out: MappedItem[] = [];
  for (const row of rows.slice(0, MAX_INPUT_ROWS)) {
    const name = cell(row, nameCol);
    if (!name) continue;

    const qtyRaw = Math.floor(Number(cell(row, quantityCol)));
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.min(qtyRaw, MAX_QTY_PER_ROW) : 1;

    const brand = cell(row, brandCol);
    const category = cell(row, categoryCol) || "Other";
    const condition = cell(row, conditionCol) || "Good";
    const upc = cell(row, upcCol);
    const itemNumber = cell(row, itemNumberCol);
    const estValue = money(row, valueCol);
    const retailValue = money(row, retailCol);
    const note = cell(row, noteCol);

    for (let i = 0; i < qty && out.length < MAX_ITEMS; i++) {
      out.push({
        name,
        brand,
        category,
        condition,
        upc,
        item_number: itemNumber,
        est_value: estValue,
        retail_value: retailValue,
        note,
      });
    }
    if (out.length >= MAX_ITEMS) break;
  }

  return out;
}
