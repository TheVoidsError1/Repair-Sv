import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import * as React from "react";

/** แยกค่า HH:mm เป็น [hour, minute] โดยนาทีปัดเป็น 00 หรือ 30 */
function parseTime(value: string): { hour: number; minute: "00" | "30" } {
  const m = (value || "").trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return { hour: 9, minute: "00" };
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (hour > 23) hour = 23;
  if (hour < 0) hour = 0;
  const minute: "00" | "30" = min >= 15 && min < 45 ? "30" : "00";
  return { hour, minute };
}

const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0")
);
const MINUTES: ("00" | "30")[] = ["00", "30"];

export interface Time30SelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

/** ตัวเลือกเวลา: ชั่วโมง (00–23) และนาที (00, 30) เท่านั้น */
export const Time30Select = React.forwardRef<HTMLDivElement, Time30SelectProps>(
  ({ value, onChange, id, className }, ref) => {
    const { hour, minute } = parseTime(value);
    const hourStr = hour.toString().padStart(2, "0");

    const handleHourChange = (v: string) => {
      onChange(`${v}:${minute}`);
    };
    const handleMinuteChange = (v: string) => {
      onChange(`${hourStr}:${v}`);
    };

    return (
      <div ref={ref} id={id} className={cn("flex gap-2", className)}>
        <Select
          value={hourStr}
          onValueChange={handleHourChange}
        >
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="ชม." />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={minute}
          onValueChange={handleMinuteChange}
        >
          <SelectTrigger className="w-[72px] shrink-0">
            <SelectValue placeholder="น." />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m}>
                :{m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
);
Time30Select.displayName = "Time30Select";
