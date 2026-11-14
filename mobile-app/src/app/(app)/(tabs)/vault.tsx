import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { Button, EmptyState, ErrorText, Pill, SkeletonList, TapCard } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatDay } from "@/lib/booking";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { MAX_UPLOAD_BYTES, formatSize, iconFor, openVaultFile, type VaultFile } from "@/lib/vault";
import { colors, radius, space } from "@/theme";

/** The person's private documents: reports sent by the Kendra and files they uploaded. */
export default function VaultGate() {
  const { user } = useSession();
  const { t } = useLanguage();
  return user ? <VaultScreen /> : <SignInPrompt title={t("guestVaultTitle")} />;
}

function VaultScreen() {
  const { api } = useSession();
  const { t, lang, pick } = useLanguage();
  const [files, setFiles] = useState<VaultFile[] | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busyId, setBusyId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setFiles((await api.request<{ files: VaultFile[] }>("/api/mobile/v1/vault")).files);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setFiles((f) => f ?? []);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (file: VaultFile) => {
    setError("");
    setInfo("");
    setBusyId(file.id);
    try {
      await openVaultFile(api, file, pick(file.titleEn, file.titleHi));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId("");
    }
  };

  const upload = async () => {
    setError("");
    setInfo("");
    const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    if (asset.size && asset.size > MAX_UPLOAD_BYTES) {
      setError(t("fileTooBig"));
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType || "application/octet-stream" } as unknown as Blob);
      form.append("title", asset.name.replace(/\.[^.]+$/, ""));
      await api.request("/api/vault/upload", { method: "POST", body: form, timeoutMs: 90000 });
      setInfo(t("fileUploaded"));
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: space.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.brand}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <Hero title={t("vaultTitle")} subtitle={t("vaultNote")} right={<LangChip />} />
      <View style={styles.body}>
        <Button label={t("uploadFile")} variant="outline" onPress={upload} busy={uploading} />
        <ErrorText>{error}</ErrorText>
        {info ? <Text style={styles.ok}>{info}</Text> : null}
        {files === null ? <SkeletonList count={3} /> : null}
        {files?.length === 0 ? <EmptyState title={t("vaultEmpty")} note={t("vaultEmptyNote")} /> : null}
        {files?.map((f) => (
          <TapCard key={f.id} onPress={() => (busyId ? undefined : open(f))} style={styles.file}>
            <View style={styles.icon}>
              <Ionicons name={iconFor(f.mimeType)} size={24} color={colors.maroon} />
            </View>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text style={styles.title} numberOfLines={2}>
                {pick(f.titleEn, f.titleHi)}
              </Text>
              <Text style={styles.meta}>
                {formatSize(f.fileSize)} · {formatDay(f.uploadedAt.slice(0, 10), lang)}
              </Text>
              <Pill label={f.uploadedByRole === "ADMIN" ? t("fromKendra") : t("uploadedByYou")} tone={f.uploadedByRole === "ADMIN" ? "brand" : "neutral"} />
            </View>
            {busyId === f.id ? <Text style={styles.meta}>{t("loading")}</Text> : <Ionicons name="open-outline" size={20} color={colors.outline} />}
          </TapCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md },
  file: { flexDirection: "row", alignItems: "center", gap: space.md },
  icon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "600", color: colors.heading, lineHeight: 21 },
  meta: { fontSize: 12, color: colors.textMuted },
  ok: { fontSize: 14, color: colors.success, fontWeight: "500" },
});
