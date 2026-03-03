# Custom Process Simulators for Asset Optimizations

## Overview
This project is an industrial Operator Training Simulator (OTS) web application designed for process engineering training. It provides high-fidelity dynamic simulations with Monte Carlo capabilities, performance visualization, and predictive analytics for outcomes and probabilities. The application is a full-stack TypeScript solution with a React frontend and an Express backend, tailored for industrial training environments that demand technical precision and professional credibility.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **UI Framework & Design System**: React 18 with TypeScript, Vite, Wouter for routing. Adopts IBM Carbon Design System principles with `shadcn/ui` (New York style) using Radix UI primitives, featuring dark mode by default and IBM Plex fonts.
- **State Management & Data Fetching**: TanStack Query for server state management with infinite stale time and disabled automatic refetching, including custom 401 error handling.
- **Styling & Theming**: Tailwind CSS with a custom industrial color palette, CSS variables for theming, and a semantic color system for process states.
- **Page Structure**: Includes a landing page, a demo page with 5 core simulation experiences (Static Acid Plant, Dynamic Acid Plant, Unit Operation Simulator, Monte Carlo, ESD Trainer), an OTS Instructions & Videos page with 7 training resources, 12 experience pages, and login/register pages. Features a protected route system.
  - **Demo Page**: Two-column layout with simulation buttons and an AI Assistant sidebar.
  - **Static Acid Plant Simulator**: Multi-screen system with DeltaV-style PID faceplate for Compressor RPM, slider for Sulfur Flow, and various process outputs. The L1 System Overview is an extracted component (`client/src/delta-v/pages/L1-SystemOverview/`) with per-equipment sub-components, colored flow arrows/edges, context-menu editing, and layout persistence via `/api/homescreen-layout/L1`. RTK service shims (`client/src/rtkServices/`) wrap TanStack Query hooks to match the component's RTK API surface.
  - **Dynamic Acid Plant Simulator**: Real-time dual PID controller system for Sulfur Flow and Compressor RPMs with adjustable parameters, synchronized charts, and a two-level temperature alarm system.
  - **Unit Operation Simulator**: Hub page linking to individual unit operation simulators, including:
    - **Catalytic Converter**: Stand-alone simulation with comprehensive input/output interface, 4 catalyst pass cards, and a backend API calling a Python RK4 solver for SO2 oxidation kinetics. Features Arrhenius kinetics, Eklund equilibrium, pass chaining, and energy balance calculations. The same RK4 solver is also inlined in the plant orchestrator (`server/python/plant_orchestrator.py`) for rigorous per-pass conversion that responds dynamically to operating conditions (RPM, sulfur flow, catalyst activity, pressure).
    - **Main Compressor**: Compressor performance calculator with static/dynamic modes, input parameters like Speed and Plant Condition, and a backend API calling a Python calculator for system curve intersection and affinity law models.
    - **SH4A / EC4C / EC4A**: HP Superheater 4A, Economizer 4C, Economizer 4A simulator (1540-HX-004/006/007) with 5-tab interface (Equipment Parameters, Stream Inputs, HX Results, Steam Outputs, Dynamic Response). Backend Python calculator (`server/python/sh4a_ec4c_ec4a_calc.py`) via `/api/sh4a-ec4c-ec4a-calc`. Features NTU-effectiveness HX solver, control valve models (equal-percentage/linear), rated U and dP correlations, SH1B duty integration with outlet temperature setpoint, 17 named output streams (gas and steam circuits), Overall Heat & Material Balance summary, and dynamic simulation mode with first-order lag + dead-time response charts (SH1B outlet temp, EC4A gas outlet temp, valve positions).
    - **Economizer 3B (EC3B)**: Economizer 3B simulator (1540-HX-002) with 5-tab interface (Equipment Parameters, Stream Inputs, HX Results, Stream Outputs, Dynamic Response). Backend Python calculator (`server/python/ec3b_calc.py`) via `/api/ec3b-calc`. Features NTU-effectiveness counter-current HX solver, TCV-7224 control valve with equal-percentage/linear characteristics, CV bisection solver targeting IPAT inlet temperature setpoint, rated U and dP correlations, bypass valve logic (excess BFW bypasses EC3B), 8 named output streams (2 gas: s15/s16, 6 water/BFW: s803A/s804B/s804C/s804D/s804E/s805), Overall Heat & Material Balance summary, valve hydraulics results, and dynamic simulation mode with first-order lag + dead-time + low-pass filter (LPF) response charts.
    - **Jug Valve / WHB Hot-side / Positioner**: Jug Valve bypass and WHB heat exchange simulator with editable Stream 5 (Furnace Outlet) inputs, Jug Valve opening percentage, and Damper (Positioner) valve opening. Backend Python calculator (`server/python/jug_valve_calc.py`) via `/api/jug-valve-simulation`. Features NTU-effectiveness WHB heat exchange model, flow splitting by jug bypass fraction, quadratic damper pressure drop model, 6 output streams (GF1/GB0/GJV0/GB1/GPV1/GP10) with nested stream objects containing so2/so3/o2/n2/h2o/h2so4/total/pressure/temperature. Request uses s5_ prefixed Stream 5 fields + jug_open_pct + damper_open_pct.
  - **AI Assistant**: Right sidebar on Demo page featuring an AI Assistant chat interface using OpenAI via Replit AI Integrations, leveraging both confidential internal knowledge and public domain information.
  - **Key Performance Parameters (KPP)**: Standalone calculator page with two-column layout — process inputs on the left, green-bordered DeltaV-style KPP faceplate on the right. Auto-calculates plant rate, SO2 conversion, emissions, steam generation, and power output as inputs change. Uses shared `KPPFaceplate` component (`client/src/components/KPPFaceplate.tsx`) that is rendered on multiple views: L1 System Overview (draggable via L1 position system, persisted via layout save), L2 Furnace Area (Rnd-based with layout persistence), L4 Converter (Rnd-based with layout persistence), and L2_1520 ACID (Rnd-based, state-only). All fed by the plant orchestrator's `kpp` output data.
  - **Turbo-Generator Signal Exchange**: Filterable/searchable table displaying 2,121 STG signals from Excel data with search, sub-system/signal-type/DCS-type filters, sortable columns, pagination, color-coded badges, and CSV export.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript for API endpoints, including middleware for logging, JSON parsing, and error handling.
- **Authentication & Session Management**: Username/password authentication using bcrypt for hashing, and session management via `express-session` with a PostgreSQL store, secure HTTP-only cookies, and session regeneration.
- **API Endpoints**: Provides endpoints for user registration, login, logout, authenticated user information, AI chat, Monte Carlo simulation, and psychrometric data. The plant orchestrator API (`/api/plant-orchestrator`) returns a `compressor` block with real VFD/motor performance data (motor_power_hp, vfd_current_amps, driver_rpm, compressor_rpm, speed_ratio) that feeds the VFD faceplate in both Static and Dynamic modes. The orchestrator (2743 lines) includes the full MECS 3:1 double-absorption topology, RK4 catalytic pass solver, mass-based WHB NTU-effectiveness heat exchange (WHB_UO=30, MW_GAS=30.5), alarm setpoint database (Doc 102-008.00), controller setpoint database, and `build_sensor_tags()` with rich alarm limit data for frontend display.
- **Psychrometric Data Service**: Uses Open-Meteo API for real-time and historical weather data, calculating psychrometric properties (e.g., humidity ratio, dew point). Includes in-memory caching.
- **AI Integration**: OpenAI chat endpoint using Replit AI Integrations (gpt-4o-mini) with a system prompt incorporating specialized domain knowledge.

### Data Storage Solutions
- **Database**: PostgreSQL database utilizing Neon serverless driver with Drizzle ORM for type-safe queries.
- **Schema**: Includes `sessions` table for persistence and `users` table for user data (username, hashedPassword, email, names, profile image URL, timestamps).
- **Setpoint and Process Variables**: Both tables use JSONB `cases` column for dynamic case data (instead of fixed case1-4 columns). Separate metadata tables (`setpoint_case_columns` and `process_variable_case_columns`) store case column definitions with id, name, and description.
- **Data Access Layer**: `DatabaseStorage` class provides an interface for user operations, ensuring password hashes are never exposed.

## External Dependencies

- **Third-Party UI Libraries**: Radix UI, React Hook Form with Zod, Lucide React, `class-variance-authority`, `date-fns`.
- **Authentication & Infrastructure**: `bcryptjs`, `express-session` with `connect-pg-simple`.
- **Security & Protection**: `Helmet` for security headers (including environment-aware CSP), `express-rate-limit` for API rate limiting.
- **AI/LLM Integration**: OpenAI SDK using Replit AI Integrations.
- **Development Tools**: `tsx`, `esbuild`.