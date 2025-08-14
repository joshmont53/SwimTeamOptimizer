# Swimming Team Optimizer

## Overview
A comprehensive web-based swimming team management system designed for precise swimmer event optimization and intelligent assignment workflows. It provides team creation and management capabilities, competition type templates, and a 4-step optimization process with full team context integration. The system aims to streamline swimming team administration and enhance performance through intelligent event assignments.

## User Preferences
- Professional, technical documentation preferred
- Clear step-by-step workflow explanations
- Comprehensive code flow documentation
- Ready for public GitHub repository sharing

## System Architecture

### Core Functionality
The application implements a 4-step workflow:
1.  **File Upload**: Upload CSVs of swimmer personal bests and county qualifying times. Data is processed, validated, and stored with availability flags.
2.  **Squad Selection**: Display uploaded swimmers, allowing filtering, individual availability toggling, and bulk selection.
3.  **Event Assignment**: Configure pre-assignments for events and relays, then run a Python-based optimization algorithm for remaining slots.
4.  **Results Display**: Present optimized individual and relay assignments, team statistics, and export options.

### Key Technologies
-   **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui components
-   **Backend**: Node.js, Express, TypeScript
-   **Optimization**: Python 3 with advanced algorithm implementation
-   **Data**: Drizzle ORM schema with PostgreSQL persistence
-   **Build**: Vite with hot reload development

### Design Principles
-   **Intelligent Optimization**: Python algorithm considers swimmer availability, personal bests, and county standards, respecting pre-assignments and generating optimal relay combinations.
-   **User Experience**: Progressive 4-step workflow with visual indicators, real-time updates, responsive design, and comprehensive error handling.
-   **Data Management**: CSV import/export, flexible swimmer availability, event configuration, and pre-assignment system.
-   **Code Standards**: Full TypeScript, React functional components with hooks, Zod validation, error boundaries.
-   **API Design**: RESTful endpoints, Zod schema validation, consistent JSON responses, comprehensive error messaging.

### Technical Implementations
-   Automated workflow step tracking and state resumption.
-   Batch database operations for high-performance CSV uploads.
-   Subprocess execution for Python optimization, with JSON data exchange and robust error/timeout management.
-   Age calculation uses swimming competition standards (age as of December 31st, 2025) for 2025/26 season.
-   Frontend displays real-time competition ages in Squad Selection without requiring CSV re-upload.
-   Optimization engine uses real-time competition age calculation ensuring proper event eligibility (verified working).
-   Time display standardized to mm:ss.mm format across the frontend.
-   Persistent storage of optimization results to database.

### Recent Fixes (August 2025)
-   **Results Navigation Bug**: Fixed critical issue where "View Results" showed wrong page instead of optimization results.
    -   Root cause: Team query using wrong API endpoint (`/api/teams` array instead of `/api/teams/{id}` single team)
    -   Solution: Corrected query key to fetch individual team data with proper status
    -   Impact: "View Results" now correctly displays Step 4 with full individual and relay event results
-   **Race Condition Resolution**: Split step logic into separate useEffect hooks to prevent status override conflicts.
-   **Production Ready**: Removed debug logging, successful build verification completed.

## External Dependencies
-   **PostgreSQL**: Primary database for all application data, including swimmer information, teams, competition settings, and optimization results.
-   **Python 3**: Used for the core optimization algorithm, integrated via subprocess execution from the Node.js backend.
-   **CSV files**: Used for importing swimmer personal bests and county qualifying times.