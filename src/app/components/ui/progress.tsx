"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

const PROGRESS_TRANSLATE_CLASS: Record<number, string> = {
  0: 'translate-x-[-100%]',
  1: 'translate-x-[-99%]',
  2: 'translate-x-[-98%]',
  3: 'translate-x-[-97%]',
  4: 'translate-x-[-96%]',
  5: 'translate-x-[-95%]',
  6: 'translate-x-[-94%]',
  7: 'translate-x-[-93%]',
  8: 'translate-x-[-92%]',
  9: 'translate-x-[-91%]',
  10: 'translate-x-[-90%]',
  11: 'translate-x-[-89%]',
  12: 'translate-x-[-88%]',
  13: 'translate-x-[-87%]',
  14: 'translate-x-[-86%]',
  15: 'translate-x-[-85%]',
  16: 'translate-x-[-84%]',
  17: 'translate-x-[-83%]',
  18: 'translate-x-[-82%]',
  19: 'translate-x-[-81%]',
  20: 'translate-x-[-80%]',
  21: 'translate-x-[-79%]',
  22: 'translate-x-[-78%]',
  23: 'translate-x-[-77%]',
  24: 'translate-x-[-76%]',
  25: 'translate-x-[-75%]',
  26: 'translate-x-[-74%]',
  27: 'translate-x-[-73%]',
  28: 'translate-x-[-72%]',
  29: 'translate-x-[-71%]',
  30: 'translate-x-[-70%]',
  31: 'translate-x-[-69%]',
  32: 'translate-x-[-68%]',
  33: 'translate-x-[-67%]',
  34: 'translate-x-[-66%]',
  35: 'translate-x-[-65%]',
  36: 'translate-x-[-64%]',
  37: 'translate-x-[-63%]',
  38: 'translate-x-[-62%]',
  39: 'translate-x-[-61%]',
  40: 'translate-x-[-60%]',
  41: 'translate-x-[-59%]',
  42: 'translate-x-[-58%]',
  43: 'translate-x-[-57%]',
  44: 'translate-x-[-56%]',
  45: 'translate-x-[-55%]',
  46: 'translate-x-[-54%]',
  47: 'translate-x-[-53%]',
  48: 'translate-x-[-52%]',
  49: 'translate-x-[-51%]',
  50: 'translate-x-[-50%]',
  51: 'translate-x-[-49%]',
  52: 'translate-x-[-48%]',
  53: 'translate-x-[-47%]',
  54: 'translate-x-[-46%]',
  55: 'translate-x-[-45%]',
  56: 'translate-x-[-44%]',
  57: 'translate-x-[-43%]',
  58: 'translate-x-[-42%]',
  59: 'translate-x-[-41%]',
  60: 'translate-x-[-40%]',
  61: 'translate-x-[-39%]',
  62: 'translate-x-[-38%]',
  63: 'translate-x-[-37%]',
  64: 'translate-x-[-36%]',
  65: 'translate-x-[-35%]',
  66: 'translate-x-[-34%]',
  67: 'translate-x-[-33%]',
  68: 'translate-x-[-32%]',
  69: 'translate-x-[-31%]',
  70: 'translate-x-[-30%]',
  71: 'translate-x-[-29%]',
  72: 'translate-x-[-28%]',
  73: 'translate-x-[-27%]',
  74: 'translate-x-[-26%]',
  75: 'translate-x-[-25%]',
  76: 'translate-x-[-24%]',
  77: 'translate-x-[-23%]',
  78: 'translate-x-[-22%]',
  79: 'translate-x-[-21%]',
  80: 'translate-x-[-20%]',
  81: 'translate-x-[-19%]',
  82: 'translate-x-[-18%]',
  83: 'translate-x-[-17%]',
  84: 'translate-x-[-16%]',
  85: 'translate-x-[-15%]',
  86: 'translate-x-[-14%]',
  87: 'translate-x-[-13%]',
  88: 'translate-x-[-12%]',
  89: 'translate-x-[-11%]',
  90: 'translate-x-[-10%]',
  91: 'translate-x-[-9%]',
  92: 'translate-x-[-8%]',
  93: 'translate-x-[-7%]',
  94: 'translate-x-[-6%]',
  95: 'translate-x-[-5%]',
  96: 'translate-x-[-4%]',
  97: 'translate-x-[-3%]',
  98: 'translate-x-[-2%]',
  99: 'translate-x-[-1%]',
  100: 'translate-x-0',
} as const;

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const v = Math.min(100, Math.max(0, Math.round(value || 0)));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("bg-primary h-full w-full flex-1 transition-transform", PROGRESS_TRANSLATE_CLASS[v])}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
