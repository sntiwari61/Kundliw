"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Save, Upload } from "lucide-react";
import { SECTIONS, type FieldDef, type LinkRow, type SectionValues, type SocialLink } from "@/lib/siteConfig/definitions";
import { SocialIcon } from "@/components/content/SocialIcon";
import { LinkTextarea } from "@/components/admin/LinkTextarea";

const NAV_GROUPS: Array<{ en: string; hi: string; ids: string[] }> = [
  { en: "Home page", hi: "होम पेज", ids: ["homeHero", "homeSections", "homeCards", "homeServices", "homeProcess", "homeContact", "homeExtras", "home", "hero", "heroAnimation"] },
  { en: "Android app", hi: "एंड्रॉइड ऐप", ids: ["appSettings", "mobileApp"] },
  { en: "Menus, links and buttons", hi: "मेन्यू, लिंक और बटन", ids: ["menu", "footerLinks", "usefulLinks", "social", "topbar", "floating", "offerPopup"] },
  { en: "Look of the site", hi: "साइट का रूप", ids: ["theme", "logo", "intro", "general"] },
  { en: "Pages and content", hi: "पेज और कंटेंट", ids: ["contact", "mapPage", "content", "features", "tools", "technology", "legal"] },
  { en: "Business, Google and notes", hi: "व्यवसाय, गूगल और नोट", ids: ["business", "invoice", "ticket", "seo", "analytics", "admin"] },
];

const field = "w-full min-h-[44px] px-3 py-2 bg-surface-container-low border border-outline-variant rounded text-sm";
const btn =
  "min-h-[44px] px-4 rounded text-xs font-bold uppercase tracking-wider border border-maroon bg-brand hover:bg-brand-hover text-on-brand disabled:opacity-50 inline-flex items-center justify-center gap-2";

type Msg = { type: "ok" | "err"; text: string } | null;

export function SiteSettingsManager({ isHindi }: { isHindi: boolean }) {
  const tr = (en: string, hi: string) => (isHindi ? hi : en);
  const [active, setActive] = useState("social");
  const [sections, setSections] = useState<Record<string, SectionValues>>({});
  const [social, setSocial] = useState<SocialLink[]>([]);
  const [lists, setLists] = useState<Record<string, LinkRow[]>>({ menu: [], footerLinks: [], usefulLinks: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/site-config");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSections(data.sections);
      setSocial(data.social);
      setLists({ menu: data.menu ?? [], footerLinks: data.footerLinks ?? [], usefulLinks: data.usefulLinks ?? [] });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed to load." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (section: string, values: unknown) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setMsg({ type: "ok", text: tr("Saved. The website is updated.", "सहेजा गया। वेबसाइट अपडेट हो गई।") });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  const upload = async (key: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("subfolder", "media");
    const res = await fetch("/api/admin/media/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setMsg({ type: "err", text: data.error || tr("Upload failed.", "अपलोड नहीं हुआ।") });
      return;
    }
    setSections((s) => ({ ...s, [active]: { ...s[active], [key]: data.url } }));
  };

  const def = SECTIONS.find((s) => s.id === active);
  const values = sections[active] ?? {};
  const set = (key: string, v: string | boolean | number) =>
    setSections((s) => ({ ...s, [active]: { ...s[active], [key]: v } }));

  const renderField = (f: FieldDef) => {
    const label = tr(f.en, f.hi);
    const v = values[f.key];
    if (f.type === "toggle") {
      return (
        <label key={f.key} className="flex items-center gap-3 min-h-[44px] text-sm">
          <input type="checkbox" className="w-5 h-5" checked={v === true} onChange={(e) => set(f.key, e.target.checked)} />
          {label}
        </label>
      );
    }
    if (f.type === "textarea" && f.rich) {
      return (
        <div key={f.key} className="text-sm">
          <LinkTextarea label={label} rows={3} maxLength={f.max} value={String(v ?? "")} onChange={(x) => set(f.key, x)} isHindi={isHindi} />
        </div>
      );
    }
    if (f.type === "color") {
      const cur = String(v || "");
      return (
        <div key={f.key} className="text-sm space-y-1">
          <span className="font-semibold text-secondary">{label}</span>
          <div className="flex items-center gap-3">
            <input type="color" aria-label={label} className="block h-11 w-20 rounded border border-outline-variant" value={cur || "#888888"} onChange={(e) => set(f.key, e.target.value)} />
            <span className="font-mono text-xs text-on-surface-variant">{cur || tr("Standard colour", "डिफ़ॉल्ट रंग")}</span>
            {cur && (
              <button type="button" onClick={() => set(f.key, "")} className="min-h-[36px] px-3 rounded border border-outline-variant text-xs font-semibold hover:bg-surface-container-high">
                {tr("Use standard colour", "डिफ़ॉल्ट रंग लगाएँ")}
              </button>
            )}
          </div>
        </div>
      );
    }
    return (
      <label key={f.key} className="block text-sm space-y-1">
        <span className="font-semibold text-secondary">{label}</span>
        {f.type === "textarea" ? (
          <textarea className={field} rows={3} maxLength={f.max} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />
        ) : f.type === "number" ? (
          <input type="number" min={0} className={field} value={Number(v ?? 0)} onChange={(e) => set(f.key, Number(e.target.value))} />
        ) : (
          <span className="flex gap-2">
            <input
              className={field}
              maxLength={f.max}
              inputMode={f.type === "url" ? "url" : undefined}
              placeholder={f.type === "url" || f.type === "image" ? "https://" : f.type === "link" ? "/services   https://...   tel:+91..." : ""}
              value={String(v ?? "")}
              onChange={(e) => set(f.key, e.target.value)}
            />
            {f.type === "image" && (
              <span className="relative shrink-0">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-label={tr("Upload image", "इमेज अपलोड करें")}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files?.[0] && upload(f.key, e.target.files[0])}
                />
                <span className={`${btn} !bg-surface !text-secondary`}>
                  <Upload className="w-4 h-4" />
                  {tr("Upload", "अपलोड")}
                </span>
              </span>
            )}
          </span>
        )}
        {f.type === "image" && typeof v === "string" && v && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v} alt="" className="h-14 w-auto rounded border border-outline-variant/60 bg-white p-1" />
        )}
      </label>
    );
  };

  if (loading)
    return (
      <div className="space-y-3">
        <h1 className="font-serif text-2xl font-bold text-secondary">{tr("Website Settings", "वेबसाइट सेटिंग्स")}</h1>
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-label="Loading" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-secondary">{tr("Website Settings", "वेबसाइट सेटिंग्स")}</h1>
        <p className="text-sm text-on-surface-variant">
          {tr("Everything here changes the live website – no code needed.", "यहाँ से हर चीज़ बदलें – कोड की ज़रूरत नहीं।")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <nav aria-label="Sections" data-lenis-prevent className="lg:max-h-[75vh] lg:overflow-y-auto overscroll-contain lg:pr-1 space-y-4">
          {NAV_GROUPS.map((g) => {
            const items = g.ids.map((id) => SECTIONS.find((x) => x.id === id)).filter((x): x is (typeof SECTIONS)[number] => !!x);
            if (items.length === 0) return null;
            return (
              <div key={g.en}>
                <div className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">{tr(g.en, g.hi)}</div>
                <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1">
                  {items.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setActive(sec.id);
                        setMsg(null);
                      }}
                      className={`shrink-0 min-h-[42px] px-3 rounded text-left text-sm font-semibold border ${
                        active === sec.id ? "bg-brand text-on-brand border-maroon" : "bg-surface text-secondary border-outline-variant/60 hover:bg-surface-container-high"
                      }`}
                    >
                      {tr(sec.en, sec.hi)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <section className="bg-surface border border-outline-variant/60 rounded-lg p-5 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/30">
            <h2 className="font-serif text-lg font-bold text-secondary">{def && tr(def.en, def.hi)}</h2>
            {active === "social" && (
              <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">
                {tr("Shown automatically in footer and home page", "फुटर और होम पेज पर स्वतः प्रदर्शित")}
              </span>
            )}
          </div>

          {msg && (
            <div role="status" className={`p-3 rounded border text-sm ${msg.type === "ok" ? "border-primary/40 text-primary" : "border-error/40 text-on-error-container"}`}>
              {msg.text}
            </div>
          )}

          {def && (def.noteEn || def.noteHi) && <p className="text-sm text-on-surface-variant">{tr(def.noteEn || "", def.noteHi || "")}</p>}

          {active === "menu" || active === "footerLinks" || active === "usefulLinks" ? (
            <LinkListEditor
              rows={lists[active] ?? []}
              onChange={(rows) => setLists((l) => ({ ...l, [active]: rows }))}
              onSave={() => save(active, { items: lists[active] ?? [] })}
              saving={saving}
              isHindi={isHindi}
              onUseDefault={active === "menu" ? () => setLists((l) => ({ ...l, menu: [] })) : undefined}
            />
          ) : active === "social" ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                {tr(
                  "Set the name, link and Active / Hide for each platform. Only Active ones with a link appear on the website.",
                  "हर प्लेटफ़ॉर्म का नाम, लिंक और सक्रिय/छिपाएँ चुनें। केवल सक्रिय और लिंक वाले ही वेबसाइट पर दिखेंगे।"
                )}
              </p>
              {social.map((row, i) => (
                <div key={row.id} className="grid grid-cols-[28px_1fr] sm:grid-cols-[28px_160px_1fr_150px_36px] gap-2 items-center rounded-lg border border-outline-variant/50 bg-surface-container-low p-2">
                  <SocialIcon id={row.id} className="w-5 h-5 text-primary" />
                  <input
                    className={field}
                    aria-label={tr("Name", "नाम")}
                    maxLength={40}
                    value={row.name}
                    onChange={(e) => setSocial((l) => l.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                  />
                  <input
                    className={`${field} col-span-2 sm:col-span-1`}
                    aria-label="URL"
                    inputMode="url"
                    placeholder={row.id === "whatsapp" ? "https://wa.me/91XXXXXXXXXX" : "https://"}
                    value={row.url}
                    onChange={(e) => setSocial((l) => l.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))}
                  />
                  <select
                    className={`${field} col-span-2 sm:col-span-1`}
                    aria-label={tr("Status", "स्थिति")}
                    value={row.active ? "1" : "0"}
                    onChange={(e) => setSocial((l) => l.map((r, j) => (j === i ? { ...r, active: e.target.value === "1" } : r)))}
                  >
                    <option value="1">{tr("Active", "सक्रिय (Active)")}</option>
                    <option value="0">{tr("Hide", "छिपाएँ (Hide)")}</option>
                  </select>
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noopener noreferrer" aria-label={tr("Open link", "लिंक खोलें")} className="inline-flex justify-center items-center min-h-[44px] col-span-2 sm:col-span-1 text-primary">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                </div>
              ))}
              <button type="button" disabled={saving} onClick={() => save("social", { items: social })} className={btn}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {tr("Save social links", "सोशल लिंक सहेजें")}
              </button>
            </div>
          ) : (
            def && (
              <div className="space-y-4">
                {def.fields.map(renderField)}
                <div className="flex flex-wrap gap-3">
                  {def.fields.length > 0 && (
                    <button type="button" disabled={saving} onClick={() => save(active, values)} className={btn}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {tr("Save", "सहेजें")}
                    </button>
                  )}
                  {def.link && (
                    <a href={def.link.href} className={`${btn} !bg-surface !text-secondary`}>
                      {tr(def.link.en, def.link.hi)}
                    </a>
                  )}
                </div>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}

function LinkListEditor({
  rows,
  onChange,
  onSave,
  saving,
  isHindi,
  onUseDefault,
}: {
  rows: LinkRow[];
  onChange: (rows: LinkRow[]) => void;
  onSave: () => void;
  saving: boolean;
  isHindi: boolean;
  onUseDefault?: () => void;
}) {
  const tr = (en: string, hi: string) => (isHindi ? hi : en);
  const upd = (i: number, patch: Partial<LinkRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-on-surface-variant">{tr("Nothing added: the standard links are used. Press 'Add link' to make your own list.", "कुछ नहीं जोड़ा: डिफ़ॉल्ट लिंक लगे हैं। अपनी सूची बनाने के लिए 'लिंक जोड़ें' दबाएँ।")}</p>
      )}
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.4fr_auto] gap-2 items-center rounded-lg border border-outline-variant/50 bg-surface-container-low p-2">
          <input className={field} aria-label={tr("Name in English", "अंग्रेज़ी में नाम")} placeholder={tr("Name (English)", "नाम (अंग्रेज़ी)")} value={r.labelEn} onChange={(e) => upd(i, { labelEn: e.target.value })} maxLength={60} />
          <input className={field} aria-label={tr("Name in Hindi", "हिंदी में नाम")} placeholder={tr("Name (Hindi)", "नाम (हिंदी)")} value={r.labelHi} onChange={(e) => upd(i, { labelHi: e.target.value })} maxLength={60} />
          <input className={field} aria-label={tr("Goes to", "कहाँ जाएगा")} placeholder="/services   https://...   tel:+91..." inputMode="url" value={r.href} onChange={(e) => upd(i, { href: e.target.value })} maxLength={400} />
          <div className="flex items-center gap-1">
            <label className="inline-flex items-center gap-1.5 text-xs px-2 min-h-[40px]">
              <input type="checkbox" checked={r.show} onChange={(e) => upd(i, { show: e.target.checked })} />
              {tr("Show", "दिखाएँ")}
            </label>
            <button type="button" onClick={() => move(i, -1)} aria-label={tr("Move up", "ऊपर")} className="min-h-[40px] min-w-[36px] rounded border border-outline-variant hover:bg-surface-container-high">↑</button>
            <button type="button" onClick={() => move(i, 1)} aria-label={tr("Move down", "नीचे")} className="min-h-[40px] min-w-[36px] rounded border border-outline-variant hover:bg-surface-container-high">↓</button>
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={tr("Remove", "हटाएँ")} className="min-h-[40px] min-w-[36px] rounded border border-error text-on-error-container hover:bg-error-container">✕</button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => onChange([...rows, { labelEn: "", labelHi: "", href: "", show: true }])} className={`${btn} !bg-surface !text-secondary`}>
          {tr("Add link", "लिंक जोड़ें")}
        </button>
        {onUseDefault && rows.length > 0 && (
          <button type="button" onClick={onUseDefault} className={`${btn} !bg-surface !text-secondary`}>
            {tr("Go back to the standard menu", "डिफ़ॉल्ट मेन्यू पर लौटें")}
          </button>
        )}
        <button type="button" disabled={saving} onClick={onSave} className={btn}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tr("Save", "सहेजें")}
        </button>
      </div>
    </div>
  );
}
