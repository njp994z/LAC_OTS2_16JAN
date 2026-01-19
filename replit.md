# Custom Process Simulators for Asset Optimizations

## Overview
This project is an industrial Operator Training Simulator (OTS) web application designed for process engineering training. It provides high-fidelity dynamic simulations with Monte Carlo capabilities, performance visualization, and predictive analytics for outcomes and probabilities. The application is a full-stack TypeScript solution with a React frontend and an Express backend, tailored for industrial training environments that demand technical precision and professional credibility.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **UI Framework & Design System**: React 18 with TypeScript, Vite, Wouter for routing. Adopts IBM Carbon Design System principles with `shadcn/ui` (New York style) using Radix UI primitives. Features dark mode by default, professional IBM Plex fonts.
- **State Management & Data Fetching**: TanStack Query for server state management, configured for infinite stale time and disabled automatic refetching. Includes custom query function for 401 error handling.
- **Styling & Theming**: Tailwind CSS with a custom industrial color palette, CSS variables for theming (dark/light modes), and a semantic color system for process states.
- **Page Structure**: Includes a landing page, a demo page with 5 core simulation experiences, an OTS Instructions & Videos page with 7 training resources, 12 experience pages (2 interactive simulators + 1 coming soon simulator + 9 marketing pages), and login/register pages. A protected route system redirects unauthenticated users to login.
  - **Demo Page**: Features a two-column layout with 5 simulation buttons (280px x 72px) on the left and an AI Assistant sidebar on the right. The page header includes two action buttons stacked vertically: "Equipment Settings" and "OTS Instructions & Videos" (blue/primary color). The 5 core simulation experiences are:
    1. Static Acid Plant Simulator (/static-simulation) - Interactive heat and material balance calculator
    2. Dynamic Acid Plant Simulator (/dynamic-simulation) - Real-time PID controller system with Manual/Automatic simulation modes:
       - Manual Mode: Direct control of Sulfur Flow and Compressor RPM setpoints
       - Automatic Mode: High-level control via SO2 Concentration Setpoint and Plant Rate targets; system automatically calculates and adjusts underlying controller setpoints
    3. Unit Operation Simulator (/unit-operation-simulator) - Hub page linking to 7 individual unit operation simulators:
       - Catalytic Converter (/unit-operation/catalytic-reactor) - Stand-alone simulation with comprehensive input/output interface:
         - **Converter Outputs** (displayed at top): Emissions (lbSO2/ST, KgSO2/MT, ppmv), Converter Diameter (ft, m), Pass Conversions (Pass 1-4), Pressure Drops (Pass 1-4), Volumes (Pass 1-4, Total)
         - **Simulation Inputs**: Pass 1 Inlet Gas Composition (SO2%, SO3%, O2%, CO2%, N2%, Total%, P_Barr, IPAT SO3 Removal), Process Inputs (Plant Rate, Pass 1-4 Inlet Velocities/Temps/Pressures)
         - **Catalyst Configuration**: 4 catalyst pass cards (Pass 1 & 4 support dual catalyst types), catalyst type dropdowns, catalyst loading and activity inputs
         - **Backend API** (`/api/catalytic-reactor-simulation`): Calls Python RK4 solver for accurate SO2 oxidation kinetics with chained multi-pass simulation:
           - **Python RK4 Solver** (`server/python/rk_solver.py`): Fourth-order Runge-Kutta integrator for adiabatic packed-bed reactor simulation
           - **Arrhenius Kinetics**: V2O5 catalyst rate constant k = A·exp(-Ea/RT) with Ea = 88 kJ/mol
           - **Eklund Equilibrium**: Kp = exp(42311/(1.98·T_R) - 11.24) for thermodynamic equilibrium
           - **Pass Chaining**: Each pass uses outlet composition from previous pass; dual-layer passes (1 & 4) chain temperature continuously
           - **Heat Capacity**: NASA/Burcat polynomial Cp/R coefficients with R = 1.9858775 BTU/(lbmol·R)
           - **Energy Balance**: dT/dW = (-ΔHrxn·r)/(FT0·Cp) with ΔHrxn = -42,560 BTU/lbmol
           - **Emissions**: Calculated from final SO2 mole fraction and molar balance equations
           - **X-T Diagram**: Operating line generated from actual RK4 simulation results (Tin/Tout, Xin/Xout) rather than heuristic model, ensuring diagram matches table values exactly
         - **Validation**: All required numeric inputs validated with user feedback via toast notifications, optional N2% and Total% fields
         - Blue "Run Simulation" button, graph placeholder for future visualizations, links to Catalyst Parameter Database
       - Gas-Gas Heat Exchanger (/unit-operation/gas-gas-heat-exchanger)
       - Sulfuric Acid Tower (/unit-operation/sulfuric-acid-tower)
       - Waste Heat Boiler (WHB) (/unit-operation/waste-heat-boiler)
       - Superheater (/unit-operation/superheater)
       - Acid Cooler (/unit-operation/acid-cooler)
       - Economizer (/unit-operation/economizer)
       - Main Compressor (/unit-operation/main-compressor) - Compressor performance calculator:
         - **GUI Layout**: Two-panel layout matching industrial HMI design with "Run Simulation" button
         - **Input Parameters**: RPMs (1/min), Temp (F), Pressure (IN WC), Barometric Pressure (ATM) with dropdown for realtime barometric data from psychrometric API
         - **Output Parameters**: Dual-unit display (Imperial/Metric) for Inlet Flow, Outlet Temp, Outlet Pressure, Temp Rise, Pressure Rise, Standard Flow, Outlet Flow, Mass Flow, Isentropic Head, Brake Power, Motor Power, Driver Speed
         - **Backend API** (`/api/compressor-simulation`): Calls Python compressor calculator for accurate performance predictions
           - **Python Calculator** (`server/python/compressor_calculator.py`): Least-squares curve-fit model using Howden SF 14.0 calibration data
           - **Affinity Laws**: Flow scales with RPM (Q ∝ N), reference 185,802 acfm at 4505 RPM
           - **Pressure Power Law**: Pout_abs = P0 * (Q/Q0)^exp from least-squares fit
           - **Temperature Rise Power Law**: dT = A * (Q/Q0)^m * (dP/dP0)^n from calibration data
           - **Isentropic Head**: H_is = (γ/(γ-1)) * R * T1 * [(P2/P1)^((γ-1)/γ) - 1]
           - **Power Calculation**: Brake power from mass flow and isentropic head with 78% efficiency
         - **Reference Documentation**: Howden SF 14.0 compressor curves PDF datasheet linked via "Compressor Data Sheet" button
         - **Python Code Display**: Syntax-highlighted Python code at /unit-operation/main-compressor/python-code using react-syntax-highlighter with VS Code Dark+ theme
    4. Monte Carlo: Profit Maximizer & Operation Optimizer (/profit-maximizer)
    5. Emergency Shutdown (ESD) Trainer (/esd-trainer)
  - **OTS Instructions & Videos Page** (/ots-instructions-videos): Central hub for training materials and documentation, featuring 7 training resources:
    1. OTS Learning Hub (/ots-learning-hub)
    2. Daily Operations Playbook (/daily-operations-playbook)
    3. Maintenance Mastery (/maintenance-mastery)
    4. Capital Projects Accelerator (/capital-projects-accelerator)
    5. Safety First Academy (/safety-first-academy)
    6. Acid Plant Document Vault (/acid-plant-document-vault)
    7. Sulfuric Acid Technology Deep Dive (/sulfuric-acid-technology-deep-dive)
  - **Shared Configuration**: Demo experiences defined in `client/src/config/demoExperiences.ts` with typed interface ensuring consistency between demo buttons and page content
  - **ExperiencePage Component**: Reusable template (`client/src/components/ExperiencePage.tsx`) for marketing pages with header, hero section, and "Coming Soon" placeholder content
  - **AI Assistant**: Right sidebar on Demo page featuring:
    - AI Assistant Guide card explaining capabilities and example queries
    - AI Assistant chat interface with message history using OpenAI via Replit AI Integrations
    - Dual knowledge base: confidential internal site information and public domain sulfuric acid production knowledge
    - Real-time chat with gpt-4o-mini model, loading indicators, and responsive layout
- **Key Features**:
    - **Static Simulation Demo**: Multi-screen system with dropdown selector for different operator screens:
      - **Compressor & Sulfur Burner Screen**: Sulfur burning process flow diagram with DeltaV-style PID faceplate for Compressor RPM (SIC-101) and slider for Sulfur Flow, plus 4 output overlays (Electrical Power MW, SO₂%, Furnace Outlet Temperature, Acid Production)
        - **PID Faceplate Component** (`client/src/components/PidFaceplate.tsx`): Industrial DeltaV-style control dialog with OUTPUT% and SETPOINT displays, vertical bar graphs for OUTPUT (cyan) and PV (yellow), PROCESS VARIABLE readout, and AUTO/MAN mode buttons
      - **Converter Operator Screen**: SO2 conversion process with 6 input controls (Pass temperatures, Jug Valve %, Gas inlet temps) and 15+ output overlays (Pass temps, SO2 conversions, acid production, power, etc.)
      - Screen-specific inputs preserved when switching between screens
      - Configuration-driven architecture with screen registry (`screenConfig.ts`) enabling easy addition of new screens and support for `controlType: 'faceplate'` controls
    - **Dynamic Simulation Demo**: Implements a real-time dual PID controller system for Sulfur Flow and Compressor RPMs with adjustable parameters and synchronized charts. Includes a two-level temperature alarm system for Furnace Outlet Temperature, acting as an automated safety interlock. Simulation speed control and real-time process value displays are included. Features a controller visibility panel with checkboxes to toggle display of Sulfur Flow and Compressor RPMs data series on the chart, with responsive layout that stacks on mobile devices.
    - **Monte Carlo Profit Maximizer**: Full-stack implementation with frontend-backend integration:
      - **Frontend**: Process input range controls (6 parameters), configuration panel (sample count, price/production type dropdowns), commodity pricing table (6 commodities with price ranges and distribution types)
      - **Backend API** (`/api/monte-carlo`): Validates inputs, runs Monte Carlo simulation with configurable sample count, returns comprehensive statistics (mean, stdDev, 95% confidence intervals) for profit, acid production, and power generation
      - **Visualization**: Recharts-based profit distribution histogram with backend-generated bins
      - **Results Display**: Shows acid production and power generation statistics with confidence intervals
      - **Data Flow**: Numeric inputs stored as strings in frontend to prevent NaN, parsed and validated server-side, simulation results displayed with proper formatting

### Backend Architecture
- **Server Framework**: Express.js with TypeScript for API endpoints, incorporating middleware for logging, JSON parsing, and error handling.
- **Authentication & Session Management**: Username/password authentication using bcrypt for hashing. Session management via `express-session` with a PostgreSQL store, secure HTTP-only cookies, and session regeneration to prevent fixation attacks. Password and username validation are enforced.
- **API Endpoints**: Provides endpoints for user registration (`/api/register`), login (`/api/login`), logout (`/api/logout`), fetching authenticated user information (`/api/auth/user`), AI chat (`/api/chat`), Monte Carlo simulation (`/api/monte-carlo`), and psychrometric data (`/api/psychrometrics/current`, `/api/psychrometrics/history`).
- **Psychrometric Data Service**: Weather service using Open-Meteo API (free, no API key required) that fetches real-time weather data and calculates psychrometric properties:
  - Location lookup via ZIP code using Open-Meteo geocoding API
  - Current weather: Temperature, humidity, pressure, dew point
  - Historical weather: ERA5 archive data for up to 30 days back
  - Calculated properties: Humidity ratio, specific enthalpy, wet bulb temperature, vapor pressure, saturation pressure, specific volume, air density
  - In-memory caching: 5 minutes for current data, 1 hour for historical data
- **AI Integration**: OpenAI chat endpoint using Replit AI Integrations (gpt-4o-mini) with system prompt containing both confidential internal knowledge and public domain information about sulfuric acid production.

### Data Storage Solutions
- **Database**: PostgreSQL database utilizing Neon serverless driver with Drizzle ORM for type-safe queries.
- **Schema**: Includes `sessions` table for persistence and `users` table for user data (username, hashedPassword, email, names, profile image URL, timestamps).
- **Data Access Layer**: `DatabaseStorage` class provides an interface for user operations, ensuring password hashes are never exposed.

## External Dependencies

- **Third-Party UI Libraries**: Radix UI (various primitives), React Hook Form with Zod, Lucide React for iconography, `class-variance-authority`, `date-fns`.
- **Authentication & Infrastructure**: `bcryptjs` for hashing, `express-session` with `connect-pg-simple` for session management.
- **Security & Protection**: `Helmet` middleware for security headers (including environment-aware CSP), `express-rate-limit` for API rate limiting on authentication and general endpoints.
- **AI/LLM Integration**: OpenAI SDK using Replit AI Integrations for serverless AI chat capabilities without requiring user API keys.
- **Development Tools**: `tsx` for TypeScript server execution, `esbuild` for production server bundling.