import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, HeartHandshake } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { useAuth } from '../features/auth/AuthContext';
import { getApiError } from '../lib/api';
import { DEFAULT_PILOT_CITY, PILOT_CITIES } from '../features/events/locations';

export function VolunteerStartPage() {
  const { addRole } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ homeCity: DEFAULT_PILOT_CITY, locality: '' });
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: addRole, onSuccess: () => navigate('/events') });
  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setError('');
    try { await mutation.mutateAsync({ role: 'VOLUNTEER', ...values }); }
    catch (requestError) { setError(getApiError(requestError, 'We couldn’t add volunteer mode to your account.')); }
  }

  return <div className="site-page"><SiteHeader app /><main className="container form-page-main"><Link to="/organizer" className="back-link"><ArrowLeft size={15} /> Back to your organizer studio</Link><div className="form-page-card"><span className="form-page-icon volunteer-choice"><HeartHandshake size={22} /></span><span className="section-kicker">FIND YOUR PLACE</span><h1>Make space for<br />new experiences.</h1><p>Add volunteer mode to this account. You can switch between organizing and volunteering whenever you like.</p><form className="stacked-form" onSubmit={submit}><label className="field"><span className="field-label">Your city</span><select className="input select-input" name="homeCity" value={values.homeCity} onChange={update} required>{PILOT_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></label><Field label="Area or locality" name="locality" placeholder="e.g. Saheed Nagar" value={values.locality} onChange={update} />{error && <div className="form-error" role="alert">{error}</div>}<Button type="submit" size="lg" loading={mutation.isPending}>Add volunteer mode <ArrowRight size={17} /></Button></form></div></main></div>;
}
