"use client";

import { useState } from "react";
import { GUIDE_PDFS } from "@/lib/guides/pdfs";
import { DemosEditor } from "@/components/admin/DemosEditor";
import type { DemoItem } from "@/lib/content/demos";

interface GuideBox {
  slug: "user" | "associate" | "admin";
  titleEn: string;
  titleHi: string;
  visuals: DemoItem[];
}

/** One box per guide: add or remove the pictures and videos shown with its text. */
export function GuideVisualsManager({ guides, isHindi }: { guides: GuideBox[]; isHindi: boolean }) {
  const t = (en: string, hi: string) => (isHindi ? hi : en);
  const [state, setState] = useState<Record<string, DemoItem[]>>(Object.fromEntries(guides.map((g) => [g.slug, g.visuals])));
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  async function save(slug: string) {
    setBusy(slug);
    setMsg((m) => ({ ...m, [slug]: "" }));
    const res = await fetch("/api/admin/guide-visuals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visuals: state[slug].filter((d) => d.url.trim()) }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(null);
    setMsg((m) => ({ ...m, [slug]: res?.ok ? t("Saved.", "सहेजा गया।") : data.error || t("Could not save.", "सहेजा नहीं जा सका।") }));
  }

  return (
    <div className="space-y-6">
      {guides.map((g) => (
        <section key={g.slug} className="space-y-3 rounded-lg border border-outline-variant/60 bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-lg font-bold text-secondary">{isHindi ? g.titleHi : g.titleEn}</h2>
            <span className="flex flex-wrap gap-3 text-xs font-bold text-primary">
              <a href={`/guides/${g.slug}`} target="_blank" rel="noreferrer" className="hover:underline">{t("View", "देखें")}</a>
              <a href={`/api/guides/${g.slug}?lang=${isHindi ? "hi" : "en"}&download=1`} className="hover:underline">{t("Download", "डाउनलोड")}</a>
              <a href={`/api/guides/${g.slug}?lang=${isHindi ? "hi" : "en"}&print=1`} target="_blank" rel="noreferrer" className="hover:underline">{t("Print / PDF", "प्रिंट / PDF")}</a>
              {(
                <>
                  <a href={GUIDE_PDFS[g.slug].en} target="_blank" rel="noreferrer" className="hover:underline">{t("Illustrated PDF (English)", "चित्रों सहित PDF (अंग्रेज़ी)")}</a>
                  <a href={GUIDE_PDFS[g.slug].hi} target="_blank" rel="noreferrer" className="hover:underline">{t("Illustrated PDF (हिन्दी)", "चित्रों सहित PDF (हिन्दी)")}</a>
                </>
              )}
            </span>
          </div>
          <DemosEditor
            demos={state[g.slug]}
            onChange={(list) => setState((s) => ({ ...s, [g.slug]: list }))}
            kinds={["image", "video"]}
            title={t("Pictures and videos", "चित्र और वीडियो")}
            help="Screenshots or a short screen recording that show how the dashboard, orders and invoices work. They appear under the guide text, and in the downloaded copy (videos as a link)."
          />
          <div className="flex items-center gap-3">
            <button type="button" disabled={busy === g.slug} onClick={() => save(g.slug)} className="min-h-[44px] rounded bg-brand px-5 text-sm font-bold text-on-brand hover:bg-brand-hover disabled:opacity-50">
              {busy === g.slug ? t("Saving…", "सहेज रहे हैं…") : t("Save", "सहेजें")}
            </button>
            {msg[g.slug] && <span role="status" className="text-xs text-on-surface-variant">{msg[g.slug]}</span>}
          </div>
        </section>
      ))}
    </div>
  );
}
