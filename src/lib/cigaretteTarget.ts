import { format } from "date-fns";
import { CIGARETTE_TARGET } from "./constants";

export interface CigaretteTargetRule {
  effective_date: string; // "yyyy-MM-dd"
  daily_target: number;
}

/**
 * The daily cigarette target for a given date, resolved from a dated
 * step-down schedule: the most recent rule with effective_date <= date
 * wins. Falls back to the CIGARETTE_TARGET baseline when no rule has
 * taken effect yet for that date.
 */
export function cigaretteTargetFor(date: Date, schedule: CigaretteTargetRule[]): number {
  const dateKey = format(date, "yyyy-MM-dd");
  let best: CigaretteTargetRule | null = null;
  for (const rule of schedule) {
    if (rule.effective_date <= dateKey && (!best || rule.effective_date > best.effective_date)) {
      best = rule;
    }
  }
  return best ? best.daily_target : CIGARETTE_TARGET;
}
