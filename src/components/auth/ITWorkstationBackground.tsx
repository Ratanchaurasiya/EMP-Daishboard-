import React, { useEffect, useState } from 'react';

interface ITWorkstationBackgroundProps {
  mousePos?: { x: number; y: number };
}

export const ITWorkstationBackground: React.FC<ITWorkstationBackgroundProps> = ({ mousePos }) => {
  const [internalMouse, setInternalMouse] = useState({ x: 0, y: 0 });
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  useEffect(() => {
    if (mousePos) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      setInternalMouse({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mousePos]);

  // Calculate mouse delta (-1 to +1)
  const mx = mousePos ? (mousePos.x - window.innerWidth / 2) / (window.innerWidth / 2) : internalMouse.x;
  const my = mousePos ? (mousePos.y - window.innerHeight / 2) / (window.innerHeight / 2) : internalMouse.y;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden bg-[#05070a]">
      {/* Dynamic Keyframes for Idle Animations & Light Pulses */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(-2deg); }
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(2.5deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        @keyframes laserDash {
          0% { stroke-dashoffset: 120; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ledBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes screenScan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .asset-badge-zoom {
          pointer-events: auto;
          cursor: pointer;
          transform-box: fill-box;
          transform-origin: center;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s ease;
        }
        .asset-badge-zoom:hover {
          transform: scale(1.5) !important;
          filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.95)) !important;
        }
      `}</style>

      {/* Deep Dark Ambient Background Gradients */}
      <div className="absolute top-1/4 left-1/6 w-[600px] h-[600px] bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Cyber Grid Background Lines */}
      <div 
        className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fbbf24_1px,transparent_1px),linear-gradient(to_bottom,#fbbf24_1px,transparent_1px)] bg-[size:4rem_4rem]"
        style={{
          transform: `translate(${mx * 8}px, ${my * 8}px)`,
          transition: 'transform 0.2s ease-out',
        }}
      />

      {/* ===================================================================== */}
      {/* MAIN CARTOON IT ARTWORK CONTAINER (LEFT & CENTER PORTION OF SCREEN)   */}
      {/* ===================================================================== */}
      <div className="absolute inset-0 flex items-center justify-start pl-4 sm:pl-8 lg:pl-16 pr-4 md:pr-0 w-full md:w-[62%] lg:w-[68%] h-full">
        
        {/* SVG Cartoon IT Workstation Scene */}
        <svg
          className="w-full h-auto max-h-[82vh] max-w-[950px] overflow-visible drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          viewBox="0 0 960 640"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Glow Filter */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradients */}
            <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="screenGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="screenBezel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="goldBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>

            <linearGradient id="cyanBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <linearGradient id="serverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
          </defs>

          {/* ----------------------------------------------------------------- */}
          {/* CONNECTIVITY NETWORK LINES (BACKGROUND LASERS)                   */}
          {/* ----------------------------------------------------------------- */}
          <g strokeWidth="2" strokeDasharray="6 6" opacity="0.6">
            <line x1="480" y1="290" x2="220" y2="140" stroke="#f59e0b" filter="url(#goldGlow)" />
            <line x1="480" y1="290" x2="740" y2="130" stroke="#38bdf8" filter="url(#cyanGlow)" />
            <line x1="480" y1="290" x2="140" y2="340" stroke="#10b981" />
            <line x1="480" y1="290" x2="810" y2="330" stroke="#f59e0b" filter="url(#goldGlow)" />
            <line x1="480" y1="290" x2="480" y2="80" stroke="#a855f7" />
          </g>

          {/* Animated Laser Pulse Dots Traveling Along Lines */}
          <circle cx="350" cy="215" r="4" fill="#fbbf24" filter="url(#goldGlow)">
            <animate attributeName="cx" values="480;220;480" dur="4s" repeatCount="indefinite" />
            <animate attributeName="cy" values="290;140;290" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="610" cy="210" r="4" fill="#38bdf8" filter="url(#cyanGlow)">
            <animate attributeName="cx" values="480;740;480" dur="3.5s" repeatCount="indefinite" />
            <animate attributeName="cy" values="290;130;290" dur="3.5s" repeatCount="indefinite" />
          </circle>

          {/* ----------------------------------------------------------------- */}
          {/* CARTOON SERVER RACK TOWER (LEFT SIDE)                            */}
          {/* ----------------------------------------------------------------- */}
          <g 
            style={{ 
              transform: `translate(${mx * -12}px, ${my * -10}px)`, 
              transition: 'transform 0.15s ease-out' 
            }}
          >
            {/* Server Cabinet Body */}
            <rect x="70" y="240" width="130" height="280" rx="16" fill="url(#serverGrad)" stroke="#334155" strokeWidth="3" />
            <rect x="80" y="250" width="110" height="260" rx="10" fill="#020617" stroke="#1e293b" strokeWidth="2" />

            {/* Server Blade Units */}
            {[265, 315, 365, 415, 465].map((yPos, i) => (
              <g key={`server-blade-${i}`}>
                <rect x="90" y={yPos} width="90" height="38" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
                <rect x="98" y={yPos + 8} width="35" height="4" rx="2" fill="#334155" />
                <rect x="98" y={yPos + 16} width="45" height="4" rx="2" fill="#1e293b" />
                <rect x="98" y={yPos + 24} width="25" height="4" rx="2" fill="#334155" />
                
                {/* Blinking Status LEDs */}
                <circle cx="155" cy={yPos + 12} r="3" fill="#10b981" style={{ animation: `ledBlink ${1.5 + i * 0.4}s infinite` }} />
                <circle cx="167" cy={yPos + 12} r="3" fill="#f59e0b" style={{ animation: `ledBlink ${2 + i * 0.3}s infinite` }} />
                <circle cx="155" cy={yPos + 24} r="3" fill="#38bdf8" style={{ animation: `ledBlink ${1.2 + i * 0.5}s infinite` }} />
                <circle cx="167" cy={yPos + 24} r="3" fill="#10b981" style={{ animation: `ledBlink ${1.8 + i * 0.2}s infinite` }} />
              </g>
            ))}

            {/* Server Rack Top Glow & Ventilation Grid */}
            <line x1="90" y1="258" x2="180" y2="258" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          </g>

          {/* ----------------------------------------------------------------- */}
          {/* CARTOON IT DESK & WORKSTATION SETUP                              */}
          {/* ----------------------------------------------------------------- */}
          <g 
            style={{ 
              transform: `translate(${mx * -6}px, ${my * -5}px)`, 
              transition: 'transform 0.15s ease-out' 
            }}
          >
            {/* Workstation Desk Top Surface */}
            <path d="M 220 490 L 760 490 L 730 520 L 250 520 Z" fill="url(#deskGrad)" stroke="#334155" strokeWidth="2" />
            <rect x="230" y="520" width="510" height="14" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
            {/* Desk Legs */}
            <rect x="270" y="534" width="18" height="90" rx="4" fill="#1e293b" />
            <rect x="680" y="534" width="18" height="90" rx="4" fill="#1e293b" />

            {/* Center Main Curved Monitor */}
            <rect x="360" y="240" width="250" height="160" rx="14" fill="url(#screenBezel)" stroke="#475569" strokeWidth="3" />
            <rect x="370" y="250" width="230" height="140" rx="8" fill="url(#screenGrad1)" />
            
            {/* Main Monitor Display Content: IT Asset Telemetry Dashboard */}
            <g>
              {/* Header Bar */}
              <rect x="380" y="260" width="210" height="18" rx="4" fill="#1e293b" />
              <circle cx="392" cy="269" r="3" fill="#ef4444" />
              <circle cx="402" cy="269" r="3" fill="#f59e0b" />
              <circle cx="412" cy="269" r="3" fill="#10b981" />
              <rect x="425" y="265" width="80" height="8" rx="3" fill="#334155" />
              <rect x="550" y="265" width="30" height="8" rx="3" fill="#f59e0b" />

              {/* Bar Chart 1 */}
              <rect x="390" y="340" width="16" height="35" rx="3" fill="url(#goldBarGrad)" />
              <rect x="412" y="320" width="16" height="55" rx="3" fill="url(#cyanBarGrad)" />
              <rect x="434" y="300" width="16" height="75" rx="3" fill="url(#goldBarGrad)" />
              <rect x="456" y="330" width="16" height="45" rx="3" fill="url(#cyanBarGrad)" />

              {/* Line Telemetry Chart */}
              <path d="M 485 365 L 505 340 L 525 350 L 545 315 L 565 330 L 580 305" fill="none" stroke="#f59e0b" strokeWidth="2.5" filter="url(#goldGlow)" />
              <circle cx="580" cy="305" r="4" fill="#fbbf24" filter="url(#goldGlow)" />

              {/* Grid Baseline */}
              <line x1="385" y1="375" x2="585" y2="375" stroke="#334155" strokeWidth="1.5" />
            </g>

            {/* Left Secondary Monitor */}
            <g transform="rotate(6, 310, 310)">
              <rect x="230" y="270" width="120" height="150" rx="10" fill="url(#screenBezel)" stroke="#334155" strokeWidth="2.5" />
              <rect x="238" y="278" width="104" height="134" rx="6" fill="url(#screenGrad1)" />
              {/* Code lines animation */}
              {[290, 305, 320, 335, 350, 365, 380].map((y, idx) => (
                <rect key={`code-${idx}`} x="248" y={y} width={30 + (idx % 4) * 18} height="5" rx="2" fill={idx % 2 === 0 ? '#38bdf8' : '#f59e0b'} opacity="0.8" />
              ))}
            </g>

            {/* Monitor Stand Base & Neck */}
            <rect x="465" y="400" width="40" height="70" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <ellipse cx="485" cy="475" rx="55" ry="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />

            {/* Keyboard & Mouse on Desk */}
            <rect x="410" y="496" width="130" height="18" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
            {/* Keyboard Keys */}
            {[420, 440, 460, 480, 500, 520].map((x, idx) => (
              <rect key={`key-${idx}`} x={x} y="500" width="14" height="10" rx="2" fill="#1e293b" />
            ))}
            {/* Ergonomic Mouse */}
            <ellipse cx="585" cy="505" rx="12" ry="16" fill="#090d16" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="585" y1="494" x2="585" y2="502" stroke="#f59e0b" strokeWidth="1.5" />
          </g>

          {/* ----------------------------------------------------------------- */}
          {/* CARTOON IT ADMINISTRATOR CHARACTER                                */}
          {/* ----------------------------------------------------------------- */}
          <g 
            style={{ 
              transform: `translate(${mx * -10}px, ${my * -8}px)`, 
              transition: 'transform 0.15s ease-out' 
            }}
          >
            {/* IT Admin Chair Backrest */}
            <rect x="620" y="320" width="90" height="160" rx="20" fill="#0f172a" stroke="#334155" strokeWidth="3" />
            <rect x="635" y="335" width="60" height="130" rx="14" fill="#1e293b" />

            {/* IT Admin Head & Face */}
            <g style={{ animation: 'floatSlow 4s ease-in-out infinite' }}>
              {/* Hair */}
              <path d="M 640 265 Q 665 240 690 265 L 695 285 Q 665 270 635 285 Z" fill="#334155" />
              {/* Head */}
              <ellipse cx="665" cy="285" rx="25" ry="28" fill="#fde047" opacity="0.9" />
              {/* Modern Tech Glasses */}
              <rect x="648" y="278" width="16" height="12" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
              <rect x="668" y="278" width="16" height="12" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
              <line x1="664" y1="284" x2="668" y2="284" stroke="#38bdf8" strokeWidth="2" />
              {/* Confident Smile */}
              <path d="M 657 298 Q 665 306 673 298" fill="none" stroke="#020617" strokeWidth="2" strokeLinecap="round" />

              {/* Headset with Mic */}
              <path d="M 638 280 C 638 250 692 250 692 280" fill="none" stroke="#f59e0b" strokeWidth="3" />
              <rect x="634" y="275" width="8" height="16" rx="4" fill="#f59e0b" />
              <rect x="688" y="275" width="8" height="16" rx="4" fill="#f59e0b" />
              <path d="M 640 286 L 652 298" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="654" cy="300" r="3" fill="#fbbf24" />
            </g>

            {/* IT Admin Torso / Hoodie */}
            <path d="M 630 320 C 630 310 700 310 700 320 L 710 440 L 620 440 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            {/* Laptop Badge / Logo on Hoodie */}
            <circle cx="665" cy="355" r="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M 658 357 L 672 357 M 661 351 L 669 351 L 669 357 L 661 357 Z" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
          </g>

          {/* ================================================================= */}
          {/* 3D CARTOON FLOATING IT ASSET BADGES (INTERACTIVE HOVER FLOATING)   */}
          {/* ================================================================= */}

          {/* Badge 1: Laptop Computer (Top Left) */}
          <g 
            style={{ 
              animation: 'floatSlow 5s ease-in-out infinite',
              transform: `translate(${mx * 18}px, ${my * 14}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <g 
              className="asset-badge-zoom"
              onMouseEnter={() => setHoveredBadge('laptop')}
              onMouseLeave={() => setHoveredBadge(null)}
              style={hoveredBadge === 'laptop' ? {
                transform: 'scale(1.5)',
                filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.95))',
              } : undefined}
            >
              <rect x="180" y="90" width="90" height="90" rx="22" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
              <rect x="190" y="100" width="70" height="70" rx="16" fill="#1e293b" />
              {/* Laptop Icon Illustration */}
              <rect x="206" y="116" width="38" height="25" rx="4" fill="#020617" stroke="#fbbf24" strokeWidth="2" />
              <path d="M 200 144 L 250 144 L 246 149 L 204 149 Z" fill="#fbbf24" />
              <circle cx="225" cy="128.5" r="3" fill="#10b981" />
              <text x="225" y="163" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">LAPTOP</text>
            </g>
          </g>

          {/* Badge 2: Mobile Phone / Tablet (Top Right) */}
          <g 
            style={{ 
              animation: 'floatMedium 4.5s ease-in-out infinite',
              transform: `translate(${mx * -20}px, ${my * 16}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <g 
              className="asset-badge-zoom"
              onMouseEnter={() => setHoveredBadge('mobile')}
              onMouseLeave={() => setHoveredBadge(null)}
              style={hoveredBadge === 'mobile' ? {
                transform: 'scale(1.5)',
                filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.95))',
              } : undefined}
            >
              <rect x="690" y="80" width="90" height="90" rx="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
              <rect x="700" y="90" width="70" height="70" rx="16" fill="#1e293b" />
              {/* Phone Illustration */}
              <rect x="723" y="104" width="24" height="42" rx="5" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
              <rect x="727" y="108" width="16" height="28" rx="2" fill="#0f172a" />
              <circle cx="735" cy="141" r="2" fill="#38bdf8" />
              <text x="735" y="153" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">MOBILE</text>
            </g>
          </g>

          {/* Badge 3: Cloud & Server Stack (Middle Left) */}
          <g 
            style={{ 
              animation: 'floatFast 6s ease-in-out infinite',
              transform: `translate(${mx * 22}px, ${my * -15}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <g 
              className="asset-badge-zoom"
              onMouseEnter={() => setHoveredBadge('server')}
              onMouseLeave={() => setHoveredBadge(null)}
              style={hoveredBadge === 'server' ? {
                transform: 'scale(1.5)',
                filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.95))',
              } : undefined}
            >
              <rect x="100" y="300" width="85" height="85" rx="20" fill="#0f172a" stroke="#10b981" strokeWidth="2.5" />
              <rect x="110" y="310" width="65" height="65" rx="14" fill="#1e293b" />
              {/* Server Stack Icon */}
              <rect x="123" y="322" width="38" height="10" rx="3" fill="#020617" stroke="#10b981" strokeWidth="1.5" />
              <rect x="123" y="337" width="38" height="10" rx="3" fill="#020617" stroke="#10b981" strokeWidth="1.5" />
              <rect x="123" y="352" width="38" height="10" rx="3" fill="#020617" stroke="#10b981" strokeWidth="1.5" />
              <circle cx="153" cy="327" r="2" fill="#10b981" />
              <circle cx="153" cy="342" r="2" fill="#fbbf24" />
              <circle cx="153" cy="357" r="2" fill="#10b981" />
              <text x="142.5" y="369" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold" fontFamily="monospace">SERVER</text>
            </g>
          </g>

          {/* Badge 4: Security Shield & Lock (Middle Right) */}
          <g 
            style={{ 
              animation: 'floatSlow 5.5s ease-in-out infinite',
              transform: `translate(${mx * -16}px, ${my * -18}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <g 
              className="asset-badge-zoom"
              onMouseEnter={() => setHoveredBadge('security')}
              onMouseLeave={() => setHoveredBadge(null)}
              style={hoveredBadge === 'security' ? {
                transform: 'scale(1.5)',
                filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.95))',
              } : undefined}
            >
              <rect x="760" y="280" width="90" height="90" rx="22" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
              <rect x="770" y="290" width="70" height="70" rx="16" fill="#1e293b" />
              {/* Shield Icon */}
              <path d="M 805 304 L 823 312 V 330 C 823 342 805 348 805 348 C 805 348 787 342 787 330 V 312 Z" fill="#020617" stroke="#fbbf24" strokeWidth="2" />
              <path d="M 800 326 L 804 330 L 811 321" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
              <text x="805" y="353" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold" fontFamily="monospace">SECURITY</text>
            </g>
          </g>

          {/* Badge 5: SIM Card & Connectivity (Top Center) */}
          <g 
            style={{ 
              animation: 'floatMedium 4.8s ease-in-out infinite',
              transform: `translate(${mx * 12}px, ${my * -12}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <g 
              className="asset-badge-zoom"
              onMouseEnter={() => setHoveredBadge('sim')}
              onMouseLeave={() => setHoveredBadge(null)}
              style={hoveredBadge === 'sim' ? {
                transform: 'scale(1.5)',
                filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.95))',
              } : undefined}
            >
              <rect x="435" y="35" width="90" height="85" rx="20" fill="#0f172a" stroke="#a855f7" strokeWidth="2.5" />
              <rect x="445" y="45" width="70" height="65" rx="14" fill="#1e293b" />
              {/* SIM Card Icon */}
              <path d="M 468 57 L 485 57 L 493 65 L 493 90 L 468 90 Z" fill="#020617" stroke="#c084fc" strokeWidth="2" />
              <rect x="473" y="68" width="14" height="14" rx="2" fill="#f59e0b" />
              <text x="480" y="103" textAnchor="middle" fill="#c084fc" fontSize="8" fontWeight="bold" fontFamily="monospace">SIM FLEET</text>
            </g>
          </g>
        </svg>

      </div>

      {/* Soft Vignette Gradient on Right Side to smoothly blend behind the Login Form */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[48%] lg:w-[42%] bg-gradient-to-l from-[#05070a] via-[#05070a]/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#05070a]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#05070a]/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#05070a]/90 to-transparent z-10 pointer-events-none" />
    </div>
  );
};
