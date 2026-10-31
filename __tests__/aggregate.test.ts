import {
  ExpenseRow,
  filterByPeriod,
  filterByPayer,
  sumTotal,
  aggregateByCategory,
  aggregateByPayer,
  aggregateByBucket,
} from "../src/logic/aggregate";
import { getPeriodRange, getBucketStarts } from "../src/logic/period";

const categories = [
  { id: 1, name: "Обед" },
  { id: 2, name: "Такси" },
];
const payers = [
  { id: 1, name: "Я" },
  { id: 2, name: "Даша" },
];

function row(partial: Partial<ExpenseRow> & { created_at: string }): ExpenseRow {
  return {
    id: partial.id ?? Math.random(),
    amount: partial.amount ?? 1000,
    category_id: partial.category_id ?? 1,
    payer_id: partial.payer_id ?? 1,
    note: partial.note ?? null,
    created_at: partial.created_at,
  };
}

describe("filterByPeriod", () => {
  it("включает траты внутри диапазона, исключает за его пределами", () => {
    const range = getPeriodRange("month", new Date(2026, 10, 1));
    const rows = [
      row({ created_at: "2026-11-01T00:00:00" }),
      row({ created_at: "2026-11-30T23:59:59" }),
      row({ created_at: "2026-10-31T23:59:59" }), // за день до начала
      row({ created_at: "2026-12-01T00:00:00" }), // следующий месяц
    ];
    const result = filterByPeriod(rows, range);
    expect(result).toHaveLength(2);
  });
});

describe("filterByPayer", () => {
  it("null возвращает всех", () => {
    const rows = [row({ payer_id: 1, created_at: "2026-11-01T00:00:00" }), row({ payer_id: 2, created_at: "2026-11-01T00:00:00" })];
    expect(filterByPayer(rows, null)).toHaveLength(2);
  });
  it("фильтрует по конкретному payer_id", () => {
    const rows = [row({ payer_id: 1, created_at: "2026-11-01T00:00:00" }), row({ payer_id: 2, created_at: "2026-11-01T00:00:00" })];
    expect(filterByPayer(rows, 2)).toHaveLength(1);
  });
});

describe("sumTotal", () => {
  it("суммирует суммы", () => {
    const rows = [row({ amount: 500, created_at: "2026-11-01T00:00:00" }), row({ amount: 1500, created_at: "2026-11-01T00:00:00" })];
    expect(sumTotal(rows)).toBe(2000);
  });
  it("пустой массив даёт 0", () => {
    expect(sumTotal([])).toBe(0);
  });
});

describe("aggregateByCategory", () => {
  it("группирует, считает долю и сортирует по убыванию", () => {
    const rows = [
      row({ category_id: 1, amount: 3000, created_at: "2026-11-01T00:00:00" }),
      row({ category_id: 2, amount: 1000, created_at: "2026-11-01T00:00:00" }),
      row({ category_id: 1, amount: 1000, created_at: "2026-11-02T00:00:00" }),
    ];
    const result = aggregateByCategory(rows, categories);
    expect(result[0]).toMatchObject({ categoryId: 1, total: 4000, count: 2, percent: 80 });
    expect(result[1]).toMatchObject({ categoryId: 2, total: 1000, count: 1, percent: 20 });
  });

  it("на пустом списке не падает", () => {
    expect(aggregateByCategory([], categories)).toEqual([]);
  });
});

describe("aggregateByPayer", () => {
  it("считает сумму на каждого", () => {
    const rows = [
      row({ payer_id: 1, amount: 2000, created_at: "2026-11-01T00:00:00" }),
      row({ payer_id: 2, amount: 500, created_at: "2026-11-01T00:00:00" }),
    ];
    const result = aggregateByPayer(rows, payers);
    expect(result.find((r) => r.payerId === 1)?.total).toBe(2000);
    expect(result.find((r) => r.payerId === 2)?.total).toBe(500);
  });
});

describe("aggregateByBucket", () => {
  it("раскладывает траты по дням недели", () => {
    const range = getPeriodRange("week", new Date(2026, 10, 4));
    const buckets = getBucketStarts("week", range);
    const rows = [
      row({ amount: 500, created_at: "2026-11-02T08:00:00" }), // пн
      row({ amount: 300, created_at: "2026-11-02T20:00:00" }), // пн, тот же день
      row({ amount: 700, created_at: "2026-11-04T12:00:00" }), // ср
    ];
    const sums = aggregateByBucket(rows, buckets, "day");
    expect(sums[0]).toBe(800); // понедельник
    expect(sums[2]).toBe(700); // среда
    expect(sums[6]).toBe(0);
  });
});
