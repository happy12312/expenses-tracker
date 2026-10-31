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
