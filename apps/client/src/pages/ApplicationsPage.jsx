import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, MapPin, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { EmptyState, ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { applicationsApi } from '../features/applications/applicationsApi';
import { formatDate } from '../lib/format';
import { getApiError } from '../lib/api';

function statusLabel(status) {
  return ({ PENDING: 'Waiting for organizer', APPROVED: 'You’re on the team', REJECTED: 'Not selected', WITHDRAWN: 'Withdrawn', WAITLISTED: 'Waitlisted', COMPLETED: 'Completed' })[status] ?? status;
}

export function ApplicationsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['my-applications'], queryFn: applicationsApi.listMine, refetchInterval: 15_000, refetchOnWindowFocus: true });
  const withdraw = useMutation({ mutationFn: applicationsApi.withdraw, onSuccess: () => client.invalidateQueries({ queryKey: ['my-applications'] }) });
  const applications = query.data ?? [];
  return <div className="site-page"><SiteHeader app /><main className="container dashboard-main applications-page"><div className="page-title-block"><span className="section-kicker">YOUR NEXT CHAPTER</span><h1>My applications.</h1><p>Every event you’ve raised your hand for, all in one place.</p></div>
    {query.isLoading ? <LoadingMessage label="Loading your applications…" /> : query.isError ? <ErrorMessage message="We couldn’t load your applications." /> : applications.length ? <div className="application-list">{applications.map((application) => { const event = application.eventShift?.eventRole?.event; const role = application.eventShift?.eventRole; const shift = application.eventShift; return <article className="application-card" key={application.id}><div className="application-card-top"><span className={`status-label status-${application.status.toLowerCase()}`}>{statusLabel(application.status)}</span><span className="application-date">Applied {formatDate(application.appliedAt, { month: 'short', day: 'numeric' })}</span></div><Link to={`/events/${event?.id}`}><h2>{event?.title ?? 'Event opportunity'} <ArrowUpRight size={16} /></h2></Link><p className="application-role">{role?.title}</p><div className="application-meta"><span><CalendarDays size={15} />{formatDate(shift?.startsAt, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span><MapPin size={15} />{event?.city}</span></div>{application.message && <p className="application-message">“{application.message}”</p>}{['PENDING','APPROVED','WAITLISTED'].includes(application.status) && new Date(shift?.startsAt) > new Date() && <Button variant="text" size="sm" className="withdraw-action" loading={withdraw.isPending} onClick={() => withdraw.mutate(application.id)}><RotateCcw size={14} /> Withdraw application</Button>}</article>; })}</div> : <EmptyState icon={CalendarDays} title="Your next story starts somewhere." action={<Link to="/events"><Button>Explore opportunities <ArrowUpRight size={16} /></Button></Link>}>When you apply to an event, you’ll be able to track the organizer’s decision here.</EmptyState>}
    {withdraw.isError && <div className="form-error">{getApiError(withdraw.error, 'Couldn’t withdraw that application.')}</div>}
  </main></div>;
}
