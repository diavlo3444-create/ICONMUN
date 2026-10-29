import React, { useCallback, useEffect, useState } from 'react';
import { getSupabase, safeUrl } from '../lib/supabase';
import { SETTINGS } from './config';
import { Button, Card, ErrorBox, Label, PageHeader, Spinner, TextInput, Toggle, friendlyError, useToast } from './ui';

export const SettingsManager: React.FC = () => {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const { data, error: e } = await sb.from('settings').select('key,value');
      if (e) throw e;
      const map: Record<string, string> = {};
      SETTINGS.forEach((s) => (map[s.key] = s.kind === 'toggle' ? 'true' : ''));
      (data || []).forEach((r) => (map[r.key] = r.value));
      setValues(map);
      setOriginal(map);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirtyKeys = SETTINGS.filter((s) => (values[s.key] ?? '') !== (original[s.key] ?? '')).map((s) => s.key);

  const save = async () => {
    for (const s of SETTINGS) {
      const v = (values[s.key] || '').trim();
      if (!v) continue;
      if (s.kind === 'url' && !safeUrl(v)) return toast('err', `${s.label}: please enter a full link starting with https://`);
      if (s.kind === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast('err', `${s.label}: that does not look like an email address.`);
      if (v.length > 1000) return toast('err', `${s.label} is too long.`);
    }
    setSaving(true);
    try {
      const sb = await getSupabase()!;
      const rows = dirtyKeys.map((k) => ({ key: k, value: (values[k] || '').trim() }));
      const { error: e } = await sb.from('settings').upsert(rows, { onConflict: 'key' });
      if (e) throw e;
      toast('ok', 'Settings saved. The public site updates on next load.');
      await load();
    } catch (e) {
      toast('err', friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const groups = Array.from(new Set(SETTINGS.map((s) => s.group)));

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Site settings"
        subtitle="Contact details and social links. Everything here is public on the website. Registration switches now live under Registry > Registration."
        actions={<Button variant="primary" loading={saving} disabled={dirtyKeys.length === 0} onClick={save}>Save changes{dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}</Button>}
      />
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card key={g} className="p-5 sm:p-6">
              <h2 className="mb-4 font-cinzel text-base font-semibold tracking-wide text-[#F3DFA2]">{g}</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {SETTINGS.filter((s) => s.group === g).map((s) => (
                  <div key={s.key} className={s.kind === 'toggle' ? 'sm:col-span-2' : ''}>
                    {s.kind === 'toggle' ? (
                      <div className="flex items-start gap-4">
                        <Toggle checked={!['false', 'no', '0', 'closed'].includes((values[s.key] || 'true').toLowerCase())} onChange={(x) => setValues((v) => ({ ...v, [s.key]: x ? 'true' : 'false' }))} label={s.label} />
                        <div>
                          <div className="text-sm font-medium text-[#F4EFE6]">{s.label}</div>
                          {s.help && <p className="mt-0.5 text-xs text-[#6F685B]">{s.help}</p>}
                        </div>
                      </div>
                    ) : (
                      <>
                        <Label htmlFor={`s-${s.key}`} hint={s.help}>{s.label}</Label>
                        <TextInput id={`s-${s.key}`} type={s.kind === 'email' ? 'email' : s.kind === 'date' ? 'date' : 'text'} inputMode={s.kind === 'url' ? 'url' : undefined} value={values[s.key] || ''} maxLength={1000} placeholder={s.placeholder} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
