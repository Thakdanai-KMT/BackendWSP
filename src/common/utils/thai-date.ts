const DAY_MS = 24 * 60 * 60 * 1000;

// วันที่ปัจจุบันตามเวลาไทย ในรูปแบบ YYYY-MM-DD
export function todayInThailand(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

// เช็คว่าเป็นวันที่จริงในปฏิทิน (กัน 2026-02-30 ที่ JavaScript จะปัดเป็นเดือนถัดไปเงียบๆ)
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

// จำนวนวันในช่วง รวมวันแรกและวันสุดท้าย (ต้องผ่าน isValidIsoDate มาก่อน)
export function daysInclusive(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / DAY_MS) + 1;
}