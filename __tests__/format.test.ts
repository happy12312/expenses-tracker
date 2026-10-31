import { formatTenge, formatPercent } from "../src/logic/format";

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
