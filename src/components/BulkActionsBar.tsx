"use client";

import { useEffect, useRef, useState } from "react";

/** A "select all" + live count + submit bar for a checkbox-driven bulk
 * action. Renders inside the same <form> as a set of
 * `<input type="checkbox" name={checkboxName} value="...">` rows further
 * down the page — it finds them via the enclosing <form> rather than
 * owning them directly, so the table rows stay plain server-rendered HTML
 * and only this small toolbar needs to be a client component. */
export function BulkActionsBar({
  checkboxName,
  itemLabel = "item",
  confirmVerb = "Delete",
}: {
  checkboxName: string;
  itemLabel?: string;
  confirmVerb?: string;
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
      <button
        type="submit"
        disabled={count === 0}
        onClick={(e) => {
          if (!confirm(`${confirmVerb} ${count} selected ${itemLabel}${count === 1 ? "" : "s"}? This can't be undone.`)) {
            e.preventDefault();
          }
        }}
        className="rounded font-body border border-alert text-alert px-3 py-1.5 text-[0.78rem] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Delete selected
      </button>
    </div>
  );
}
