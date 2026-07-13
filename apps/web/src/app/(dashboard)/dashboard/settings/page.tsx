import { UserProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Manage your account profile and connected services.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <UserProfile />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold">API Keys configured</h2>
        <p className="mt-2 text-sm text-slate-400">Placeholder status for environment variables available to the app.</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          <li>• GEMINI_API_KEY: placeholder status</li>
          <li>• OPENAI_API_KEY: placeholder status</li>
          <li>• ANTHROPIC_API_KEY: placeholder status</li>
        </ul>
      </div>
    </div>
  );
}
