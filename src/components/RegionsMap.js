// src/components/RegionsMap.js
import React, { useState } from 'react';
import './RegionsMap.css';

// ============================================
// AWS REGIONS — coordinates and metadata
// ============================================
const REGIONS = [
  {
    id: 'af-south-1',
    name: 'Cape Town',
    country: 'South Africa',
    flag: '🇿🇦',
    code: 'af-south-1',
    role: 'Primary',
    coords: [18.4241, -33.9249],
  },
  {
    id: 'sa-east-1',
    name: 'São Paulo',
    country: 'Brazil',
    flag: '🇧🇷',
    code: 'sa-east-1',
    role: 'Edge',
    coords: [-46.6333, -23.5505],
  },
  {
    id: 'ap-southeast-1',
    name: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    code: 'ap-southeast-1',
    role: 'Edge',
    coords: [103.8198, 1.3521],
  },
  {
    id: 'eu-west-1',
    name: 'Ireland',
    country: 'Ireland',
    flag: '🇮🇪',
    code: 'eu-west-1',
    role: 'Edge',
    coords: [-6.2603, 53.3498],
  },
  {
    id: 'us-east-1',
    name: 'N. Virginia',
    country: 'United States',
    flag: '🇺🇸',
    code: 'us-east-1',
    role: 'Edge',
    coords: [-77.4874, 38.6270],
  },
  {
    id: 'us-west-2',
    name: 'Oregon',
    country: 'United States',
    flag: '🇺🇸',
    code: 'us-west-2',
    role: 'Edge',
    coords: [-122.6765, 45.5231],
  },
  {
    id: 'ap-northeast-1',
    name: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    code: 'ap-northeast-1',
    role: 'Edge',
    coords: [139.6917, 35.6895],
  },
  {
    id: 'ap-south-1',
    name: 'Mumbai',
    country: 'India',
    flag: '🇮🇳',
    code: 'ap-south-1',
    role: 'Edge',
    coords: [72.8777, 19.0760],
  },
  {
    id: 'ap-southeast-2',
    name: 'Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    code: 'ap-southeast-2',
    role: 'Edge',
    coords: [151.2093, -33.8688],
  },
];

// ============================================
// SIMPLIFIED WORLD LAND PATHS
// Each path is an SVG polygon in a 1000x500 viewBox
// Longitude -> x : (lng + 180) * (1000/360)
// Latitude  -> y : (90 - lat) * (500/180)
// ============================================
const projectX = (lng) => ((lng + 180) * 1000) / 360;
const projectY = (lat) => ((90 - lat) * 500) / 180;

// Simplified continent outlines — deliberately low-poly, blueprint style
const LANDMASSES = [
  // North America
  'M 145 90 L 200 75 L 250 80 L 290 100 L 310 130 L 295 165 L 265 185 L 235 200 L 210 220 L 195 245 L 175 240 L 165 210 L 150 180 L 130 150 L 120 120 Z',
  // Central America + Caribbean
  'M 210 220 L 235 232 L 245 248 L 235 260 L 220 255 L 210 240 Z',
  // South America
  'M 250 275 L 285 265 L 305 280 L 315 310 L 310 350 L 295 390 L 275 425 L 260 445 L 250 440 L 245 415 L 240 385 L 235 350 L 240 320 L 245 295 Z',
  // Europe
  'M 490 100 L 530 90 L 560 95 L 575 110 L 570 130 L 555 145 L 530 155 L 510 160 L 495 150 L 485 135 L 480 115 Z',
  // UK & Ireland
  'M 470 105 L 480 100 L 485 112 L 480 122 L 470 120 Z',
  // Africa
  'M 495 175 L 535 165 L 570 175 L 585 200 L 590 235 L 580 275 L 565 315 L 550 350 L 540 380 L 525 395 L 510 380 L 500 350 L 490 320 L 485 285 L 485 250 L 490 215 Z',
  // Madagascar
  'M 590 320 L 598 315 L 602 340 L 598 360 L 592 355 L 588 335 Z',
  // Asia (big landmass)
  'M 575 100 L 640 90 L 700 95 L 760 105 L 810 120 L 840 140 L 850 165 L 835 185 L 800 195 L 770 200 L 740 210 L 710 220 L 680 225 L 655 220 L 635 205 L 615 190 L 600 175 L 590 155 L 580 130 Z',
  // India
  'M 690 225 L 720 220 L 735 235 L 740 260 L 730 285 L 715 300 L 700 290 L 690 270 L 685 245 Z',
  // Southeast Asia
  'M 760 260 L 790 255 L 810 265 L 815 285 L 800 300 L 780 300 L 765 290 L 755 275 Z',
  // Japan
  'M 855 140 L 862 135 L 868 150 L 865 170 L 858 175 L 852 160 Z',
  // Australia
  'M 815 340 L 855 330 L 885 340 L 900 365 L 895 395 L 875 415 L 845 420 L 820 410 L 805 385 L 805 360 Z',
  // New Zealand
  'M 925 420 L 932 415 L 938 430 L 933 448 L 926 445 L 922 435 Z',
  // Greenland
  'M 350 55 L 400 45 L 425 55 L 420 80 L 395 100 L 365 95 L 350 75 Z',
  // Antarctica (subtle)
  'M 0 480 L 1000 480 L 1000 500 L 0 500 Z',
];

const RegionsMap = () => {
  const [activeRegion, setActiveRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const primary = REGIONS.find((r) => r.role === 'Primary');
  const edges = REGIONS.filter((r) => r.role === 'Edge');

  const focused = hoveredRegion || activeRegion;

  return (
    <div className="regions-map-wrap">
      <div className="regions-map-header">
        <span className="regions-map-badge">🌍 Global Network</span>
        <h3>9 AWS regions. One platform.</h3>
        <p>
          Every session, every whiteboard stroke, every notification is delivered
          from the region closest to you.
        </p>
      </div>

      <div className="regions-map-canvas">
        <svg
          viewBox="0 0 1000 500"
          className="regions-map-svg"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="EduSpantech global infrastructure map"
        >
          {/* Ocean grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(99, 102, 241, 0.08)"
                strokeWidth="0.5"
              />
            </pattern>
            <radialGradient id="glowPrimary" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowEdge" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="1000" height="500" fill="url(#grid)" />

          {/* Landmasses */}
          <g className="regions-landmasses">
            {LANDMASSES.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* Arcs from primary to each edge */}
          <g className="regions-arcs">
            {edges.map((region) => {
              const x1 = projectX(primary.coords[0]);
              const y1 = projectY(primary.coords[1]);
              const x2 = projectX(region.coords[0]);
              const y2 = projectY(region.coords[1]);

              // Control point for a smooth arc above the midpoint
              const cx = (x1 + x2) / 2;
              const cy = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.15;

              const isFocused =
                focused && (focused.id === region.id || focused.id === primary.id);

              return (
                <path
                  key={region.id}
                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                  className={`regions-arc ${isFocused ? 'active' : ''}`}
                />
              );
            })}
          </g>

          {/* Region markers */}
          <g className="regions-markers">
            {REGIONS.map((region) => {
              const x = projectX(region.coords[0]);
              const y = projectY(region.coords[1]);
              const isPrimary = region.role === 'Primary';
              const isFocused = focused?.id === region.id;

              return (
                <g
                  key={region.id}
                  transform={`translate(${x}, ${y})`}
                  className={`region-marker ${isPrimary ? 'primary' : 'edge'} ${
                    isFocused ? 'focused' : ''
                  }`}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() =>
                    setActiveRegion((prev) =>
                      prev?.id === region.id ? null : region
                    )
                  }
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer glow ring */}
                  <circle
                    r={isPrimary ? 22 : 16}
                    className="region-glow"
                    fill={isPrimary ? 'url(#glowPrimary)' : 'url(#glowEdge)'}
                  />
                  {/* Pulse ring (primary only) */}
                  {isPrimary && <circle r="10" className="region-pulse" />}
                  {/* Core dot */}
                  <circle r={isPrimary ? 5 : 3.5} className="region-dot" />
                  {/* Label */}
                  <text
                    x="0"
                    y={isPrimary ? -16 : -12}
                    textAnchor="middle"
                    className="region-label"
                  >
                    {region.flag} {region.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Info card — shown when a region is hovered or clicked */}
        {focused && (
          <div
            className={`region-info-card ${focused.role === 'Primary' ? 'primary' : ''}`}
          >
            <div className="region-info-flag">{focused.flag}</div>
            <div className="region-info-body">
              <div className="region-info-name">
                {focused.name}
                {focused.role === 'Primary' && (
                  <span className="region-info-primary-badge">PRIMARY</span>
                )}
              </div>
              <div className="region-info-country">{focused.country}</div>
              <div className="region-info-code">{focused.code}</div>
            </div>
          </div>
        )}
      </div>

      <div className="regions-map-legend">
        <div className="regions-legend-item">
          <span className="legend-dot primary" />
          <span>Primary region</span>
        </div>
        <div className="regions-legend-item">
          <span className="legend-dot edge" />
          <span>Edge region</span>
        </div>
        <div className="regions-legend-item legend-hint">
          <span>Hover or tap a marker for details</span>
        </div>
      </div>
    </div>
  );
};

export default RegionsMap;