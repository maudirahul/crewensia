import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CircleDot, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { EmptyState, ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { applicationsApi } from '../features/applications/applicationsApi';
import { formatDate } from '../lib/format';

export function NotificationsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: applicationsApi.notifications });
  const markRead = useMutation({ mutationFn: applicationsApi.markNotificationRead, onSuccess: () => { client.invalidateQueries({ queryKey: ['notifications'] }); client.invalidateQueries({ queryKey: ['unread-notifications'] }); } });
  const notifications = query.data ?? [];
  return <div className="site-page"><SiteHeader app /><main className="container dashboard-main"><div className="page-title-block"><span className="section-kicker">STAY IN THE LOOP</span><h1>Your notifications.</h1><p>Updates from your events and applications.</p></div>{query.isLoading ? <LoadingMessage /> : query.isError ? <ErrorMessage message="Notifications are unavailable right now." /> : notifications.length ? <div className="notification-list">{notifications.map((item) => <article className={`notification-card${item.readAt ? '' : ' notification-unread'}`} key={item.id}><span className="notification-icon">{item.readAt ? <Bell size={18} /> : <CircleDot size={18} />}</span><div className="notification-content"><div className="notification-title-row"><h2>{item.title}</h2><span>{formatDate(item.createdAt, { month: 'short', day: 'numeric' })}</span></div><p>{item.message}</p>{item.eventId && <Link to={`/events/${item.eventId}`}>View event <ExternalLink size={13} /></Link>}</div>{!item.readAt && <button className="mark-read-button" title="Mark as read" onClick={() => markRead.mutate(item.id)}><Check size={16} /></button>}</article>)}</div> : <EmptyState icon={Bell} title="You’re all caught up.">When an organizer replies or your events change, you’ll see it here.</EmptyState>}</main></div>;
}
