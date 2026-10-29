import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, LogOut, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

type ApplicantRow = {
  id: string;
  created_at: string;
  track: string;
  status: string;
  committee: string | null;
  first_country: string | null;
  institution: string | null;
  delegation_type: string | null;
  role: string | null;
  pass_token: string | null;
  checked_in_at: string | null;
};

const label = (track: string) => ({ delegate: 'Delegate', volunteer: 'Volunteer', security: 'Security', media: 'Media' }[track] || track);
const statusTone = (status: string) => status === 'accepted' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : status === 'rejected' ? 'border-rose-300/30 bg-rose-300/10 text-rose-200' : status === 'waitlisted' ? 'border-amber-200/30 bg-amber-200/10 text-amber-100' : 'border-white/15 bg-white/5 text-[#D8CDBA]';

export default function ApplicantPortal() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const client = await getSupabase();
      if (!client) throw new Error('The applicant portal is not configured yet.');
      const { data, error: rpcError } = await client.rpc('my_application_status');
      if (rpcError) throw rpcError;
      setRows((data || []) as ApplicantRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Applicant Portal · ICON MUN';
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const client = await getSupabase();
      if (!client) return;
      const { data } = await client.auth.getSession();
      if (alive && data.session) setSession(data.session);
      const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (!alive) return;
        setSession(nextSession);
        if (nextSession) {
          setEmail(nextSession.user.email || '');
          setSent(false);
          window.history.replaceState({}, document.title, '/portal');
        } else {
          setRows([]);
        }
      });
      unsubscribe = () => authListener.subscription.unsubscribe();
    })().catch(() => { if (alive) setError('Could not connect to the sign-in service.'); });
    return () => { alive = false; unsubscribe?.(); };
  }, []);

  useEffect(() => { if (session) void loadApplications(); }, [session?.user.id, loadApplications]);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const client = await getSupabase();
      if (!client) throw new Error('The applicant portal is not configured yet.');
      const { error: authError } = await client.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin + '/portal' },
      });
      if (authError) throw authError;
      setSent(true);
      setMessage('If this email can sign in, a secure link will arrive shortly. Check your inbox and spam folder.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the sign-in link. Please try again.');
    }
  };

  const signOut = async () => {
    const client = await getSupabase();
    if (client) await client.auth.signOut();
    setSession(null);
    setRows([]);
    setSent(false);
  };

  return (
    <main className="min-h-screen bg-[#080607] px-4 py-8 text-[#F5EEE4] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[.18em] text-[#CDBF9F] transition hover:text-white"><ArrowLeft size={15} /> Back to ICON MUN</a>
        <header className="mb-8 mt-8 flex flex-col justify-between gap-5 border-b border-[#E7DBC3]/20 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[.32em] text-[#CDBF9F]">The International Masquerade of Diplomacy · 2027</p>
            <h1 className="mt-3 font-cinzel text-3xl font-semibold sm:text-5xl">Applicant portal</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#B7AA9A]">Check your application status and access your digital event pass using a verified email link.</p>
          </div>
          {session && <button onClick={signOut} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-white/15 px-4 text-sm text-[#D8CDBA] transition hover:border-[#E7DBC3]/50 sm:self-auto"><LogOut size={15} /> Sign out</button>}
        </header>

        {!isSupabaseConfigured && <Notice tone="error">The portal is not connected to the application database yet. Please contact the organisers.</Notice>}
        {!session ? (
          <section className="mx-auto max-w-xl rounded-2xl border border-[#E7DBC3]/20 bg-[#120D10] p-6 shadow-2xl sm:p-9">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#E7DBC3]/25 bg-[#E7DBC3]/10 text-[#E7DBC3]"><Mail /></div>
            <h2 className="font-cinzel text-xl">Sign in with email</h2>
            <p className="mt-2 text-sm leading-6 text-[#B7AA9A]">We’ll send a one-time secure link. Use the same email address you used to apply.</p>
            <form onSubmit={requestLink} className="mt-6 space-y-4">
              <label htmlFor="portal-email" className="block text-xs uppercase tracking-[.14em] text-[#CDBF9F]">Email address</label>
              <input id="portal-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="min-h-12 w-full rounded-xl border border-white/15 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#E7DBC3]/70 focus:ring-2 focus:ring-[#E7DBC3]/15" />
              <button disabled={!isSupabaseConfigured} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E7DBC3] px-4 font-semibold text-[#160E11] transition hover:bg-[#F4E8D1] disabled:cursor-not-allowed disabled:opacity-50">{sent ? 'Send another link' : 'Email me a sign-in link'}</button>
            </form>
            {message && <Notice tone="success">{message}</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
          </section>
        ) : (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E7DBC3]/20 bg-[#120D10] p-5 sm:flex-row sm:items-center sm:p-6">
              <div><p className="text-xs uppercase tracking-[.18em] text-[#CDBF9F]">Signed in as</p><p className="mt-1 break-all text-lg">{session.user.email}</p></div>
              <button onClick={() => void loadApplications()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm transition hover:border-[#E7DBC3]/50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh status</button>
            </div>
            {loading ? <div className="rounded-2xl border border-white/10 p-10 text-center text-[#B7AA9A]">Loading your applications…</div> : error ? <Notice tone="error">{error}</Notice> : rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#120D10] p-10 text-center"><Clock3 className="mx-auto h-8 w-8 text-[#CDBF9F]" /><h2 className="mt-4 font-cinzel text-xl">No applications found</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#B7AA9A]">We couldn’t find an application linked to this verified email. Make sure you used the same address when applying.</p><a href="/#registration" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-[#E7DBC3]/30 px-5 text-sm text-[#E7DBC3]">Return to registration</a></div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {rows.map(row => <article key={row.id} className="rounded-2xl border border-[#E7DBC3]/20 bg-[#120D10] p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[.2em] text-[#CDBF9F]">{label(row.track)} application</p><h2 className="mt-2 font-cinzel text-xl">{row.track === 'delegate' ? (row.committee || 'Council assignment pending') : (row.role || label(row.track))}</h2><p className="mt-1 text-sm text-[#B7AA9A]">{row.institution || 'Institution not provided'}</p></div><span className={'shrink-0 rounded-full border px-3 py-1.5 text-xs capitalize ' + statusTone(row.status)}>{row.status}</span></div>
                  <div className="mt-5 border-t border-white/10 pt-4 text-sm text-[#B7AA9A]"><p>Submitted {new Date(row.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>{row.track === 'delegate' && <p className="mt-1">Country preference: {row.first_country || 'TBA'} · {row.delegation_type || 'single'} delegation</p>}</div>
                  {row.status === 'accepted' && row.pass_token && <div className="mt-6 rounded-xl border border-[#E7DBC3]/20 bg-black/25 p-4 text-center"><div className="mx-auto inline-block rounded-lg bg-white p-3"><QRCodeSVG value={row.pass_token} size={180} level="M" includeMargin /></div><p className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 size={16} /> Digital pass issued</p><p className="mt-1 break-all text-[10px] text-[#9D9181]">Pass ID: {row.pass_token}</p>{row.checked_in_at && <p className="mt-2 text-xs text-emerald-200">Checked in at {new Date(row.checked_in_at).toLocaleString()}</p>}</div>}
                  {row.status === 'accepted' && !row.pass_token && <p className="mt-5 rounded-xl border border-amber-200/20 bg-amber-200/5 p-3 text-sm text-amber-100">Your application is accepted. Refresh in a moment to issue your pass.</p>}
                  {row.status !== 'accepted' && <p className="mt-5 text-xs leading-5 text-[#9D9181]">Your digital pass will appear here if your application is accepted.</p>}
                </article>)}
              </div>
            )}
          </section>
        )}
        <footer className="mt-10 border-t border-white/10 pt-5 text-xs text-[#756B62]">Keep your digital pass private. It is intended for entry to ICON MUN only.</footer>
      </div>
    </main>
  );
}

const Notice: React.FC<{ tone: 'success' | 'error'; children: React.ReactNode }> = ({ tone, children }) => <p role={tone === 'error' ? 'alert' : 'status'} className={'mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ' + (tone === 'error' ? 'border-rose-300/20 bg-rose-300/5 text-rose-100' : 'border-emerald-300/20 bg-emerald-300/5 text-emerald-100')}>{children}</p>;
