export function startOfToday(now = new Date()): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function isBackupDue(lastBackupAt: number | null): boolean {
  return lastBackupAt === null || lastBackupAt < startOfToday();
}
