import React from 'react';

const illustrations = {
    'blood-pressure': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="60" y="30" width="120" height="140" rx="20" fill="#ccfbf1" stroke="#0d9488" strokeWidth="3" />
            <rect x="80" y="55" width="80" height="50" rx="10" fill="white" stroke="#14b8a6" strokeWidth="2" />
            <text x="120" y="80" textAnchor="middle" fill="#0f766e" fontSize="18" fontWeight="bold">120</text>
            <line x1="90" y1="88" x2="150" y2="88" stroke="#5eead4" strokeWidth="1.5" />
            <text x="120" y="98" textAnchor="middle" fill="#14b8a6" fontSize="14">80</text>
            <text x="120" y="45" textAnchor="middle" fill="#0d9488" fontSize="10" fontWeight="600">mmHg</text>
            <circle cx="120" cy="135" r="18" fill="#99f6e4" stroke="#0d9488" strokeWidth="2" />
            <path d="M112 135 L118 141 L128 129" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M45 100 Q30 90 30 75 Q30 55 50 55 Q60 55 60 65" stroke="#f0abfc" strokeWidth="2" fill="#fce7f3" opacity="0.6" />
            <path d="M195 100 Q210 90 210 75 Q210 55 190 55 Q180 55 180 65" stroke="#f0abfc" strokeWidth="2" fill="#fce7f3" opacity="0.6" />
        </svg>
    ),
    'checkup': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="120" cy="60" r="25" fill="#ccfbf1" stroke="#0d9488" strokeWidth="2" />
            <circle cx="120" cy="52" r="10" fill="#99f6e4" />
            <path d="M100 75 Q120 95 140 75" stroke="#0d9488" strokeWidth="2" fill="none" />
            <rect x="95" y="85" width="50" height="60" rx="8" fill="#ccfbf1" stroke="#0d9488" strokeWidth="2" />
            <rect x="60" y="120" width="40" height="55" rx="8" fill="#e0f2fe" stroke="#0d9488" strokeWidth="2" />
            <rect x="140" y="120" width="40" height="55" rx="8" fill="#e0f2fe" stroke="#0d9488" strokeWidth="2" />
            <rect x="105" y="95" width="30" height="8" rx="3" fill="#5eead4" />
            <rect x="105" y="107" width="30" height="8" rx="3" fill="#5eead4" />
            <circle cx="170" cy="60" r="15" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
            <text x="170" y="65" textAnchor="middle" fill="#d97706" fontSize="16" fontWeight="bold">✓</text>
        </svg>
    ),
    'no-salt': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="85" y="50" width="70" height="100" rx="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
            <rect x="95" y="40" width="50" height="20" rx="5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="105" cy="85" r="3" fill="#94a3b8" />
            <circle cx="120" cy="90" r="3" fill="#94a3b8" />
            <circle cx="135" cy="80" r="3" fill="#94a3b8" />
            <circle cx="115" cy="100" r="3" fill="#94a3b8" />
            <circle cx="130" cy="105" r="3" fill="#94a3b8" />
            <circle cx="110" cy="115" r="3" fill="#94a3b8" />
            <circle cx="125" cy="120" r="3" fill="#94a3b8" />
            <circle cx="120" cy="100" r="40" fill="none" stroke="#ef4444" strokeWidth="4" opacity="0.8" />
            <line x1="92" y1="72" x2="148" y2="128" stroke="#ef4444" strokeWidth="4" opacity="0.8" />
            <text x="120" y="175" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600">Kurangi Garam</text>
        </svg>
    ),
    'fruits-vegs': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="120" cy="140" rx="80" ry="40" fill="#f0fdf4" stroke="#86efac" strokeWidth="2" />
            <circle cx="90" cy="110" r="20" fill="#fca5a5" stroke="#ef4444" strokeWidth="2" />
            <ellipse cx="90" cy="104" rx="6" ry="3" fill="#fecdd3" opacity="0.6" />
            <path d="M85 92 Q90 80 95 92" stroke="#22c55e" strokeWidth="2" fill="#4ade80" />
            <ellipse cx="140" cy="115" rx="18" ry="22" fill="#fde047" stroke="#eab308" strokeWidth="2" />
            <path d="M139 95 Q145 85 148 95" stroke="#22c55e" strokeWidth="2" fill="#4ade80" />
            <circle cx="115" cy="125" r="15" fill="#c084fc" stroke="#a855f7" strokeWidth="2" />
            <ellipse cx="115" cy="121" rx="5" ry="2" fill="#e9d5ff" opacity="0.6" />
            <path d="M60 135 Q55 115 65 120 Q60 105 75 115" fill="#22c55e" stroke="#16a34a" strokeWidth="1.5" />
            <path d="M170 130 Q165 110 175 115 Q170 100 185 110" fill="#22c55e" stroke="#16a34a" strokeWidth="1.5" />
            <circle cx="70" cy="130" r="12" fill="#86efac" stroke="#22c55e" strokeWidth="1.5" />
            <circle cx="165" cy="125" r="14" fill="#fed7aa" stroke="#f97316" strokeWidth="1.5" />
        </svg>
    ),
    'meditation': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="120" cy="100" r="70" fill="#f0fdfa" opacity="0.5" />
            <circle cx="120" cy="100" r="55" fill="#ccfbf1" opacity="0.4" />
            <circle cx="120" cy="60" r="18" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
            <path d="M113 56 Q120 50 127 56" stroke="#f472b6" strokeWidth="1.5" fill="none" />
            <circle cx="115" cy="58" r="1.5" fill="#be185d" />
            <circle cx="125" cy="58" r="1.5" fill="#be185d" />
            <path d="M100 82 L90 110 Q120 130 150 110 L140 82" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="2" />
            <path d="M90 110 Q75 115 70 130" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M150 110 Q165 115 170 130" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M100 130 Q120 160 140 130" stroke="#8b5cf6" strokeWidth="2" fill="none" />
            <circle cx="80" cy="45" r="4" fill="#fde68a" opacity="0.7" />
            <circle cx="160" cy="50" r="3" fill="#bbf7d0" opacity="0.7" />
            <circle cx="70" cy="80" r="3" fill="#c4b5fd" opacity="0.5" />
            <circle cx="170" cy="85" r="4" fill="#fbcfe8" opacity="0.5" />
        </svg>
    ),
    'sleep': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="40" y="100" width="160" height="70" rx="12" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2" />
            <rect x="50" y="90" width="60" height="30" rx="15" fill="#c7d2fe" stroke="#818cf8" strokeWidth="1.5" />
            <circle cx="100" cy="115" r="15" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="1.5" />
            <path d="M94 118 Q100 122 106 118" stroke="#f472b6" strokeWidth="1.5" fill="none" />
            <line x1="93" y1="113" x2="97" y2="113" stroke="#be185d" strokeWidth="2" strokeLinecap="round" />
            <line x1="103" y1="113" x2="107" y2="113" stroke="#be185d" strokeWidth="2" strokeLinecap="round" />
            <rect x="80" y="115" width="100" height="40" rx="5" fill="#ddd6fe" opacity="0.5" />
            <text x="155" y="80" fill="#818cf8" fontSize="20" fontWeight="bold" opacity="0.8">Z</text>
            <text x="170" y="65" fill="#a5b4fc" fontSize="16" fontWeight="bold" opacity="0.6">Z</text>
            <text x="183" y="52" fill="#c7d2fe" fontSize="12" fontWeight="bold" opacity="0.4">Z</text>
            <circle cx="50" cy="45" r="18" fill="#fde68a" opacity="0.3" />
            <circle cx="50" cy="45" r="12" fill="#fef08a" opacity="0.5" />
        </svg>
    ),
    'no-junkfood': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="80" y="60" width="80" height="50" rx="8" fill="#fde68a" stroke="#eab308" strokeWidth="2" />
            <rect x="70" y="110" width="100" height="20" rx="5" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            <rect x="75" y="130" width="90" height="25" rx="6" fill="#fed7aa" stroke="#f97316" strokeWidth="2" />
            <rect x="85" y="70" width="15" height="35" rx="3" fill="#22c55e" opacity="0.7" />
            <rect x="105" y="72" width="15" height="30" rx="3" fill="#ef4444" opacity="0.7" />
            <rect x="125" y="68" width="15" height="38" rx="3" fill="#fbbf24" opacity="0.7" />
            <circle cx="120" cy="105" r="45" fill="none" stroke="#ef4444" strokeWidth="4" opacity="0.8" />
            <line x1="88" y1="73" x2="152" y2="137" stroke="#ef4444" strokeWidth="4" opacity="0.8" />
            <text x="120" y="185" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">Hindari Junk Food</text>
        </svg>
    ),
    'no-caffeine': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M85 80 L85 140 Q85 155 100 155 L140 155 Q155 155 155 140 L155 80 Z" fill="#f0fdf4" stroke="#7c3aed" strokeWidth="2" />
            <path d="M155 95 Q175 95 175 110 Q175 125 155 125" stroke="#7c3aed" strokeWidth="2" fill="none" />
            <path d="M105 70 Q105 55 110 60 Q115 50 120 60 Q125 50 130 60 Q135 55 135 70" stroke="#94a3b8" strokeWidth="1.5" fill="none" opacity="0.5" />
            <rect x="85" y="155" width="70" height="8" rx="4" fill="#ddd6fe" />
            <circle cx="120" cy="115" r="38" fill="none" stroke="#ef4444" strokeWidth="4" opacity="0.8" />
            <line x1="93" y1="88" x2="147" y2="142" stroke="#ef4444" strokeWidth="4" opacity="0.8" />
            <text x="120" y="185" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">Batasi Kafein</text>
        </svg>
    ),
    'no-smoking': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="70" y="100" width="90" height="22" rx="4" fill="#fafaf9" stroke="#a8a29e" strokeWidth="2" />
            <rect x="160" y="100" width="15" height="22" rx="2" fill="#fdba74" stroke="#f97316" strokeWidth="1.5" />
            <circle cx="175" cy="95" r="3" fill="#ef4444" opacity="0.8" />
            <path d="M172 92 Q168 80 174 75 Q180 68 176 58" stroke="#94a3b8" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M178 90 Q175 78 180 72 Q185 65 182 55" stroke="#94a3b8" strokeWidth="1.5" fill="none" opacity="0.4" />
            <circle cx="125" cy="110" r="42" fill="none" stroke="#ef4444" strokeWidth="4" opacity="0.85" />
            <line x1="95" y1="80" x2="155" y2="140" stroke="#ef4444" strokeWidth="4" opacity="0.85" />
            <text x="120" y="175" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">Stop Merokok</text>
        </svg>
    ),
    'healthy-cooking': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="120" cy="145" rx="65" ry="15" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
            <path d="M55 145 L55 100 Q55 85 70 85 L170 85 Q185 85 185 100 L185 145" fill="#e0f2fe" stroke="#0d9488" strokeWidth="2" />
            <path d="M85 85 Q85 60 90 65 Q95 50 100 65 Q105 50 110 65 Q115 60 115 85" stroke="#94a3b8" strokeWidth="1.5" fill="none" opacity="0.4" />
            <circle cx="90" cy="115" r="10" fill="#86efac" stroke="#22c55e" strokeWidth="1.5" />
            <circle cx="115" cy="110" r="8" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" />
            <circle cx="135" cy="118" r="9" fill="#fdba74" stroke="#f97316" strokeWidth="1.5" />
            <circle cx="155" cy="112" r="7" fill="#c084fc" stroke="#a855f7" strokeWidth="1.5" />
            <path d="M120 50 L120 35" stroke="#78716c" strokeWidth="3" strokeLinecap="round" />
            <circle cx="120" cy="30" r="5" fill="#fde68a" stroke="#eab308" strokeWidth="1.5" />
        </svg>
    ),
    'stress-manage': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="120" cy="75" r="30" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
            <circle cx="110" cy="70" r="3" fill="#1e293b" />
            <circle cx="130" cy="70" r="3" fill="#1e293b" />
            <path d="M110 82 Q120 90 130 82" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M90 65 Q100 45 105 60" stroke="#1e293b" strokeWidth="2" fill="none" />
            <path d="M150 65 Q140 45 135 60" stroke="#1e293b" strokeWidth="2" fill="none" />
            <rect x="50" y="120" width="60" height="55" rx="8" fill="#fee2e2" stroke="#fca5a5" strokeWidth="2" />
            <text x="80" y="145" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="600">STRES</text>
            <text x="80" y="162" textAnchor="middle" fill="#f87171" fontSize="20">😰</text>
            <rect x="130" y="120" width="60" height="55" rx="8" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="2" />
            <text x="160" y="145" textAnchor="middle" fill="#059669" fontSize="12" fontWeight="600">KELOLA</text>
            <text x="160" y="162" textAnchor="middle" fill="#10b981" fontSize="20">😊</text>
            <path d="M110 145 L130 145" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
            <defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="#94a3b8" /></marker></defs>
        </svg>
    ),
    'consistency': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="55" y="40" width="130" height="130" rx="15" fill="#f0fdfa" stroke="#99f6e4" strokeWidth="2" />
            <rect x="55" y="40" width="130" height="35" rx="15" fill="#14b8a6" />
            <text x="120" y="63" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">TARGET</text>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <React.Fragment key={i}>
                    <rect x={68 + i * 16} y="90" width="12" height={20 + i * 10} rx="3" fill={i < 5 ? '#5eead4' : '#99f6e4'} stroke="#0d9488" strokeWidth="1" />
                </React.Fragment>
            ))}
            <path d="M68 155 L180 155" stroke="#e2e8f0" strokeWidth="1" />
            <path d="M70 140 Q95 125 110 130 Q130 120 150 115 Q165 110 178 100" stroke="#0d9488" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="178" cy="100" r="5" fill="#0d9488" />
            <text x="120" y="180" textAnchor="middle" fill="#0f766e" fontSize="11" fontWeight="600">Konsisten = Berhasil ✓</text>
        </svg>
    ),
    'exercise-benefit': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="120" cy="95" r="60" fill="#fef2f2" opacity="0.5" />
            <path d="M95 80 Q105 55 120 75 Q135 55 145 80 Q150 95 120 120 Q90 95 95 80Z" fill="#fca5a5" stroke="#ef4444" strokeWidth="2" />
            <path d="M108 85 L115 95 L132 75" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M70 140 L85 125 L100 135 L120 110 L140 130 L155 118 L170 140" stroke="#0d9488" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="70" cy="140" r="3" fill="#0d9488" />
            <circle cx="170" cy="140" r="3" fill="#0d9488" />
            <path d="M85 155 Q120 165 155 155" stroke="#5eead4" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
            <text x="120" y="185" textAnchor="middle" fill="#0f766e" fontSize="11" fontWeight="600">Jantung Sehat</text>
        </svg>
    ),
    'walking': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 165 Q60 150 120 160 Q180 170 240 155" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1.5" />
            <circle cx="120" cy="50" r="15" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
            <path d="M115 48 L115 48" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M125 48 L125 48" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M116 55 Q120 58 124 55" stroke="#1e293b" strokeWidth="1.5" fill="none" />
            <path d="M120 65 L120 110" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 75 L100 95" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 75 L140 90" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 110 L105 145" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 110 L140 140" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="40" r="20" fill="#fef08a" opacity="0.4" />
            <circle cx="60" cy="40" r="12" fill="#fde047" opacity="0.6" />
            <path d="M180 140 L190 130 L185 140 L195 135" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M50 145 L55 135 L60 148 L65 138" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
    ),
    'yoga': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="120" cy="100" r="70" fill="#faf5ff" opacity="0.5" />
            <circle cx="120" cy="45" r="15" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
            <path d="M116 43 L116 43" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M124 43 L124 43" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M116 50 Q120 53 124 50" stroke="#1e293b" strokeWidth="1.5" fill="none" />
            <path d="M120 60 L120 110" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 75 L85 60" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 75 L155 60" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 110 L90 140" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 110 L150 140" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <path d="M90 140 L75 135" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <path d="M150 140 L165 135" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="120" cy="155" rx="50" ry="8" fill="#ede9fe" opacity="0.5" />
            <circle cx="75" cy="35" r="3" fill="#c4b5fd" opacity="0.6" />
            <circle cx="165" cy="40" r="4" fill="#ddd6fe" opacity="0.5" />
            <circle cx="50" cy="60" r="3" fill="#fbcfe8" opacity="0.5" />
        </svg>
    ),
    'cycling': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 170 Q80 165 120 168 Q180 172 240 165" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" />
            <circle cx="80" cy="135" r="28" fill="none" stroke="#0d9488" strokeWidth="3" />
            <circle cx="80" cy="135" r="4" fill="#0d9488" />
            <circle cx="160" cy="135" r="28" fill="none" stroke="#0d9488" strokeWidth="3" />
            <circle cx="160" cy="135" r="4" fill="#0d9488" />
            <line x1="80" y1="135" x2="120" y2="115" stroke="#475569" strokeWidth="2.5" />
            <line x1="120" y1="115" x2="160" y2="135" stroke="#475569" strokeWidth="2.5" />
            <line x1="120" y1="115" x2="110" y2="90" stroke="#475569" strokeWidth="2.5" />
            <line x1="80" y1="135" x2="120" y2="135" stroke="#475569" strokeWidth="2" />
            <line x1="120" y1="135" x2="120" y2="115" stroke="#475569" strokeWidth="2" />
            <rect x="103" y="85" width="20" height="6" rx="3" fill="#475569" />
            <circle cx="115" cy="70" r="12" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
            <path d="M111 68 L111 68" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M119 68 L119 68" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M112 74 Q115 77 118 74" stroke="#1e293b" strokeWidth="1.5" fill="none" />
        </svg>
    ),
    'swimming': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="20" y="90" width="200" height="90" rx="15" fill="#bae6fd" opacity="0.4" />
            <path d="M20 100 Q50 90 80 100 Q110 110 140 100 Q170 90 200 100 Q215 105 220 100" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M20 130 Q50 120 80 130 Q110 140 140 130 Q170 120 200 130 Q215 135 220 130" stroke="#7dd3fc" strokeWidth="1.5" fill="none" opacity="0.4" />
            <circle cx="100" cy="80" r="15" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
            <path d="M96 78 L96 78" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M104 78 L104 78" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M96 85 Q100 88 104 85" stroke="#1e293b" strokeWidth="1.5" fill="none" />
            <path d="M115 85 L160 70" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
            <path d="M85 90 L55 105" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
            <circle cx="45" cy="60" r="4" fill="#bae6fd" opacity="0.6" />
            <circle cx="180" cy="55" r="3" fill="#bae6fd" opacity="0.5" />
            <circle cx="160" cy="75" r="2" fill="#93c5fd" opacity="0.4" />
        </svg>
    ),
    'schedule': (
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="50" y="30" width="140" height="150" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="2" />
            <rect x="50" y="30" width="140" height="35" rx="12" fill="#0d9488" />
            <text x="120" y="53" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">JADWAL OLAHRAGA</text>
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum'].map((day, i) => (
                <React.Fragment key={day}>
                    <rect x="62" y={75 + i * 20} width="116" height="16" rx="4" fill={i < 3 ? '#d1fae5' : '#f0fdfa'} stroke={i < 3 ? '#6ee7b7' : '#99f6e4'} strokeWidth="1" />
                    <text x="78" y={86 + i * 20} fill="#0f766e" fontSize="9" fontWeight="600">{day}</text>
                    <text x="120" y={86 + i * 20} fill="#475569" fontSize="8">{['Jalan Kaki', 'Yoga', 'Bersepeda', 'Berenang', 'Jalan Kaki'][i]}</text>
                    {i < 3 && <text x="165" y={86 + i * 20} fill="#059669" fontSize="10">✓</text>}
                </React.Fragment>
            ))}
        </svg>
    ),
};

export default function StepIllustration({ type }) {
    return (
        <div className="w-full max-w-[280px] mx-auto aspect-[6/5] flex items-center justify-center p-4">
            {illustrations[type] || illustrations['blood-pressure']}
        </div>
    );
}
