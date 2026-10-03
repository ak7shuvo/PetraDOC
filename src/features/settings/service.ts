import { settingsRepo } from "@/lib/repositories";
import { defaultSettings, SETTINGS_ID, type AppSettings } from "./types";

export const getSettings = async (): Promise<AppSettings> => (await settingsRepo.get(SETTINGS_ID)) ?? defaultSettings();
export const updateSettings = async (patch: Partial<AppSettings>) =>
  settingsRepo.save({ ...(await getSettings()), ...patch, id: SETTINGS_ID });
