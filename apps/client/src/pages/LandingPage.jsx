import { motion, MotionConfig } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, CircleCheck, MapPin, MoveUpRight, Sparkles, Users, HeartHandshake, BriefcaseBusiness, Check, Clock3, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { Brand } from '../components/Brand';

const floatIn = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } };

export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user"><div className="landing-page">
      <SiteHeader />
      <main>
        <section className="hero-section">
          <div className="hero-backdrop-shape" aria-hidden="true" />
          <div className="hero-grid container">
            <motion.div className="hero-copy" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
              <motion.div className="pilot-note" variants={floatIn}><span className="pilot-dot" /> Starting in Bhubaneswar <span className="pilot-note-line" /></motion.div>
              <motion.h1 variants={floatIn}>Find local event shifts.<br className="desktop-break" /> <span>Show up for something good.</span></motion.h1>
              <motion.p className="hero-description" variants={floatIn}>Crewensia connects volunteers with local event organizers. Browse paid and volunteer roles, see the schedule and expectations, then apply directly.</motion.p>
              <motion.div className="hero-actions" variants={floatIn}>
                <Link to="/events"><Button size="lg">Find your next event <ArrowUpRight size={18} /></Button></Link>
                <Link className="text-action" to="/signup?role=ORGANIZER">I’m organizing an event <ArrowRight size={16} /></Link>
              </motion.div>
              <motion.div className="hero-social-proof" variants={floatIn}>
                <span className="proof-avatars"><i>R</i><i>A</i><i>M</i><i>+</i></span>
                <span><strong>Built around real people</strong><small>Local events. Clear roles. Real experience.</small></span>
              </motion.div>
            </motion.div>

            <motion.div className="hero-visual" initial={{ opacity: 0, scale: .96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .7, delay: .15, ease: 'easeOut' }}>
              <motion.div className="visual-sun" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 80, ease: 'linear' }}><span /><span /><span /><span /></motion.div>
              <div className="visual-panel">
                <div className="visual-panel-top"><span>YOUR NEXT CHAPTER</span><Sparkles size={17} /></div>
                <div className="visual-poster"><div className="poster-ring" /><div className="poster-sun" /><div className="poster-stairs" /><span className="poster-label">CITY LIGHTS<br />COMMUNITY FEST</span><span className="poster-date">NOV 22 — 23</span></div>
                <div className="visual-event-info">
                  <div><span className="live-dot" /> OPEN CALL <span className="event-info-count">8 SPOTS</span></div>
                  <h2>Make the day<br />happen together.</h2>
                  <div className="visual-meta"><span><MapPin size={14} />Bhubaneswar</span><span><CalendarDays size={14} />Choose your shift</span></div>
                </div>
              </div>
              <motion.div className="floating-card floating-card-top" animate={{ y: [0, -8, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
                <span className="floating-icon yellow"><CircleCheck size={17} /></span><span><strong>Application sent</strong><small>You’re on your way.</small></span>
              </motion.div>
              <motion.div className="floating-card floating-card-bottom" animate={{ y: [0, 7, 0] }} transition={{ duration: 4.7, repeat: Infinity, ease: 'easeInOut' }}>
                <span className="floating-icon orange"><Users size={17} /></span><span><strong>People make it</strong><small>Show up as yourself.</small></span>
              </motion.div>
              <div className="visual-caption"><span>001 — YOUR CITY, IN MOTION</span><ArrowDown size={15} /></div>
            </motion.div>
          </div>
          <div className="hero-bottom container"><span>FOR THE PEOPLE WHO MAKE THE MOMENT</span><span>DISCOVER <MoveUpRight size={13} /></span></div>
        </section>

        <section className="how-section container" id="how-it-works">
          <div className="section-heading">
            <div><span className="section-kicker">GOOD THINGS START WITH SHOWING UP</span><h2>Find your way into<br />the moments that matter.</h2></div>
            <p>From your first volunteer shift to the next big production, Crewensia makes it easy to find a role, know what to expect, and get involved.</p>
          </div>
          <div className="how-grid">
            <motion.article className="how-card" whileHover={{ y: -5 }} transition={{ duration: .18 }}><span className="how-number">01 / FIND</span><div className="how-icon icon-peach"><MapPin size={22} /></div><h3>Start close to home.</h3><p>Browse upcoming events in your city. Filter by role, skills, and the time you have.</p><span className="how-card-mark">↗</span></motion.article>
            <motion.article className="how-card" whileHover={{ y: -5 }} transition={{ duration: .18 }}><span className="how-number">02 / CHOOSE</span><div className="how-icon icon-yellow"><CalendarDays size={22} /></div><h3>Know before you say yes.</h3><p>See the schedule, responsibilities, openings, and paid or unpaid terms up front.</p><span className="how-card-mark">↗</span></motion.article>
            <motion.article className="how-card" whileHover={{ y: -5 }} transition={{ duration: .18 }}><span className="how-number">03 / SHOW UP</span><div className="how-icon icon-green"><Users size={22} /></div><h3>Make it happen together.</h3><p>Apply directly to organizers, meet your team, and build real event experience.</p><span className="how-card-mark">↗</span></motion.article>
          </div>
        </section>

        <section className="benefits-section" id="for-everyone">
          <div className="container benefits-container">
            <motion.div className="benefits-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .4 }}>
              <span className="section-kicker">TWO SIDES OF A GREAT EVENT</span>
              <h2>A better way to find your place<br className="desktop-break" /> and bring people together.</h2>
              <p>Whether you’re showing up to help or bringing an event to life, Crewensia makes the next step clear.</p>
            </motion.div>
            <div className="benefits-grid">
              <motion.article className="benefit-card volunteer-benefit" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .45 }} whileHover={{ y: -4 }}>
                <div className="benefit-copy"><span className="benefit-audience"><span className="benefit-icon volunteer-benefit-icon"><HeartHandshake size={19} /></span>FOR VOLUNTEERS</span><h3>Find events that fit your life.</h3><p>See what needs doing, when to show up, and what you’ll get from the experience before you apply.</p>
                  <ul className="benefit-points"><li><Check size={16} />Browse nearby event opportunities</li><li><Check size={16} />Know the role, timing, and pay terms up front</li><li><Check size={16} />Apply directly and follow your status</li></ul>
                </div>
                <motion.div className="benefit-preview volunteer-preview" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .2, duration: .45 }}>
                  <div className="benefit-preview-top"><span>YOUR APPLICATION</span><span className="preview-status"><i /> IN REVIEW</span></div>
                  <div className="preview-event"><span className="preview-event-icon"><CalendarDays size={19} /></span><span><strong>Community Garden Day</strong><small><MapPin size={12} /> Saheed Nagar · Upcoming event</small></span></div>
                  <div className="preview-progress"><motion.span initial={{ width: '12%' }} whileInView={{ width: '58%' }} viewport={{ once: true }} transition={{ delay: .35, duration: 1, ease: 'easeOut' }} /></div>
                  <div className="preview-steps"><span className="step-done"><CircleCheck size={15} /> Applied</span><span className="step-current"><Clock3 size={14} /> Organizer review</span><span>Decision</span></div>
                </motion.div>
                <Link className="benefit-link" to="/events">Explore events <ArrowRight size={16} /></Link>
              </motion.article>

              <motion.article className="benefit-card organizer-benefit" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .45, delay: .12 }} whileHover={{ y: -4 }}>
                <div className="benefit-copy"><span className="benefit-audience"><span className="benefit-icon organizer-benefit-icon"><BriefcaseBusiness size={19} /></span>FOR ORGANIZERS</span><h3>Build a crew you can count on.</h3><p>Share a clear opportunity, review interested volunteers, and keep everyone updated as your team comes together.</p>
                  <ul className="benefit-points"><li><Check size={16} />Post roles, schedules, location, and pay</li><li><Check size={16} />Review volunteer profiles and contact details</li><li><Check size={16} />Accept, reject, or waitlist applications</li></ul>
                </div>
                <motion.div className="benefit-preview organizer-preview" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .28, duration: .45 }}>
                  <div className="benefit-preview-top"><span>NEW APPLICATIONS</span><span className="preview-count">2 TO REVIEW</span></div>
                  <motion.div className="preview-applicant" animate={{ x: [0, 3, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}><span className="preview-avatar preview-avatar-orange"><UserRound size={17} /></span><span className="preview-applicant-info"><strong>Aarav Volunteer</strong><small>Event support · Saheed Nagar</small></span><span className="preview-new-dot" /></motion.div>
                  <div className="preview-applicant"><span className="preview-avatar preview-avatar-yellow"><UserRound size={17} /></span><span className="preview-applicant-info"><strong>Riya Das</strong><small>Guest welcome · Bhubaneswar</small></span><span className="preview-pending">PENDING</span></div>
                  <div className="preview-actions"><span><Check size={13} /> Accept</span><span><ArrowRight size={13} /> View profile</span></div>
                </motion.div>
                <Link className="benefit-link" to="/signup?role=ORGANIZER">Start organizing <ArrowRight size={16} /></Link>
              </motion.article>
            </div>
          </div>
        </section>

        <section className="verification-section" id="organizer-verification">
          <motion.div className="container verification-content" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .55 }}>
            <span className="section-kicker">TRUST STARTS BEFORE THE EVENT</span>
            <h2>Every organizer is reviewed by our team.</h2>
            <p>Before an organizer can publish events, our admin team contacts them directly and checks their identity and organization details. Only after this manual review do we approve their account.</p>
            <div className="verification-steps"><span><CircleCheck size={18} /> Contact details collected</span><ArrowRight size={16} /><span><CircleCheck size={18} /> Credentials checked</span><ArrowRight size={16} /><span><CircleCheck size={18} /> Admin approval required</span></div>
          </motion.div>
        </section>
        <section className="landing-cta-section">
          <motion.div className="container landing-cta" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .6 }}>
            <div className="cta-orbit" aria-hidden="true" />
            <span className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>A little of your time.<br /><span>A whole lot of possibility.</span></h2>
            <p>Find your next event in Bhubaneswar, or bring together the people who will make yours happen.</p>
            <div className="landing-cta-actions">
              <Link to="/events"><Button size="lg">Explore opportunities <ArrowUpRight size={18} /></Button></Link>
              <Link className="cta-organizer-link" to="/signup?role=ORGANIZER">Find your event crew <ArrowRight size={18} /></Link>
            </div>
            <span className="cta-footnote"><MapPin size={14} /> Starting local. Building connections.</span>
          </motion.div>
        </section>
      </main>
      <footer className="landing-footer">
          <div className="container landing-footer-main">
          <div className="landing-footer-brand"><Brand /><p>People for every event.<br />Local opportunities, stronger communities.</p><span className="footer-pilot"><MapPin size={14} /> Starting in Bhubaneswar</span></div>
          <nav className="landing-footer-links" aria-label="Explore Crewensia"><h3>Explore</h3><Link to="/events">Find events</Link><Link to="/#how-it-works">How it works</Link><Link to="/signup">Create an account</Link></nav>
          <nav className="landing-footer-links" aria-label="For event organizers"><h3>For organizers</h3><Link to="/signup?role=ORGANIZER">Post an event</Link><Link to="/login">Organizer sign in</Link><Link to="/signup?role=ORGANIZER">Build your event crew</Link></nav>
        </div>
        <div className="container landing-footer-bottom"><span>© {new Date().getFullYear()} Crewensia</span><span>Made for the people who make events happen.</span><Link to="/login">Already part of the crew? Log in <ArrowUpRight size={14} /></Link></div>
      </footer>
    </div></MotionConfig>
  );
}
