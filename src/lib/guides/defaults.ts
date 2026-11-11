import { ADMIN_GUIDE_EN, ADMIN_GUIDE_HI } from "./adminGuideText";
import { USER_GUIDE_EN, USER_GUIDE_HI } from "./userGuideText";
import { ASSOCIATE_GUIDE_EN, ASSOCIATE_GUIDE_HI } from "./associateGuideText";

export type GuideSlug = "user" | "associate" | "admin";

export const GUIDE_SLUGS: GuideSlug[] = ["user", "associate", "admin"];

export interface GuideContent {
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
}

/** StaticPage slug under which the admin can edit each guide. */
export const guidePageSlug = (slug: GuideSlug) => `guide-${slug}`;

/**
 * Starter guides, shown until the admin edits the matching page
 * (Admin > Pages & legal > "Guide: ..."). Pictures and videos are added in Admin > Guides & visuals.
 * They describe only what the system does.
 */
export const DEFAULT_GUIDES: Record<GuideSlug, GuideContent> = {
  user: {
    titleEn: "User Guide",
    titleHi: "उपयोगकर्ता मार्गदर्शिका",
    // The full illustrated guide as editable text (Admin > Pages & legal > Guide: User). Screens are in the PDFs.
    contentEn: USER_GUIDE_EN,
    contentHi: USER_GUIDE_HI,
  },
  associate: {
    titleEn: "Associate Guide",
    titleHi: "एसोसिएट मार्गदर्शिका",
    // The full illustrated guide as editable text (Admin > Pages & legal > Guide: Associate). Screens are in the PDFs.
    contentEn: ASSOCIATE_GUIDE_EN,
    contentHi: ASSOCIATE_GUIDE_HI,
  },
  admin: {
    titleEn: "Admin Guide",
    titleHi: "एडमिन मार्गदर्शिका",
    // The full illustrated guide as editable text (Admin > Pages & legal > Guide: Admin). Screens are in the PDFs.
    contentEn: ADMIN_GUIDE_EN,
    contentHi: ADMIN_GUIDE_HI,
  },
};
