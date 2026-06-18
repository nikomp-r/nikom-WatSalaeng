import { VisitorRecord, QuotaSettings } from "./types";

export const DEFAULT_QUOTA_SETTINGS: QuotaSettings = {
  daily: 40,
  monthly: 300,
  yearly: 2000,
};

export const INITIAL_VISITORS: VisitorRecord[] = [];
