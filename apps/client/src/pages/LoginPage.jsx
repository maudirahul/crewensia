import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { getApiError } from '../lib/api';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const user = await signIn(values);
      const destination = location.state?.from?.pathname || (user.roles?.includes('ADMIN') ? '/admin' : user.activeRole === 'ORGANIZER' ? '/organizer' : '/events');
      navigate(destination, { replace: true });
    } catch (requestError) { setError(getApiError(requestError, 'We couldn’t sign you in. Check your details and try again.')); }
    finally { setBusy(false); }
  }

  return <motion.div className="auth-form-wrap" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
    <span className="auth-kicker">WELCOME BACK</span><h2>Good to see you.</h2><p className="auth-subtitle">Sign in to pick up where your next event begins.</p>
    <form className="auth-form" onSubmit={submit}>
      <Field label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={update} required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={values.password} onChange={update} required />
      {error && <div className="form-error" role="alert">{error}</div>}
      <Button type="submit" size="lg" className="form-submit" loading={busy}>Log in <span aria-hidden="true">→</span></Button>
    </form>
    <p className="auth-switch">New to Crewensia? <Link to="/signup">Create an account</Link></p>
    <p className="auth-legal">By continuing, you agree to use Crewensia to connect respectfully with local event teams.</p>
  </motion.div>;
}
