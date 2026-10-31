import { formatTenge, formatPercent, formatTime, formatDayLabel } from "../src/logic/format";

describe("formatTenge", () => {
  it("маленькие суммы без пробелов", () => {
    expect(formatTenge(450)).toBe("450 ₸");
  });
  it("тысячи с пробелом-разделителем", () => {
    expect(formatTenge(12500)).toBe("12 500 ₸");
  });
  it("миллионы с двумя разделителями", () => {
    expect(formatTenge(1234567)).toBe("1 234 567 ₸");
  });
  it("округляет нецелые суммы", () => {
    expect(formatTenge(1000.6)).toBe("1 001 ₸");
  });
  it("ноль", () => {
    expect(formatTenge(0)).toBe("0 ₸");
  });
});

describe("formatPercent", () => {
  it("считает округлённый процент", () => {
    expect(formatPercent(1, 3)).toBe("33%");
  });
  it("total=0 не делит на ноль", () => {
    expect(formatPercent(0, 0)).toBe("0%");
  });
  it("100% когда part равен total", () => {
    expect(formatPercent(500, 500)).toBe("100%");
  });
});

describe("formatTime", () => {
  it("форматирует часы и минуты с ведущим нулём", () => {
    expect(formatTime("2026-11-04T09:03:00")).toBe("09:03");
  });
});

describe("formatDayLabel", () => {
  const now = new Date(2026, 10, 4, 12, 0);

  it("сегодня", () => {
    expect(formatDayLabel("2026-11-04T08:00:00", now)).toBe("Сегодня");
  });
  it("вчера", () => {
    expect(formatDayLabel("2026-11-03T23:59:00", now)).toBe("Вчера");
  });
  it("дата в этом году без года", () => {
    expect(formatDayLabel("2026-10-20T10:00:00", now)).toBe("20 октября");
  });
  it("дата в другом году с годом", () => {
    expect(formatDayLabel("2025-10-20T10:00:00", now)).toBe("20 октября 2025");
  });
});
