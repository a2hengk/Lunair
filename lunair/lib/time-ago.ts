const rtf = new Intl.RelativeTimeFormat("de", { numeric: "auto" });
const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });
const dateYearFmt = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Berlin",
});
const fullFmt = new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Berlin" });

/** „gerade eben“, „vor 5 Minuten“, „vor 3 Stunden“, „gestern“, „vor 4 Tagen“, dann Datum. */
export function timeAgo(date: Date, now = new Date()) {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "gerade eben";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return date.getFullYear() === now.getFullYear() ? dateFmt.format(date) : dateYearFmt.format(date);
}

export function fullDate(date: Date) {
  return fullFmt.format(date);
}
