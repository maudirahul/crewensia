import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock3, MapPin, ShieldCheck, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { eventsApi } from '../features/events/eventsApi';
import { useAuth } from '../features/auth/AuthContext';
import { formatCompensation, formatDate, formatTime, getEventLocation } from '../lib/format';
import { getApiError } from '../lib/api';
import { useState } from 'react';

export function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [notice, setNotice] = useState('');
  const { data: event, isLoading, isError } = useQuery({ queryKey: ['event', eventId], queryFn: () => eventsApi.get(eventId) });
  const apply = useMutation({
    mutationFn: ({ shiftId, message }) => eventsApi.apply(shiftId, message),
    onSuccess: () => { setNotice('Your application is in. The organizer will be in touch.'); queryClient.invalidateQueries({ queryKey: ['my-applications'] }); },
    onError: (error) => setNotice(getApiError(error, 'We couldn’t send your application. Please try again.')),
  });

  if (isLoading) return <div className="site-page"><SiteHeader app /><div className="container page-pad"><LoadingMessage label="Loading event details…" /></div></div>;
  if (isError || !event) return <div className="site-page"><SiteHeader app /><div className="container page-pad"><ErrorMessage message="We couldn’t find that event. It may have been removed." /><Link className="back-link" to="/events"><ArrowLeft size={15} /> Back to events</Link></div></div>;

  const isVolunteer = user?.roles?.includes('VOLUNTEER');
  async function handleApply(shiftId) {
    if (!user) { navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } }); return; }
    if (!isVolunteer) { setNotice('Switch to volunteer mode to apply for a shift.'); return; }
    apply.mutate({ shiftId, message: '' });
  }

  return <div className="site-page"><SiteHeader app />
    <main className="container detail-main">
      <Link className="back-link" to="/events"><ArrowLeft size={15} /> All opportunities</Link>
      <motion.div className="detail-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="detail-hero-art"><div className="detail-art-sun" /><div className="detail-art-lines" /><span>{event.category || 'COMMUNITY EVENT'}</span><strong>{event.title}</strong><small>CREWENSIA / LOCAL</small></div>
        <div className="detail-hero-copy"><span className="event-status-pill"><i /> APPLICATIONS OPEN</span><h1>{event.title}</h1><p className="detail-organizer">Hosted by <strong>{event.organizer?.organizationName || event.organizer?.user?.name || 'Local organizer'}</strong></p><div className="detail-quick-facts"><span><CalendarDays size={17} /><b>{formatDate(event.startsAt, { weekday: 'long', month: 'long', day: 'numeric' })}</b></span><span><MapPin size={17} /><b>{getEventLocation(event)}</b></span><span><Clock3 size={17} /><b>Apply by {formatDate(event.applicationDeadline, { month: 'short', day: 'numeric' })}</b></span></div><p className="detail-description">{event.description}</p>
          <div className="event-detail-tags"><span><ShieldCheck size={14} /> Organizer verified</span><span>Clear role expectations</span></div>
        </div>
      </motion.div>
      <div className="detail-content-grid"><section className="roles-section"><div className="section-title-row"><div><span className="section-kicker">FIND YOUR ROLE</span><h2>Where you fit in</h2></div><span className="role-count">{event.roles?.length ?? 0} roles</span></div>
        {event.roles?.map((role) => <article className="role-card" key={role.id}><div className="role-card-head"><div><span className="role-card-kicker">THE ROLE</span><h3>{role.title}</h3></div><strong className={`role-pay${role.compensationType === 'UNPAID' ? ' role-pay-unpaid' : ''}`}>{formatCompensation(role)}</strong></div><p>{role.responsibilities}</p>{role.requiredSkills?.length > 0 && <div className="skill-chips">{role.requiredSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>}
          {role.compensationType === 'PAID' && role.expectedPaymentAt && <p className="payment-note">Payment timing: {role.expectedPaymentAt}. Payment is arranged directly with the organizer.</p>}
          <div className="shift-list">{role.shifts?.map((shift, index) => <div className="shift-row" key={shift.id}><div><span className="shift-name">Shift {index + 1}</span><span className="shift-time">{formatDate(shift.startsAt, { month: 'short', day: 'numeric' })} · {formatTime(shift.startsAt)}–{formatTime(shift.endsAt)}</span></div><span className="shift-spots"><Users size={14} /> {shift.openings} spots</span><Button size="sm" onClick={() => handleApply(shift.id)} loading={apply.isPending}>Apply <ArrowUpRight size={14} /></Button></div>)}</div>
        </article>)}
      </section><aside className="detail-aside"><div className="detail-aside-card"><span className="section-kicker">BE READY FOR THE DAY</span><h3>Here’s what to know.</h3><ul><li><Check size={15} />Arrive on time for your selected shift</li><li><Check size={15} />Follow the organizer’s arrival instructions</li><li><Check size={15} />Ask the organizer directly about event details</li></ul><div className="aside-location"><MapPin size={16} /><span><strong>{event.venueName || 'Event venue'}</strong><small>{event.venueAddress}</small></span></div><p className="aside-trust">Your application goes straight to the organizer. Crewensia never handles event payments.</p></div></aside></div>
      {notice && <div className={`toast-message${apply.isError ? ' toast-error' : ''}`}>{apply.isError ? getApiError(apply.error) : notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
    </main>
  </div>;
}
