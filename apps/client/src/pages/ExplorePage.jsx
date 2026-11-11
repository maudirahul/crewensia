import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { EventCard } from '../components/EventCard';
import { EmptyState, ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { Button } from '../components/Button';
import { eventsApi } from '../features/events/eventsApi';
import { useAuth } from '../features/auth/AuthContext';
import { DEFAULT_PILOT_CITY, PILOT_CITIES } from '../features/events/locations';

export function ExplorePage() {
  const { user, ready } = useAuth();
  const profileCity = user?.volunteerProfile?.homeCity;
  const savedCity = PILOT_CITIES.includes(profileCity) ? profileCity : DEFAULT_PILOT_CITY;
  const [filters, setFilters] = useState({ city: savedCity, role: '', skill: '' });
  const [query, setQuery] = useState({ city: savedCity, role: '', skill: '' });
  useEffect(() => {
    if (!ready || !savedCity) return;
    setFilters((current) => current.city ? current : { ...current, city: savedCity });
    setQuery((current) => current.city ? current : { ...current, city: savedCity });
  }, [ready, savedCity]);
  const { data, isLoading, isError } = useQuery({ queryKey: ['events', query], queryFn: () => eventsApi.list(Object.fromEntries(Object.entries(query).filter(([, value]) => value.trim()))) });
  function update(event) { setFilters((current) => ({ ...current, [event.target.name]: event.target.value })); }
  function search(event) { event.preventDefault(); setQuery(filters); }
  const events = data?.data ?? [];

  return <div className="site-page"><SiteHeader app />
    <main className="container explore-main">
      <div className="explore-heading"><div><span className="section-kicker"><MapPin size={13} /> DISCOVER NEAR YOU</span><h1>Find your kind of<br /><em>event.</em></h1><p>Good events need good people. Find a role that fits your time, skills, and energy.</p></div><div className="explore-stamp"><Compass size={22} /><span>YOUR CITY<br />YOUR NEXT MOVE</span></div></div>
      <form className="event-search" onSubmit={search}>
        <label className="search-field"><MapPin size={18} /><span><small>LOCATION</small><select className="search-select" name="city" value={filters.city} onChange={update}>{PILOT_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></span></label>
        <label className="search-field"><Search size={18} /><span><small>ROLE</small><input name="role" value={filters.role} onChange={update} placeholder="Any kind of role" /></span></label>
        <label className="search-field search-field-skill"><SlidersHorizontal size={18} /><span><small>SKILL</small><input name="skill" value={filters.skill} onChange={update} placeholder="Add a skill" /></span></label>
        <Button type="submit" size="md"><Search size={17} /><span className="search-button-label">Search</span></Button>
      </form>
      <div className="results-heading"><div><span className="section-kicker">THE LINEUP</span><h2>{query.city ? `Events in ${query.city}` : 'Events near you'}</h2></div><span className="results-count">{data?.pagination?.total ?? events.length} {data?.pagination?.total === 1 ? 'opportunity' : 'opportunities'}</span></div>
      {isLoading ? <LoadingMessage label="Finding events near you…" /> : isError ? <ErrorMessage message="Events aren’t loading at the moment. Please try again." /> : events.length ? <motion.div className="events-grid" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: .07 } } }}>{events.map((event) => <motion.div key={event.id} variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}><EventCard event={event} /></motion.div>)}</motion.div> : <EmptyState icon={Compass} title="Your next opportunity is on its way." action={<Link to="/signup"><Button variant="outline">Get notified when we launch <ArrowRight size={16} /></Button></Link>}>There aren’t any published events matching these filters yet. Try a different search or check back soon.</EmptyState>}
    </main>
  </div>;
}
