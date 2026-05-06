import { useState } from 'react';
import '../styles/sidebar.css';

interface NavItem {
  icon: string;
  label: string;
  path: string;
  badge?: number;
  section: 'principal' | 'administration';
}

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('tableau-de-bord');

  const navItems: NavItem[] = [
    { icon: '📊', label: 'Tableau de bord', path: '/dashboard', section: 'principal' },
    { icon: '📤', label: 'Dispatcher', path: '/dispatcher', badge: 4, section: 'principal' },
    { icon: '📥', label: 'Courrier Entrant', path: '/entrant', section: 'principal' },
    { icon: '📬', label: 'Courrier Sortant', path: '/sortant', section: 'principal' },
    { icon: '💬', label: 'Courrier Interne', path: '/interne', section: 'principal' },
    { icon: '👁️', label: 'Mon Suivi', path: '/suivi', section: 'principal' },
    { icon: '📈', label: 'Statistiques', path: '/statistiques', section: 'administration' },
    { icon: '⚙️', label: 'Paramètres', path: '/settings', section: 'administration' },
  ];

  const handleNavClick = (id: string) => {
    setActiveItem(id);
  };

  const principalItems = navItems.filter(item => item.section === 'principal');
  const adminItems = navItems.filter(item => item.section === 'administration');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">📬</span>
          <div className="logo-text">
            <h2>NexusMail</h2>
            <p>Gestion des Courriers</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">PRINCIPAL</h3>
          <ul className="nav-items">
            {principalItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={`nav-link ${activeItem === item.path ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.path);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">ADMINISTRATION</h3>
          <ul className="nav-items">
            {adminItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={`nav-link ${activeItem === item.path ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.path);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="ai-assistant">
          <span className="ai-icon">✨</span>
          <span className="ai-text">IA Assistant actif</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
