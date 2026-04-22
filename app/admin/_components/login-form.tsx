"use client";

import { useActionState } from "react";
import {
  submitCredentials,
  submitEnrollment,
  submitTotp,
  type LoginStep,
} from "../_actions/auth";

const initial: LoginStep = { step: "credentials" };

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginStep, FormData>(
    async (prev, fd) => {
      const current = (fd.get("_step") as string) ?? prev.step;
      if (current === "credentials") return submitCredentials(prev, fd);
      if (current === "enroll") return submitEnrollment(prev, fd);
      if (current === "totp") return submitTotp(prev, fd);
      return prev;
    },
    initial,
  );

  if (state.step === "enroll") {
    return (
      <form action={action} className="space-y-5">
        <input type="hidden" name="_step" value="enroll" />
        <input type="hidden" name="pendingToken" value={state.pendingToken} />
        <div className="space-y-3">
          <p className="text-sm text-ink">
            Scan with Google Authenticator, 1Password, or Authy.
          </p>
          <div
            className="flex justify-center text-ink [&_svg]:h-56 [&_svg]:w-56 [&_svg]:[shape-rendering:crispEdges]"
            role="img"
            aria-label="TOTP QR code"
            dangerouslySetInnerHTML={{ __html: state.qrSvg }}
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Can&apos;t scan? Enter this secret manually:</p>
            <code className="block break-all text-ink">{state.secret}</code>
          </div>
        </div>
        <Field
          label="6-digit code"
          name="code"
          autoFocus
          inputMode="numeric"
          maxLength={6}
          required
        />
        {state.error && <ErrorText>{state.error}</ErrorText>}
        <SubmitButton pending={pending}>Verify & finish setup</SubmitButton>
      </form>
    );
  }

  if (state.step === "totp") {
    const isDev = process.env.NODE_ENV !== "production";
    return (
      <form action={action} className="space-y-4">
        <input type="hidden" name="_step" value="totp" />
        <input type="hidden" name="pendingToken" value={state.pendingToken} />
        <Field
          label="6-digit code"
          name="code"
          autoFocus
          inputMode="numeric"
          maxLength={6}
          required
          defaultValue={isDev ? "000000" : undefined}
        />
        {isDev && (
          <p className="text-xs text-muted-foreground">
            Dev mode: any code works when it&apos;s <code className="text-ink">000000</code>.
          </p>
        )}
        {state.error && <ErrorText>{state.error}</ErrorText>}
        <SubmitButton pending={pending}>Sign in</SubmitButton>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="_step" value="credentials" />
      <Field label="Email" name="email" type="email" autoFocus required />
      <Field label="Password" name="password" type="password" required />
      {state.error && <ErrorText>{state.error}</ErrorText>}
      <SubmitButton pending={pending}>Continue</SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-ink outline-none focus:border-border-strong"
        {...rest}
      />
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-red-600">{children}</p>;
}

function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-ink text-background py-2 text-sm font-medium disabled:opacity-50"
    >
      {pending ? "…" : children}
    </button>
  );
}
