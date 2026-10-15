"use client";

import { Check, Wand2, X } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/admin/action-button";

/**
 * "Generate from content" for the share text.
 *
 * Generation overwrites whatever is in the box, so when the box is not empty the
 * button asks first — hand-written post text is the one thing in this panel that
 * cannot be re-derived from anything else.
 */
export function GenerateButton({
  onGenerate,
  willReplace,
  label = "Generate from content",
  replaceLabel = "Regenerate from content",
  size = "sm",
}: {
  onGenerate: () => void;
  /** True when the target field already has content. */
  willReplace: boolean;
  label?: string;
  replaceLabel?: string;
  size?: "sm" | "md";
}) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <ActionButton
          icon={Check}
          label="Replace text"
          size={size}
          variant="danger"
          onClick={() => {
            onGenerate();
            setArmed(false);
          }}
        />
        <ActionButton
          icon={X}
          label="Cancel"
          size={size}
          variant="ghost"
          onClick={() => setArmed(false)}
        />
      </span>
    );
  }

  return (
    <ActionButton
      icon={Wand2}
      label={willReplace ? replaceLabel : label}
      size={size}
      variant="secondary"
      onClick={() => (willReplace ? setArmed(true) : onGenerate())}
    />
  );
}
