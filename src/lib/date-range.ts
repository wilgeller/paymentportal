import {
  endOfDay,
  startOfDay,
  subDays,
} from "date-fns";

export type DateRangePreset = "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  from: string;
  to: string;
  preset: DateRangePreset;
}

export function presetToRange(preset: Exclude<DateRangePreset, "custom">): DateRange {
  const to = endOfDay(new Date());
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = startOfDay(subDays(to, days - 1));
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    preset,
  };
}

export function customRange(fromDate: Date, toDate: Date): DateRange {
  return {
    from: startOfDay(fromDate).toISOString(),
    to: endOfDay(toDate).toISOString(),
    preset: "custom",
  };
}

export const DEFAULT_RANGE = presetToRange("30d");
