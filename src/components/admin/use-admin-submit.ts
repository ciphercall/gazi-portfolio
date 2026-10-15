"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/admin/types";

/**
 * Client plumbing around the server actions.
 *
 * The actions answer with `{ ok, message, errors }` instead of throwing, so the
 * panel can do the three things the owner asked for every time: keep the user on
 * the form, mark the exact fields that failed, and say plainly whether it saved.
 */

export interface AdminSubmitOptions<TData> {
  /** Shown on success. Defaults to the message the action returned. */
  successMessage?: string;
  onSuccess?: (data: TData | undefined) => void;
  onFailure?: (errors: Record<string, string[]> | null, message: string) => void;
}

export interface AdminSubmit<TInput> {
  submit: (input: TInput) => void;
  pending: boolean;
  errors: Record<string, string[]> | null;
  formError: string | null;
  /** First error recorded for a field, ready to hand to `<TextField error=…>`. */
  errorFor: (field: string) => string | undefined;
  reset: () => void;
}

function messageFromError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong before the request could be sent.";
}

export function useAdminSubmit<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: AdminSubmitOptions<TData> = {},
): AdminSubmit<TInput> {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Not memoised on purpose: it is only ever called from an event handler, and
  // depending on `options` (a fresh object each render) would defeat the memo
  // anyway.
  const submit = (input: TInput) => {
    setErrors(null);
    setFormError(null);

    startTransition(async () => {
      try {
        const result = await action(input);

        if (result.ok) {
          toast.success(options.successMessage ?? result.message);
          options.onSuccess?.(result.data);
          return;
        }

        const summary = result.errors?.form?.[0] ?? result.message;
        setErrors(result.errors ?? null);
        setFormError(summary);
        toast.error(summary);
        options.onFailure?.(result.errors ?? null, result.message);
      } catch (error) {
        const message = messageFromError(error);
        setFormError(message);
        toast.error(message);
      }
    });
  };

  return {
    submit,
    pending,
    errors,
    formError,
    errorFor: (field: string) => errors?.[field]?.[0],
    reset: () => {
      setErrors(null);
      setFormError(null);
    },
  };
}

/**
 * Fire-and-forget variant for row actions (publish, delete, reorder): it reports
 * the outcome with a toast and returns the action result, so the caller can also
 * react to it in the UI.
 */
export async function runWithToast<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  input: TInput,
  options: { successMessage?: string; silentSuccess?: boolean } = {},
): Promise<ActionResult<TData>> {
  try {
    const result = await action(input);

    if (result.ok) {
      if (!options.silentSuccess) toast.success(options.successMessage ?? result.message);
    } else {
      toast.error(result.message);
    }

    return result;
  } catch (error) {
    const message = messageFromError(error);
    toast.error(message);
    return { ok: false, message };
  }
}
