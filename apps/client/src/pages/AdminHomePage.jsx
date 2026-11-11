import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ClipboardCheck, Clock3, RotateCcw, X } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { EmptyState, ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { getApiError } from '../lib/api';
import { formatDate } from '../lib/format';
import { adminApi } from '../features/admin/adminApi';

export function AdminHomePage() {
  const [notes, setNotes] = useState({});
  const [notice, setNotice] = useState(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'organizer-verifications'], queryFn: () => adminApi.getOrganizerVerifications({ status: 'PENDING', pageSize: 50 }) });
  const review = useMutation({
    mutationFn: ({ requestId, decision }) => adminApi.reviewOrganizer(requestId, { decision, notes: notes[requestId] || undefined }),
    onSuccess: (_data, variables) => {
      setNotice({ type: 'success', message: variables.decision === 'APPROVED' ? 'Organizer approved. They can now publish events.' : 'Verification request updated.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizer-verifications'] });
    },
    onError: (error) => setNotice({ type: 'error', message: getApiError(error) }),
  });

  return <div className="site-page"><SiteHeader app /><main className="container dashboard-main admin-main">
    <section className="dashboard-welcome admin-welcome"><div><span className="section-kicker">CREWENSIA ADMIN</span><h1>Organizer review</h1><p>Check submitted credentials and approve organizations before they publish events.</p></div><span className="dashboard-welcome-mark"><ClipboardCheck /></span></section>
    {notice && <div className={`admin-notice admin-notice-${notice.type}`} role="status">{notice.message}<button onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div>}
    <div className="admin-section-head"><div><span className="section-kicker">ONBOARDING QUEUE</span><h2>Pending verification requests</h2></div><Button variant="secondary" size="sm" onClick={() => query.refetch()}><RotateCcw size={14} /> Refresh</Button></div>
    {query.isLoading ? <LoadingMessage label="Loading verification requests…" /> : query.isError ? <ErrorMessage message={getApiError(query.error, 'Could not load organizer requests.')} /> : query.data?.data?.length ? <div className="admin-request-list">{query.data.data.map((item) => <article className="admin-request-card" key={item.id}>
      <div className="admin-request-top"><div><span className="pending-tag"><Clock3 size={12} /> Pending review</span><h3>{item.organizer.organizationName || 'Organization'}</h3><p className="admin-contact">{item.organizer.user.name} · <a href={`mailto:${item.organizer.user.email}`}>{item.organizer.user.email}</a>{item.organizer.user.phone && <> · <a href={`tel:${item.organizer.user.phone}`}>{item.organizer.user.phone}</a></>}</p></div><span className="application-date">Submitted {formatDate(item.submittedAt)}</span></div>
      <div className="admin-credential"><span>{item.credentialType}</span><p>{item.credentialDetails}</p>{item.documentReference && <small>Document: {item.documentReference}</small>}</div>
      <label className="admin-notes-field">Review notes<textarea value={notes[item.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Optional for approval; required when requesting changes or rejecting" /></label>
      <div className="admin-review-actions"><Button size="sm" loading={review.isPending && review.variables?.requestId === item.id && review.variables?.decision === 'APPROVED'} onClick={() => review.mutate({ requestId: item.id, decision: 'APPROVED' })}><Check size={14} /> Approve organizer</Button><Button variant="secondary" size="sm" disabled={review.isPending && review.variables?.requestId === item.id} onClick={() => review.mutate({ requestId: item.id, decision: 'NEEDS_INFORMATION' })}><RotateCcw size={14} /> Request details</Button><Button variant="quiet" size="sm" disabled={review.isPending && review.variables?.requestId === item.id} onClick={() => review.mutate({ requestId: item.id, decision: 'REJECTED' })}><X size={14} /> Reject</Button></div>
    </article>)}</div> : <EmptyState icon={Check} title="All caught up">There are no pending organizer verification requests.</EmptyState>}
  </main></div>;
}
