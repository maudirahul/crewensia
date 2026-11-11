import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Brand } from './Brand';
import { Button } from './Button';
import { useAuth } from '../features/auth/AuthContext';
import { applicationsApi } from '../features/applications/applicationsApi';

export function SiteHeader({ app = false }) {
  const { user, signOut, switchRole } = useAuth();
  const unreadQuery = useQuery({ queryKey: ['unread-notifications'], queryFn: applicationsApi.unreadNotificationCount, enabled: Boolean(user), refetchInterval: 30_000, refetchOnWindowFocus: true });
  const hasUnread = (unreadQuery.data ?? 0) > 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();

  async function handleRole(role) {
    try {
      const updated = await switchRole(role);
      setAccountOpen(false);
      navigate(updated.activeRole === 'ORGANIZER' ? '/organizer' : '/events');
    } catch {
      setAccountOpen(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className={`site-header${app ? ' site-header-app' : ''}`}>
      <div className="header-inner">
        <Brand />
        <nav className={`main-nav${menuOpen ? ' nav-open' : ''}`} aria-label="Main navigation">
          <NavLink to="/events" onClick={() => setMenuOpen(false)}>Find opportunities</NavLink>
          {user?.roles?.includes('ORGANIZER') && <NavLink to="/organizer" onClick={() => setMenuOpen(false)}>For organizers</NavLink>}
          {user?.roles?.includes('ADMIN') && <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Admin review</NavLink>}
          {user && <NavLink className="notifications-nav-link" to="/notifications" onClick={() => setMenuOpen(false)}><span className="notification-bell-wrap"><Bell size={16} />{hasUnread && <i className="notification-red-dot" aria-label="Unread notifications" />}</span>Notifications</NavLink>}
        </nav>
        <div className="header-actions">
          {user ? (
            <div className="account-wrap">
              <button className="account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen}>
                <span className="avatar">{user.name?.slice(0, 1)?.toUpperCase() ?? 'C'}</span>
                <span className="account-name">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={15} />
              </button>
              {accountOpen && <div className="account-menu">
                <span className="account-email">{user.email}</span>
                <Link to="/applications" onClick={() => setAccountOpen(false)}>My applications</Link>
                <Link className="account-notifications-link" to="/notifications" onClick={() => setAccountOpen(false)}>Notifications{hasUnread && <i className="notification-red-dot" aria-label="Unread notifications" />}</Link>
                {user.roles?.includes('ADMIN') && <Link to="/admin" onClick={() => setAccountOpen(false)}>Admin panel</Link>}
                {user.roles?.length > 1 && <div className="menu-role-group">
                  <span>Switch workspace</span>
                  {user.roles.filter((role) => role !== 'ADMIN').map((role) => <button key={role} onClick={() => handleRole(role)}>{role === 'ORGANIZER' ? 'Organizer' : 'Volunteer'}{user.activeRole === role ? ' · Active' : ''}</button>)}
                </div>}
                {!user.roles?.includes('ORGANIZER') && <Link to="/organizer/start" onClick={() => setAccountOpen(false)}>Become an organizer</Link>}
                {!user.roles?.includes('VOLUNTEER') && <Link to="/volunteer/start" onClick={() => setAccountOpen(false)}>Join as a volunteer</Link>}
                <button className="menu-signout" onClick={handleSignOut}>Sign out</button>
              </div>}
            </div>
          ) : <>
            <Link className="header-login" to="/login">Log in</Link>
            <Button size="sm" onClick={() => navigate('/signup')}>Get started <span aria-hidden="true">↗</span></Button>
          </>}
        </div>
        <button className="mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}
