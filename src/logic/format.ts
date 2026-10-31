// Сумма в тенге всегда целая; разделяем тысячи обычным пробелом (неразрывным не нужно, это не веб-типографика)
export function formatTenge(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.round(Math.abs(amount));
  const withSpaces = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${withSpaces} ₸`;
}

export function formatPercent(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function parseLocalIsoDate(iso: string): Date {
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h = 0, mi = 0] = (timePart ?? "0:0").split(":").map(Number);
  return new Date(y, m - 1, d, h, mi);
}

export function formatTime(iso: string): string {
  const d = parseLocalIsoDate(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

/** Короткая абсолютная дата+время для строки траты: «4 ноя, 09:03». */
export function formatShortDateTime(iso: string): string {
  const d = parseLocalIsoDate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${formatTime(iso)}`;
}

/** Заголовок группы дня в истории: «Сегодня», «Вчера» или «5 ноября». */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const d = parseLocalIsoDate(iso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  const withYear = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : "";
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}${withYear}`;
}
