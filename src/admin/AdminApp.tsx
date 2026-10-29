import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  CalendarDays, ClipboardList, DoorOpen, History, Inbox, Landmark, LayoutDashboard, Loader2, LogOut, Menu, QrCode, Settings, ShieldAlert, Users, X, ExternalLink,
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { ApplicationsManager } from './ApplicationsManager';
import { CheckInManager } from './CheckInManager';
import { AuditLog } from './AuditLog';
import { ContentManager } from './ContentManager';
import { Dashboard } from './Dashboard';
import { RegistrationManager } from './RegistrationManager';
import { SettingsManager } from './SettingsManager';
import { Button, Card, Label, TextInput, ToastProvider, cx } from './ui';

const IDLE_LIMIT_MS = 60 * 60 * 1000; // sign out after 60 minutes without activity

const NAV: Array<{ group: string; items: Array<{ route: string; label: string; icon: React.ComponentType<{ className?: string }> }> }> = [
  { group: 'Overview', items: [{ route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'Registry', items: [{ route: 'registrations', label: 'Registration', icon: DoorOpen }, { route: 'applications', label: 'Applications', icon: Inbox }] },
  {
    group: 'Website content',
    items: [
      { route: 'committees', label: 'Councils', icon: Landmark },
      { route: 'schedule_days', label: 'Schedule days', icon: CalendarDays },
      { route: 'schedule_events', label: 'Schedule events', icon: ClipboardList },
      { route: 'secretariat', label: 'Secretariat', icon: Users },
      { route: 'settings', label: 'Site settings', icon: Settings },
    ],
  },
  { group: 'Event operations', items: [{ route: 'check-in', label: 'QR check-in', icon: QrCode }] },
  { group: 'Security', items: [{ route: 'activity', label: 'Activity log', icon: History }] },
];

const parseHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [route, query] = raw.split('?');
  return { route: route || 'dashboard', query: new URLSearchParams(query || '') };
};

/* ------------------------------------------------------------------ shell */
const Backdrop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="icon-admin-shell relative min-h-screen bg-[#100609] text-[#F0E8E2]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
    <div className="pointer-events-none fixed inset-0 opacity-70" style={{ background: 'radial-gradient(900px 500px at 85% -10%, rgba(232,203,164,0.10), transparent 60%), radial-gradient(700px 500px at -10% 110%, rgba(100,27,45,0.24), transparent 60%)' }} />
    <div className="relative">{children}</div>
  </div>
);

const Brand: React.FC<{ small?: boolean }> = ({ small }) => (
  <div className="flex items-center gap-3">
    <span className={cx('flex items-center justify-center rounded-xl bg-[#E7DBC3]', small ? 'h-10 w-10' : 'h-14 w-14')}><img src="/brand/logo-mark.webp" alt="" className={small ? 'h-9 w-9 object-contain' : 'h-12 w-12 object-contain'} /></span>
    <div>
      <div className={cx('font-cinzel font-bold tracking-[0.22em] text-[#FFF5E8]', small ? 'text-sm' : 'text-lg')}>ICON MUN</div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#E8CBA4]">Organiser console</div>
    </div>
  </div>
);

const SetupNeeded: React.FC = () => (
  <Backdrop>
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8">
        <Brand />
        <h1 className="mt-6 font-cinzel text-xl font-bold text-[#FFF3D6]">Supabase is not connected</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#A89D8A]">
          Create a file named <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#F1D6B3]">.env</code> in the project folder with your project URL and anon key, then restart the dev server (or add them as environment variables on Vercel and redeploy):
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-[#0d0d0d] p-4 text-xs leading-relaxed text-[#F3DFA2]">{`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJ...`}</pre>
      </Card>
    </div>
  </Backdrop>
);

/* ------------------------------------------------------------------ login */
const Login: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fails = useRef(0);
  const lockedUntil = useRef(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockedUntil.current) {
      return setError(`Too many attempts. Wait ${Math.ceil((lockedUntil.current - Date.now()) / 1000)} seconds.`);
    }
    setBusy(true);
    setError('');
    try {
      const sb = await getSupabase()!;
      const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (err) {
        fails.current += 1;
        if (fails.current >= 5) { lockedUntil.current = Date.now() + 30000; fails.current = 0; }
        setError('Incorrect email or password.');
      } else {
        fails.current = 0;
        onDone();
      }
    } catch {
      setError('Could not reach the server. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Backdrop>
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-[0_0_80px_-20px_rgba(212,175,106,0.25)]">
          <Brand />
          <h1 className="mt-8 font-cinzel text-2xl font-bold text-[#FFF3D6]">Sign in</h1>
          <p className="mt-1 text-sm text-[#8E8678]">Organisers only.</p>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <TextInput id="login-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="login-pass">Password</Label>
              <TextInput id="login-pass" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">{error}</p>}
            <Button type="submit" variant="primary" loading={busy} className="w-full">Sign in</Button>
          </form>
        </Card>
      </div>
    </Backdrop>
  );
};

/* ------------------------------------------------------------------ app */
type Phase = 'loading' | 'signedOut' | 'forbidden' | 'ready';

const AdminInner: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [nav, setNav] = useState(parseHash());
  const [menuOpen, setMenuOpen] = useState(false);

  const checkAdmin = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) return setPhase('signedOut');
    try {
      const sb = await getSupabase()!;
      const { data, error } = await sb.from('admins').select('user_id').eq('user_id', s.user.id).maybeSingle();
      setPhase(!error && data ? 'ready' : 'forbidden');
    } catch { setPhase('forbidden'); }
  }, []);

  useEffect(() => {
    document.title = 'Organiser console · ICON MUN';
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    meta.content = 'noindex, nofollow';

    let unsub: (() => void) | undefined;
    (async () => {
      const sb = await getSupabase()!;
      const { data } = await sb.auth.getSession();
      await checkAdmin(data.session);
      const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
        if (event === 'SIGNED_OUT') { setSession(null); setPhase('signedOut'); }
        else if (event === 'SIGNED_IN') { setTimeout(() => checkAdmin(s), 0); }
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, [checkAdmin]);

  useEffect(() => {
    const onHash = () => { setNav(parseHash()); setMenuOpen(false); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const signOut = useCallback(async () => {
    const sb = await getSupabase()!;
    await sb.auth.signOut();
    setPhase('signedOut');
  }, []);

  // auto sign-out after inactivity
  useEffect(() => {
    if (phase !== 'ready') return;
    let t = window.setTimeout(signOut, IDLE_LIMIT_MS);
    const reset = () => { window.clearTimeout(t); t = window.setTimeout(signOut, IDLE_LIMIT_MS); };
    const events = ['pointerdown', 'keydown', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => { window.clearTimeout(t); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, [phase, signOut]);

  const go = (route: string) => { window.location.hash = `#/${route}`; };

  if (phase === 'loading') {
    return <Backdrop><div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#D4AF6A]" /></div></Backdrop>;
  }
  if (phase === 'signedOut') return <Login onDone={() => {}} />;
  if (phase === 'forbidden') {
    return (
      <Backdrop>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-amber-300" />
            <h1 className="mt-4 font-cinzel text-xl font-bold text-[#FFF3D6]">Not an organiser</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#A89D8A]">
              {session?.user.email} signed in successfully, but this account is not on the organisers list. Ask the site owner to add it, then sign in again.
            </p>
            <Button className="mt-6" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
          </Card>
        </div>
      </Backdrop>
    );
  }

  const route = nav.route;
  let page: React.ReactNode;
  if (route === 'dashboard') page = <Dashboard go={go} />;
  else if (route === 'applications') page = <ApplicationsManager key={`${nav.query.get('status') || 'all'}-${nav.query.get('track') || 'all'}`} initialStatus={nav.query.get('status') || 'all'} initialTrack={nav.query.get('track') || 'all'} />;
  else if (route === 'registrations') page = <RegistrationManager go={go} />;
  else if (route === 'settings') page = <SettingsManager />;
  else if (route === 'activity') page = <AuditLog />;
  else if (route === 'check-in') page = <CheckInManager />;
  else if (['committees', 'schedule_days', 'schedule_events', 'secretariat'].includes(route)) page = <ContentManager key={route} resourceKey={route} />;
  else page = <Dashboard go={go} />;

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="px-5 py-6"><Brand small /></div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8D737A]">{g.group}</div>
            {g.items.map((it) => {
              const active = route === it.route || (route === 'dashboard' && it.route === 'dashboard');
              return (
                <button
                  key={it.route}
                  onClick={() => go(it.route)}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:translate-x-0.5',
                    active ? 'bg-[#E8CBA4]/10 text-[#FFF3D6]' : 'text-[#A89D8A] hover:bg-white/5 hover:text-[#F3DFA2]'
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#D4AF6A]" />}
                  <it.icon className={cx('h-4 w-4', active ? 'text-[#D4AF6A]' : 'text-[#6F685B] group-hover:text-[#D4AF6A]')} />
                  {it.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 truncate text-xs text-[#8E8678]" title={session?.user.email}>{session?.user.email}</div>
        <div className="flex gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#E8CBA4]/25 px-3 py-2 text-xs text-[#E6E1D8] transition-colors hover:border-[#E8CBA4]/60 hover:bg-[#E8CBA4]/10">
            <ExternalLink className="h-3.5 w-3.5" /> View site
          </a>
          <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </nav>
  );

  return (
    <Backdrop>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-[#E8CBA4]/15 bg-[#16080E]/95 shadow-[18px_0_60px_rgba(0,0,0,.12)] backdrop-blur-xl lg:block">{sidebar}</aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#D4AF6A]/15 bg-[#16080E]/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand small />
        <Button variant="ghost" size="sm" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-[#D4AF6A]/20 bg-[#080808]">
            <button className="absolute right-3 top-4 cursor-pointer rounded p-1 text-[#A89D8A]" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-7 lg:ml-64 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1440px]">{page}</div>
      </main>
    </Backdrop>
  );
};

const AdminApp: React.FC = () => (
  <ToastProvider>{isSupabaseConfigured ? <AdminInner /> : <SetupNeeded />}</ToastProvider>
);

export default AdminApp;
