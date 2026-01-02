# Design Guidelines: Process Simulator for Operator Training

## Design Approach

**Selected System:** Carbon Design System (IBM) with industrial/technical adaptations
**Rationale:** Enterprise-grade industrial application requiring data-dense interfaces, technical precision, and professional credibility. Carbon excels at complex dashboards, data visualization, and process monitoring interfaces.

**Core Design Principles:**
1. Technical Precision - Every element communicates accuracy and reliability
2. Information Hierarchy - Complex data presented with clear visual organization
3. Professional Authority - Design instills confidence in critical training systems
4. Functional Clarity - No decorative elements; every pixel serves operator needs

---

## Color Palette

**Dark Mode Primary (Default):**
- Background Base: 220 15% 8%
- Surface Elevated: 220 12% 12%
- Surface Interactive: 220 10% 16%
- Primary Brand: 210 100% 45% (Deep professional blue)
- Primary Hover: 210 100% 55%
- Accent/Success: 142 65% 45% (Process active green)
- Warning/Caution: 38 92% 50%
- Critical/Error: 0 84% 60%

**Light Mode (Optional Toggle):**
- Background: 220 15% 97%
- Surface: 0 0% 100%
- Primary Brand: 210 100% 40%

**Semantic Colors:**
- Process Active: 142 65% 45%
- Process Idle: 220 15% 60%
- Alarm Critical: 0 84% 60%
- Alarm Warning: 38 92% 50%
- KPI Positive: 142 65% 45%
- KPI Negative: 0 84% 60%

---

## Typography

**Font Families:**
- Primary: 'IBM Plex Sans' (Google Fonts CDN)
- Monospace/Data: 'IBM Plex Mono' (for values, metrics, technical data)

**Type Scale:**
- Hero Heading: text-5xl font-semibold (landing)
- Section Heading: text-3xl font-semibold
- Subsection: text-xl font-medium
- Body: text-base font-normal
- Technical Data: text-sm font-mono
- Labels/Captions: text-xs font-medium uppercase tracking-wide

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-24
- Grid gaps: gap-4, gap-6, gap-8
- Margins: m-2, m-4, m-6

**Container Strategy:**
- Marketing pages: max-w-7xl mx-auto px-6
- Simulator interface: Full viewport (w-screen h-screen) with fixed panels
- Content sections: max-w-6xl mx-auto

**Grid System:**
- Feature grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard metrics: grid-cols-2 lg:grid-cols-4
- Process diagrams: Full-width with sidebar navigation

---

## Component Library

### Navigation
- Top navigation bar with dark background (bg-[hsl(220,15%,8%)])
- Logo left, auth status right
- Breadcrumb navigation for simulator sections
- Sidebar for process diagram navigation (collapsible)

### Authentication
- Centered card-based login (max-w-md)
- Replit Auth integration button
- Professional form inputs with labels
- Subtle border on card (border-[hsl(220,10%,16%)])

### Landing Page Components
- Hero: Full viewport height with technical grid background pattern, centered content
- Feature cards: Elevated surfaces with icons (Heroicons), title, description
- Competitive advantages: Comparison table with checkmarks/X marks
- Project phases: Timeline/stepper component showing progression
- Benefits: Icon-led cards in 3-column grid
- Technical specs: Data table with alternating row backgrounds
- CTA sections: Primary button with supporting text

### Simulation Dashboard
- Fixed header with system status indicators
- Left sidebar: Process flow navigation tree
- Main viewport: Interactive P&ID diagram (Process & Instrumentation Diagram)
- Right panel: Control interface with sliders, inputs, real-time values
- Bottom panel: KPI metrics strip showing live performance data
- Floating scenario selector modal

### Data Display Components
- Metric cards: Dark surface with large value, label, trend indicator
- Data tables: Striped rows, sticky headers, monospace numbers
- Charts: Line graphs for trends, bar charts for comparisons (mocked with divs/gradients)
- Status badges: Color-coded pills for system states

### Form Elements
- Dark mode inputs with light borders (border-[hsl(220,10%,16%)])
- Labels above inputs (text-xs uppercase)
- Consistent focus states (ring-2 ring-[hsl(210,100%,55%)])
- Slider controls for process parameters

### Buttons
- Primary: bg-[hsl(210,100%,45%)] text-white px-6 py-3 rounded-md
- Secondary: border border-[hsl(220,10%,16%)] text-white px-6 py-3 rounded-md
- Ghost/Tertiary: text-[hsl(210,100%,45%)] hover:bg-[hsl(220,10%,16%)]
- Icon buttons: p-2 rounded-md hover:bg-[hsl(220,10%,16%)]

---

## Page-Specific Layouts

### Landing Page
1. **Hero Section:** Full viewport with background grid pattern overlay, headline "Process Simulator for Operator Training", subtext highlighting key value props, primary CTA "View Demo", secondary "Learn More"
2. **Features Grid:** 3-column layout showcasing AI Integration, KPI Visualization, Neural Network Optimization
3. **Competitive Advantages:** Side-by-side comparison table vs. competitors (Elessent, Honeywell, Siemens)
4. **Project Phases:** Visual timeline showing Static Model → Dynamic Simulation → Scenario Development
5. **Technical Specifications:** Two-column layout with specs and architecture diagram placeholder
6. **Benefits Section:** 4-column grid of key benefits with icons
7. **CTA Footer:** Contact form + company info

### Login Page
- Centered card (max-w-md) on dark background
- Company logo at top
- Replit Auth button
- Optional username/password fields
- "Access Simulator" primary button
- No distracting hero imagery - focused on authentication

### Simulation Demo Page
- **Fixed Top Bar:** System status, user profile, scenario selector button
- **Left Sidebar (300px):** Process sections tree navigation with expand/collapse
- **Main Canvas:** P&ID diagram with interactive nodes (tanks, pumps, valves)
- **Right Panel (350px):** Live controls - temperature setpoint sliders, flow rate inputs, pressure displays (monospace values)
- **Bottom KPI Strip (80px fixed):** Real-time metrics showing Safety Score, Efficiency %, Environmental Compliance, Production Rate

---

## Icons & Assets

**Icon Library:** Heroicons (via CDN) - outline style for UI, solid for status indicators

**Key Icons:**
- Beaker (simulation/process)
- ChartBar (KPIs/analytics)
- Cog (settings/controls)
- ExclamationTriangle (warnings)
- CheckCircle (success states)
- CPU Chip (AI/neural network)
- AcademicCap (training)

**Images:**
- Hero: Abstract industrial/technical grid pattern background (dark blue gradient overlay)
- Process diagram placeholder: Simplified P&ID mockup with tanks, lines, valves
- Feature section: Screenshot mockups of GUI interfaces from appendix
- No decorative photography - technical diagrams only

---

## Animations

**Minimal Motion:**
- Subtle hover state transitions (150ms ease)
- Loading indicators for data fetch (spinning icon)
- Scenario modal slide-in (300ms ease-out)
- No scroll-triggered animations
- No background animations or particles

---

## Responsive Breakpoints

- Mobile (< 768px): Stacked layouts, collapsible sidebar, simplified simulation view
- Tablet (768px - 1024px): 2-column grids, persistent sidebar
- Desktop (> 1024px): Full multi-panel layout, 3-4 column grids

---

## Accessibility & Quality

- WCAG AA contrast ratios (minimum 4.5:1 for text)
- All interactive elements keyboard accessible
- Screen reader labels for technical diagrams
- Color-blind safe palette (never rely on color alone)
- Focus indicators on all interactive elements
- Dark mode as default with light mode toggle option