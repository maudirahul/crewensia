export function formatDate(value, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!value) return 'Date to be announced';
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(value));
}

export function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function formatCompensation(role) {
  if (role?.compensationType !== 'PAID' || role.compensationAmount == null) return 'Volunteer role';
  const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(role.compensationAmount);
  const basis = { PER_HOUR: '/ hour', PER_SHIFT: '/ shift', PER_EVENT: '/ event' }[role.compensationBasis] ?? '';
  return `${amount}${basis}`;
}

export function getEventLocation(event) {
  return [event?.locality, event?.city].filter(Boolean).join(', ') || event?.venueAddress || 'Location to be announced';
}
