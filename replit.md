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
  - **Static Acid Plant Simulator**: Multi-screen system with DeltaV-style PID faceplate for Compressor RPM, slider for Sulfur Flow, and various process outputs.
  - **Dynamic Acid Plant Simulator**: Real-time dual PID controller system for Sulfur Flow and Compressor RPMs with adjustable parameters, synchronized charts, and a two-level temperature alarm system.
  - **Unit Operation Simulator**: Hub page linking to individual unit operation simulators, including:
    - **Catalytic Converter**: Stand-alone simulation with comprehensive input/output interface, 4 catalyst pass cards, and a backend API calling a Python RK4 solver for SO2 oxidation kinetics. Features Arrhenius kinetics, Eklund equilibrium, pass chaining, and energy balance calculations.
    - **Main Compressor**: Compressor performance calculator with static/dynamic modes, input parameters like Speed and Plant Condition, and a backend API calling a Python calculator for system curve intersection and affinity law models.
  - **AI Assistant**: Right sidebar on Demo page featuring an AI Assistant chat interface using OpenAI via Replit AI Integrations, leveraging both confidential internal knowledge and public domain information.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript for API endpoints, including middleware for logging, JSON parsing, and error handling.
- **Authentication & Session Management**: Username/password authentication using bcrypt for hashing, and session management via `express-session` with a PostgreSQL store, secure HTTP-only cookies, and session regeneration.
- **API Endpoints**: Provides endpoints for user registration, login, logout, authenticated user information, AI chat, Monte Carlo simulation, and psychrometric data.
- **Psychrometric Data Service**: Uses Open-Meteo API for real-time and historical weather data, calculating psychrometric properties (e.g., humidity ratio, dew point). Includes in-memory caching.
- **AI Integration**: OpenAI chat endpoint using Replit AI Integrations (gpt-4o-mini) with a system prompt incorporating specialized domain knowledge.

### Data Storage Solutions
- **Database**: PostgreSQL database utilizing Neon serverless driver with Drizzle ORM for type-safe queries.
- **Schema**: Includes `sessions` table for persistence and `users` table for user data (username, hashedPassword, email, names, profile image URL, timestamps).
- **Data Access Layer**: `DatabaseStorage` class provides an interface for user operations, ensuring password hashes are never exposed.

## External Dependencies

- **Third-Party UI Libraries**: Radix UI, React Hook Form with Zod, Lucide React, `class-variance-authority`, `date-fns`.
- **Authentication & Infrastructure**: `bcryptjs`, `express-session` with `connect-pg-simple`.
- **Security & Protection**: `Helmet` for security headers (including environment-aware CSP), `express-rate-limit` for API rate limiting.
- **AI/LLM Integration**: OpenAI SDK using Replit AI Integrations.
- **Development Tools**: `tsx`, `esbuild`.