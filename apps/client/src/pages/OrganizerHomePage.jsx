import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, CalendarDays, CircleHelp, Clock3, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { EmptyState, ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { useAuth } from '../features/auth/AuthContext';
import { organizerApi } from '../features/organizer/organizerApi';
import { formatDate } from '../lib/format';

export function OrganizerHomePage() {
  const { user } = useAuth();
  const profileQuery = useQuery({ queryKey: ['organizer-profile'], queryFn: organizerApi.getProfile });
  const eventsQuery = useQuery({ queryKey: ['organizer-events'], queryFn: organizerApi.getEvents });
  const profile = profileQuery.data;

  return <div className="site-page"><SiteHeader app />
    <main className="container dashboard-main">
      <div className="dashboard-welcome"><div><span className="section-kicker">ORGANIZER STUDIO</span><h1>Make room for<br /><em>good things.</em></h1><p>Post clear opportunities. Find people ready to make the day happen.</p></div><div className="dashboard-welcome-mark"><CalendarDays size={29} /></div></div>
      {profileQuery.isLoading ? <LoadingMessage label="Loading your organizer profile…" /> : profileQuery.isError ? <ErrorMessage message="We couldn’t load your organizer profile." /> : profile?.verificationStatus === 'APPROVED' ? <div className="verification-banner verified"><span className="verification-icon"><BadgeCheck size={19} /></span><span><strong>You’re verified, {user?.name?.split(' ')[0]}.</strong><small>Your events can be published and applications are ready to review.</small></span><span className="verified-tag">VERIFIED</span></div> : <div className="verification-banner pending"><span className="verification-icon"><Clock3 size={19} /></span><span><strong>Your organizer profile is being reviewed.</strong><small>Our team will review your contact details and credentials before you can publish an event.</small></span><span className="pending-tag">IN REVIEW</span></div>}

      <div className="dashboard-section-head"><div><span className="section-kicker">YOUR EVENTS</span><h2>Things you’re bringing to life</h2></div>{profile?.verificationStatus === 'APPROVED' && <Link to="/organizer/events/new"><Button><Plus size={17} /> Create an event</Button></Link>}</div>
      {eventsQuery.isLoading ? <LoadingMessage label="Loading your events…" /> : eventsQuery.isError ? <ErrorMessage message="We couldn’t load your event list." /> : eventsQuery.data?.length ? <div className="organizer-event-list">{eventsQuery.data.map((event) => <article className="organizer-event-row" key={event.id}><div className="organizer-event-icon"><CalendarDays size={19} /></div><div className="organizer-event-info"><span className={`status-label status-${event.status?.toLowerCase()}`}>{event.status}</span><h3>{event.title}</h3><p>{formatDate(event.startsAt, { month: 'long', day: 'numeric', year: 'numeric' })} · {event.city}</p></div><Link className="organizer-manage-link" to={`/organizer/events/${event.id}/applications`}>Manage team <ArrowRight size={15} /></Link></article>)}</div> : profile?.verificationStatus === 'APPROVED' ? <EmptyState icon={CalendarDays} title="Your first event starts here." action={<Link to="/organizer/events/new"><Button>Create your first event <ArrowRight size={16} /></Button></Link>}>Give your event a clear role, schedule, location, and compensation details. Volunteers will know what to expect before they apply.</EmptyState> : <div className="pending-note"><CircleHelp size={18} /><p>While your profile is in review, you can explore the volunteer side of Crewensia. We’ll let you know when organizer tools are ready.</p><Link to="/events">Explore events <ArrowRight size={15} /></Link></div>}
      <div className="dashboard-tip"><Users size={17} /><span>Clear roles help volunteers find the right fit. Include specific responsibilities and exact shift times.</span></div>
    </main>
  </div>;
}
