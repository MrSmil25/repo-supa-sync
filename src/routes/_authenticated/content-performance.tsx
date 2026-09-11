import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Plus } from "lucide-react";
import { toast } from "sonner";
import { useMyProfile } from "@/hooks/useProfile";
import { label } from "@/lib/marketing";
import { formatDateID } from "@/lib/format";
import {
  archivePerformance,
  canRecordPerformance,
  engagementRate,
  fetchPendingPerformance,
  fetchPerformanceRecords,
  fetchPerformanceViews,
  formatNumberID,
  formatPercentID,
  recordTitle,
  type PendingPerformance,
  type PerformanceRecord,
} from "@/lib/content-performance";
import { PerformanceFormDialog } from "@/components/marketing/PerformanceFormDialog";
import { Button } from "@/components/ui/button";

type Tab = "catatan" | "analitik";

export const Route = createFileRoute("/_authenticated/content-performance")({
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => ({
    tab: search['tab'] === "analitik" ? "analitik" : "catatan",
  }),
  head: () => ({
    meta: [
      { title: "Performa Konten — OrgTool" },
      {
        name: "description",
        content:
          "Catat dan analisis performa konten media sosial organisasi: jangkauan, interaksi, simpanan, dan follower baru.",
      },
      { property: "og:title", content: "Performa Konten — OrgTool" },
      {
        property: "og:description",
        content: "Catat performa konten dan lihat analitik per format, pilar, dan bulan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContentPerformancePage,
});

function ContentPerformancePage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const canRecord = canRecordPerformance(profile?.role, profile?.division);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PerformanceRecord | null>(null);
  const [seed, setSeed] = useState<PendingPerformance | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["content-performance"],
    queryFn: () => fetchPerformanceRecords(),
  });
  const { data: pending = [] } = useQuery({
    queryKey: ["content-needs-performance"],
    queryFn: fetchPendingPerformance,
  });
  const { data: views } = useQuery({
    queryKey: ["content-performance-views"],
    queryFn: fetchPerformanceViews,
    enabled: tab === "analitik",
  });

  const archive = useMutation({
    mutationFn: archivePerformance,
    onSuccess: () => {
      toast.success("Catatan performa diarsipkan");
      queryClient.invalidateQueries({ queryKey: ["content-performance"] });
      queryClient.invalidateQueries({ queryKey: ["content-performance-views"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openNew(pendingItem?: PendingPerformance) {
    setEditing(null);
    setSeed(pendingItem ?? null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <BarChart3 className="size-6" /> Performa Konten
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catat hasil konten yang sudah tayang, lalu lihat ringkasan analitiknya.
          </p>
        </div>
        {canRecord ? (
          <Button onClick={() => openNew()}>
            <Plus className="size-4" /> Catat performa
          </Button>
        ) : null}
      </header>

      <div className="flex gap-2">
        {(["catatan", "analitik"] as Tab[]).map((value) => (
          <button
            key={value}
            onClick={() => navigate({ search: { tab: value } })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {value === "catatan" ? "Catatan" : "Analitik"}
          </button>
        ))}
      </div>

      {tab === "catatan" ? (
        <div className="space-y-6">
          {pending.length > 0 ? (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Belum dicatat performanya ({pending.length})
              </h2>
              <ul className="mt-3 space-y-2">
                {pending.map((item) => (
                  <li
                    key={`${item.content_plan_id}-${item.title}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span className="text-sm text-foreground">
                      {item.title ?? "Tanpa judul"}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {label(item.platform)} · {formatDateID(item.published_at)}
                      </span>
                    </span>
                    {canRecord ? (
                      <Button size="sm" variant="secondary" onClick={() => openNew(item)}>
                        Catat
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            {isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Memuat catatan…</p>
            ) : records.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Belum ada catatan performa.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Konten</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Jangkauan</th>
                      <th className="px-4 py-3">Interaksi</th>
                      <th className="px-4 py-3">ER</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">{recordTitle(record)}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {label(record.platform)} · {label(record.format)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateID(record.posted_date)}
                        </td>
                        <td className="px-4 py-3">{formatNumberID(record.reach)}</td>
                        <td className="px-4 py-3">{formatNumberID(record.engagement_total)}</td>
                        <td className="px-4 py-3">
                          {formatPercentID(engagementRate(record.engagement_total, record.reach))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canRecord ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditing(record);
                                  setSeed(null);
                                  setDialogOpen(true);
                                }}
                              >
                                Ubah
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => archive.mutate(record.id)}
                              >
                                Arsipkan
                              </Button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsCard
            title="Per format"
            rows={(views?.byFormat ?? []).map((row) => ({
              key: label(row.format),
              count: row.jumlah_konten,
              reach: row.rata_jangkauan,
              er: row.engagement_rate_persen,
            }))}
          />
          <AnalyticsCard
            title="Per pilar"
            rows={(views?.byPillar ?? []).map((row) => ({
              key: row.pilar ?? "-",
              count: row.jumlah_konten,
              reach: row.rata_jangkauan,
              er: row.engagement_rate_persen,
            }))}
          />
          <AnalyticsCard
            title="Per hari tayang"
            rows={(views?.byDow ?? []).map((row) => ({
              key: row.hari_nama ?? "-",
              count: row.jumlah_konten,
              reach: row.rata_jangkauan,
              er: null,
            }))}
          />
          <AnalyticsCard
            title="Per bulan"
            rows={(views?.monthly ?? []).map((row) => ({
              key: row.bulan ?? "-",
              count: row.jumlah_konten,
              reach: row.rata_jangkauan,
              er: null,
            }))}
          />
          <section className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
            <h2 className="text-sm font-semibold text-foreground">Konten terbaik</h2>
            <ul className="mt-3 space-y-2">
              {(views?.top ?? []).map((row) => (
                <li
                  key={row.id ?? row.judul}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{row.judul ?? "Tanpa judul"}</span>
                  <span className="text-xs text-muted-foreground">
                    Jangkauan {formatNumberID(row.reach)} · Interaksi{" "}
                    {formatNumberID(row.engagement_total)} · ER{" "}
                    {formatPercentID(row.engagement_rate)}
                  </span>
                </li>
              ))}
              {(views?.top ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">Belum ada data.</li>
              ) : null}
            </ul>
          </section>
        </div>
      )}

      <PerformanceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialPending={seed}
        editing={editing}
      />
    </div>
  );
}

function AnalyticsCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    key: string;
    count: number | null;
    reach: number | null;
    er: number | null;
  }>;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-muted-foreground">Belum ada data.</li>
        ) : (
          rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground">{row.key}</span>
              <span className="text-xs text-muted-foreground">
                {formatNumberID(row.count)} konten · rata jangkauan {formatNumberID(row.reach)}
                {row.er !== null ? ` · ER ${formatPercentID(row.er)}` : ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
