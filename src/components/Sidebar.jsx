import { useState } from 'react';

/**
 * Sidebar — Fixed left-side SPA navigation with minimalist SVG icons.
 */

const menuItems = [
    {
        id: 'home',
        label: 'Home',
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
            </svg>
        ),
    },
    {
        id: 'modul-1',
        label: 'Modul 1: Penjelasan',
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" />
            </svg>
        ),
    },
    {
        id: 'modul-2',
        label: 'Modul 2: Pantangan',
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
        ),
    },
    {
        id: 'modul-3',
        label: 'Modul 3: Olahraga',
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        ),
    },
    {
        id: 'jadwal',
        label: 'Jadwal Latihan',
        icon: (
            <svg viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        id: 'referensi',
        label: 'Referensi',
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="13" y2="11" />
            </svg>
        ),
    },
];

export default function Sidebar({ activePage, onNavigate }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleNav = (id) => {
        onNavigate(id);
        setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className="menu-toggle"
                aria-label="Toggle menu"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                ☰
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="mobile-overlay show"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar panel */}
            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header" onClick={() => handleNav('home')} style={{ cursor: 'pointer' }}>
                    <div className="logo">
                        <div className="logo-icon">
                            <img src="/HyPrevent.png" alt="HyPrevent Logo" className="logo-img" />
                        </div>
                        <div>
                            <h1>HyPrevent</h1>
                        </div>
                    </div>
                    <p className="logo-subtitle">Strength to Prevent</p>
                </div>

                <nav>
                    <ul className="nav-menu">
                        {menuItems.map((item) => (
                            <li key={item.id} className="nav-item">
                                <div
                                    className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                                    onClick={() => handleNav(item.id)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
}
