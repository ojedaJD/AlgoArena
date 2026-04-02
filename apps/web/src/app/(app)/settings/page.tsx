'use client';

import { useState, type FormEvent } from 'react';
import {
  Bell,
  Shield,
  Palette,
  Code2,
  Eye,
  Save,
  CheckCircle2,
  Moon,
  Sun,
  Monitor,
  Loader2,
} from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Toggle Component
// ─────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900',
        checked ? 'bg-blue-600' : 'bg-slate-700'
      )}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// ─────────────────────────────────────────────
// Settings Page
// ─────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    matchInvite: true,
    matchResult: true,
    friendActivity: false,
    weeklySummary: true,
    newProblems: false,
    systemAlerts: true,
  });

  // Editor preferences
  const [editor, setEditor] = useState({
    defaultLanguage: 'python',
    fontSize: '14',
    tabSize: '4',
    lineNumbers: true,
    minimap: false,
    wordWrap: false,
    ligatures: true,
    autoSave: true,
  });

  // Privacy preferences
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showSubmissions: false,
    showRating: true,
    allowChallenges: true,
    showOnlineStatus: true,
  });

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleEditor = (key: keyof typeof editor) =>
    setEditor((prev) => ({ ...prev, [key]: !prev[key] }));

  const togglePrivacy = (key: keyof typeof privacy) =>
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSaved(true);
      success('Settings saved', 'Your preferences have been updated.');
    } catch {
      toastError('Failed to save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Manage your preferences for editor, notifications, and privacy.
        </p>
      </div>

      <form onSubmit={handleSave} noValidate>
        <div className="space-y-6">

          {/* ── Appearance ── */}
          <Card>
            <CardHeader bordered>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette size={17} className="text-slate-500" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['dark', 'light'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={cn(
                        'flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200',
                        theme === t
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                      )}
                    >
                      {t === 'dark' && <Moon size={20} className={theme === t ? 'text-blue-400' : 'text-slate-500'} />}
                      {t === 'light' && <Sun size={20} className={theme === t ? 'text-blue-400' : 'text-slate-500'} />}
                      <span className={cn('text-sm font-medium capitalize', theme === t ? 'text-blue-300' : 'text-slate-400')}>
                        {t}
                      </span>
                    </button>
                  ))}
                  {/* System option */}
                  <button
                    type="button"
                    onClick={() => {
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      setTheme(prefersDark ? 'dark' : 'light');
                    }}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 border-slate-700 hover:border-slate-600 bg-slate-800/50 transition-all duration-200"
                  >
                    <Monitor size={20} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">System</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Code Editor ── */}
          <Card>
            <CardHeader bordered>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 size={17} className="text-slate-500" />
                Code Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Default Language"
                  value={editor.defaultLanguage}
                  onChange={(e) => setEditor((p) => ({ ...p, defaultLanguage: e.target.value }))}
                  options={[
                    { value: 'python', label: 'Python 3' },
                    { value: 'cpp', label: 'C++17' },
                    { value: 'java', label: 'Java 17' },
                    { value: 'javascript', label: 'JavaScript' },
                    { value: 'typescript', label: 'TypeScript' },
                    { value: 'go', label: 'Go' },
                  ]}
                />
                <Select
                  label="Font Size"
                  value={editor.fontSize}
                  onChange={(e) => setEditor((p) => ({ ...p, fontSize: e.target.value }))}
                  options={['12', '13', '14', '15', '16', '18', '20'].map((s) => ({ value: s, label: `${s}px` }))}
                />
                <Select
                  label="Tab Size"
                  value={editor.tabSize}
                  onChange={(e) => setEditor((p) => ({ ...p, tabSize: e.target.value }))}
                  options={[
                    { value: '2', label: '2 spaces' },
                    { value: '4', label: '4 spaces' },
                    { value: 'tab', label: '1 tab' },
                  ]}
                />
              </div>

              {/* Toggle options */}
              <div className="space-y-4 pt-2">
                {(
                  [
                    { key: 'lineNumbers' as const, label: 'Show line numbers' },
                    { key: 'minimap' as const, label: 'Show minimap' },
                    { key: 'wordWrap' as const, label: 'Word wrap' },
                    { key: 'ligatures' as const, label: 'Font ligatures' },
                    { key: 'autoSave' as const, label: 'Auto-save on run' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label htmlFor={`editor-${key}`} className="text-sm text-slate-300 cursor-pointer">
                      {label}
                    </label>
                    <Toggle
                      id={`editor-${key}`}
                      checked={editor[key] as boolean}
                      onChange={() => toggleEditor(key)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Notifications ── */}
          <Card>
            <CardHeader bordered>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell size={17} className="text-slate-500" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {(
                [
                  { key: 'matchInvite' as const, label: 'Match invitations', desc: 'When someone challenges you to a battle' },
                  { key: 'matchResult' as const, label: 'Match results', desc: 'After a 1v1 match concludes' },
                  { key: 'friendActivity' as const, label: 'Friend activity', desc: 'When friends solve problems or go online' },
                  { key: 'weeklySummary' as const, label: 'Weekly summary', desc: 'Your progress digest every Sunday' },
                  { key: 'newProblems' as const, label: 'New problems', desc: 'When new problems are added' },
                  { key: 'systemAlerts' as const, label: 'System alerts', desc: 'Maintenance and important updates' },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor={`notif-${key}`} className="text-sm font-medium text-slate-300 cursor-pointer">
                      {label}
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    id={`notif-${key}`}
                    checked={notifications[key]}
                    onChange={() => toggleNotif(key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Privacy ── */}
          <Card>
            <CardHeader bordered>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield size={17} className="text-slate-500" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {(
                [
                  { key: 'showProfile' as const, label: 'Public profile', desc: 'Let anyone view your profile page' },
                  { key: 'showSubmissions' as const, label: 'Show submissions', desc: 'Allow others to see your code submissions' },
                  { key: 'showRating' as const, label: 'Show rating', desc: 'Display your competitive rating publicly' },
                  { key: 'allowChallenges' as const, label: 'Allow challenges', desc: 'Let anyone send you a 1v1 challenge' },
                  { key: 'showOnlineStatus' as const, label: 'Online status', desc: 'Show when you are online to friends' },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor={`privacy-${key}`} className="text-sm font-medium text-slate-300 cursor-pointer">
                      {label}
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    id={`privacy-${key}`}
                    checked={privacy[key]}
                    onChange={() => togglePrivacy(key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Danger Zone ── */}
          <Card className="border-red-900/40">
            <CardHeader bordered>
              <CardTitle className="flex items-center gap-2 text-base text-red-400">
                <Eye size={17} />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-300">Delete Account</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    /* TODO: open confirmation dialog */
                  }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Save Button ── */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-600">
              {saved && (
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 size={14} />
                  Settings saved
                </span>
              )}
            </p>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              leftIcon={!saving ? <Save size={16} /> : undefined}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
