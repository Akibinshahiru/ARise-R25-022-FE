// AllIEPReportsList.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ---------- Types ----------
type IEPReportItem = {
  id?: string;
  report_id?: string;
  student_id: string;
  student_name?: string;
  generated_at?: string;
  report_date?: string;
  report_period_start?: string;
  report_period_end?: string;

  current_performance_level?: string;
  irregular_words_avg_score?: number; // 0..1
  regular_words_avg_score?: number;   // 0..1
  total_evaluations?: number;
  intervention_rate?: number;         // 0..1

  strengths?: string[];
  improvement_areas?: string[];
  annual_goals?: string[];
  short_term_objectives?: string[];
  accommodations?: string[];
  teaching_strategies?: string[];
  progress_monitoring?: Record<string, any>;
  parent_recommendations?: string[];
  irregular_vs_regular?: Record<string, any>;
  overall_performance?: Record<string, any>;
  intervention_analysis?: Record<string, any>;
  [k: string]: any;
};

// ---------- API helpers ----------
function getIEPApiBase(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL_IEP as string) || "http://localhost:8002";
}

async function fetchAllIEPReports(): Promise<IEPReportItem[]> {
  const base = getIEPApiBase();
  const url = `${base}/reports`;
  const res = await axios.get(url, { timeout: 20000 });
  const raw = res.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.reports)) return raw.reports;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

// ---------- Utils ----------
const PURPLE = "#8b5cf6";
const DEEP_PURPLE = "#5b21b6";
const LILAC = "#eee5ff";
const YELLOW = "#facc15";

function formatDate(s?: string) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString();
  } catch {
    return s;
  }
}

function initialsFromId(id: string) {
  return (id?.slice(0, 2) || "ST").toUpperCase();
}

function percent(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  const clamped = Math.max(0, Math.min(1, n));
  return Math.round(clamped * 100);
}

function safeNum(n: any, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function list(items?: any[]): string {
  return (items || []).filter(Boolean).map(String).join(", ");
}

// ---------- PDF builder (IEP standard-ish layout) ----------
function buildIEPHtml(r: IEPReportItem): string {
  const student = r.student_name || `Student #${r.student_id?.slice(0, 8)}`;
  const rptDate = formatDate(r.report_date || r.generated_at);
  const period = `${formatDate(r.report_period_start)} — ${formatDate(r.report_period_end)}`;

  const irr = percent(safeNum(r.irregular_words_avg_score));
  const reg = percent(safeNum(r.regular_words_avg_score));
  const inter = Math.max(0, Math.min(100, Math.round((safeNum(r.intervention_rate) || 0) * 100)));

  const strengths = (r.strengths || []).map(s => `<li>${s}</li>`).join("") || "<li>—</li>";
  const improve = (r.improvement_areas || []).map(s => `<li>${s}</li>`).join("") || "<li>—</li>";
  const goals = (r.annual_goals || []).map(s => `<li>${s}</li>`).join("") || "<li>—</li>";
  const objectives = (r.short_term_objectives || []).map(s => `<li>${s}</li>`).join("") || "<li>—</li>";
  const accom = (r.accommodations || []).map(s => `<li>${s}</li>`).join("") || "<li>—</li>";
  const strategies = (r.teaching_strategies || []).map(s => `<li>${s}</li>`).join("") || "<li>—</li>";
  const parents = (r.parent_recommendations || []).map(s => `<li>${s}</li>`).join("") || "<li>—</li>";

  const pm =
    r.progress_monitoring &&
    Object.entries(r.progress_monitoring).map(([k, v]) => `<tr><td>${k}</td><td>${String(v)}</td></tr>`).join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>IEP Report</title>
<style>
  @page { size: A4; margin: 24mm 18mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, "Helvetica Neue", Arial, "Noto Sans", sans-serif; color: #1f1147; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom: 2px solid #e9d5ff; padding-bottom: 6mm; margin-bottom: 6mm; }
  .brand { font-weight:800; color:#5b21b6; }
  .title { font-size: 20pt; font-weight:900; color:#4c1d95; margin: 0; }
  .meta { color:#6b7280; font-weight:700; margin-top:2mm; }
  .section { margin-top: 8mm; }
  .section h2 { font-size: 12.5pt; color:#4c1d95; margin:0 0 3mm 0; border-left:4px solid #8b5cf6; padding-left:6px; }
  .pillrow { display:flex; gap:6px; flex-wrap:wrap; margin-top: 2mm; }
  .pill { background:#f5f3ff; border:2px solid #e9d5ff; padding:4px 8px; border-radius:999px; font-weight:900; color:#1f1147; font-size:10pt; }
  .grid { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; }
  .metric { background:#f5f3ff; border-radius:10px; padding:8px; border:1.5px solid #e9d5ff; }
  .metric .lab { color:#6b7280; font-weight:800; font-size:9pt; }
  .metric .val { font-weight:900; font-size:12pt; margin-top:2px; }
  .bar { height:10px; border-radius:6px; background:#F3F4F6; overflow:hidden; margin-top:4px; }
  .fill { height:100%; background:#8b5cf6; width:0; }
  .list { margin: 0; padding-left: 16px; }
  table { width:100%; border-collapse: collapse; }
  td, th { border:1px solid #e5e7eb; padding:6px; font-size:10pt; }
  .foot { border-top: 2px solid #e9d5ff; margin-top: 8mm; padding-top: 4mm; color:#6b7280; font-size:9pt; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Individualized Education Program (IEP) Report</h1>
      <div class="meta">Student: <strong>${student}</strong></div>
      <div class="meta">Student ID: ${r.student_id}</div>
      <div class="meta">Report Date: ${rptDate}</div>
      <div class="meta">Assessment Period: ${period}</div>
    </div>
    <div class="brand">ARise</div>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <div class="pillrow">
      <span class="pill">Performance: ${r.current_performance_level || "—"}</span>
      <span class="pill">Evaluations: ${r.total_evaluations ?? 0}</span>
    </div>
    <div class="grid" style="margin-top:6px;">
      <div class="metric"><div class="lab">Irregular Words Avg</div><div class="val">${irr}%</div></div>
      <div class="metric"><div class="lab">Regular Words Avg</div><div class="val">${reg}%</div></div>
      <div class="metric">
        <div class="lab">Intervention Rate</div>
        <div class="val">${inter}%</div>
        <div class="bar"><div class="fill" style="width:${Math.max(6, inter)}%"></div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Strengths</h2>
    <ul class="list">${strengths}</ul>
  </div>

  <div class="section">
    <h2>Areas for Improvement</h2>
    <ul class="list">${improve}</ul>
  </div>

  <div class="section">
    <h2>Annual Goals</h2>
    <ul class="list">${goals}</ul>
  </div>

  <div class="section">
    <h2>Short-Term Objectives</h2>
    <ul class="list">${objectives}</ul>
  </div>

  <div class="section">
    <h2>Accommodations</h2>
    <ul class="list">${accom}</ul>
  </div>

  <div class="section">
    <h2>Teaching Strategies</h2>
    <ul class="list">${strategies}</ul>
  </div>

  <div class="section">
    <h2>Progress Monitoring</h2>
    ${
      pm
        ? `<table><thead><tr><th>Measure</th><th>Value</th></tr></thead><tbody>${pm}</tbody></table>`
        : "<div class='meta'>No progress data available.</div>"
    }
  </div>

  <div class="section">
    <h2>Parent / Caregiver Recommendations</h2>
    <ul class="list">${parents}</ul>
  </div>

  <div class="foot">
    Generated by ARise • This IEP summary is intended to support individualized instruction for learners with reading/dyslexia needs.
  </div>
</body>
</html>
  `.trim();
}

// ---------- Component ----------
export default function AllIEPReportsList() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<IEPReportItem[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<IEPReportItem | null>(null);

  // bg floaters
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const floatC = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const mk = (v: Animated.Value, duration: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration, delay, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration, useNativeDriver: true }),
        ])
      );
    const a = mk(floatA, 6500, 0),
      b = mk(floatB, 7200, 400),
      c = mk(floatC, 8000, 900);
    a.start(); b.start(); c.start();
    return () => { a.stop(); b.stop(); c.stop(); };
  }, [floatA, floatB, floatC]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const items = await fetchAllIEPReports();
      items.sort((a, b) => {
        const da = new Date(a.generated_at || a.report_date || 0).getTime();
        const db = new Date(b.generated_at || b.report_date || 0).getTime();
        return db - da;
      });
      setReports(items);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const items = await fetchAllIEPReports();
      items.sort((a, b) => {
        const da = new Date(a.generated_at || a.report_date || 0).getTime();
        const db = new Date(b.generated_at || b.report_date || 0).getTime();
        return db - da;
      });
      setReports(items);
    } catch {}
    setRefreshing(false);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => {
      const id = r.student_id?.toLowerCase() ?? "";
      const name = r.student_name?.toLowerCase() ?? "";
      const perf = r.current_performance_level?.toLowerCase() ?? "";
      const anyStrength = (r.strengths || []).join(" ").toLowerCase();
      const anyImprove = (r.improvement_areas || []).join(" ").toLowerCase();
      const rid = (r.report_id || r.id || "").toLowerCase();
      return id.includes(q) || name.includes(q) || perf.includes(q) || anyStrength.includes(q) || anyImprove.includes(q) || rid.includes(q);
    });
  }, [reports, query]);

  const onDownloadPdf = useCallback(async (item: IEPReportItem) => {
    try {
      setDownloading(true);
      const html = buildIEPHtml(item);

      const filenameSafe = (item.student_name || item.student_id || "IEP")
        .replace(/[^\w.-]+/g, "_")
        .slice(0, 32);
      const filename = `IEP_${filenameSafe}_${Date.now()}.pdf`;

      // generate once; need base64 for SAF/web
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });

      if (Platform.OS === "android") {
        // Ask for a directory (prefer Downloads)
        const DOWNLOADS = "content://com.android.externalstorage.documents/document/primary:Download";
        const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(DOWNLOADS);

        if (perm.granted) {
          const target = await FileSystem.StorageAccessFramework.createFileAsync(
            perm.directoryUri,
            filename,
            "application/pdf"
          );
          const pdfB64 =
            base64 ?? (await FileSystem.readAsStringAsync(uri, { encoding: "base64" }));
          await FileSystem.StorageAccessFramework.writeAsStringAsync(
            target,
            pdfB64,
            { encoding: "base64" }
          );
          Alert.alert("Saved", "PDF saved to your selected folder.");
          return;
        }

        // Fallback: share sheet
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Save IEP Report",
          UTI: "com.adobe.pdf",
        });
        return;
      }

      if (Platform.OS === "ios") {
        const target = FileSystem.documentDirectory + filename;
        await FileSystem.copyAsync({ from: uri, to: target });
        await Sharing.shareAsync(target, {
          mimeType: "application/pdf",
          dialogTitle: "Save IEP Report",
          UTI: "com.adobe.pdf",
        });
        return;
      }

      if (Platform.OS === "web") {
        const data = base64 ?? "";
        if (typeof document !== "undefined" && data) {
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${data}`;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          await Print.printAsync({ html });
        }
        return;
      }
    } catch (e) {
      console.warn("PDF save failed:", e);
      Alert.alert("PDF", "Could not save the PDF.");
    } finally {
      setDownloading(false);
    }
  }, []);

  // ---------- Render ----------
  if (loading) {
    return (
      <View style={styles.root}>
        <Background floatA={floatA} floatB={floatB} floatC={floatC} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loading}>Loading reports…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <Background floatA={floatA} floatB={floatB} floatC={floatC} />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Oops</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={[styles.btn, styles.primaryBtn, { marginTop: 12 }]}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Background floatA={floatA} floatB={floatB} floatC={floatC} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>IEP Reports</Text>
          <Text style={styles.subtitle}>All students • {filtered.length} {filtered.length === 1 ? "report" : "reports"}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ARise</Text>
        </View>
      </View>

      {/* Search pill */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={DEEP_PURPLE} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by student, ID, performance, strengths…"
          placeholderTextColor="#6b7280"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
            <Ionicons name="close" size={16} color="#1e1b4b" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => String(item.report_id || item.id || idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
        renderItem={({ item }) => (
          <ReportCard
            item={item}
            onPress={() => setSelected(item)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={styles.emptyText}>No reports found.</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderTop}>
              <Text style={styles.modalTitle}>Report Details</Text>
            </View>

            <View style={styles.modalActionsRow}>
              {!!selected && (
                <TouchableOpacity
                  onPress={() => onDownloadPdf(selected)}
                  disabled={downloading}
                  style={[
                    styles.btn,
                    styles.primaryBtn,
                    styles.modalActionBtn,
                    downloading && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>{downloading ? "Preparing…" : "Download PDF"}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setSelected(null)}
                style={[styles.btn, styles.secondaryBtn, styles.modalActionBtn]}
              >
                <Ionicons name="close" size={18} color="#1f1147" />
                <Text style={[styles.btnText, { color: "#1f1147" }]}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              {!!selected && (
                <>
                  <View style={styles.modalHeaderRow}>
                    <Avatar id={selected.student_id} size={44} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.modalStudent}>
                        {selected.student_name || `Student #${selected.student_id?.slice(0, 8)}`}
                      </Text>
                      <Text style={styles.modalMeta}>
                        {formatDate(selected.report_period_start)} — {formatDate(selected.report_period_end)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.kvRow}>
                    <KV label="Performance" value={selected.current_performance_level || "—"} />
                    <KV label="Evaluations" value={String(selected.total_evaluations ?? 0)} />
                  </View>

                  <View style={styles.kvRow}>
                    <KV label="Irregular Avg" value={`${percent(safeNum(selected.irregular_words_avg_score))}%`} />
                    <KV label="Regular Avg" value={`${percent(safeNum(selected.regular_words_avg_score))}%`} />
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.sectionTitle}>Strengths</Text>
                    <ChipRow items={selected.strengths || []} empty="No strengths listed" />
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.sectionTitle}>Areas to Improve</Text>
                    <ChipRow items={selected.improvement_areas || []} variant="warn" empty="No improvement areas listed" />
                  </View>

                  {(selected.annual_goals?.length || selected.short_term_objectives?.length) ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.sectionTitle}>Goals & Objectives</Text>
                      <ChipRow items={selected.annual_goals || []} empty="No annual goals" />
                      <View style={{ height: 6 }} />
                      <ChipRow items={selected.short_term_objectives || []} empty="No objectives" />
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- Subcomponents ----------
function Background({ floatA, floatB, floatC }: { floatA: Animated.Value; floatB: Animated.Value; floatC: Animated.Value }) {
  return (
    <>
      <LinearGradient
        colors={["#fff7e6", "#fcefe2", "#f9e6ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.blobOne,
          {
            transform: [
              { translateY: floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
              { translateX: floatA.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
              { scale: floatA.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blobTwo,
          {
            transform: [
              { translateY: floatB.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
              { translateX: floatB.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
              { scale: floatB.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blobThree,
          {
            transform: [
              { translateY: floatC.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
              { translateX: floatC.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
              { scale: floatC.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) },
            ],
          },
        ]}
      />
    </>
  );
}

function ReportCard({ item, onPress }: { item: IEPReportItem; onPress: () => void }) {
  const irregularPct = percent(safeNum(item.irregular_words_avg_score));
  const regularPct = percent(safeNum(item.regular_words_avg_score));
  const interventions = Math.round((safeNum(item.intervention_rate) || 0) * 100);

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.cardTap}>
      <View style={styles.cardBorder}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Avatar id={item.student_id} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.cardTitle}>{item.student_name || `Student #${item.student_id?.slice(0, 8)}`}</Text>
              <Text style={styles.cardMeta}>
                {formatDate(item.report_period_start)} — {formatDate(item.report_period_end)}
              </Text>
            </View>
            <Pill label={item.current_performance_level || "—"} />
          </View>

          <View style={styles.metricsRow}>
            <Metric label="Irregular Avg" value={`${irregularPct}%`} icon="star-four-points-outline" />
            <Metric label="Regular Avg" value={`${regularPct}%`} icon="book-outline" />
            <Metric label="Evaluations" value={String(item.total_evaluations ?? 0)} icon="chart-bar" />
          </View>

          <ProgressBar label="Intervention Rate" value={interventions} />

          {(item.strengths && item.strengths.length > 0) || (item.improvement_areas && item.improvement_areas.length > 0) ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              <View style={styles.chipsWrap}>
                {(item.strengths || []).slice(0, 3).map((s, i) => (
                  <Chip key={`s-${i}`} text={s} />
                ))}
                {(item.improvement_areas || []).slice(0, 2).map((s, i) => (
                  <Chip key={`i-${i}`} text={s} warn />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Avatar({ id, size = 40 }: { id: string; size?: number }) {
  const i = initialsFromId(id);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: LILAC,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: PURPLE,
      }}
    >
      <Text style={{ color: DEEP_PURPLE, fontWeight: "900" }}>{i}</Text>
    </View>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <View style={styles.metric}>
      <MaterialCommunityIcons name={icon} size={18} color={DEEP_PURPLE} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <View style={{ marginTop: 8 }}>
      <View style={styles.pbHeader}>
        <Text style={styles.pbLabel}>{label}</Text>
        <Text style={styles.pbValue}>{v}%</Text>
      </View>
      <View style={styles.pbTrack}>
        <View style={[styles.pbFill, { width: `${Math.max(6, v)}%` }]} />
      </View>
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <View style={styles.kvPill}>
        <Text style={styles.kvVal}>{value}</Text>
      </View>
    </View>
  );
}

function Chip({ text, warn = false }: { text: string; warn?: boolean }) {
  return (
    <View style={[styles.chip, warn ? styles.chipWarn : styles.chipOk]}>
      <Text style={[styles.chipText, warn && { color: "#92400e" }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function ChipRow({ items, variant, empty }: { items: string[]; variant?: "warn"; empty?: string }) {
  if (!items?.length) {
    return <Text style={styles.emptySmall}>{empty || "—"}</Text>;
    }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {items.map((s, i) => (
        <Chip key={i} text={s} warn={variant === "warn"} />
      ))}
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff7e6" },

  // Background blobs
  blobOne: {
    position: "absolute",
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: LILAC, left: -60, top: -40, opacity: 0.9,
  },
  blobTwo: {
    position: "absolute",
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: YELLOW, right: -40, top: 20, opacity: 0.8,
  },
  blobThree: {
    position: "absolute",
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: PURPLE, right: -60, bottom: -60, opacity: 0.15,
  },

  headerRow: { paddingHorizontal: 16, paddingTop: 16, flexDirection: "row", alignItems: "center" },
  title: { color: DEEP_PURPLE, fontSize: 28, fontWeight: "900" },
  subtitle: { marginTop: 2, color: "#6b7280", fontWeight: "700" },
  badge: { backgroundColor: "#e9d5ff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginLeft: 10 },
  badgeText: { color: "#1e1b4b", fontWeight: "900" },

  searchRow: {
    marginHorizontal: 16, marginTop: 12, flexDirection: "row", alignItems: "center",
    backgroundColor: "#f5f3ff", borderRadius: 16, borderWidth: 2, borderColor: "#e9d5ff",
    paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, color: "#1f1147", fontWeight: "700", paddingVertical: 6 },
  clearBtn: { marginLeft: 6, backgroundColor: "#e9d5ff", borderRadius: 10, padding: 6 },

  // Loading / Error
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loading: { color: "#6b7280", marginTop: 10, fontWeight: "700" },
  errorTitle: { color: DEEP_PURPLE, fontWeight: "900", fontSize: 18 },
  errorText: { color: "#6b7280", marginTop: 6 },

  // Cards
  cardTap: { marginTop: 14 },
  cardBorder: {
    padding: 2, borderRadius: 20, backgroundColor: "#8B5CF6",
    shadowColor: "#A78BFA", shadowOpacity: 0.45, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: { color: "#1f1147", fontWeight: "900", fontSize: 16 },
  cardMeta: { color: "#6b7280", fontWeight: "700", marginTop: 2 },

  pill: { backgroundColor: "#e9d5ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { color: "#1f1147", fontWeight: "900" },

  metricsRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  metric: { flex: 1, backgroundColor: "#f5f3ff", borderRadius: 14, padding: 10, marginHorizontal: 4, alignItems: "center" },
  metricLabel: { color: "#6b7280", fontWeight: "800", marginTop: 4, fontSize: 12 },
  metricValue: { color: "#1f1147", fontWeight: "900", marginTop: 2, fontSize: 16 },

  pbHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  pbLabel: { color: "#1f1147", fontWeight: "900" },
  pbValue: { color: DEEP_PURPLE, fontWeight: "900" },
  pbTrack: { marginTop: 6, height: 10, backgroundColor: "#F3F4F6", borderRadius: 6, overflow: "hidden" },
  pbFill: { height: "100%", backgroundColor: PURPLE },

  sectionTitle: { color: "#4c1d95", fontWeight: "900", marginTop: 2, marginBottom: 6 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", padding: 16, justifyContent: "center" },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    maxHeight: "88%",
    width: "100%",
  },
  modalHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  modalActionBtn: {
    marginLeft: 8,
    marginTop: 8,
  },
  modalTitle: { color: "#1f1147", fontSize: 20, fontWeight: "900" },
  modalHeaderRow: { marginTop: 12, flexDirection: "row", alignItems: "center" },
  modalStudent: { color: "#1f1147", fontWeight: "900", fontSize: 16 },
  modalMeta: { color: "#6b7280", fontWeight: "700" },
  kvRow: { flexDirection: "row", marginTop: 10 },
  kv: { flex: 1, marginRight: 8 },
  kvLabel: { color: "#6b7280", fontWeight: "800", marginBottom: 4 },
  kvPill: { backgroundColor: "#f5f3ff", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  kvVal: { color: "#1f1147", fontWeight: "900" },
  emptySmall: { color: "#6b7280", fontStyle: "italic" },

  // Buttons
  btn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  primaryBtn: { backgroundColor: DEEP_PURPLE },
  secondaryBtn: { backgroundColor: "#e9d5ff" },
  btnText: { color: "#fff", fontWeight: "900" },

  // Empty state
  emptyText: { color: "#6b7280", fontWeight: "700" },

  // Chips
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e9d5ff",
    backgroundColor: "#f5f3ff",
    marginRight: 8,
    marginBottom: 8,
  },
  chipOk: {
    backgroundColor: "#ecfeff",
    borderColor: "#a7f3d0",
  },
  chipWarn: {
    backgroundColor: "#fff7ed",
    borderColor: "#fecaca",
  },
  chipText: {
    color: "#1f1147",
    fontWeight: "900",
  },
});
