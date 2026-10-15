const IST = "Asia/Kolkata";

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const istFields = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
};

export const toDateTimeLocalIST = (
  value: Date | string | null | undefined,
): string => {
  const date = toDate(value);
  if (!date) return "";
  const f = istFields(date);
  return `${f.year}-${f.month}-${f.day}T${f.hour}:${f.minute}`;
};

export const parseDateTimeInputIST = (
  value: string | null | undefined,
): Date | undefined => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (/T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}+05:30`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const date = new Date(`${trimmed}:00+05:30`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const fromDateTimeLocalIST = (
  value: string | null | undefined,
): Date | undefined => parseDateTimeInputIST(value);

const formatISTDay = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
  }).format(date);

const formatISTTime = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

export const formatISTRange = (
  startsAt: Date | string | null | undefined,
  endsAt: Date | string | null | undefined,
): string => {
  const start = toDate(startsAt);
  const end = toDate(endsAt);
  if (start && end) {
    if (formatISTDay(start) === formatISTDay(end)) {
      return `${formatISTDay(start)}, ${formatISTTime(start)} to ${formatISTTime(end)} IST`;
    }
    return `${formatISTDay(start)}, ${formatISTTime(start)} to ${formatISTDay(end)}, ${formatISTTime(end)} IST`;
  }
  if (start) return `From ${formatISTDay(start)}, ${formatISTTime(start)} IST`;
  if (end) return `Until ${formatISTDay(end)}, ${formatISTTime(end)} IST`;
  return "";
};
