// Tiny chrome.storage wrapper for popup preferences. Right now this is
// just the user's last-selected target platforms — sticky between
// popups so they don't repick the same set every time. Add more keys
// here as the popup grows.

const KEY_TARGETS = "captureTargets";

export async function getLastTargets(): Promise<string[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([KEY_TARGETS], (items) => {
      const value = items[KEY_TARGETS];
      if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
        resolve(value);
      } else {
        resolve([]);
      }
    });
  });
}

export async function saveLastTargets(targets: string[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [KEY_TARGETS]: targets }, () => resolve());
  });
}
