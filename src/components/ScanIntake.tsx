"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";
import type { IScannerControls } from "@zxing/browser";
import { CATEGORIES, CONDITIONS, type Item } from "@/lib/types";
import { createScannedItem, lookupItemsByUpc } from "@/app/(app)/scan/actions";
import { Button, Card, Field } from "@/components/ui";

type PalletOption = { id: string; source: string; purchase_date: string };

type FormState = {
  name: string;
  brand: string;
  category: string;
  condition: string;
  item_number: string;
  est_value: string;
  retail_value: string;
  note: string;
};

const BLANK_FORM: FormState = {
  name: "",
  brand: "",
  category: "",
  condition: "Good",
  item_number: "",
  est_value: "",
  retail_value: "",
  note: "",
};

function formFromItem(item: Item): FormState {
  return {
    name: item.name,
    brand: item.brand,
    category: item.category,
    condition: item.condition || "Good",
    item_number: item.item_number,
    est_value: item.est_value ? String(item.est_value) : "",
    retail_value: item.retail_value ? String(item.retail_value) : "",
    note: "",
  };
}

const RESUME_DELAY_MS = 2200;

export function ScanIntake({
  pallets,
  initialPalletId,
}: {
  pallets: PalletOption[];
  initialPalletId: string;
}) {
  const [palletId, setPalletId] = useState(initialPalletId);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [paused, setPaused] = useState(false);

  const [upc, setUpc] = useState("");
  const [manualUpc, setManualUpc] = useState("");
  const [priorCount, setPriorCount] = useState(0);
  const [hasResult, setHasResult] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK_FORM);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [added, setAdded] = useState<{ id: string; name: string; upc: string }[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    clearResumeTimer();
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraOn(false);
    setPaused(false);
  }, [clearResumeTimer]);

  useEffect(() => {
    return () => {
      clearResumeTimer();
      controlsRef.current?.stop();
    };
  }, [clearResumeTimer]);

  const runLookup = useCallback(async (code: string) => {
    setUpc(code);
    setSaveError("");
    try {
      const result = await lookupItemsByUpc(code);
      if (result.match) {
        setForm(formFromItem(result.match));
        setPriorCount(result.priorCount);
      } else {
        setForm({ ...BLANK_FORM });
        setPriorCount(0);
      }
      setHasResult(true);
    } catch {
      setSaveError("Couldn't look that UPC up — check your connection and try again.");
    }
  }, []);

  const handleDecode = useCallback(
    (code: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setPaused(true);
      clearResumeTimer();
      void runLookup(code).finally(() => {
        busyRef.current = false;
      });
    },
    [clearResumeTimer, runLookup]
  );

  const startCamera = useCallback(async () => {
    setCameraError("");
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
    ]);
    const reader = new BrowserMultiFormatReader(hints);
    try {
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, err) => {
        if (result) {
          handleDecode(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          // Transient decode noise is expected on nearly every frame that
          // isn't lined up on a barcode yet — only surface real failures.
        }
      });
      controlsRef.current = controls;
      setCameraOn(true);
    } catch {
      setCameraError("Couldn't access the camera. Check that you've allowed camera permission for this site.");
    }
  }, [handleDecode]);

  const resumeScanning = useCallback(() => {
    clearResumeTimer();
    setPaused(false);
    setHasResult(false);
    setUpc("");
    setSaveError("");
    setForm(BLANK_FORM);
  }, [clearResumeTimer]);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      resumeScanning();
    }, RESUME_DELAY_MS);
  }, [clearResumeTimer, resumeScanning]);

  const handleManualLookup = () => {
    const code = manualUpc.trim();
    if (!code) return;
    clearResumeTimer();
    setPaused(true);
    void runLookup(code);
  };

  const handleAdd = async () => {
    if (!palletId) {
      setSaveError("Pick a lot to scan into first.");
      return;
    }
    if (!form.name.trim()) {
      setSaveError("Give this item a name before adding it.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const created = await createScannedItem({
        pallet_id: palletId,
        name: form.name,
        brand: form.brand,
        category: form.category,
        condition: form.condition,
        upc,
        item_number: form.item_number,
        est_value: Number(form.est_value) || 0,
        retail_value: Number(form.retail_value) || 0,
        note: form.note,
      });
      setAdded((prev) => [{ id: created.id, name: created.name, upc: created.upc }, ...prev].slice(0, 12));
      setManualUpc("");
      if (cameraOn) {
        scheduleResume();
      } else {
        resumeScanning();
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn't save that item.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-4">
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Scanning into">
              <select value={palletId} onChange={(e) => setPalletId(e.target.value)}>
                {pallets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.source} — {p.purchase_date}
                  </option>
                ))}
              </select>
            </Field>
            {!cameraOn ? (
              <Button variant="primary" onClick={startCamera}>
                Start scanning
              </Button>
            ) : (
              <Button variant="danger" onClick={stopCamera}>
                Stop camera
              </Button>
            )}
          </div>
          {cameraError && <div className="mt-3 text-sm bg-alert-soft text-alert rounded-lg px-3 py-2">{cameraError}</div>}

          <div className="mt-4 relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70 px-6 text-center">
                Camera preview appears here once scanning starts.
              </div>
            )}
            {cameraOn && paused && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-sm text-white font-medium">
                Paused — review the result below
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <Field label="Or type a UPC manually">
              <input
                value={manualUpc}
                onChange={(e) => setManualUpc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleManualLookup();
                  }
                }}
                placeholder="012345678905"
                inputMode="numeric"
              />
            </Field>
            <Button onClick={handleManualLookup}>Look up</Button>
          </div>
        </Card>

        {hasResult && (
          <Card>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3 className="text-sm font-display font-semibold">
                {priorCount > 0 ? "Matched a previous item" : "New product"}
              </h3>
              <span className="text-xs text-ink-faint mono">{upc || "no UPC"}</span>
            </div>
            {priorCount > 0 && (
              <div className="text-xs text-good mb-3">
                Logged {priorCount} time{priorCount === 1 ? "" : "s"} before — details prefilled below.
              </div>
            )}
            {priorCount === 0 && (
              <div className="text-xs text-ink-soft mb-3">No match in your items yet. Fill this in and it&apos;ll be remembered next time.</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Item name" wide>
                <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Cordless drill, open box" />
              </Field>
              <Field label="Brand">
                <input value={form.brand} onChange={(e) => updateField("brand", e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Category">
                <input value={form.category} onChange={(e) => updateField("category", e.target.value)} list="scanCatList" placeholder="Category" />
                <datalist id="scanCatList">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Condition">
                <select value={form.condition} onChange={(e) => updateField("condition", e.target.value)}>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Item #">
                <input value={form.item_number} onChange={(e) => updateField("item_number", e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Est. resale value ($)">
                <input type="number" step="0.01" min="0" value={form.est_value} onChange={(e) => updateField("est_value", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Retail / MSRP ($)">
                <input type="number" step="0.01" min="0" value={form.retail_value} onChange={(e) => updateField("retail_value", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Note" wide>
                <input value={form.note} onChange={(e) => updateField("note", e.target.value)} placeholder="Optional" />
              </Field>
            </div>

            {saveError && <div className="mt-3 text-sm bg-alert-soft text-alert rounded-lg px-3 py-2">{saveError}</div>}

            <div className="mt-4 flex gap-2">
              <Button variant="primary" onClick={handleAdd} disabled={saving}>
                {saving ? "Adding…" : "Add to lot"}
              </Button>
              <Button variant="ghost" onClick={resumeScanning} disabled={saving}>
                Skip / scan again
              </Button>
            </div>
          </Card>
        )}

        {cameraOn && paused && !hasResult && (
          <Card>
            <div className="text-sm text-ink-soft">Looking that UPC up…</div>
          </Card>
        )}
      </div>

      <div>
        <h3 className="text-[0.85rem] font-display font-semibold mb-2">Added this session</h3>
        {added.length ? (
          <ul className="flex flex-col gap-1.5">
            {added.map((a) => (
              <li key={a.id} className="bg-surface border border-line rounded-lg px-3 py-2 text-sm">
                <div className="font-medium">{a.name}</div>
                {a.upc && <div className="text-xs text-ink-faint mono">{a.upc}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-ink-faint">Scanned items will show up here as you add them.</div>
        )}
      </div>
    </div>
  );
}
