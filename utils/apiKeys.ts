export function getRuntimeApiKey(): string | null {
  // Vite exposes env variables prefixed with VITE_ via import.meta.env
  try {
    const env = (import.meta as any)?.env;
    if (env && env.VITE_GEMINI_API_KEY) {
      return String(env.VITE_GEMINI_API_KEY);
    }
  } catch (e) {
    // ignore
  }

  // If running in an environment that exposes aistudio helpers, prefer that
  try {
    const aistudio = (window as any)?.aistudio;
    if (aistudio && typeof aistudio.getApiKey === 'function') {
      const key = aistudio.getApiKey();
      if (key) return String(key);
    }
  } catch (e) {
    // ignore
  }

  // Fallback to localStorage (user-entered key)
  try {
    const stored = localStorage.getItem('GEMINI_API_KEY');
    if (stored) return stored;
  } catch (e) {
    // ignore
  }

  return null;
}

export function setLocalApiKey(key: string) {
  try {
    localStorage.setItem('GEMINI_API_KEY', key);
  } catch (e) {
    // ignore
  }
}
