import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { Field, SelectField } from '../components/Field';
import { organizerApi } from '../features/organizer/organizerApi';
import { getApiError } from '../lib/api';
import { DEFAULT_PILOT_CITY, PILOT_CITIES } from '../features/events/locations';

function futureLocalDate(daysAhead, hour) {
  const date = new Date(); date.setDate(date.getDate() + daysAhead); date.setHours(hour, 0, 0, 0);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [draftId, setDraftId] = useState('');
  const [values, setValues] = useState({ title: '', category: '', description: '', venueName: '', venueAddress: '', locality: '', city: DEFAULT_PILOT_CITY, startsAt: futureLocalDate(14, 9), endsAt: futureLocalDate(14, 17), applicationDeadline: futureLocalDate(10, 18), roleTitle: '', responsibilities: '', skills: '', compensationType: 'UNPAID', compensationAmount: '', compensationBasis: 'PER_SHIFT', expectedPaymentAt: '', openings: 5, eligibility: '', benefits: '', dressCode: '', arrivalInstructions: '', otherConditions: '' });
  const create = useMutation({ mutationFn: organizerApi.createEvent, onSuccess: (event) => {
    const ids = JSON.parse(localStorage.getItem('crewensia.organizerEvents') || '[]');
    localStorage.setItem('crewensia.organizerEvents', JSON.stringify([event.id, ...ids.filter((id) => id !== event.id)]));
    queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    return event;
  } });
  function update(event) { const { name, value, type, checked } = event.target; setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value })); }
  async function submit(event) {
    event.preventDefault(); setError('');
    if (draftId) {
      try { await organizerApi.publishEvent(draftId); queryClient.invalidateQueries({ queryKey: ['organizer-events'] }); navigate('/organizer', { state: { message: 'Your event is live. Volunteers can now find it.' } }); }
      catch (publishError) { setError(`Your draft is saved, but couldn’t be published: ${getApiError(publishError)}`); }
      return;
    }
    const startsAt = new Date(values.startsAt); const endsAt = new Date(values.endsAt);
    const payload = {
      title: values.title, category: values.category || undefined, description: values.description,
      venueName: values.venueName || undefined, venueAddress: values.venueAddress, locality: values.locality || undefined, city: values.city,
      startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), applicationDeadline: new Date(values.applicationDeadline).toISOString(),
      eligibility: values.eligibility || undefined, benefits: values.benefits || undefined, dressCode: values.dressCode || undefined,
      arrivalInstructions: values.arrivalInstructions || undefined, otherConditions: values.otherConditions || undefined,
      roles: [{ title: values.roleTitle, responsibilities: values.responsibilities, requiredSkills: values.skills.split(',').map((skill) => skill.trim()).filter(Boolean), compensationType: values.compensationType,
        ...(values.compensationType === 'PAID' ? { compensationAmount: Number(values.compensationAmount), compensationBasis: values.compensationBasis, expectedPaymentAt: values.expectedPaymentAt } : {}),
        shifts: [{ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), openings: Number(values.openings) }],
      }],
    };
    try {
      const created = await create.mutateAsync(payload);
      try { await organizerApi.publishEvent(created.id); queryClient.invalidateQueries({ queryKey: ['organizer-events'] }); navigate('/organizer', { state: { message: 'Your event is live. Volunteers can now find it.' } }); }
      catch (publishError) { setDraftId(created.id); setError(`Your event was saved as a draft, but couldn’t be published: ${getApiError(publishError)}`); }
    } catch (requestError) { setError(getApiError(requestError, 'Please review the event details and try again.')); }
  }

  return <div className="site-page"><SiteHeader app /><main className="container create-event-main"><Link to="/organizer" className="back-link"><ArrowLeft size={15} /> Organizer studio</Link><div className="create-event-intro"><span className="section-kicker">MAKE THE CALL</span><h1>Give your event<br /><em>a great crew.</em></h1><p>Share the details people need to know before they apply.</p></div>
    <form className="event-form" onSubmit={submit}>
      <section className="event-form-section"><div className="event-form-section-title"><span>01</span><div><h2>The event</h2><p>Set the scene. Make the essentials easy to find.</p></div></div><div className="event-form-fields"><Field label="Event title" name="title" placeholder="e.g. Neighbourhood Arts Festival" value={values.title} onChange={update} required /><div className="form-two-col"><Field label="Category" name="category" placeholder="Community, music, sport…" value={values.category} onChange={update} /><Field label="Venue name" name="venueName" placeholder="Name of the venue" value={values.venueName} onChange={update} /></div><label className="field"><span className="field-label">About the event</span><textarea className="input textarea" name="description" rows={4} placeholder="What is happening, and why will people want to apply?" value={values.description} onChange={update} required /></label><div className="form-two-col"><SelectField label="City" name="city" value={values.city} onChange={update} required>{PILOT_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</SelectField><Field label="Area or locality" name="locality" placeholder="e.g. Saheed Nagar" value={values.locality} onChange={update} /></div><Field label="Street address" name="venueAddress" placeholder="Full address of the venue" value={values.venueAddress} onChange={update} required /></div></section>
      <section className="event-form-section"><div className="event-form-section-title"><span>02</span><div><h2>Timing and arrival</h2><p>Give people a clear picture of the day.</p></div></div><div className="event-form-fields"><div className="form-two-col"><Field label="Event starts" type="datetime-local" name="startsAt" value={values.startsAt} onChange={update} required /><Field label="Event ends" type="datetime-local" name="endsAt" value={values.endsAt} onChange={update} required /></div><Field label="Apply by" type="datetime-local" name="applicationDeadline" value={values.applicationDeadline} onChange={update} required /><div className="form-two-col"><Field label="Arrival instructions" name="arrivalInstructions" placeholder="Where to check in, what to bring…" value={values.arrivalInstructions} onChange={update} /><Field label="Dress code" name="dressCode" placeholder="Comfortable shoes, event shirt…" value={values.dressCode} onChange={update} /></div><div className="form-two-col"><Field label="Who can apply?" name="eligibility" placeholder="Any experience or age requirements?" value={values.eligibility} onChange={update} /><Field label="Benefits" name="benefits" placeholder="Meals, certificate, transport…" value={values.benefits} onChange={update} /></div></div></section>
      <section className="event-form-section"><div className="event-form-section-title"><span>03</span><div><h2>The opportunity</h2><p>Describe the role and how volunteers will be compensated.</p></div></div><div className="event-form-fields"><Field label="Role title" name="roleTitle" placeholder="e.g. Guest check-in team" value={values.roleTitle} onChange={update} required /><label className="field"><span className="field-label">Responsibilities</span><textarea className="input textarea" name="responsibilities" rows={3} placeholder="What will someone in this role do?" value={values.responsibilities} onChange={update} required /></label><Field label="Useful skills" name="skills" placeholder="Separate skills with commas" value={values.skills} onChange={update} hint="Optional. Example: guest support, first aid, photography" /><div className="form-two-col"><SelectField label="Compensation" name="compensationType" value={values.compensationType} onChange={update}><option value="UNPAID">Unpaid volunteer role</option><option value="PAID">Paid role</option></SelectField><Field label="Number of openings" type="number" name="openings" min="1" max="10000" value={values.openings} onChange={update} required /></div>{values.compensationType === 'PAID' && <div className="paid-fields"><div className="form-two-col"><Field label="Payment amount (INR)" type="number" name="compensationAmount" min="1" step="0.01" placeholder="e.g. 1500" value={values.compensationAmount} onChange={update} required /><SelectField label="Payment basis" name="compensationBasis" value={values.compensationBasis} onChange={update}><option value="PER_SHIFT">Per shift</option><option value="PER_HOUR">Per hour</option><option value="PER_EVENT">Per event</option></SelectField></div><Field label="When will payment be made?" name="expectedPaymentAt" placeholder="e.g. At the end of the event" value={values.expectedPaymentAt} onChange={update} required /><p className="payment-note">Payment is arranged directly between you and the volunteer. Crewensia does not process payments.</p></div>}</div></section>
      <label className="field final-notes"><span className="field-label">Anything else volunteers should know?</span><textarea className="input textarea" name="otherConditions" rows={3} placeholder="Optional information for applicants" value={values.otherConditions} onChange={update} /></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="event-submit-row"><span><MapPin size={15} /> Your event will be visible to people browsing {values.city || 'your city'}.</span><Button type="submit" size="lg" loading={create.isPending}><Plus size={17} /> {draftId ? 'Retry publishing' : 'Publish event'} <ArrowRight size={16} /></Button></div>
    </form></main></div>;
}
