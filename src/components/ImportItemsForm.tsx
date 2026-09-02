"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitMappedItems } from "@/app/(app)/pallets/import-actions";
import {
  applyMapping,
  guessMapping,
  TARGET_FIELDS,
  type ImportColumn,
  type TargetFieldKey,
} from "@/lib/import-mapping";

type ParsedSheet = {
  fileName: string;
  columns: ImportColumn[];
  rows: unknown[][];
};

export function ImportItemsForm({ palletId, palletSource }: { palletId: string; palletSource: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Record<number, TargetFieldKey>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setSheet(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: "array" });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", blankrows: false });

      if (!grid.length) {
        setError("That file looks empty.");
        return;
      }

      const headerRow = grid[0];
      const dataRows = grid.slice(1);
      const columns: ImportColumn[] = headerRow
        .map((h, index) => ({ index, header: String(h ?? "").trim() }))
        .filter((c) => c.header);

      if (!columns.length) {
        setError("Couldn't find a header row — make sure the first row of your spreadsheet has column labels.");
        return;
      }

      setSheet({ fileName: file.name, columns, rows: dataRows });
      setMapping(guessMapping(columns));
    } catch {
      setError("Couldn't read that file — make sure it's a valid .csv, .xlsx, or .xls spreadsheet.");
    }
  }

  function reset() {
    setSheet(null);
    setMapping({});
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const hasNameMapped = Object.values(mapping).includes("name");
  const previewRows = sheet ? sheet.rows.slice(0, 4) : [];
  const mappedCount = sheet ? applyMapping(sheet.rows, mapping).length : 0;

  async function handleImport() {
    if (!sheet) return;
    setError(null);
    if (!hasNameMapped) {
      setError("Map at least one column to Item Name before importing.");
      return;
    }
    const items = applyMapping(sheet.rows, mapping);
    if (!items.length) {
      setError("No rows have a value in the column mapped to Item Name.");
      return;
    }
    setSubmitting(true);
    const result = await submitMappedItems(palletId, items);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/items?pallet=${palletId}&imported=${result.imported}`);
  }

  return (
    <div>
      {!sheet && (
        <>
          <p className="text-xs text-ink-soft mb-3">
            Upload a spreadsheet (.csv, .xlsx) with &quot;{palletSource}&quot;&apos;s contents — one row per item.
            You&apos;ll get to match each column to a field before anything is imported.{" "}
            <a href="/item-import-template.csv" className="text-accent hover:underline">
              Download a template
            </a>
            .
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="text-sm file:mr-3 file:rounded file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </>
      )}

      {error && <div className="mt-3 text-sm bg-alert-soft text-alert rounded px-3 py-2">{error}</div>}

      {sheet && (
        <div className="mt-1">
          <p className="text-xs text-ink-soft mb-3">
            <span className="font-semibold text-ink">{sheet.fileName}</span> — {sheet.rows.length} row
            {sheet.rows.length === 1 ? "" : "s"} found. Match each column below to a field, then import.
          </p>

          <div className="overflow-x-auto border border-line rounded-lg mb-3">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-surface-2 text-left text-[0.7rem] uppercase tracking-wide text-ink-soft">
                  <th className="px-2.5 py-2">Column in your file</th>
                  <th className="px-2.5 py-2">Sample value</th>
                  <th className="px-2.5 py-2">Maps to</th>
                </tr>
              </thead>
              <tbody>
                {sheet.columns.map((col) => {
                  const sample = String(sheet.rows.find((r) => String(r[col.index] ?? "").trim())?.[col.index] ?? "");
                  return (
                    <tr key={col.index} className="border-t border-line">
                      <td className="px-2.5 py-2 font-medium">{col.header}</td>
                      <td className="px-2.5 py-2 text-ink-faint truncate max-w-[220px]">{sample || "—"}</td>
                      <td className="px-2.5 py-2">
                        <select
                          value={mapping[col.index] ?? "ignore"}
                          onChange={(e) =>
                            setMapping((m) => ({ ...m, [col.index]: e.target.value as TargetFieldKey }))
                          }
                        >
                          {TARGET_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {previewRows.length > 0 && (
            <p className="text-xs text-ink-faint mb-3">
              This will create {mappedCount} item{mappedCount === 1 ? "" : "s"}
              {mappedCount !== sheet.rows.length ? ` from ${sheet.rows.length} rows` : ""}
              {hasNameMapped ? "" : " — map a column to Item Name to continue"}.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={submitting || !hasNameMapped}
              onClick={handleImport}
              className="bg-accent text-accent-ink font-semibold rounded px-4 py-2 text-sm hover:brightness-[1.06] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Importing…" : `Import ${mappedCount} item${mappedCount === 1 ? "" : "s"}`}
            </button>
            <button type="button" onClick={reset} className="text-ink-soft text-sm px-3 py-2">
              Choose a different file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
