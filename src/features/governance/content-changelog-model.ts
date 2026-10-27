export type ContentChange = {
  id: string;
  date: string;
  title: string;
  summary: string;
};

export function recentContentChanges(changes: readonly ContentChange[], limit = 4) {
  return [...changes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export function contentUpdatedAt(changes: readonly ContentChange[]) {
  return recentContentChanges(changes, 1)[0]?.date ?? null;
}

export function formatContentDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata" }).format(
    new Date(`${date}T00:00:00+05:30`),
  );
}
