import { useEffect, useRef, useState } from "react";
import { Animated, Easing, FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { FadeIn, Picture } from "@/components/ContentKit";
import { Button, Card, SectionTitle } from "@/components/ui";
import { imageUri, offerValue, plainText } from "@/lib/content";
import { isOn, pickText, type HomeContent } from "@/lib/home";
import { ABOUT, HEADINGS, HOME_SLIDES, STEPS, TIPS, WHY, type Item, type Pair } from "@/lib/homeDefaults";
import { useLanguage } from "@/lib/i18n";
import { openLink, whatsappUrl } from "@/lib/links";
import { formatPaise } from "@/lib/validation";
import { colors, radius, shadow, space } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Values = HomeContent["extras"];

const lang1 = (l: string) => (l === "hi" ? "hi" : "en");

/** The title and text of a numbered block (for example why1Title, why1Text): the admin's words, else the app's own. */
function items(values: Values, prefix: string, defaults: Item[], lang: "hi" | "en", count = defaults.length): { icon: IconName; title: string; text: string }[] {
  return defaults.slice(0, count).map((d, i) => ({
    icon: d.icon as IconName,
    title: pickText(values, `${prefix}${i + 1}Title`, lang, d.title[lang]),
    text: pickText(values, `${prefix}${i + 1}Text`, lang, d.text[lang]),
  }));
}

/** A coloured heading with the small gold bar, using the admin's heading when there is one. */
function Heading({ values, k, fallback, lang }: { values: Values; k: string; fallback: Pair; lang: "hi" | "en" }) {
  return <SectionTitle>{k ? pickText(values, k, lang, fallback[lang]) : fallback[lang]}</SectionTitle>;
}

/* ---------- Banner slides ---------- */

export function SlideShow({ data }: { data: HomeContent }) {
  const { lang, t } = useLanguage();
  const l = lang1(lang);
  const { width } = useWindowDimensions();
  const slideWidth = width - space.lg * 2;
  const list = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const slides = data.slides.length
    ? data.slides.map((s) => ({
        key: s.id,
        image: imageUri(s.imageUrl),
        title: l === "hi" ? s.titleHi || s.titleEn : s.titleEn || s.titleHi,
        text: l === "hi" ? s.descHi || s.descEn : s.descEn || s.descHi,
        color: s.titleColor && /^#[0-9a-fA-F]{6}$/.test(s.titleColor) ? s.titleColor : colors.goldSoft,
        go: () => (s.serviceSlug ? router.push({ pathname: "/service/[slug]", params: { slug: s.serviceSlug as string } }) : s.youtubeUrl ? Linking.openURL(s.youtubeUrl).catch(() => undefined) : router.push("/services")),
        cta: s.youtubeUrl && !s.serviceSlug ? t("watchVideo") : t("bookNow"),
      }))
    : HOME_SLIDES.map((d, i) => ({
        key: `d${i}`,
        image: imageUri(String(i === 0 ? data.hero.image1 || d.image : data.hero.image2 || d.image)),
        title: d.title[l],
        text: d.text[l],
        color: colors.goldSoft as string,
        go: () => openLink(i === 0 ? String(data.hero.cta1Url || "/services") : String(data.hero.cta2Url || "/kundli")),
        cta: i === 0 ? pickText(data.hero, "cta1Label", l, t("bookNow")) : pickText(data.hero, "cta2Label", l, t("kundliTool")),
      }));

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        list.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5500);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <View>
      <FlatList
        ref={list}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth + space.md}
        decelerationRate="fast"
        contentContainerStyle={{ gap: space.md, paddingHorizontal: space.lg }}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (slideWidth + space.md)))}
        getItemLayout={(_, i) => ({ length: slideWidth + space.md, offset: (slideWidth + space.md) * i, index: i })}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={item.go} style={[styles.slide, { width: slideWidth }]}>
            {item.image ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
            <LinearGradient colors={["rgba(40,12,8,0.15)", "rgba(40,12,8,0.88)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.slideBody}>
              <Text serif style={[styles.slideTitle, { color: item.color }]} numberOfLines={3}>
                {item.title}
              </Text>
              {item.text ? (
                <Text style={styles.slideText} numberOfLines={3}>
                  {item.text}
                </Text>
              ) : null}
              <View style={styles.slideCta}>
                <Text style={styles.slideCtaText}>{item.cta}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.maroonDeep} />
              </View>
            </View>
          </Pressable>
        )}
      />
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* ---------- Notice strip ---------- */

export function NoticeStrip({ notices }: { notices: HomeContent["notices"] }) {
  const { lang } = useLanguage();
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  const text = notices.map((n) => (lang === "hi" ? n.textHi || n.textEn : n.textEn || n.textHi)).filter(Boolean).join("   •   ");

  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const loop = Animated.loop(Animated.timing(x, { toValue: -w, duration: Math.max(12000, w * 22), easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [w, x, text]);

  if (!text) return null;
  return (
    <View style={styles.strip} accessibilityRole="text" accessibilityLabel={text}>
      <Ionicons name="megaphone" size={16} color={colors.gold} style={{ marginHorizontal: space.md }} />
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Animated.View style={{ flexDirection: "row", transform: [{ translateX: x }] }}>
          <Text style={styles.stripText} numberOfLines={1} onLayout={(e) => setW(e.nativeEvent.layout.width + 48)}>
            {text}
          </Text>
          <Text style={[styles.stripText, { marginLeft: 48 }]} numberOfLines={1}>
            {text}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

/* ---------- Offers ---------- */

export function OffersRow({ data }: { data: HomeContent }) {
  const { t, lang, pick } = useLanguage();
  const [copied, setCopied] = useState("");
  if (!data.offers.length) return null;
  return (
    <View style={{ gap: space.md }}>
      <SectionTitle
        action={
          <Pressable onPress={() => router.push("/explore/offers" as never)} accessibilityRole="button">
            <Text style={styles.seeAll}>{t("seeAll")}</Text>
          </Pressable>
        }
      >
        {HEADINGS.offers[lang1(lang)]}
      </SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingRight: space.lg }}>
        {data.offers.map((o, i) => (
          <FadeIn key={o.id} index={i}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={o.code}
              onPress={async () => {
                if (o.autoApply) return router.push("/services");
                await Clipboard.setStringAsync(o.code);
                setCopied(o.id);
              }}
              style={styles.offer}
            >
              <LinearGradient colors={["#D95A24", "#A51F1B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.offerValue}>{offerValue(o, formatPaise, t("off"), t("maxOff"))}</Text>
              <Text style={styles.offerTitle} numberOfLines={2}>
                {pick(o.titleEn, o.titleHi)}
              </Text>
              <View style={styles.offerCode}>
                <Text style={styles.offerCodeText}>{o.autoApply ? t("autoApplied") : copied === o.id ? t("codeCopied") : o.code}</Text>
              </View>
            </Pressable>
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------- Other services (Puja, Vastu, ...) ---------- */

export function OtherServicesRow({ data }: { data: HomeContent }) {
  const { t, lang, pick } = useLanguage();
  if (!data.otherServices.length) return null;
  const heading = pickText(data.servicesCfg, "connectedTitle", lang1(lang), HEADINGS.other[lang1(lang)]);
  return (
    <View style={{ gap: space.md }}>
      <SectionTitle>{heading}</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingRight: space.lg }}>
        {data.otherServices.map((o, i) => {
          const title = pick(o.titleEn, o.titleHi);
          return (
            <FadeIn key={o.slug} index={i}>
              <View style={styles.other}>
                <View style={styles.otherPic}>
                  <Picture src={o.imageUrl ?? "/ref/astrology.webp"} height={110} />
                </View>
                <View style={{ padding: space.md, gap: space.xs, flex: 1 }}>
                  <Text style={styles.otherTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.otherText} numberOfLines={3}>
                    {plainText(pick(o.descEn, o.descHi))}
                  </Text>
                </View>
                <View style={{ padding: space.md, paddingTop: 0 }}>
                  <Button
                    label={t("consultNow")}
                    variant="outline"
                    onPress={() => Linking.openURL(whatsappUrl(data.contact.whatsapp, `${pickText(data.app, "whatsappMessage", lang1(lang), t("waHello"))} ${title}`)).catch(() => undefined)}
                  />
                </View>
              </View>
            </FadeIn>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ---------- About ---------- */

export function AboutBlock({ data }: { data: HomeContent }) {
  const { t, lang } = useLanguage();
  const l = lang1(lang);
  const c = data.cards;
  const points = items(c, "feature", ABOUT.points, l);
  return (
    <FadeIn>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Picture src={(c.aboutImage as string | null) ?? "/ref/about.webp"} height={170} />
        <View style={{ padding: space.lg, gap: space.md }}>
          <Text style={styles.eyebrow}>{pickText(c, "aboutLabel", l, t("aboutUs")).toUpperCase()}</Text>
          <Text serif style={styles.blockTitle}>
            {pickText(c, "aboutTitle", l, ABOUT.title[l])}
          </Text>
          <Text style={styles.body}>{plainText(pickText(c, "aboutIntro", l, ABOUT.text[l]))}</Text>
          {points.map((p) => (
            <View key={p.title} style={styles.point}>
              <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{p.title}</Text>
                <Text style={styles.pointText}>{p.text}</Text>
              </View>
            </View>
          ))}
          <Button label={t("moreAbout")} variant="outline" onPress={() => router.push("/explore/about" as never)} />
        </View>
      </Card>
    </FadeIn>
  );
}

/* ---------- Why us / steps / tips ---------- */

function IconGrid({ list, columns }: { list: { icon: IconName; title: string; text: string }[]; columns: 1 | 2 }) {
  return (
    <View style={styles.grid}>
      {list.map((it, i) => (
        <FadeIn key={it.title} index={i}>
          <View style={[styles.gridCell, columns === 2 && { width: "100%" }]}>
            <View style={styles.gridIcon}>
              <Ionicons name={it.icon} size={22} color={colors.maroon} />
            </View>
            <Text style={styles.pointTitle}>{it.title}</Text>
            <Text style={styles.pointText}>{it.text}</Text>
          </View>
        </FadeIn>
      ))}
    </View>
  );
}

export function WhyBlock({ data }: { data: HomeContent }) {
  const { lang } = useLanguage();
  const l = lang1(lang);
  return (
    <View style={{ gap: space.md }}>
      <Heading values={data.extras} k={HEADINGS.why.key} fallback={HEADINGS.why} lang={l} />
      <IconGrid list={items(data.extras, "why", WHY, l)} columns={2} />
    </View>
  );
}

export function StepsBlock({ data }: { data: HomeContent }) {
  const { lang, t } = useLanguage();
  const l = lang1(lang);
  const list = items(data.process, "step", STEPS, l);
  return (
    <View style={{ gap: space.md }}>
      <Heading values={data.process} k={HEADINGS.steps.key} fallback={HEADINGS.steps} lang={l} />
      <Card>
        {list.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.stepNo}>
              <Text style={styles.stepNoText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointTitle}>{s.title}</Text>
              <Text style={styles.pointText}>{s.text}</Text>
            </View>
          </View>
        ))}
        <Button label={t("startBooking")} onPress={() => router.push("/services")} />
      </Card>
    </View>
  );
}

export function TipsBlock({ data }: { data: HomeContent }) {
  const { lang } = useLanguage();
  const l = lang1(lang);
  return (
    <View style={{ gap: space.md }}>
      <Heading values={data.extras} k={HEADINGS.tips.key} fallback={HEADINGS.tips} lang={l} />
      <IconGrid list={items(data.extras, "tip", TIPS, l)} columns={2} />
    </View>
  );
}

/* ---------- Reviews, articles, gallery, FAQ ---------- */

export function ReviewsBlock({ data }: { data: HomeContent }) {
  const { lang, pick, t } = useLanguage();
  const l = lang1(lang);
  const { width } = useWindowDimensions();
  if (!data.testimonials.length) return null;
  return (
    <View style={{ gap: space.md }}>
      <SectionTitle
        action={
          <Pressable onPress={() => router.push("/explore/testimonials" as never)} accessibilityRole="button">
            <Text style={styles.seeAll}>{t("seeAll")}</Text>
          </Pressable>
        }
      >
        {pickText(data.contactCfg, "reviewsTitle", l, HEADINGS.reviews[l])}
      </SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingRight: space.lg }}>
        {data.testimonials.map((x, i) => (
          <FadeIn key={x.id} index={i}>
            <Card style={{ width: width * 0.78, minHeight: 180 }}>
              <View style={{ flexDirection: "row", gap: 2 }}>
                {Array.from({ length: 5 }, (_, k) => (
                  <Ionicons key={k} name={k < x.rating ? "star" : "star-outline"} size={15} color={colors.gold} />
                ))}
              </View>
              <Text style={styles.quote} numberOfLines={5}>{`“${pick(x.quoteEn, x.quoteHi)}”`}</Text>
              <Text style={styles.pointTitle}>{pick(x.authorNameEn, x.authorNameHi)}</Text>
              <Text style={styles.pointText}>{pick(x.cityEn, x.cityHi)}</Text>
            </Card>
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}

export function PostsBlock({ data }: { data: HomeContent }) {
  const { lang, pick, t } = useLanguage();
  const l = lang1(lang);
  if (!data.posts.length) return null;
  return (
    <View style={{ gap: space.md }}>
      <SectionTitle
        action={
          <Pressable onPress={() => router.push("/explore/blogs" as never)} accessibilityRole="button">
            <Text style={styles.seeAll}>{t("seeAll")}</Text>
          </Pressable>
        }
      >
        {pickText(data.extras, "blogTitle", l, HEADINGS.blog[l])}
      </SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingRight: space.lg }}>
        {data.posts.map((p, i) => (
          <FadeIn key={p.slug} index={i}>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/explore/blog/${encodeURIComponent(p.slug)}` as never)} style={styles.post}>
              <Picture src={p.coverImage} height={110} />
              <View style={{ padding: space.md, gap: space.xs }}>
                <Text style={styles.otherTitle} numberOfLines={2}>
                  {pick(p.titleEn, p.titleHi)}
                </Text>
                <Text style={styles.otherText} numberOfLines={2}>
                  {plainText(pick(p.excerptEn ?? "", p.excerptHi ?? ""))}
                </Text>
              </View>
            </Pressable>
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}

export function GalleryStrip({ data }: { data: HomeContent }) {
  const { lang, t } = useLanguage();
  const l = lang1(lang);
  if (!data.gallery.length) return null;
  return (
    <View style={{ gap: space.md }}>
      <SectionTitle
        action={
          <Pressable onPress={() => router.push("/explore/gallery" as never)} accessibilityRole="button">
            <Text style={styles.seeAll}>{t("seeAll")}</Text>
          </Pressable>
        }
      >
        {pickText(data.process, "galleryTitle", l, HEADINGS.gallery[l])}
      </SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingRight: space.lg }}>
        {data.gallery.map((g) => (
          <Pressable key={g.id} accessibilityRole="imagebutton" onPress={() => router.push("/explore/gallery" as never)} style={styles.galleryCell}>
            <Picture src={g.imageUrl} height={120} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function FaqBlock({ data }: { data: HomeContent }) {
  const { lang, pick, t } = useLanguage();
  const l = lang1(lang);
  const [open, setOpen] = useState<string | null>(null);
  if (!data.faqs.length) return null;
  return (
    <View style={{ gap: space.md }}>
      <SectionTitle>{pickText(data.contactCfg, "faqTitle", l, HEADINGS.faq[l])}</SectionTitle>
      {data.faqs.slice(0, 4).map((q) => (
        <Card key={q.id} style={{ padding: 0 }}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: open === q.id }} onPress={() => setOpen(open === q.id ? null : q.id)} style={styles.faqRow}>
            <Text style={[styles.pointTitle, { flex: 1 }]}>{pick(q.questionEn, q.questionHi)}</Text>
            <Ionicons name={open === q.id ? "chevron-up" : "chevron-down"} size={18} color={colors.primary} />
          </Pressable>
          {open === q.id ? <Text style={[styles.pointText, { padding: space.lg, paddingTop: 0 }]}>{plainText(pick(q.answerEn, q.answerHi))}</Text> : null}
        </Card>
      ))}
      <Button label={t("allQuestions")} variant="outline" onPress={() => router.push("/explore/faq" as never)} />
    </View>
  );
}

/* ---------- Contact block and floating buttons ---------- */

export function ContactBlock({ data }: { data: HomeContent }) {
  const { lang, t } = useLanguage();
  const l = lang1(lang);
  const c = data.contact;
  return (
    <FadeIn>
      <LinearGradient colors={["#800000", "#5C0000"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.contact}>
        <Text style={styles.contactEyebrow}>{pickText(data.contactCfg, "contactLabel", l, t("contactTitle")).toUpperCase()}</Text>
        <Text serif style={styles.contactTitle}>
          {pickText(data.contactCfg, "contactTitle", l, HEADINGS.contact[l])}
        </Text>
        <Text style={styles.contactText}>{plainText(pickText(data.contactCfg, "contactIntro", l, t("contactIntroDefault")))}</Text>
        <Text style={styles.contactPhone}>{c.phone}</Text>
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Button label={t("callUs")} onPress={() => Linking.openURL(`tel:${c.phone.replace(/[^\d+]/g, "")}`).catch(() => undefined)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="WhatsApp" variant="outline" onPress={() => Linking.openURL(whatsappUrl(c.whatsapp, pickText(data.app, "whatsappMessage", l, t("waHello")))).catch(() => undefined)} />
          </View>
        </View>
      </LinearGradient>
    </FadeIn>
  );
}

/** Round Call and WhatsApp buttons floating at the bottom corner of Home, each switched on or off by the admin. */
export function FloatingButtons({ data }: { data: HomeContent }) {
  const { lang, t } = useLanguage();
  const l = lang1(lang);
  const showCall = isOn(data.app, "showCallButton");
  const showWa = isOn(data.app, "showWhatsappButton");
  if (!showCall && !showWa) return null;
  return (
    <View style={styles.fabs} pointerEvents="box-none">
      {showWa ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="WhatsApp"
          onPress={() => Linking.openURL(whatsappUrl(data.contact.whatsapp, pickText(data.app, "whatsappMessage", l, t("waHello")))).catch(() => undefined)}
          style={[styles.fab, { backgroundColor: "#25A244" }]}
        >
          <Ionicons name="logo-whatsapp" size={26} color="#fff" />
        </Pressable>
      ) : null}
      {showCall ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t("callUs")} onPress={() => Linking.openURL(`tel:${data.contact.phone.replace(/[^\d+]/g, "")}`).catch(() => undefined)} style={[styles.fab, { backgroundColor: colors.brand }]}>
          <Ionicons name="call" size={24} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { height: 260, borderRadius: radius.xl, overflow: "hidden", backgroundColor: colors.maroon, justifyContent: "flex-end", ...shadow.strong },
  slideBody: { padding: space.lg, gap: space.sm },
  slideTitle: { fontSize: 26, lineHeight: 31 },
  slideText: { fontSize: 13, color: "#fff", opacity: 0.9, lineHeight: 19 },
  slideCta: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm, marginTop: space.xs },
  slideCtaText: { fontSize: 13, fontWeight: "700", color: colors.maroonDeep },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: space.sm },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.outlineVariant },
  dotOn: { width: 20, backgroundColor: colors.brand },
  strip: { flexDirection: "row", alignItems: "center", backgroundColor: colors.maroon, borderRadius: radius.md, height: 38, overflow: "hidden" },
  stripText: { fontSize: 13, fontWeight: "600", color: colors.onMaroon },
  seeAll: { fontSize: 13, fontWeight: "600", color: colors.primary },
  offer: { width: 220, minHeight: 130, borderRadius: radius.lg, padding: space.lg, gap: space.sm, overflow: "hidden", justifyContent: "space-between", ...shadow.card },
  offerValue: { fontSize: 22, fontWeight: "700", color: "#fff" },
  offerTitle: { fontSize: 13, color: "#fff", opacity: 0.92 },
  offerCode: { alignSelf: "flex-start", borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.goldSoft, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: 4 },
  offerCodeText: { fontSize: 13, fontWeight: "700", color: colors.goldSoft, letterSpacing: 1 },
  other: { width: 220, backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.outlineVariant, ...shadow.card },
  otherPic: { width: "100%" },
  otherTitle: { fontSize: 15, fontWeight: "700", color: colors.heading, lineHeight: 21 },
  otherText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  eyebrow: { fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 1.2 },
  blockTitle: { fontSize: 26, color: colors.heading, lineHeight: 31 },
  body: { fontSize: 14, color: colors.text, lineHeight: 22 },
  point: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  pointTitle: { fontSize: 14, fontWeight: "700", color: colors.heading, lineHeight: 20 },
  pointText: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19, marginTop: 2 },
  grid: { gap: space.md },
  gridCell: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.xs, borderWidth: 1, borderColor: colors.outlineVariant, ...shadow.card },
  gridIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center", marginBottom: space.xs },
  step: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  stepNo: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.maroon, alignItems: "center", justifyContent: "center" },
  stepNoText: { fontSize: 14, fontWeight: "700", color: colors.gold },
  quote: { fontSize: 14, lineHeight: 22, color: colors.text, fontStyle: "italic" },
  post: { width: 230, backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.outlineVariant, ...shadow.card },
  galleryCell: { width: 150, borderRadius: radius.lg, overflow: "hidden" },
  faqRow: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg },
  contact: { borderRadius: radius.xl, padding: space.xl, gap: space.md },
  contactEyebrow: { fontSize: 11, fontWeight: "700", color: colors.gold, letterSpacing: 1.4 },
  contactTitle: { fontSize: 28, color: colors.onMaroon, lineHeight: 33 },
  contactText: { fontSize: 13, color: colors.onMaroon, opacity: 0.85, lineHeight: 20 },
  contactPhone: { fontSize: 26, fontWeight: "700", color: colors.gold },
  fabs: { position: "absolute", right: space.lg, bottom: space.lg, gap: space.md, alignItems: "center" },
  fab: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", ...shadow.strong },
});
