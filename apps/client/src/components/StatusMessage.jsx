import { AlertCircle, LoaderCircle } from 'lucide-react';

export function LoadingMessage({ label = 'Loading…' }) {
  return <div className="status-message"><LoaderCircle className="spin" size={20} /><span>{label}</span></div>;
}

export function ErrorMessage({ message = 'We couldn’t load this right now.' }) {
  return <div className="inline-error"><AlertCircle size={18} /><span>{message}</span></div>;
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-icon"><Icon size={23} /></span>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
