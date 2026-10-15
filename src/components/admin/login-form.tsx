"use client";

import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/admin/action-button";
import { TextField } from "@/components/admin/fields";

/**
 * Sign-in form.
 *
 * Posts to `/api/admin/login` rather than calling a server action so the session
 * cookie is set by a route handler with a real HTTP status — the rate limiter,
 * the 401 and the "already signed in" redirect all need one.
 *
 * The error is rendered inline above the button as well as toasted: an inline
 * message stays on screen while he fixes the typo in his email address.
 */
export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    void (async () => {
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, next: nextPath }),
        });

        const payload: unknown = await response.json().catch(() => null);
        const data = payload as { ok?: boolean; message?: string; redirectTo?: string } | null;

        if (response.ok && data?.ok) {
          toast.success("Signed in.");
          // Deliberately left pending: the form should not flash back to an
          // editable state while the panel route is being replaced.
          router.replace(data.redirectTo ?? nextPath);
          router.refresh();
          return;
        }

        setError(data?.message ?? `Sign-in failed (${response.status}).`);
        setPending(false);
      } catch {
        setError("Could not reach the server. Check that the stack is running.");
        setPending(false);
      }
    })();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error ? (
        <p
          role="alert"
          className="rounded-control border border-rose/50 bg-rose/10 px-3 py-2 text-sm text-rose"
        >
          {error}
        </p>
      ) : null}

      <TextField
        label="Email address"
        value={email}
        onChange={setEmail}
        type="email"
        autoComplete="username"
        inputMode="email"
        placeholder="you@example.com"
        required
      />

      <TextField
        label="Password"
        value={password}
        onChange={setPassword}
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />

      <ActionButton
        type="submit"
        icon={KeyRound}
        label="Sign in"
        pendingLabel="Signing in…"
        pending={pending}
        variant="primary"
        className="w-full justify-center"
      />

      <p className="flex items-start gap-2 text-xs text-faint">
        <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-teal" />
        <span>
          Repeated failures from one address are paused for 15 minutes. The counter lives in the
          server process, so it resets on deploy.
        </span>
      </p>
    </form>
  );
}

/** Shown under the form: the way back to the public site. */
export function LoginFooterLink() {
  return (
    <a
      href="/"
      className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-teal"
    >
      <ArrowRight aria-hidden className="size-3.5 rotate-180" />
      Back to the public site
    </a>
  );
}
