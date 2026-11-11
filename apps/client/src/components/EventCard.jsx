import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, MapPin, Users } from 'lucide-react';
import { formatCompensation, formatDate, getEventLocation } from '../lib/format';

export function EventCard({ event, featured = false }) {
  const roles = event.roles ?? [];
  const firstRole = roles[0];
  const shiftCount = roles.reduce((sum, role) => sum + (role.shifts?.length ?? 0), 0);
  const openings = roles.reduce((sum, role) => sum + (role.shifts ?? []).reduce((n, shift) => n + shift.openings, 0), 0);
  return (
    <Link className={`event-card${featured ? ' event-card-featured' : ''}`} to={`/events/${event.id}`}>
      <div className="event-card-art">
        <div className="event-art-orbit orbit-one" /><div className="event-art-orbit orbit-two" />
        <span className="event-category">{event.category || 'Community'}</span>
        <span className="event-card-date">{formatDate(event.startsAt, { month: 'short', day: 'numeric' })}</span>
        <span className="event-art-copy">{event.title?.split(' ').slice(0, 2).join('\n')}</span>
      </div>
      <div className="event-card-body">
        <div className="event-card-title-row"><h3>{event.title}</h3><ArrowUpRight size={18} /></div>
        <p className="event-card-location"><MapPin size={15} />{getEventLocation(event)}</p>
        <div className="event-card-meta">
          <span><CalendarDays size={14} />{shiftCount} {shiftCount === 1 ? 'shift' : 'shifts'}</span>
          <span><Users size={14} />{openings} spots</span>
        </div>
        <div className="event-card-footer">
          <span className="role-label">{firstRole?.title || 'Event volunteer'}</span>
          <strong className={firstRole?.compensationType === 'PAID' ? 'pay-amount' : 'unpaid-label'}>{formatCompensation(firstRole)}</strong>
        </div>
      </div>
    </Link>
  );
}
