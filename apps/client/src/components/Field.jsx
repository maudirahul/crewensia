import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Field({ label, hint, error, className = '', ...props }) {
  const isPassword = props.type === 'password';
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <label className={`field ${className}`.trim()}>
      <span className="field-label">{label}</span>
      {isPassword ? (
        <span className="password-input-wrap">
          <input className={`input${error ? ' input-error' : ''}`} {...props} type={passwordVisible ? 'text' : 'password'} />
          <button
            className="password-visibility-toggle"
            type="button"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </span>
      ) : <input className={`input${error ? ' input-error' : ''}`} {...props} />}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function SelectField({ label, children, ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="input select-input" {...props}>{children}</select>
    </label>
  );
}
