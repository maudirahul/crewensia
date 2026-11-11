import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, HeartHandshake } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { getApiError } from '../lib/api';
import { DEFAULT_PILOT_CITY, PILOT_CITIES } from '../features/events/locations';

const blank = { name: '', email: '', password: '', phone: '', homeCity: DEFAULT_PILOT_CITY, locality: '', organizationName: '', credentialType: '', credentialDetails: '' };

export function SignupPage() {
  const location = useLocation();
  const initialRole = new URLSearchParams(location.search).get('role') === 'ORGANIZER' ? 'ORGANIZER' : 'VOLUNTEER';
  const [role, setRole] = useState(initialRole);
  const [values, setValues] = useState(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const payload = { ...values, initialRole: role };
    if (role === 'VOLUNTEER') delete payload.organizationName, delete payload.credentialType, delete payload.credentialDetails;
    else { delete payload.homeCity; delete payload.locality; }
    try {
      const user = await signUp(payload);
      navigate(user.roles?.includes('ADMIN') ? '/admin' : user.activeRole === 'ORGANIZER' ? '/organizer' : '/events', { replace: true });
    } catch (requestError) { setError(getApiError(requestError, 'We couldn’t create your account. Please try again.')); }
    finally { setBusy(false); }
  }

  return <motion.div className="auth-form-wrap signup-form-wrap" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
    <span className="auth-kicker">JOIN THE CREW</span><h2>Let’s get you started.</h2><p className="auth-subtitle">One account. Find opportunities or bring your event to life.</p>
    <div className="role-choice" role="radiogroup" aria-label="Choose your starting role">
      <button type="button" className={`role-choice-card${role === 'VOLUNTEER' ? ' selected' : ''}`} onClick={() => setRole('VOLUNTEER')} role="radio" aria-checked={role === 'VOLUNTEER'}><span className="role-choice-icon volunteer-choice"><HeartHandshake size={19} /></span><span><strong>Find opportunities</strong><small>I want to join an event team</small></span><i /></button>
      <button type="button" className={`role-choice-card${role === 'ORGANIZER' ? ' selected' : ''}`} onClick={() => setRole('ORGANIZER')} role="radio" aria-checked={role === 'ORGANIZER'}><span className="role-choice-icon organizer-choice"><BriefcaseBusiness size={19} /></span><span><strong>Organize events</strong><small>I’m building an event team</small></span><i /></button>
    </div>
    <form className="auth-form signup-fields" onSubmit={submit}>
      <div className="form-two-col"><Field label="Your name" name="name" autoComplete="name" placeholder="Full name" value={values.name} onChange={update} required /><Field label="Phone number" name="phone" autoComplete="tel" type="tel" placeholder="+91 98765 43210" value={values.phone} onChange={update} required={role === 'ORGANIZER'} /></div>
      <Field label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={update} required />
      <Field label="Password" name="password" type="password" autoComplete="new-password" placeholder="At least 12 characters" value={values.password} onChange={update} minLength={12} required />
      {role === 'VOLUNTEER' ? <div className="form-two-col"><label className="field"><span className="field-label">Your city</span><select className="input select-input" name="homeCity" value={values.homeCity} onChange={update}>{PILOT_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></label><Field label="Area or locality" name="locality" placeholder="e.g. Saheed Nagar" value={values.locality} onChange={update} /></div> : <>
        <Field label="Organization or group name" name="organizationName" placeholder="Your organization" value={values.organizationName} onChange={update} required />
        <Field label="What can help verify your organization?" name="credentialType" placeholder="e.g. Website, registration, event history" value={values.credentialType} onChange={update} required />
        <label className="field"><span className="field-label">A few details about your organization</span><textarea className="input textarea" name="credentialDetails" placeholder="Share a website, public profile, or details our team can use to verify you." value={values.credentialDetails} onChange={update} required rows={3} /></label>
        <p className="verification-note">Organizer accounts are reviewed by our team before events can be published.</p>
      </>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <Button type="submit" size="lg" className="form-submit" loading={busy}>Create account <ArrowRight size={17} /></Button>
    </form>
    <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
  </motion.div>;
}
