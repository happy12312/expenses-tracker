import { getPeriodRange, formatPeriodLabel, toLocalIso, getBucketStarts } from "../src/logic/period";

describe("getPeriodRange: week", () => {
  it("начинается в понедельник, даже если anchor — воскресенье", () => {
    // 2026-11-01 — воскресенье
    const anchor = new Date(2026, 10, 1);
    const { start, end } = getPeriodRange("week", anchor);
    expect(start).toEqual(new Date(2026, 9, 26)); // понедельник 26 октября
    expect(end).toEqual(new Date(2026, 10, 2)); // следующий понедельник
  });

  it("anchor в среду даёт ту же неделю, что и anchor в понедельник", () => {
    const wed = new Date(2026, 10, 4); // среда
    const mon = new Date(2026, 10, 2); // понедельник той же недели
    expect(getPeriodRange("week", wed)).toEqual(getPeriodRange("week", mon));
  });

  it("offset=-1 даёт предыдущую неделю", () => {
    const anchor = new Date(2026, 10, 4);
    const prev = getPeriodRange("week", anchor, -1);
    expect(prev.start).toEqual(new Date(2026, 9, 26));
    expect(prev.end).toEqual(new Date(2026, 10, 2));
  });

  it("неделя корректно переходит через смену года", () => {
    // 2026-12-31 — четверг; понедельник той недели — 28 декабря
    const anchor = new Date(2026, 11, 31);
    const { start, end } = getPeriodRange("week", anchor);
    expect(start).toEqual(new Date(2026, 11, 28));
    expect(end).toEqual(new Date(2027, 0, 4));
  });
});

describe("getPeriodRange: month", () => {
  it("границы календарного месяца", () => {
    const anchor = new Date(2026, 1, 15); // февраль
    const { start, end } = getPeriodRange("month", anchor);
    expect(start).toEqual(new Date(2026, 1, 1));
    expect(end).toEqual(new Date(2026, 2, 1));
  });

  it("переход через смену года при offset", () => {
    const anchor = new Date(2027, 0, 10); // январь 2027
    const prev = getPeriodRange("month", anchor, -1);
    expect(prev.start).toEqual(new Date(2026, 11, 1));
    expect(prev.end).toEqual(new Date(2027, 0, 1));
  });
});

describe("getPeriodRange: year", () => {
  it("границы календарного года", () => {
    const anchor = new Date(2026, 5, 1);
    const { start, end } = getPeriodRange("year", anchor);
    expect(start).toEqual(new Date(2026, 0, 1));
    expect(end).toEqual(new Date(2027, 0, 1));
  });
});

describe("toLocalIso", () => {
  it("форматирует без таймзоны, лексикографически сортируемо", () => {
    const d = new Date(2026, 0, 5, 9, 3, 7);
    expect(toLocalIso(d)).toBe("2026-01-05T09:03:07");
  });
});

describe("formatPeriodLabel", () => {
  it("неделя в одном месяце", () => {
    const range = getPeriodRange("week", new Date(2026, 10, 4));
    expect(formatPeriodLabel("week", range)).toBe("2 – 8 ноября");
  });

  it("неделя на стыке месяцев", () => {
    const range = getPeriodRange("week", new Date(2026, 9, 29));
    expect(formatPeriodLabel("week", range)).toBe("26 октября – 1 ноября");
  });

  it("месяц", () => {
    const range = getPeriodRange("month", new Date(2026, 10, 4));
    expect(formatPeriodLabel("month", range)).toBe("Ноябрь 2026");
  });

  it("год", () => {
    const range = getPeriodRange("year", new Date(2026, 10, 4));
    expect(formatPeriodLabel("year", range)).toBe("2026");
  });
});

describe("getBucketStarts", () => {
  it("по дням для недели — 7 элементов", () => {
    const range = getPeriodRange("week", new Date(2026, 10, 4));
    expect(getBucketStarts("week", range)).toHaveLength(7);
  });

  it("по месяцам для года — 12 элементов", () => {
    const range = getPeriodRange("year", new Date(2026, 10, 4));
    expect(getBucketStarts("year", range)).toHaveLength(12);
  });
});
