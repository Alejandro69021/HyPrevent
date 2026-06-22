import { useState } from 'react';
import Sidebar from './components/Sidebar';
import IntroSection from './components/IntroSection';
import ModuleSection from './components/ModuleSection';
import ReferensiSection from './components/ReferensiSection';
import JadwalSection from './components/JadwalSection';
import { modules } from './data/modules';

/**
 * App — Root SPA component.
 */
export default function App() {
    const [activePage, setActivePage] = useState('home');

    const handleNavigate = (pageId) => {
        setActivePage(pageId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderContent = () => {
        if (activePage === 'home') {
            return <IntroSection />;
        }
        if (activePage === 'referensi') {
            return <ReferensiSection />;
        }
        if (activePage === 'jadwal') {
            return <JadwalSection />;
        }
        const moduleData = modules.find((m) => m.id === activePage);
        if (moduleData) {
            return <ModuleSection module={moduleData} key={moduleData.id} />;
        }
        return <IntroSection />;
    };

    return (
        <div className="app-container">
            <Sidebar activePage={activePage} onNavigate={handleNavigate} />

            <main className="main-content">
                {renderContent()}

                {/* Footer */}
                <footer className="app-footer">
                    <p className="footer-pill">© 2026 — Promosi Kesehatan</p>
                    <div className="footer-dev">
                        <span className="footer-dev-label">Develop by</span>
                        <span className="footer-dev-name">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                            </svg>
                            Alwafie
                        </span>
                        <span className="footer-dev-version">Version 1.0 (beta)</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
