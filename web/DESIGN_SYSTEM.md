# Truck Alert Web UI — Design System

## Overview
Modern, production-ready SaaS dashboard design for the Truck Alert Driver Safety Network web application.

---

## Design Philosophy

- **Dark Theme**: Deep navy/black backgrounds for reduced eye strain during night driving
- **Glassmorphism**: Translucent panels with backdrop blur for depth and premium feel
- **Glow Effects**: Subtle accent glows on active elements and alerts
- **Smooth Animations**: 180ms transitions for all interactive elements
- **Responsive**: Desktop-first with mobile bottom navigation fallback

---

## Color System

### Background
- `--bg`:  #020617 (Deep navy, main background)
- `--bg2`: #0f172a (Secondary panels)
- `--bg3`: #1e293b (Tertiary elements)

### Accent
- `--accent`:  #f59e0b (Primary orange)
- `--accent2`: #fbbf24 (Lighter orange)

### Status Colors
- `--danger`:  #ef4444 (Red for SOS/errors)
- `--danger2`: #dc2626 (Darker red)
- `--success`: #22c55e (Green for resolved)
- `--success2`: #16a34a (Darker green)
- `--info`:    #3b82f6 (Blue for info/links)

### Text
- `--text`:  #f1f5f9 (Primary text)
- `--text2`: #cbd5e1 (Secondary text)
- `--muted`: #94a3b8 (Muted/disabled text)

### Borders & Glass
- `--border`:  rgba(255,255,255,0.07)
- `--border2`: rgba(255,255,255,0.12)
- `--glass`:   rgba(15,23,42,0.7)
- `--glass2`:  rgba(30,41,59,0.6)

### Effects
- `--shadow`:      0 4px 24px rgba(0,0,0,0.4)
- `--shadow-lg`:   0 8px 40px rgba(0,0,0,0.6)
- `--glow-accent`: 0 0 20px rgba(245,158,11,0.25)
- `--glow-danger`: 0 0 30px rgba(239,68,68,0.4)

---

## Typography

**Font**: Inter (Google Fonts)

### Hierarchy
- **Page Title**: 28px, weight 800, -0.5px letter-spacing
- **Section Title**: 20-22px, weight 800, -0.3px letter-spacing
- **Card Title**: 14-15px, weight 700
- **Body**: 13-14px, weight 400-500
- **Small**: 11-12px, weight 400-600
- **Label**: 10-11px, weight 700, uppercase, 0.8px letter-spacing

---

## Layout

### Sidebar Navigation
- Fixed left sidebar: 220px width
- Collapses to bottom bar on mobile (≤768px)
- Glassmorphism background with blur
- Active link: orange glow + inset accent border

### Content Area
- `margin-left: 220px` (desktop)
- Full-height scrollable pages
- No top navbar (sidebar handles all navigation)

### Responsive Breakpoints
- Desktop: >768px (sidebar left)
- Mobile: ≤768px (bottom nav bar)

---

## Components

### Glassmorphism Cards
```css
background: var(--glass2);
backdrop-filter: blur(12px);
border: 1px solid var(--border);
border-radius: 14px;
```

### Buttons
- **Primary**: Orange gradient, white text, 700 weight
- **Secondary**: Transparent bg, border, muted text
- **Danger**: Red bg/border, white text
- **Hover**: opacity 0.85-0.9, translateY(-1px)

### Status Badges
- Rounded pill (20px radius)
- 10-11px font, 700 weight, uppercase
- Colored background (12-15% opacity) + border

### Input Fields
```css
background: var(--bg2);
border: 1px solid var(--border2);
padding: 13px 16px;
border-radius: 10px;
focus: border-color var(--accent) + glow
```

---

## Animations

### Transitions
- Default: `all 0.18s ease`
- Hover: `opacity 0.2s, transform 0.15s`

### Keyframes
- **Pulse**: SOS button ring expansion
- **Glow**: Accent shadow fade in/out
- **Slide**: Alert banners from top
- **Pop**: Badge scale animation

---

## Page-Specific Styles

### Login
- Split layout: hero image left, form right
- Hero: gradient overlay, stats badges
- Form: glassmorphism card, toggle buttons

### Map
- Full-screen Leaflet map
- Floating glass controls (top center)
- Traffic legend (bottom left)
- Dark Leaflet zoom controls

### Report
- Centered glass card
- 3-column issue type grid
- Photo upload with preview
- Red gradient submit button

### History
- Sticky tabs bar (top)
- Glass report cards
- Expandable descriptions
- Status badges (active/resolved/confirmed)

### Emergency
- Radial red glow background
- Large pulsing SOS button (210px)
- Ring animations
- Glass info/tips cards

### Profile
- Centered layout
- Circular avatar with glow
- Glass info section
- Password change form

### SOS Alerts
- Glass alert cards
- Inline Leaflet maps
- Pulsing SOS pin marker
- Acknowledge/respond buttons

---

## Icons & Emojis

All icons use native emojis for zero dependencies:
- 🗺️ Map
- 🚨 Report
- 📋 History
- 🆘 Emergency
- 🔔 SOS Alerts
- 👤 Profile
- 🚛 Truck/Driver

---

## Accessibility

- Focus states: accent border + glow
- Hover states: clear visual feedback
- Color contrast: WCAG AA compliant
- Keyboard navigation: full support

---

## Performance

- CSS variables for instant theme switching
- Hardware-accelerated animations (transform, opacity)
- Backdrop-filter with fallback
- Lazy-loaded heavy components

---

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with -webkit- prefixes)
- Mobile browsers: Responsive layout

---

## File Structure

```
web/src/
├── index.css           # Global styles, CSS variables, utilities
├── App.css             # Minimal app-level overrides
├── components/
│   ├── Navbar.js       # Sidebar navigation
│   ├── Navbar.css
│   ├── SosAlertPopup.css
│   └── LocationMapModal.css
└── pages/
    ├── Login.css       # Split hero + form
    ├── MapPage.css     # Full-screen map
    ├── ReportPage.css  # Issue submission
    ├── HistoryPage.css # Report list
    ├── EmergencyPage.css # SOS button
    ├── ProfilePage.css # Driver profile
    ├── SosAlertsPage.css # SOS feed
    └── AdminPage.css   # Admin dashboard
```

---

## Implementation Notes

### Backend Compatibility
- **Zero backend changes** — all APIs remain identical
- Mobile app **completely untouched**
- Only web frontend CSS/JSX modified

### Production Deployment
- All styles use relative units (rem, %, vh/vw)
- No hardcoded localhost URLs
- Environment variables for API endpoints
- Works with existing MongoDB schema

---

## Future Enhancements

- [ ] Dark/light theme toggle
- [ ] Custom color accent picker
- [ ] Animated map markers
- [ ] Real-time driver location tracking on map
- [ ] Push notification integration
- [ ] PWA manifest for installable web app

---

**Version**: 2.0  
**Last Updated**: 2025  
**Design System**: Glassmorphism + Dark SaaS Dashboard
