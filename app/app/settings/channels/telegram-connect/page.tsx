"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { connectTelegram } from "../../actions";
import { TelegramIcon } from "@/app/auth/_components/provider-icons";

function SubmitButton({ needsCode, needsPassword }: { needsCode: boolean; needsPassword: boolean }) {
  const { pending } = useFormStatus();
  let text = "Connect Telegram";
  if (needsCode) text = "Verify Code";
  if (needsPassword) text = "Verify Password";
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-ink text-background font-medium text-[14px] hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {needsCode ? "Verifying..." : needsPassword ? "Verifying..." : "Connecting..."}
        </>
      ) : (
        text
      )}
    </button>
  );
}

export default function TelegramConnectPage() {
  const [state, formAction] = useActionState(connectTelegram, null);
  const [needsCode, setNeedsCode] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    chatId: "",
    username: "",
    phoneCode: "",
    password: "",
  });

  // Handle state updates from server
  const handleFormAction = (formData: FormData) => {
    const result = connectTelegram(null, formData);
    result.then((newState) => {
      if (newState?.needsCode) {
        setNeedsCode(true);
      }
      if (newState?.needsPassword) {
        setNeedsPassword(true);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    // Add all form values
    Object.entries(formData).forEach(([key, value]) => {
      if (value) fd.set(key, value);
    });
    
    formAction(fd);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <Link
          href="/app/settings/channels"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink/60 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to channels
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-soft border border-primary/20 grid place-items-center">
            <TelegramIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-[26px] leading-[1.1] tracking-[-0.02em] text-ink">
              Connect Telegram
            </h1>
            <p className="text-[13px] text-ink/60 mt-0.5">
              Authenticate with your phone number
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {state?.error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13.5px] font-medium text-red-800">
                {state.error}
              </p>
            </div>
          </div>
        )}

        {needsCode ? (
          <>
            <div className="p-4 rounded-xl bg-primary-soft border border-primary/20">
              <p className="text-[13px] text-ink">
                A verification code has been sent to your Telegram app. Please enter it below.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="phoneCode"
                className="block text-[13px] font-medium text-ink"
              >
                Verification Code
              </label>
              <input
                id="phoneCode"
                name="phoneCode"
                type="text"
                autoComplete="off"
                placeholder="12345"
                required
                value={formData.phoneCode}
                onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </>
        ) : needsPassword ? (
          <>
            <div className="p-4 rounded-xl bg-primary-soft border border-primary/20">
              <p className="text-[13px] text-ink">
                Your account has two-factor authentication enabled. Please enter your password.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-ink"
              >
                2FA Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="off"
                placeholder="Your Telegram password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <label
                htmlFor="phoneNumber"
                className="block text-[13px] font-medium text-ink"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+1234567890"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <p className="text-[11.5px] text-ink/50">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="chatId"
                className="block text-[13px] font-medium text-ink"
              >
                Chat ID
              </label>
              <input
                id="chatId"
                name="chatId"
                type="text"
                autoComplete="off"
                placeholder="@mychannel or -1001234567890"
                required
                value={formData.chatId}
                onChange={(e) => setFormData({ ...formData, chatId: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <p className="text-[11.5px] text-ink/50">
                Channel username (e.g., @mychannel) or numeric chat ID
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-[13px] font-medium text-ink"
              >
                Channel Username (optional)
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="off"
                placeholder="@mychannel"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <p className="text-[11.5px] text-ink/50">
                For creating links to your posts (e.g., t.me/@mychannel/123)
              </p>
            </div>
          </>
        )}

        <div className="pt-2">
          <SubmitButton needsCode={needsCode} needsPassword={needsPassword} />
        </div>
      </form>

      {!needsCode && !needsPassword && (
        <div className="mt-8 p-4 rounded-xl border border-dashed border-border-strong">
          <h3 className="text-[13px] font-medium text-ink mb-2">
            How it works
          </h3>
          <ol className="text-[12.5px] text-ink/60 leading-relaxed list-decimal list-inside space-y-2">
            <li>Enter your phone number with country code</li>
            <li>Enter the target channel username or chat ID</li>
            <li>Click Connect to receive a verification code in your Telegram app</li>
            <li>Enter the code to complete authentication</li>
            <li>If you have 2FA enabled, you&apos;ll also need to enter your password</li>
          </ol>
        </div>
      )}
    </div>
  );
}
