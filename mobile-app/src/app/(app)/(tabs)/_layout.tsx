import { StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function icon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, focused, size }: { color: unknown; focused: boolean; size: number }) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color as string} />;
  };
}

/**
 * The main tabs. A customer sees Home, Services, Orders, Vault and Account. An Associate sees a Dashboard
 * (referrals and earnings) in place of Orders; the orders stay reachable from Home.
 */
export default function TabsLayout() {
  const { t } = useLanguage();
  const { user } = useSession();
  const insets = useSafeAreaInsets();
  const isAssociate = user?.role === "ASSOCIATE";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.outline,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: [styles.bar, { height: 60 + insets.bottom, paddingBottom: insets.bottom + 6 }],
        sceneStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabHome"), tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="services" options={{ title: t("tabServices"), tabBarIcon: icon("sparkles", "sparkles-outline") }} />
      <Tabs.Screen name="orders" options={{ title: t("tabOrders"), tabBarIcon: icon("receipt", "receipt-outline"), href: isAssociate ? null : undefined }} />
      <Tabs.Screen name="dashboard" options={{ title: t("tabDashboard"), tabBarIcon: icon("stats-chart", "stats-chart-outline"), href: isAssociate ? undefined : null }} />
      <Tabs.Screen name="vault" options={{ title: t("tabVault"), tabBarIcon: icon("folder-open", "folder-open-outline") }} />
      <Tabs.Screen name="account" options={{ title: t("tabAccount"), tabBarIcon: icon("person", "person-outline") }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderTopColor: colors.outlineVariant,
    borderTopWidth: 1,
    paddingTop: 6,
    elevation: 12,
    shadowColor: "#40241C",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
});
