import browser from 'webextension-polyfill';

export const DEFAULT_API_BASE = import.meta.env.VITE_API_URL;

const STORAGE_KEY = 'apiBase';

export async function getApiBase(): Promise<string> {
  const stored = await browser.storage.sync.get(STORAGE_KEY);
  const value = stored[STORAGE_KEY];
  return typeof value === 'string' && value ? value : DEFAULT_API_BASE;
}

export async function setApiBase(value: string): Promise<void> {
  await browser.storage.sync.set({ [STORAGE_KEY]: value });
}
