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
-   **County Times Index for 10U Bug**: Fixed optimization script to handle swimmers aged 10 and under.
    -   Root cause: County times start at age 11, leaving younger swimmers without qualifying time baselines
    -   Solution: Added fallback logic to use age 11 county times for swimmers aged 10 and under
    -   Impact: 10U swimmers now get proper county time indexing for optimization calculations
-   **Relay Swimmer Count Bug**: Fixed hardcoded relay swimmer count detection to support dynamic extraction.
    -   Root cause: Script only recognized "6x" pattern, defaulting all others to 4 swimmers
    -   Solution: Implemented regex-based dynamic extraction from event names (4x, 6x, 8x, etc.)
    -   Impact: Custom templates can now correctly specify any relay swimmer count (verified with 8x50m relays)
-   **Medley Relay Optimization Critical Fix**: Resolved major performance issue in medley relay swimmer selection algorithm.
    -   Root cause: Script selected first 10 swimmers by database order instead of fastest 10 by stroke time, missing optimal swimmers
    -   Solution: Added sorting by stroke time before selecting top 10 swimmers for each stroke (backstroke, breaststroke, butterfly, freestyle)
    -   Impact: Medley relays now use fastest swimmers per stroke, achieving 4+ second improvements (e.g., Open Male 4x100m Medley: 4:10.99 → 4:06.10)
    -   Technical: Modified lines 612-631 in `server/optimizer.py` to sort stroke pools using `sorted(..., key=lambda x: x.stroke_time)`
-   **Relay Pre-Assignment Critical Fix**: Implemented comprehensive relay pre-assignment functionality that was previously non-functional.
    -   Root cause: Frontend collected relay assignments but never saved them to database; Python optimizer had processing logic but received empty relay assignments
    -   Solution: Added missing relay assignment saving logic in frontend with proper key parsing for complex relay names; enhanced Python script with position-specific and stroke-specific validation
    -   Frontend fix: Added relay assignment saving loop in `handleRunOptimization` with complex key parsing for formats like "4 x 100m Freestyle_99_Male_1_Backstroke"
    -   Backend enhancement: Enhanced Python script to process relay pre-assignments before optimization with fallback to optimal selection when assignments are invalid
    -   Impact: Users can now pre-assign swimmers to specific relay positions (1-4) and medley stroke positions with full validation and graceful fallback
-   **Relay Pre-Assignment Implementation Complete**: Successfully implemented and verified comprehensive relay pre-assignment functionality with full end-to-end testing.
    -   Root cause analysis: Frontend correctly collected relay assignments but issue was testing on wrong team template (arena_league vs county_relays event mismatch)
    -   Solution components: Enhanced frontend error handling, completed backend API endpoints, validated Python optimization processing, confirmed database schema consistency
    -   Frontend enhancement: Added comprehensive debugging and error handling in assignment saving workflow with proper ASA number handling
    -   Backend completion: Added missing GET and DELETE endpoints for relay assignments (`/api/relay-assignments/:teamId`, `/api/relay-assignments/team/:teamId`)
    -   Python validation: Confirmed swimmer lookup correctly uses `swimmer_list` with proper ASA number matching and pre-assignment preservation
    -   Schema consistency: Verified `relayAssignments.swimmer_id` as text type matches `eventAssignments` for ASA number storage
    -   Impact: Users can now pre-assign swimmers to specific relay positions (1-4) and medley stroke positions with full validation and preservation during optimization
    -   End-to-end verification: Comprehensive testing confirms Josh Montgomery correctly appears in position 1 of 4x100m Freestyle and Freestyle leg of 4x100m Medley; Max Walton correctly appears in Breaststroke leg of 4x100m Medley
    -   Production ready: All team templates (Arena League, County Relays, Custom Templates) support relay pre-assignments with complete workflow integration
-   **Production Ready**: All template types (Arena League, County Relays, Custom Templates) fully functional with comprehensive relay pre-assignment support and regression testing completed.
-   **Relay Pre-Assignment Database Persistence Critical Fix**: Resolved major issue where pre-assignments disappeared from database after optimization, causing user confusion.
    -   Root cause: Backend was clearing ALL assignments (including pre-assignments) before optimization, making users think their manual assignments were ignored
    -   Solution: Implemented selective clearing methods that preserve pre-assignments while clearing only auto-generated assignments
    -   New storage methods: `clearNonPreAssignedEventAssignments()` and `clearNonPreAssignedRelayAssignments()` using `isPreAssigned` boolean field for filtering
    -   Updated optimization route to use selective clearing instead of full database clearing
    -   Impact: Pre-assignments now persist in database after optimization AND are correctly honored by Python algorithm
    -   Comprehensive regression testing: Verified both relay and individual pre-assignments work correctly, optimization algorithm processes them properly, and standard optimization without pre-assignments remains functional
    -   User experience: Users can now see their manual assignments remain active in the database after optimization, providing confidence the system respects their choices

## External Dependencies
-   **PostgreSQL**: Primary database for all application data, including swimmer information, teams, competition settings, and optimization results.
-   **Python 3**: Used for the core optimization algorithm, integrated via subprocess execution from the Node.js backend.
-   **CSV files**: Used for importing swimmer personal bests and county qualifying times.