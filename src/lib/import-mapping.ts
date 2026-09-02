// Shared between the client-side mapping UI (ImportItemsForm) and the
// server action that commits the import — keeps the field list, defaults,
// and safety caps in exactly one place.

export const MAX_INPUT_ROWS = 1000;
export const MAX_QTY_PER_ROW = 200;
export const MAX_ITEMS = 2000;

export type TargetFieldKey = "name" | "category" | "condition" | "quantity" | "est_value" | "note" | "ignore";

export const TARGET_FIELDS: { key: TargetFieldKey; label: string; required?: boolean }[] = [
  { key: "name", label: "Item Name", required: true },
  { key: "category", label: "Category" },
  { key: "condition", label: "Condition" },
  { key: "quantity", label: "Quantity" },
  { key: "est_value", label: "Estimated Value ($)" },
  { key: "note", label: "Note" },
  { key: "ignore", label: "— Ignore this column —" },
];

const GUESS_KEYS: Record<Exclude<TargetFieldKey, "ignore">, string[]> = {
  name: ["itemname", "item", "name", "description", "product", "productname"],
  category: ["category", "cat"],
  condition: ["condition"],
  quantity: ["quantity", "qty", "count"],
  est_value: ["estvalue", "estimatedvalue", "estimatedresalevalue", "resalevalue", "resaleprice", "value", "price"],
  note: ["note", "notes", "comment", "comments"],
};

export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
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
  category: string;
  condition: string;
  est_value: number;
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
  const categoryCol = colFor("category");
  const conditionCol = colFor("condition");
  const quantityCol = colFor("quantity");
  const valueCol = colFor("est_value");
  const noteCol = colFor("note");

  const cell = (row: unknown[], col: number) => (col === -1 ? "" : String(row[col] ?? "").trim());

  const out: MappedItem[] = [];
  for (const row of rows.slice(0, MAX_INPUT_ROWS)) {
    const name = cell(row, nameCol);
    if (!name) continue;

    const qtyRaw = Math.floor(Number(cell(row, quantityCol)));
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.min(qtyRaw, MAX_QTY_PER_ROW) : 1;

    const valueRaw = cell(row, valueCol).replace(/[^0-9.-]/g, "");
    const estValue = Number(valueRaw) || 0;
    const category = cell(row, categoryCol) || "Other";
    const condition = cell(row, conditionCol) || "Good";
    const note = cell(row, noteCol);

    for (let i = 0; i < qty && out.length < MAX_ITEMS; i++) {
      out.push({ name, category, condition, est_value: estValue, note });
    }
    if (out.length >= MAX_ITEMS) break;
  }

  return out;
}
