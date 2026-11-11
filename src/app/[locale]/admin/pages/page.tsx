"use client";

import { LinkTextarea } from "@/components/admin/LinkTextarea";
import React, { useState, useEffect, useRef } from "react";
import { Save, CheckCircle2, AlertCircle, Plus, Trash2, ExternalLink, ArrowLeft, ArrowRight, Pencil, RotateCcw } from "lucide-react";
import { LEGAL_DEFAULTS, isSeedStub } from "@/lib/legal/defaults";
import { DEFAULT_GUIDES, GUIDE_SLUGS, guidePageSlug } from "@/lib/guides/defaults";
import { ContentBlock, normalizeBlocks } from "@/lib/content/media";
import { isCorePageSlug } from "@/lib/content/pages";
import { BlocksEditor } from "@/components/admin/MediaFields";

interface StaticPageItem {
  id: string;
  slug: string;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
  blocks?: unknown;
  isActive: boolean;
  showInFooter: boolean;
  showInMenu?: boolean;
  metaDescEn?: string | null;
  metaDescHi?: string | null;
  updatedAt: string;
}

const PRESET_PAGES = [
  { slug: "about", name: "About the Kendra (संस्था परिचय)", path: "/about" },
  { slug: "founder", name: "Founder & Astrological Lineage (संस्थापक परंपरा)", path: "/founder" },
  { slug: "help", name: "Help & Frequently Asked Questions (सहायता)", path: "/help" },
  { slug: "terms", name: "Terms of Service & Astrological Ethics (नियम व शर्तें)", path: "/legal/terms" },
  { slug: "privacy", name: "Privacy Policy (गोपनीयता नीति)", path: "/legal/privacy" },
  { slug: "refund", name: "Cancellation & Refund Policy (धनवापसी नीति)", path: "/legal/refund" },
  { slug: "cancellation", name: "Cancellation Policy (रद्दीकरण नीति)", path: "/legal/cancellation" },
  { slug: "platform-guidelines", name: "Platform Guidelines (प्लेटफ़ॉर्म दिशानिर्देश)", path: "/legal/platform-guidelines" },
  { slug: "member-agreement", name: "Member Agreement (सदस्य अनुबंध)", path: "/legal/member-agreement" },
  { slug: "rules-regulations", name: "Rules & Regulations (नियम एवं विनियम)", path: "/legal/rules-regulations" },
  { slug: "guide-user", name: "Guide: User (उपयोगकर्ता मार्गदर्शिका)", path: "/guides/user" },
  { slug: "guide-associate", name: "Guide: Associate (एसोसिएट मार्गदर्शिका)", path: "/guides/associate" },
  { slug: "guide-admin", name: "Guide: Admin (एडमिन मार्गदर्शिका)", path: "/guides/admin" },
];

const field =
  "w-full min-h-[44px] px-3 py-2 bg-surface-container-low border border-outline-variant rounded text-xs focus:border-secondary focus:outline-none";
const label = "block text-xs font-bold uppercase text-on-surface-variant mb-1";

export default function AdminPagesPage() {
  const startedFromLink = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<StaticPageItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("about");
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentHi, setContentHi] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [showInFooter, setShowInFooter] = useState(false);
  const [showInMenu, setShowInMenu] = useState(false);
  const [metaDescEn, setMetaDescEn] = useState("");
  const [metaDescHi, setMetaDescHi] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const customPages = pages.filter((p) => !isCorePageSlug(p.slug));
  const isCore = isCorePageSlug(selectedSlug);
  const selectedPage = pages.find((p) => p.slug === selectedSlug);

  const loadSlugData = (slug: string, pagesList: StaticPageItem[]) => {
    const existing = pagesList.find((p) => p.slug === slug);
    const legalDef = LEGAL_DEFAULTS[slug];
    if (legalDef && (!existing || isSeedStub(existing.contentEn))) {
      setTitleEn(legalDef.titleEn);
      setTitleHi(legalDef.titleHi);
      setContentEn(legalDef.contentEn);
      setContentHi(legalDef.contentHi);
      setBlocks(normalizeBlocks(existing?.blocks));
      setIsActive(existing ? existing.isActive : true);
      setShowInFooter(existing ? existing.showInFooter : false);
      setShowInMenu(!!existing?.showInMenu);
      setMetaDescEn(existing?.metaDescEn || "");
      setMetaDescHi(existing?.metaDescHi || "");
    } else if (existing) {
      setTitleEn(existing.titleEn);
      setTitleHi(existing.titleHi);
      setContentEn(existing.contentEn);
      setContentHi(existing.contentHi);
      setBlocks(normalizeBlocks(existing.blocks));
      setIsActive(existing.isActive);
      setShowInFooter(existing.showInFooter);
      setShowInMenu(!!existing.showInMenu);
      setMetaDescEn(existing.metaDescEn || "");
      setMetaDescHi(existing.metaDescHi || "");
    } else if (GUIDE_SLUGS.some((g) => guidePageSlug(g) === slug)) {
      const guide = DEFAULT_GUIDES[slug.replace("guide-", "") as keyof typeof DEFAULT_GUIDES];
      setTitleEn(guide.titleEn);
      setTitleHi(guide.titleHi);
      setContentEn(guide.contentEn);
      setContentHi(guide.contentHi);
      setBlocks([]);
      setIsActive(true);
      setShowInFooter(false);
    } else {
      const preset = PRESET_PAGES.find((p) => p.slug === slug);
      setTitleEn(preset ? preset.name.split(" (")[0] : slug);
      setTitleHi(preset ? preset.name.split("(")[1]?.replace(")", "") || slug : slug);
      setContentEn(`${slug}: content coming soon.`);
      setContentHi(`${slug}: विवरण शीघ्र उपलब्ध होगा।`);
      setBlocks([]);
      setIsActive(true);
      setShowInFooter(false);
    }
  };

  const fetchPages = async (slugToLoad?: string) => {
    try {
      const res = await fetch("/api/admin/pages");
      const data = await res.json();
      if (res.ok) {
        setPages(data.pages || []);
        loadSlugData(slugToLoad || selectedSlug, data.pages || []);
      } else {
        setError(data.error || "Failed to load pages");
      }
    } catch {
      setError("Error loading pages");
    }
  };

  useEffect(() => {
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSlug = (slug: string) => {
    setCreating(false);
    setSelectedSlug(slug);
    loadSlugData(slug, pages);
    setError(null);
    setSuccess(null);
  };

  const startNewPage = () => {
    setCreating(true);
    setNewSlug("");
    setSelectedSlug("");
    setTitleEn("");
    setTitleHi("");
    setContentEn("");
    setContentHi("");
    setBlocks([]);
    setIsActive(true);
    setShowInFooter(true);
    setShowInMenu(true);
    setMetaDescEn("");
    setMetaDescHi("");
    setSlugTouched(false);
    setError(null);
    setSuccess(null);
  };

  // Arrived from "Add a new page" elsewhere in the admin (address ends with ?new=1)
  useEffect(() => {
    if (startedFromLink.current) return;
    startedFromLink.current = true;
    if (new URLSearchParams(window.location.search).get("new") === "1") startNewPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = creating ? newSlug.trim().toLowerCase() : selectedSlug;
    if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
      setError("The page address may contain only lowercase letters, numbers and hyphens (at least 2 characters).");
      return;
    }
    if (creating && (isCorePageSlug(slug) || pages.some((p) => p.slug === slug))) {
      setError("A page with this address already exists.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          titleEn,
          titleHi,
          contentEn,
          contentHi,
          blocks,
          isActive,
          showInFooter,
          showInMenu,
          metaDescEn: metaDescEn.trim() || null,
          metaDescHi: metaDescHi.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Page "${slug}" saved`);
        setCreating(false);
        setSelectedSlug(slug);
        await fetchPages(slug);
      } else {
        const detail = data.details?.fieldErrors ? Object.values(data.details.fieldErrors).flat().join(" ") : "";
        setError(`${data.error || "Failed to save page"} ${detail}`.trim());
      }
    } catch {
      setError("Error saving page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPage || isCore) return;
    if (!window.confirm(`Remove the page "${selectedPage.titleEn}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/pages/${selectedPage.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove page");
      setSuccess("Page removed");
      setSelectedSlug("about");
      await fetchPages("about");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove page");
    }
  };

  // Every page in tab order, for Previous / Next
  const tabs = [...PRESET_PAGES, ...customPages.map((p) => ({ slug: p.slug, name: `${p.titleEn} (custom)`, path: `/pages/${p.slug}` }))];
  const tabIndex = creating ? -1 : tabs.findIndex((t) => t.slug === selectedSlug);
  const step = (dir: -1 | 1) => {
    const next = tabs[tabIndex + dir];
    if (next) handleSelectSlug(next.slug);
  };
  const startEdit = () => {
    titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    titleRef.current?.focus();
  };

  // Built-in pages (legal, about, guides) cannot be removed from the site: "delete" returns them to the standard text
  const handleReset = async () => {
    if (!selectedPage || !isCore) return;
    if (!window.confirm(`Delete your saved changes to "${selectedPage.titleEn}" and go back to the standard text? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/pages/${selectedPage.id}?reset=1`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset the page");
      setSuccess("Your changes were deleted. The standard text is shown again.");
      await fetchPages(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the page");
    }
  };

  const publicPath = isCore
    ? PRESET_PAGES.find((p) => p.slug === selectedSlug)?.path
    : selectedSlug
      ? `/pages/${selectedSlug}`
      : undefined;

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="font-serif text-2xl font-bold text-secondary">स्थैतिक पृष्ठ संपादक • Pages CMS</h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Edit the text of About, Help and Legal pages, add images, YouTube videos and links as blocks, and create your own pages for the footer Quick Links.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded bg-error-container/20 border border-error text-on-error-container text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/40">
        {[...PRESET_PAGES, ...customPages.map((p) => ({ slug: p.slug, name: `${p.titleEn} (custom)`, path: `/pages/${p.slug}` }))].map((preset) => {
          const isSelected = !creating && selectedSlug === preset.slug;
          const saved = pages.some((p) => p.slug === preset.slug);
          return (
            <button
              key={preset.slug}
              type="button"
              onClick={() => handleSelectSlug(preset.slug)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected ? "bg-brand text-on-brand" : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              <span>{preset.name}</span>
              {saved && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={startNewPage}
          className={`min-h-[44px] px-3.5 py-1.5 rounded text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border border-maroon ${
            creating ? "bg-brand text-on-brand" : "bg-surface text-secondary hover:bg-gold"
          }`}
        >
          <Plus className="w-4 h-4" /> New page
        </button>
      </div>

      {!creating && (
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Page actions">
          <button type="button" onClick={() => step(-1)} disabled={tabIndex <= 0} className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded border border-outline-variant bg-surface text-xs font-bold text-secondary hover:bg-surface-container-high disabled:opacity-40">
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs font-semibold text-on-surface-variant">{tabIndex >= 0 ? `${tabIndex + 1} of ${tabs.length}` : ""}</span>
          <button type="button" onClick={() => step(1)} disabled={tabIndex < 0 || tabIndex >= tabs.length - 1} className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded border border-outline-variant bg-surface text-xs font-bold text-secondary hover:bg-surface-container-high disabled:opacity-40">
            Next <ArrowRight className="w-4 h-4" />
          </button>
          <span className="mx-1 hidden h-6 w-px bg-outline-variant sm:block" aria-hidden="true" />
          <button type="button" onClick={startEdit} className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded border border-outline-variant bg-surface text-xs font-bold text-secondary hover:bg-surface-container-high">
            <Pencil className="w-4 h-4" /> Edit this page
          </button>
          {isCore && selectedPage && (
            <button type="button" onClick={handleReset} className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded border border-error text-xs font-bold text-on-error-container hover:bg-error-container">
              <RotateCcw className="w-4 h-4" /> Delete my changes (standard text)
            </button>
          )}
          {!isCore && selectedPage && (
            <button type="button" onClick={handleDelete} className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded border border-error text-xs font-bold text-on-error-container hover:bg-error-container">
              <Trash2 className="w-4 h-4" /> Delete page
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-surface rounded-lg p-6 border-2 border-secondary/20 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {creating ? "New page" : `Editing: ${publicPath || selectedSlug}`}
            </span>
            <h2 className="font-serif text-lg font-bold text-secondary">{titleEn || "Untitled page"}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {!creating && publicPath && (
              <a href={publicPath} target="_blank" rel="noreferrer" className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded border border-maroon text-xs font-bold text-secondary hover:bg-gold">
                <ExternalLink className="w-4 h-4" /> View page
              </a>
            )}
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Page"}</span>
            </button>
          </div>
        </div>

        {creating && (
          <div>
            <label className={label}>Page address * (made from the title; you may change it)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-on-surface-variant">/pages/</span>
              <input type="text" required value={newSlug} onChange={(e) => { setSlugTouched(true); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} placeholder="our-process" className={field + " font-mono max-w-xs"} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className={label}>Title (English) *</label>
              <input ref={titleRef} type="text" required value={titleEn} onChange={(e) => { setTitleEn(e.target.value); if (creating && !slugTouched) setNewSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)); }} className={field} />
            </div>
            <div>
              <label className={label}>Page text (English) *</label>
              <LinkTextarea rows={12} value={contentEn} onChange={(v) => setContentEn(v)} className="w-full p-3 text-xs bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:outline-none" required />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className={label}>शीर्षक (हिन्दी) *</label>
              <input type="text" required value={titleHi} onChange={(e) => setTitleHi(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>पृष्ठ का पाठ (हिन्दी) *</label>
              <LinkTextarea rows={12} value={contentHi} onChange={(v) => setContentHi(v)} className="w-full p-3 text-xs bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:outline-none" required />
            </div>
          </div>
        </div>

        <BlocksEditor blocks={blocks} onChange={setBlocks} />

        {!isCore && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={label}>Search engine description (English, optional)</label>
              <textarea rows={2} maxLength={300} value={metaDescEn} onChange={(e) => setMetaDescEn(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>सर्च इंजन विवरण (हिन्दी, वैकल्पिक)</label>
              <textarea rows={2} maxLength={300} value={metaDescHi} onChange={(e) => setMetaDescHi(e.target.value)} className={field} />
            </div>
          </div>
        )}

        {!isCore && (
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
              Active (page is visible)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={showInMenu} onChange={(e) => setShowInMenu(e.target.checked)} className="w-4 h-4" />
              Show in the top menu (More list and phone menu)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={showInFooter} onChange={(e) => setShowInFooter(e.target.checked)} className="w-4 h-4" />
              Show in footer Quick Links
            </label>
          </div>
        )}

        <div className="sticky bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))] xl:bottom-12 z-30 bg-surface/95 backdrop-blur border-t border-outline-variant/40 -mx-2 px-2 py-3">
          <button type="submit" disabled={saving} className="min-h-[44px] px-6 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs uppercase tracking-wider rounded flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Page"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
