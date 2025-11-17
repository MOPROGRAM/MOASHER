<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1oUZsAgoGlIX3Gro6DJdKsv7mMfu29Li7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## API Key configuration and security

- **Preferred (Vite env):** Create a local environment file `.env.local` with the variable `VITE_GEMINI_API_KEY` (see `.env.example`).
- **Browser fallback:** If your environment doesn't provide an env variable, the app will attempt to read a key from `localStorage` under `GEMINI_API_KEY` or from an `aistudio` helper if available.
- **Do not commit secrets:** Never commit your real API keys to the repository. Use `.gitignore` to keep `.env.local` local.
- **Using the UI to set the key:** The app shows a prompt where you can paste your Gemini API key; this stores it locally in your browser for testing.

If you want to inject the API key into the build for testing only, set `VITE_GEMINI_API_KEY` in your local environment before running `npm run dev`. For production, use a secure server-side proxy or secret manager — embedding keys in client-side bundles is insecure.
