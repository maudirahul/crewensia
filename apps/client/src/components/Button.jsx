export function Button({ variant = 'primary', size = 'md', className = '', loading = false, children, ...props }) {
  return (
    <button className={`button button-${variant} button-${size} ${className}`.trim()} disabled={loading || props.disabled} {...props}>
      {loading && <span className="button-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
