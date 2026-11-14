import { Stack } from "expo-router";
import { useLanguage } from "@/lib/i18n";
import { colors, fonts } from "@/theme";

/** The signed-in part of the app: the main tabs, and the screens that open over them. */
export default function AppLayout() {
  const { t } = useLanguage();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.maroon },
        headerTintColor: colors.onMaroon,
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="service/[slug]" options={{ title: t("services") }} />
      <Stack.Screen name="book" options={{ title: t("bookingTitle") }} />
      <Stack.Screen name="pay/[id]" options={{ title: t("payTitle") }} />
      <Stack.Screen name="orders/[id]" options={{ title: t("orderNo") }} />
      <Stack.Screen name="tickets" options={{ title: t("support") }} />
      <Stack.Screen name="tickets/new" options={{ title: t("newTicket") }} />
      <Stack.Screen name="tickets/[id]" options={{ title: t("ticket") }} />
      <Stack.Screen name="explore/about" options={{ title: t("aboutUs") }} />
      <Stack.Screen name="explore/founder" options={{ title: t("founderTitle") }} />
      <Stack.Screen name="explore/faq" options={{ title: t("faqTitle") }} />
      <Stack.Screen name="explore/gallery" options={{ title: t("galleryTitle") }} />
      <Stack.Screen name="explore/blogs" options={{ title: t("blogsTitle") }} />
      <Stack.Screen name="explore/blog/[slug]" options={{ title: t("blogsTitle") }} />
      <Stack.Screen name="explore/testimonials" options={{ title: t("testimonialsTitle") }} />
      <Stack.Screen name="explore/offers" options={{ title: t("offersTitle") }} />
      <Stack.Screen name="explore/contact" options={{ title: t("contactTitle") }} />
      <Stack.Screen name="explore/tool/[tool]" options={{ title: t("toolsIntro") }} />
      <Stack.Screen name="explore/request/[type]" options={{ title: t("requestKundli") }} />
      <Stack.Screen name="delete-account" options={{ title: t("deleteTitle") }} />
    </Stack>
  );
}
