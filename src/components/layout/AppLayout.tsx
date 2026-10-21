
import { NavLink, Outlet } from 'react-router-dom';

import {
  CalendarDays,
  ChartNoAxesColumn,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Target,
} from 'lucide-react';

import './AppLayout.css';

const navigation = [
  {
    path: '/',
    label: 'Мій день',
    icon: LayoutDashboard,
    end: true,
  },
  {
    path: '/subjects',
    label: 'Предмети',
    icon: GraduationCap,
  },
  {
    path: '/tasks',
    label: 'Завдання',
    icon: ListTodo,
  },
  {
    path: '/week',
    label: 'Мій тиждень',
    icon: CalendarDays,
  },
  {
    path: '/focus',
    label: 'Фокус',
    icon: Target,
  },
  {
    path: '/progress',
    label: 'Прогрес',
    icon: ChartNoAxesColumn,
  },
];

export function AppLayout() {
  return (
    <div className="uf-app-layout">
      <aside className="uf-sidebar">
        <NavLink to="/" className="uf-brand">
          <span className="uf-brand__symbol">
            <CheckSquare size={23} aria-hidden="true" />
          </span>

          <span className="uf-brand__text">
            Uni<span>Flow</span>
          </span>
        </NavLink>

        <div className="uf-sidebar__caption">
          НАВІГАЦІЯ
        </div>

        <nav className="uf-navigation" aria-label="Основна навігація">
          {navigation.map(({ path, label, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                [
                  'uf-navigation__link',
                  isActive && 'uf-navigation__link--active',
                ].filter(Boolean).join(' ')
              }
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="uf-sidebar__footer">
          <p>Навчання без хаосу.</p>
          <span>UniFlow · Student Planner</span>
        </div>
      </aside>

      <div className="uf-app-layout__main">
        <header className="uf-topbar">
          <span className="uf-topbar__title">
            Твій навчальний простір
          </span>

          <div className="uf-topbar__status">
            <span className="uf-topbar__status-dot" />
            Мій семестр
          </div>
        </header>

        <main id="main-content" className="uf-page">
          <Outlet />
        </main>
      </div>

      <nav
        className="uf-mobile-nav"
        aria-label="Мобільна навігація"
      >
        {navigation.map(({ path, label, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              [
                'uf-mobile-nav__link',
                isActive && 'uf-mobile-nav__link--active',
              ].filter(Boolean).join(' ')
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
