"use client";

import { useEffect, useRef, useState } from "react";

type BulkAction = {
  label: string;
  /** Omit to fall back to the enclosing <form>'s own `action` (e.g. a
   * delete button can stay wired to the form's default bulk-delete
   * action). Provide to route this specific button at a different server
   * action via the button's own `formAction`, the same way each row's
   * individual toggle button already does. */
  formAction?: (formData: FormData) => void | Promise<void>;
  tone?: "default" | "good" | "danger";
  /** Confirmation prompt shown before submit; `{count}` and `{label}` are
   * replaced with the live selection count and a pluralized item label.
   * Omit to skip the confirm dialog (appropriate for reversible actions). */
  confirm?: string;
};

const TONE_CLASSES: Record<NonNullable<BulkAction["tone"]>, string> = {
  default: "border-line-strong text-ink-soft hover:border-ink-soft disabled:hover:border-line-strong",
  good: "border-good text-good hover:bg-good-soft disabled:hover:bg-transparent",
  danger: "border-alert text-alert hover:bg-alert-soft disabled:hover:bg-transparent",
};

/** A "select all" + live count + one-or-more submit buttons toolbar for a
 * checkbox-driven bulk action. Renders inside the same <form> as a set of
 * `<input type="checkbox" name={checkboxName} value="...">` rows further
 * down the page — it finds them via the enclosing <form> rather than
 * owning them directly, so the table rows stay plain server-rendered HTML
 * and only this small toolbar needs to be a client component.
 *
 * Each entry in `actions` renders its own submit button; a button with its
 * own `formAction` submits to that server action (carrying along every
 * checked checkbox in the form) instead of the form's default action, so
 * one shared selection can drive several different bulk operations. */
export function BulkActionsBar({
  checkboxName,
  itemLabel = "item",
  actions,
}: {
  checkboxName: string;
  itemLabel?: string;
  actions: BulkAction[];
}) {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const form = selectAllRef.current?.closest("form");
    if (!form) return;
    formRef.current = form;

    const selector = `input[name="${checkboxName}"]`;

    const recount = () => {
      const boxes = form.querySelectorAll<HTMLInputElement>(selector);
      const checked = form.querySelectorAll<HTMLInputElement>(`${selector}:checked`).length;
      setCount(checked);
      if (selectAllRef.current) {
        selectAllRef.current.indeterminate = checked > 0 && checked < boxes.length;
        selectAllRef.current.checked = boxes.length > 0 && checked === boxes.length;
      }
    };

    recount();
    form.addEventListener("change", recount);
    return () => form.removeEventListener("change", recount);
  }, [checkboxName]);

  function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    const form = formRef.current;
    if (!form) return;
    const boxes = form.querySelectorAll<HTMLInputElement>(`input[name="${checkboxName}"]:not(:disabled)`);
    boxes.forEach((b) => (b.checked = e.target.checked));
    setCount(e.target.checked ? boxes.length : 0);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-2.5">
      <label className="flex items-center gap-1.5 text-sm text-ink-soft">
        <input ref={selectAllRef} type="checkbox" onChange={handleSelectAll} />
        Select all
      </label>
      <span className="text-xs text-ink-faint">{count} selected</span>
      {actions.map((action) => (
        <button
          key={action.label}
          type="submit"
          formAction={action.formAction}
          formNoValidate={!!action.formAction}
          disabled={count === 0}
          onClick={(e) => {
            if (!action.confirm) return;
            const label = `${itemLabel}${count === 1 ? "" : "s"}`;
            const message = action.confirm.replace("{count}", String(count)).replace("{label}", label);
            if (!confirm(message)) e.preventDefault();
          }}
          className={`rounded-lg font-body border px-3 py-1.5 text-[0.78rem] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
            TONE_CLASSES[action.tone ?? "default"]
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
