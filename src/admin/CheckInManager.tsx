import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, CircleAlert, ScanLine, ShieldCheck, UserRound } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { getSupabase } from '../lib/supabase';
import { Button, Card, ErrorBox, PageHeader, TextInput, friendlyError, useToast } from './ui';

type ScanResult = { ok?: boolean; name?: string; email?: string; track?: string; role?: string; checked_in_at?: string; message?: string };

export const CheckInManager: React.FC = () => {
  const toast = useToast();
  const scanner = useRef<Html5Qrcode | null>(null);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => () => { if (scanner.current?.isScanning) void scanner.current.stop().catch(() => undefined); }, []);

  const checkIn = async (raw = token) => {
    const value = raw.trim();
    if (!value) return setError('Scan a pass or enter its pass ID first.');
    setBusy(true); setError(''); setResult(null);
    try {
      const sb = await getSupabase()!;
      const { data, error: rpcError } = await sb.rpc('check_in_pass', { p_token: value });
      if (rpcError) throw rpcError;
      const row = (Array.isArray(data) ? data[0] : data) as ScanResult | null;
      if (!row?.ok) {
        setResult(row || { ok: false, message: 'Pass not recognized.' });
        return;
      }
      setResult(row);
      setToken('');
      toast('ok', row.message || 'Attendee checked in.');
    } catch (e) {
      setError(friendlyError(e));
    } finally { setBusy(false); }
  };

  const startCamera = async () => {
    setError('');
    try {
      const instance = new Html5Qrcode('icon-checkin-reader');
      scanner.current = instance;
      await instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 }, (decoded) => {
        if (scanner.current?.isScanning) void scanner.current.stop().catch(() => undefined);
        setCameraOn(false);
        setToken(decoded);
        void checkIn(decoded);
      }, () => undefined);
      setCameraOn(true);
    } catch (e) {
      setCameraOn(false);
      setError(e instanceof Error ? e.message : 'Camera access failed. Allow camera access in your browser settings, or enter the pass ID manually.');
    }
  };

  const stopCamera = async () => {
    if (scanner.current?.isScanning) await scanner.current.stop().catch(() => undefined);
    setCameraOn(false);
  };

  return (
    <div>
      <PageHeader eyebrow="Event operations" title="QR check-in" subtitle="Scan accepted applicants’ digital passes. Only organiser accounts can access this screen." />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5 sm:p-7">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8CBA4]/25 bg-[#E8CBA4]/10 text-[#E8CBA4]"><ScanLine /></span><div><h2 className="font-cinzel text-lg text-[#FFF3D6]">Scan a digital pass</h2><p className="mt-1 text-sm text-[#A89D8A]">Use a phone camera or a scanner keyboard.</p></div></div>
          <div id="icon-checkin-reader" className="mt-5 min-h-8 overflow-hidden rounded-xl bg-black/30" />
          <div className="mt-4 flex flex-wrap gap-2">
            {!cameraOn ? <Button onClick={() => void startCamera()}><Camera className="h-4 w-4" /> Start camera</Button> : <Button variant="secondary" onClick={() => void stopCamera()}>Stop camera</Button>}
          </div>
          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-[#6F685B]"><span className="h-px flex-1 bg-white/10" />Or enter pass ID<span className="h-px flex-1 bg-white/10" /></div>
          <form onSubmit={e => { e.preventDefault(); void checkIn(); }} className="flex flex-col gap-3 sm:flex-row"><TextInput aria-label="Pass ID" placeholder="Paste pass ID…" value={token} onChange={e => setToken(e.target.value)} /><Button type="submit" loading={busy} disabled={!token.trim()}>Verify & check in</Button></form>
          {error && <ErrorBox message={error} onRetry={() => setError('')} />}
          <p className="mt-4 text-xs leading-5 text-[#8E8678]">Camera access requires HTTPS and browser permission. Manual entry remains available if camera scanning is blocked.</p>
        </Card>
        <Card className="p-5 sm:p-7">
          <h2 className="font-cinzel text-lg text-[#FFF3D6]">Scan result</h2>
          {!result ? <div className="flex min-h-64 flex-col items-center justify-center text-center text-[#8E8678]"><ShieldCheck className="h-10 w-10 text-[#6F685B]" /><p className="mt-3 text-sm">Attendee details appear here after a scan.</p></div> : (
            <div className="mt-5">
              <div className={'flex items-center gap-3 rounded-xl border p-4 ' + (result.ok ? 'border-emerald-300/25 bg-emerald-300/5' : 'border-rose-300/25 bg-rose-300/5')}>
                {result.ok ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-200" /> : <CircleAlert className="h-6 w-6 shrink-0 text-rose-200" />}
                <div><p className={'font-medium ' + (result.ok ? 'text-emerald-100' : 'text-rose-100')}>{result.message || (result.ok ? 'Check-in complete' : 'Pass rejected')}</p><p className="mt-1 text-xs text-[#A89D8A]">{result.checked_in_at ? new Date(result.checked_in_at).toLocaleString() : 'No check-in recorded'}</p></div>
              </div>
              {result.ok && <div className="mt-5 space-y-4"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-[#E8CBA4]" /><div><p className="font-medium text-[#FFF3D6]">{result.name || 'Attendee'}</p><p className="text-xs text-[#A89D8A]">{result.email || ''}</p></div></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 p-3"><p className="text-[10px] uppercase tracking-[.16em] text-[#8E8678]">Track</p><p className="mt-1 text-sm text-[#E6D6C4]">{result.track || '—'}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-[10px] uppercase tracking-[.16em] text-[#8E8678]">Assignment</p><p className="mt-1 text-sm text-[#E6D6C4]">{result.role || '—'}</p></div></div></div>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
