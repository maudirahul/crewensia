import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, MapPin, Mail, Phone, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { EmptyState, ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { organizerApi } from '../features/organizer/organizerApi';
import { formatDate } from '../lib/format';
import { getApiError } from '../lib/api';

const applicationLabels = { PENDING: 'Pending', APPROVED: 'Accepted', REJECTED: 'Rejected', WAITLISTED: 'Waitlisted', WITHDRAWN: 'Withdrawn', COMPLETED: 'Completed' };

export function VolunteerProfilePage() {
  const { volunteerId } = useParams();
  const query = useQuery({ queryKey: ['organizer-volunteer', volunteerId], queryFn: () => organizerApi.getVolunteerProfile(volunteerId) });
  const profile = query.data;

  return <div className="site-page"><SiteHeader app /><main className="container dashboard-main volunteer-profile-page">
    <Link className="back-link" to="/organizer"><ArrowLeft size={15} /> Organizer studio</Link>
    {query.isLoading ? <LoadingMessage label="Loading volunteer profile…" /> : query.isError ? <ErrorMessage message={getApiError(query.error, 'We couldn’t load this volunteer profile.')} /> : <>
      <section className="volunteer-profile-hero"><span className="volunteer-profile-avatar"><UserRound size={27} /></span><div><span className="section-kicker">VOLUNTEER PROFILE</span><h1>{profile.name}</h1><p>Member since {formatDate(profile.createdAt, { month: 'long', year: 'numeric' })}</p></div></section>
      <div className="volunteer-profile-columns"><section className="volunteer-profile-card"><span className="section-kicker">CONTACT AND LOCATION</span><h2>Profile details</h2><div className="volunteer-profile-contact">{profile.email && <a href={`mailto:${profile.email}`}><Mail size={17} />{profile.email}</a>}{profile.phone && <a href={`tel:${profile.phone}`}><Phone size={17} />{profile.phone}</a>}<span><MapPin size={17} />{[profile.volunteerProfile?.locality, profile.volunteerProfile?.homeCity].filter(Boolean).join(', ') || 'Location not provided'}</span></div><h3>Skills</h3>{profile.volunteerProfile?.skills?.length ? <div className="skill-chips">{profile.volunteerProfile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p className="volunteer-profile-muted">No skills added yet.</p>}
        {profile.volunteerProfile?.availabilityWindows?.length > 0 && <><h3>Upcoming availability</h3><ul className="volunteer-availability-list">{profile.volunteerProfile.availabilityWindows.map((window) => <li key={window.id}><CalendarDays size={15} />{formatDate(window.startsAt, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatDate(window.startsAt, { hour: 'numeric', minute: '2-digit' })}–{formatDate(window.endsAt, { hour: 'numeric', minute: '2-digit' })}</li>)}</ul></>}
      </section><section className="volunteer-profile-card"><span className="section-kicker">YOUR EVENTS</span><h2>Application history</h2>{profile.applications?.length ? <div className="volunteer-profile-applications">{profile.applications.map((application) => { const event = application.eventShift?.eventRole?.event; return <article key={application.id}><div><h3>{event?.title || 'Event opportunity'}</h3><p>{event?.city} · {formatDate(event?.startsAt, { month: 'short', day: 'numeric', year: 'numeric' })}</p></div><span className={`status-label status-${application.status.toLowerCase()}`}>{applicationLabels[application.status] || application.status}</span></article>; })}</div> : <EmptyState icon={CalendarDays} title="No applications to your events yet." />}</section></div>
    </>}
  </main></div>;
}
