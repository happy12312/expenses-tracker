import { expensesToCsv } from "../src/logic/csv";
import { ExpenseRow } from "../src/logic/aggregate";

const catName = (id: number) => (id === 1 ? "Обед" : "Такси");
const payerName = (id: number) => (id === 1 ? "Я" : "Даша");

describe("expensesToCsv", () => {
  it("содержит заголовок и строки по каждой трате", () => {
    const rows: ExpenseRow[] = [
      { id: 1, amount: 500, category_id: 1, payer_id: 1, note: null, created_at: "2026-11-04T09:00:00" },
      { id: 2, amount: 1200, category_id: 2, payer_id: 2, note: "срочно", created_at: "2026-11-05T18:30:00" },
    ];
    const csv = expensesToCsv(rows, catName, payerName);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Дата и время,Сумма,Категория,Кто,Комментарий");
    expect(lines[1]).toBe('"4 ноя, 09:00",500,Обед,Я,');
    expect(lines[2]).toBe('"5 ноя, 18:30",1200,Такси,Даша,срочно');
  });

  it("экранирует запятые и переносы строк в комментарии", () => {
    const rows: ExpenseRow[] = [
      { id: 1, amount: 100, category_id: 1, payer_id: 1, note: "раз, два", created_at: "2026-11-04T09:00:00" },
    ];
    const csv = expensesToCsv(rows, catName, payerName);
    expect(csv.split("\n")[1]).toBe('"4 ноя, 09:00",100,Обед,Я,"раз, два"');
  });

  it("пустой список — только заголовок", () => {
    const csv = expensesToCsv([], catName, payerName);
    expect(csv).toBe("Дата и время,Сумма,Категория,Кто,Комментарий");
  });
});
