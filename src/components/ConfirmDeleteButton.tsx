"use client";

export function ConfirmDeleteButton({ confirmText = "Delete this? This can't be undone." }: { confirmText?: string }) {
  return (
    <button
      type="submit"
      className="rounded font-body border border-alert text-alert px-2.5 py-1.5 text-[0.78rem]"
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      Delete
    </button>
  );
}
