"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { DayPicker, type DateRange as DayPickerRange } from "react-day-picker";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  customRange,
  type DateRange,
  type DateRangePreset,
  presetToRange,
} from "@/lib/date-range";
import "react-day-picker/style.css";

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "custom", label: "Custom" },
];

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayPickerRange | undefined>(() => ({
    from: new Date(value.from),
    to: new Date(value.to),
  }));

  const label = `${format(new Date(value.from), "MMM d, yyyy")} – ${format(new Date(value.to), "MMM d, yyyy")}`;

  function applyPreset(preset: DateRangePreset) {
    if (preset === "custom") {
      onChange({ ...value, preset: "custom" });
      setOpen(true);
      return;
    }
    const next = presetToRange(preset);
    onChange(next);
    setDraft({ from: new Date(next.from), to: new Date(next.to) });
    setOpen(false);
  }

  function applyCustom() {
    if (!draft?.from || !draft?.to) return;
    const next = customRange(draft.from, draft.to);
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-black/10 bg-white p-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              value.preset === preset.id
                ? "bg-brand text-black"
                : "text-black/60 hover:text-black",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button variant="secondary" className="min-w-[240px] justify-start">
            <CalendarDays className="h-4 w-4 text-black/40" />
            {label}
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 rounded-xl border border-black/10 bg-white p-4 shadow-xl"
            sideOffset={8}
            align="end"
          >
            <DayPicker
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={2}
              className="rdp-light"
            />
            <div className="mt-3 flex justify-end gap-2 border-t border-black/10 pt-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={applyCustom} disabled={!draft?.from || !draft?.to}>
                Apply range
              </Button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
