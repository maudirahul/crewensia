export function Field({ label, hint, error, className = '', ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span className="field-label">{label}</span>
      <input className={`input${error ? ' input-error' : ''}`} {...props} />
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
