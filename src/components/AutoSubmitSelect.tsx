"use client";

import type { SelectHTMLAttributes } from "react";

/** A <select> that submits its enclosing <form method="get"> the moment the
 * value changes — lets filter pages stay plain GET forms (no client state,
 * shareable/bookmarkable URLs) while still feeling instant. */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
