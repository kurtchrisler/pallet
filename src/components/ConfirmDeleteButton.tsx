"use client";

/** `formAction` is optional so this can either sit in its own
 * `<form action={deleteX}>` (omit it) or, as a submit button inside a
 * larger shared `<form>` (e.g. one row's delete button living inside a
 * bulk-select form), override just that click's target via the button's
 * own `formAction` — the standard HTML way to have several buttons in one
 * form each submit to a different place. */
export function ConfirmDeleteButton({
  confirmText = "Delete this? This can't be undone.",
  formAction,
}: {
  confirmText?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      formNoValidate
      className="rounded-lg font-body border border-alert text-alert px-2.5 py-1.5 text-[0.78rem] hover:bg-alert-soft"
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      Delete
    </button>
  );
}
