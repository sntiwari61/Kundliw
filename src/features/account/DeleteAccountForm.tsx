"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";

/** Delete my account: type DELETE (and the password, when the account has one). */
export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const isHindi = useLocale() === "hi";
  const t = (en: string, hi: string) => (isHindi ? hi : en);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, password: hasPassword ? password : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("Could not delete the account.", "खाता हटाया नहीं जा सका।"));
        return;
      }
      await signOut({ callbackUrl: `/${isHindi ? "hi" : "en"}` });
    } catch {
      setError(t("Network problem. Please try again.", "नेटवर्क की समस्या। कृपया फिर कोशिश करें।"));
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full min-h-[44px] rounded border border-outline-variant bg-surface px-3 text-sm";
  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-error/40 bg-surface p-5">
      <p className="text-sm font-bold text-error">{t("This cannot be undone.", "इसे वापस नहीं किया जा सकता।")}</p>
      <label className="block text-xs font-bold uppercase text-on-surface-variant">
        {t("Type DELETE to confirm", "पुष्टि के लिए DELETE लिखें")}
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className={`${field} mt-1`} />
      </label>
      {hasPassword && (
        <label className="block text-xs font-bold uppercase text-on-surface-variant">
          {t("Your password", "आपका पासवर्ड")}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={`${field} mt-1`} />
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || confirm !== "DELETE" || (hasPassword && !password)}
        className="min-h-[44px] rounded bg-error px-5 text-sm font-bold text-on-error disabled:opacity-50"
      >
        {busy ? t("Deleting...", "हटाया जा रहा है...") : t("Delete my account", "मेरा खाता हटाएँ")}
      </button>
    </form>
  );
}
