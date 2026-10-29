import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, Clock3, MapPin, ShieldQuestion, BookOpen, ArrowUpRight } from 'lucide-react';
import { useSiteData } from '../lib/SiteData';
import { safeUrl } from '../lib/supabase';

const FAQS = [
  { q: 'What happens at a Model United Nations conference?', a: 'Delegates represent countries or other assigned roles, research an issue, deliver speeches, negotiate with other delegates and work together on resolutions.' },
  { q: 'Is this my first MUN? Can I still apply?', a: 'Yes. Read the experience requirements shown in the application form for your chosen role. If you are new to MUN, focus on preparation, respectful debate and collaboration.' },
  { q: 'What should delegates prepare?', a: 'Start with the committee topic, your assigned country or role, the background guide when it is published, and a short opening speech. Further preparation details will be shared by the organisers.' },
  { q: 'When and where will ICON MUN take place?', a: 'The organisers will publish confirmed dates and venue details here when they are announced. Please check this page again before making travel plans.' },
  { q: 'How can I check my application?', a: 'Open the Applicant Portal and sign in using the same email address you used on your application. A secure sign-in link will be sent to your inbox.' },
];

export const ConferenceInfoSection: React.FC = () => {
  const { settings } = useSiteData();
  const [now, setNow] = useState(Date.now());
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const conferenceDate = settings.conference_date ? new Date(settings.conference_date) : null;
  const validDate = conferenceDate && !Number.isNaN(conferenceDate.getTime()) ? conferenceDate : null;
  const countdown = useMemo(() => {
    if (!validDate) return null;
    const ms = Math.max(0, validDate.getTime() - now);
    return { days: Math.floor(ms / 86400000), hours: Math.floor((ms % 86400000) / 3600000), minutes: Math.floor((ms % 3600000) / 60000) };
  }, [validDate?.getTime(), now]);
  useEffect(() => {
    if (!validDate) return;
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, [validDate?.getTime()]);
  const guideUrl = safeUrl(settings.delegate_guide_url);
  const venue = settings.venue_name?.trim();
  const address = settings.venue_address?.trim();

  return (
    <section id="conference-info" data-theme="dark" className="relative overflow-hidden border-y border-gold/20 bg-[#080708] px-4 py-20 text-ink2 sm:px-6 sm:py-28 lg:px-12">
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full border border-gold/10" /><div className="pointer-events-none absolute -right-20 top-12 h-72 w-72 rounded-full border border-gold/10" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-[10px] uppercase tracking-[.32em] text-gold">Before the first gavel</p>
            <h2 className="mt-4 max-w-xl font-cinzel text-3xl font-semibold leading-tight text-[#F7EFE3] sm:text-5xl">Everything you need to arrive prepared.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#A89D8A]">Conference details, preparation guidance and answers to common questions — kept in one place as ICON MUN 2027 information is confirmed.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gold/20 bg-white/[.025] p-4"><CalendarDays className="h-5 w-5 text-gold" /><p className="mt-4 text-[10px] uppercase tracking-[.18em] text-[#8E8678]">Conference dates</p>{validDate ? <><p className="mt-1 text-base text-[#F7EFE3]">{validDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>{countdown && <p className="mt-2 text-xs text-gold">{countdown.days}d {countdown.hours}h {countdown.minutes}m remaining</p>}</> : <p className="mt-1 text-base text-[#F7EFE3]">To be announced</p>}</div>
              <div className="rounded-xl border border-gold/20 bg-white/[.025] p-4"><MapPin className="h-5 w-5 text-gold" /><p className="mt-4 text-[10px] uppercase tracking-[.18em] text-[#8E8678]">Venue</p><p className="mt-1 text-base text-[#F7EFE3]">{venue || 'To be announced'}</p>{address && <p className="mt-1 text-xs leading-5 text-[#A89D8A]">{address}</p>}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/portal" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E7DBC3] px-5 text-xs font-semibold uppercase tracking-[.14em] text-[#140D10] transition hover:bg-[#F4E8D1]">Applicant portal <ArrowUpRight size={15} /></a>
              {guideUrl && <a href={guideUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/30 px-5 text-xs uppercase tracking-[.14em] text-[#E7DBC3] transition hover:bg-gold/10"><BookOpen size={15} /> Delegate guide</a>}
            </div>
          </div>
          <div>
            <div className="mb-5 flex items-center gap-3"><ShieldQuestion className="h-5 w-5 text-gold" /><p className="text-[10px] uppercase tracking-[.3em] text-gold">Frequently asked questions</p></div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {FAQS.map((faq, i) => <div key={faq.q}>
                <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-sm text-[#F0E7DC] transition hover:text-[#E7DBC3]"><span>{faq.q}</span><ChevronDown className={'h-4 w-4 shrink-0 transition-transform ' + (openFaq === i ? 'rotate-180' : '')} /></button>
                {openFaq === i && <p className="max-w-2xl pb-5 pr-8 text-sm leading-6 text-[#A89D8A]">{faq.a}</p>}
              </div>)}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.025] p-4"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><p className="text-xs leading-5 text-[#8E8678]">Only details confirmed by the organisers will be published. Dates, venue and preparation materials can be managed from the admin console.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
};
