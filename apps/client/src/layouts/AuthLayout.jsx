import { ArrowUpRight, CalendarDays, HeartHandshake, MapPin } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Brand } from '../components/Brand';

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-aside">
        <Brand light />
        <div className="auth-aside-content">
          <span className="section-kicker">YOUR CITY IS FULL OF MOMENTS</span>
          <h1>There’s a place<br />for you <em>in it.</em></h1>
          <p>Find event opportunities, choose a role that fits, and meet the people who bring it all to life.</p>
          <div className="auth-aside-list"><span><MapPin size={17} />Opportunities close to home</span><span><CalendarDays size={17} />Clear shifts and expectations</span><span><HeartHandshake size={17} />Direct connection with organizers</span></div>
        </div>
        <div className="auth-aside-foot"><span>BHUBANESWAR PILOT</span><Link to="/">Back to Crewensia <ArrowUpRight size={14} /></Link></div>
        <div className="auth-aside-shape" />
      </section>
      <section className="auth-main"><Outlet /></section>
    </main>
  );
}
