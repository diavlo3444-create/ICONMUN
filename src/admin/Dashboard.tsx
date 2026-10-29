import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Inbox, Landmark, Settings, Users } from 'lucide-react';
import { getTrackStatus } from '../lib/tracks';
import type { TrackItem } from '../data/defaults';
import { getSupabase } from '../lib/supabase';
import { APPLICATION_STATUSES, TRACK_LABELS } from './config';
import { StatusBadge, type Application } from './ApplicationsManager';
import { Button, Card, ErrorBox, PageHeader, Spinner, cx, friendlyError, timeAgo } from './ui';

type Slim = Pick<Application, 'id' | 'created_at' | 'status' | 'committee' | 'full_name' | 'institution' | 'track'>;

const Stat: React.FC<{ label: string; value: number | string; tone?: string; onClick?: () => void; hint?: string }> = ({ label, value, tone, onClick, hint }) => (
  <button onClick={onClick} disabled={!onClick} className={cx('block h-full w-full cursor-pointer text-left disabled:cursor-default')}>
    <Card className={cx('h-full p-5 transition-all', onClick && 'hover:-translate-y-0.5 hover:border-[#D4AF6A]/40')}>
      <div className="text-[11px] uppercase tracking-[0.2em] text-[#8E8678]">{label}</div>
      <div className={cx('mt-2 font-cinzel text-4xl font-bold', tone || 'text-[#FFF3D6]')}>{value}</div>
      {hint && <div className="mt-1 text-xs text-[#6F685B]">{hint}</div>}
    </Card>
  </button>
);

export const Dashboard: React.FC<{ go: (route: string) => void }> = ({ go }) => {
  const [apps, setApps] = useState<Slim[]>([]);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const [a, s, c1, c2, c3, c4] = await Promise.all([
        sb.from('applications').select('id,created_at,status,committee,full_name,institution,track').order('created_at', { ascending: false }).limit(2000),
        sb.from('registration_tracks').select('*').order('sort_order'),
        sb.from('committees').select('id', { count: 'exact', head: true }),
        sb.from('schedule_events').select('id', { count: 'exact', head: true }),
        sb.from('secretariat').select('id', { count: 'exact', head: true }),
        sb.from('schedule_days').select('id', { count: 'exact', head: true }),
      ]);
      if (a.error) throw a.error;
      setApps((a.data || []) as Slim[]);
      setTracks(
        (s.data || []).map((r: Record<string, string | boolean | null>) => ({
          key: r.key as TrackItem['key'], title: String(r.title), description: String(r.description ?? ''), isOpen: !!r.is_open,
          opensAt: (r.opens_at as string) ?? null, closesAt: (r.closes_at as string) ?? null, closedLabel: String(r.closed_label || 'Closed'),
        }))
      );
      setCounts({ committees: c1.count || 0, events: c2.count || 0, secretariat: c3.count || 0, days: c4.count || 0 });
    } catch (e) { setError(friendlyError(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    apps.forEach((a) => (m[a.status] = (m[a.status] || 0) + 1));
    return m;
  }, [apps]);

  // last 14 days
  const daily = useMemo(() => {
    const days: { label: string; n: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      days.push({ label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), n: 0 });
      const start = d.getTime(), end = start + 86400000;
      apps.forEach((a) => { const t = new Date(a.created_at).getTime(); if (t >= start && t < end) days[days.length - 1].n++; });
    }
    return days;
  }, [apps]);
  const maxDaily = Math.max(1, ...daily.map((d) => d.n));

  const byCommittee = useMemo(() => {
    const m: Record<string, number> = {};
    apps.filter((a) => a.track === 'delegate').forEach((a) => (m[a.committee] = (m[a.committee] || 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [apps]);
  const maxCom = Math.max(1, ...byCommittee.map(([, n]) => n));

  const weekCount = daily.slice(-7).reduce((s, d) => s + d.n, 0);

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard" subtitle="A live look at registrations and your site content." />
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <Stat label="Total applications" value={apps.length} onClick={() => go('applications')} hint={`${weekCount} in the last 7 days`} />
            <Stat label="New · need review" value={byStatus.new || 0} tone="text-sky-300" onClick={() => go('applications?status=new')} />
            <Stat label="Accepted" value={byStatus.accepted || 0} tone="text-emerald-300" onClick={() => go('applications?status=accepted')} />
            <Stat label="Waitlisted" value={byStatus.waitlisted || 0} tone="text-[#F3DFA2]" onClick={() => go('applications?status=waitlisted')} />
            <Stat label="Rejected" value={byStatus.rejected || 0} tone="text-rose-300" onClick={() => go('applications?status=rejected')} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-cinzel text-base font-semibold text-[#F3DFA2]">Applications, last 14 days</h2>
                <span className="text-xs text-[#6F685B]">peak {maxDaily === 1 && daily.every((d) => d.n === 0) ? 0 : maxDaily} / day</span>
              </div>
              <svg viewBox="0 0 560 150" className="w-full" role="img" aria-label="Applications per day for the last 14 days">
                {daily.map((d, i) => {
                  const h = d.n === 0 ? 2 : Math.max(6, (d.n / maxDaily) * 88);
                  return (
                    <g key={i}>
                      <rect x={i * 40 + 6} y={120 - h} width={28} height={h} rx={5} fill={d.n ? 'url(#gold)' : 'rgba(255,255,255,0.06)'} />
                      {d.n > 0 && <text x={i * 40 + 20} y={113 - h} textAnchor="middle" fontSize="11" fill="#F3DFA2">{d.n}</text>}
                      {(i % 2 === 1 || i === 13) && <text x={i * 40 + 20} y={142} textAnchor="middle" fontSize="9" fill="#6F685B">{d.label}</text>}
                    </g>
                  );
                })}
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F3DFA2" /><stop offset="100%" stopColor="#B8893C" /></linearGradient>
                </defs>
              </svg>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-cinzel text-base font-semibold text-[#F3DFA2]">Registration</h2>
                <Button size="sm" variant="ghost" onClick={() => go('registrations')}>Manage <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
              <ul className="space-y-2">
                {tracks.map((t) => {
                  const st = getTrackStatus(t);
                  return (
                    <li key={t.key} className="flex items-center justify-between text-sm">
                      <span className="text-[#C4BAA8]">{TRACK_LABELS[t.key]}</span>
                      <span className={cx('inline-flex items-center gap-1.5 text-xs', st.state === 'open' ? 'text-emerald-300' : st.state === 'upcoming' ? 'text-amber-300' : 'text-[#8E8678]')}>
                        <span className={cx('h-1.5 w-1.5 rounded-full', st.state === 'open' ? 'bg-emerald-300' : st.state === 'upcoming' ? 'bg-amber-300' : 'bg-rose-300/70')} />
                        {st.label}
                      </span>
                    </li>
                  );
                })}
                {tracks.length === 0 && <li className="text-xs text-[#6F685B]">Run supabase/team_applications.sql to enable registration switches.</li>}
              </ul>
              <div className="mt-6 space-y-2.5">
                {APPLICATION_STATUSES.map((s) => (
                  <div key={s.value} className="flex items-center justify-between text-sm">
                    <StatusBadge status={s.value} />
                    <span className="font-mono text-[#C4BAA8]">{byStatus[s.value] || 0}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-cinzel text-base font-semibold text-[#F3DFA2]">Latest applications</h2>
                <Button size="sm" variant="ghost" onClick={() => go('applications')}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
              {apps.length === 0 ? <p className="py-6 text-center text-sm text-[#6F685B]">No applications yet.</p> : (
                <ul className="divide-y divide-white/5">
                  {apps.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#F4EFE6]">{a.full_name}</div>
                        <div className="truncate text-xs text-[#6F685B]">{TRACK_LABELS[a.track] || a.track}{a.track === 'delegate' ? ` · ${a.committee}` : ''} · {timeAgo(a.created_at)}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 font-cinzel text-base font-semibold text-[#F3DFA2]">By council</h2>
              {byCommittee.length === 0 ? <p className="py-6 text-center text-sm text-[#6F685B]">Nothing to show yet.</p> : (
                <ul className="space-y-3">
                  {byCommittee.map(([name, n]) => (
                    <li key={name}>
                      <div className="mb-1 flex justify-between text-xs"><span className="text-[#C4BAA8]">{name}</span><span className="font-mono text-[#8E8678]">{n}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-[#8C6221] to-[#F3DFA2]" style={{ width: `${(n / maxCom) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <h2 className="mb-3 font-cinzel text-base font-semibold text-[#F3DFA2]">Manage the website</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[
                { r: 'committees', label: 'Councils', n: counts.committees, icon: Landmark },
                { r: 'schedule_days', label: 'Schedule days', n: counts.days, icon: CalendarDays },
                { r: 'schedule_events', label: 'Events', n: counts.events, icon: CalendarDays },
                { r: 'secretariat', label: 'Secretariat', n: counts.secretariat, icon: Users },
                { r: 'settings', label: 'Settings', n: undefined, icon: Settings },
              ].map(({ r, label, n, icon: I }) => (
                <button key={r} onClick={() => go(r)} className="cursor-pointer text-left">
                  <Card className="flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-[#D4AF6A]/40">
                    <I className="h-5 w-5 text-[#D4AF6A]" />
                    <div>
                      <div className="text-sm font-medium text-[#F4EFE6]">{label}</div>
                      {n !== undefined && <div className="text-xs text-[#6F685B]">{n} in database</div>}
                    </div>
                  </Card>
                </button>
              ))}
            </div>
            {apps.length === 0 && <p className="mt-3 flex items-center gap-2 text-xs text-[#6F685B]"><Inbox className="h-3.5 w-3.5" /> If a count shows 0, run supabase/seed.sql to load the current site content.</p>}
          </div>
        </div>
      )}
    </div>
  );
};
