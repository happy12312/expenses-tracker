import { ExpenseRow } from "./aggregate";
import { formatShortDateTime } from "./format";

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function expensesToCsv(
  expenses: ExpenseRow[],
  categoryName: (id: number) => string,
  payerName: (id: number) => string
): string {
  const header = ["Дата и время", "Сумма", "Категория", "Кто", "Комментарий"];
  const lines = [header.map(escapeCsvField).join(",")];
  for (const e of expenses) {
    lines.push(
      [
        formatShortDateTime(e.created_at),
        String(e.amount),
        categoryName(e.category_id),
        payerName(e.payer_id),
        e.note ?? "",
      ]
        .map(escapeCsvField)
        .join(",")
    );
  }
  return lines.join("\n");
}
