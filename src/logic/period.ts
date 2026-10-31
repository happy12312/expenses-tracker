export type PeriodKind = "week" | "month" | "year";

export interface PeriodRange {
  start: Date; // inclusive, local midnight
  end: Date; // exclusive, local midnight of the day after the period ends
}

// Храним created_at как локальное ISO без таймзоны ("YYYY-MM-DDTHH:mm:ss"),
// чтобы строковое сравнение в SQLite совпадало с хронологическим порядком.
export function toLocalIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Понедельник = начало недели. getDay(): 0=вс,1=пн,...,6=сб.
function mondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7; // сколько дней назад до понедельника
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  return monday;
}

/**
 * offset=0 — период, содержащий anchor; -1 — предыдущий; +1 — следующий.
 */
export function getPeriodRange(
  kind: PeriodKind,
  anchor: Date,
  offset: number = 0
): PeriodRange {
  if (kind === "week") {
    const thisMonday = mondayOf(startOfDay(anchor));
    const start = new Date(
      thisMonday.getFullYear(),
      thisMonday.getMonth(),
      thisMonday.getDate() + offset * 7
    );
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return { start, end };
  }
  if (kind === "month") {
    const start = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start, end };
  }
  // year
  const start = new Date(anchor.getFullYear() + offset, 0, 1);
  const end = new Date(start.getFullYear() + 1, 0, 1);
  return { start, end };
}

export function formatPeriodLabel(kind: PeriodKind, range: PeriodRange): string {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  if (kind === "year") {
    return String(range.start.getFullYear());
  }
  if (kind === "month") {
    const monthNames = [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
    ];
    return `${monthNames[range.start.getMonth()]} ${range.start.getFullYear()}`;
  }
  // week: последний день периода — это end минус 1 день
  const lastDay = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate() - 1);
  const sameMonth = range.start.getMonth() === lastDay.getMonth();
  const startStr = `${range.start.getDate()}${sameMonth ? "" : " " + months[range.start.getMonth()]}`;
  const endStr = `${lastDay.getDate()} ${months[lastDay.getMonth()]}`;
  return `${startStr} – ${endStr}`;
}

/** Список дней (для графика по дням в неделе/месяце) или месяцев (для года). */
export function getBucketStarts(kind: PeriodKind, range: PeriodRange): Date[] {
  const buckets: Date[] = [];
  if (kind === "year") {
    for (let m = 0; m < 12; m++) {
      buckets.push(new Date(range.start.getFullYear(), m, 1));
    }
    return buckets;
  }
  const cursor = new Date(range.start);
  while (cursor < range.end) {
    buckets.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}
