import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { getApiError, api } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';

export function OrganizerStartPage() {
  const { addRole } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ phone: '', organizationName: '', credentialType: '', credentialDetails: '' });
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: async (payload) => {
    await api.patch('/me/profile', { phone: payload.phone });
    return addRole({ role: 'ORGANIZER', ...payload });
  }, onSuccess: () => navigate('/organizer') });
  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) { event.preventDefault(); setError(''); try { await mutation.mutateAsync(values); } catch (requestError) { setError(getApiError(requestError, 'We couldn’t start organizer onboarding.')); } }

  return <div className="site-page"><SiteHeader app /><main className="container form-page-main"><Link to="/events" className="back-link"><ArrowLeft size={15} /> Back to events</Link><div className="form-page-card"><span className="form-page-icon"><BriefcaseBusiness size={22} /></span><span className="section-kicker">START ORGANIZING</span><h1>Build your event<br />team on Crewensia.</h1><p>Tell us a little about your organization. Our team will verify your details before you can publish an event.</p><form className="stacked-form" onSubmit={submit}><Field label="Contact phone" name="phone" type="tel" placeholder="+91 98765 43210" value={values.phone} onChange={update} required /><Field label="Organization or group name" name="organizationName" placeholder="Your organization" value={values.organizationName} onChange={update} required /><Field label="Verification type" name="credentialType" placeholder="Website, registration, event history…" value={values.credentialType} onChange={update} required /><label className="field"><span className="field-label">Verification details</span><textarea className="input textarea" name="credentialDetails" rows={4} placeholder="Add a public link or details our team can verify." value={values.credentialDetails} onChange={update} required /></label>{error && <div className="form-error" role="alert">{error}</div>}<Button type="submit" size="lg" loading={mutation.isPending}>Submit for review <ArrowRight size={17} /></Button></form></div></main></div>;
}
