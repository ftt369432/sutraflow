export function validateEnv() {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!geminiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not defined');
  }

  if (!geminiKey.startsWith('AIza')) {
    throw new Error('VITE_GEMINI_API_KEY appears to be invalid (should start with AIza)');
  }

  return {
    VITE_GEMINI_API_KEY: geminiKey
  };
}