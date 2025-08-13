# Swimming Team Optimizer - Replit Project

## Project Overview
A comprehensive web-based swimming team management system focused on precise swimmer event optimization and intelligent assignment workflows. The enhanced application now provides team creation and management capabilities, competition type templates, and maintains the existing 4-step optimization process with full team context integration throughout the workflow.

## Current Status
- ✅ Professional team management system with creation/selection interface
- ✅ Competition type templates (Arena League, County Relays, Custom)
- ✅ Team context integration throughout workflow
- ✅ Complete 4-step workflow implementation with persistent state management
- ✅ High-performance CSV file upload with batch database operations
- ✅ Swimmer availability management with team-specific endpoints
- ✅ Event and relay pre-assignment system  
- ✅ Python optimization engine integration
- ✅ Results display with statistics
- ✅ Modern React/TypeScript frontend
- ✅ Express backend with PostgreSQL database integration
- ✅ Workflow step tracking and automatic state resumption
- ✅ Ready for professional deployment

## Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui components
- **Backend**: Node.js, Express, TypeScript
- **Optimization**: Python 3 with advanced algorithm implementation
- **Data**: In-memory storage with Drizzle ORM schema
- **Build**: Vite with hot reload development

## Project Architecture

### Frontend Structure
```
client/src/
├── components/          # Reusable UI components
│   ├── file-upload-section.tsx
│   ├── squad-selection-section.tsx  
│   ├── event-assignment-section.tsx
│   ├── results-section.tsx
│   └── progress-indicator.tsx
├── pages/
│   └── home.tsx        # Main application page
└── lib/                # Utilities and configuration
```

### Backend Structure  
```
server/
├── index.ts           # Express server entry point
├── routes.ts          # API endpoint definitions
├── storage.ts         # Data persistence layer
├── optimizer.py       # Python optimization engine
└── vite.ts           # Development server setup
```

### Shared Resources
```
shared/
└── schema.ts          # Database schema and TypeScript types
```

## Application Workflow

### Step 1: File Upload
- Upload CSV files containing swimmer personal best times
- Process and validate swimmer data
- Store swimmer information with availability flags
- Load county qualifying time standards

### Step 2: Squad Selection
- Display all uploaded swimmers with filtering capabilities
- Toggle individual swimmer availability for the competition
- Search and filter by name, gender, age category
- Bulk selection operations for efficient management

### Step 3: Event Assignment
- View all available events by age category and gender
- Make pre-assignments for key swimmers to specific events
- Configure relay team positions and assignments
- Run Python optimization algorithm for remaining events

### Step 4: Results Display
- Show optimized individual event assignments
- Display relay team compositions with predicted times
- Present team statistics and qualifying swimmer counts
- Export functionality for meet management

## Core Features

### Intelligent Optimization
- Python-based algorithm considering swimmer availability, personal bests, and county standards
- Respects pre-assigned events while optimizing remaining slots
- Generates optimal relay team combinations
- Calculates team performance indices and qualification statistics

### User Experience
- Progressive 4-step workflow with visual indicators
- Real-time data updates and validation
- Modern, responsive interface design
- Comprehensive error handling and user feedback

### Data Management
- CSV import/export capabilities
- Flexible swimmer availability management
- Event configuration with age/gender categories
- Pre-assignment system for strategic planning

## Development Guidelines

### Code Standards
- Full TypeScript implementation for type safety
- React functional components with hooks
- Zod validation for all data inputs
- Error boundaries and proper exception handling

### API Design
- RESTful endpoints with proper HTTP status codes
- Input validation using Zod schemas
- Consistent JSON response formats
- Comprehensive error messaging

### Python Integration
- Subprocess execution for optimization algorithm
- JSON data exchange between Node.js and Python
- Proper error handling and timeout management
- Performance optimization for large datasets

## Recent Changes

### Squad Assignment Bug Fix (2025-08-13)
- ✅ **SWIMMER AVAILABILITY TOGGLE FIX**: Fixed critical API route mismatch preventing swimmer deselection
  - **Problem**: Frontend calls `/api/swimmers/{teamId}/{id}` but backend only had `/api/swimmers/{id}` route
  - **Error**: "Unexpected token '<'" JSON parsing error - API calls returned HTML instead of JSON
  - **Root Cause**: Route mismatch caused requests to fall through to Vite development server
  - **Solution**: Added new route `/api/swimmers/:teamId/:id` in `server/routes.ts` (lines 324-341)
  - **Backward Compatibility**: Kept original `/api/swimmers/:id` route as legacy endpoint
  - **Testing**: Confirmed Sam Law Chin Yung can be deselected and excluded from optimization
  - **Impact**: Users can now properly toggle swimmer availability without errors

### Critical "View Results" Bug Fix (2025-08-12)
- ✅ **OPTIMIZATION RESULTS PERSISTENCE**: Fixed critical bug where "View Results" button showed empty page
  - **Problem**: Optimization results were never saved to database, only sent to frontend during initial optimization
  - **Root Cause**: Missing database storage calls in optimization endpoint (`server/routes.ts` lines 634-644)
  - **Solution**: Added complete save/load optimization results system:
    - Clear previous results before saving new ones (Option 1: Replace Previous Results)
    - Save individual and relay results to `optimizationResults` table using `storage.createOptimizationResult()`
    - Generate unique `sessionId` per optimization run for data tracking
    - Transform and store results in database-compatible format
- ✅ **OPTIMIZATION RESULTS LOADING**: Added automatic loading of stored results for completed teams
  - **New API Endpoint**: `GET /api/teams/:teamId/optimization-results` - retrieves latest results by team ID only
  - **Storage Method**: `getOptimizationResultsByTeam(teamId)` - bypasses sessionId requirement
  - **Frontend Integration**: Added React Query for automatic result loading in `TeamWorkflow` component
  - **Result Transformation**: Convert database format back to frontend-expected format with stats calculation
- ✅ **USER EXPERIENCE IMPROVEMENTS**: Added proper loading states and error handling
  - **Loading State**: Shows spinner while fetching stored optimization results
  - **Automatic Detection**: Uses team status "selected" and `currentStep = 4` to trigger result loading
  - **Re-optimization Support**: Multiple optimization runs replace previous results (no historical data accumulation)
  - **Component Integration**: Updated `ResultsSection` to handle null results with proper TypeScript types
- ✅ **WORKFLOW CONSISTENCY**: Fixed component prop interfaces and data flow
  - **Fixed TypeScript Errors**: Corrected prop interfaces for FileUploadSection, SquadSelectionSection, EventAssignmentSection
  - **Data Flow**: Optimization results now persist through page refreshes and team navigation
  - **Team Context**: Proper team data passing throughout workflow components

### Critical Bug Fix (2025-08-11)
- ✅ **AGE CALCULATION FIX**: Fixed critical data integrity issue in CSV import
  - **Problem**: All swimmers had incorrect age 17 regardless of birth date
  - **Root Cause**: Age parsed from CSV column instead of calculated from date of birth
  - **Location**: `server/routes.ts` line 168 - CSV upload logic
  - **Solution**: Added `calculateAgeFromDateOfBirth()` function with proper date parsing
  - **Impact**: Fixed swimmer assignments in Open category events
- ✅ **OPTIMIZATION ALGORITHM FIX**: Fixed performance-based sorting for Open category
  - **Problem**: Swimmers without county qualifying times got `None` index, causing poor sorting
  - **Location**: `server/optimizer.py` lines 248-268 - qualifying time assignment logic  
  - **Solution**: Use age 17 county times as baseline for Open category (age 99) events
  - **Logic**: Open category swimmers are compared against age 17 standards for consistent index-based ranking
  - **Result**: Sam Law Chin Yung (66.27s) now correctly assigned instead of Malcolm Rainier (91.16s)
- ✅ **COUNTY TIMES DATA FIX**: Added missing Female 50m Freestyle qualifying times
  - **Problem**: Female swimmers in 50m Freestyle had very large index values due to missing county times
  - **Root Cause**: County times file missing all Female 50m Freestyle entries (28 missing)
  - **Location**: `attached_assets/county_times_cleaned.csv` - county qualifying times database
  - **Solution**: Added complete Female 50m Freestyle times for ages 11-17 (LC/SC, CT/QT)
  - **Result**: Female swimmers now get proper index-based assignments for 50m Freestyle events
- ✅ **DISPLAY CONSISTENCY**: Fixed age category display across frontend
  - **Problem**: "99U" showing instead of "Open" in some components
  - **Solution**: Applied consistent age formatting using existing helper functions
  - **Files**: `client/src/components/event-assignment-section.tsx`, `server/optimizer.py`

### Latest Updates (2025-08-10)
- ✅ Implemented comprehensive team management system
- ✅ Added team selection/creation interface with modal dialog
- ✅ Created competition type templates (Arena League, County Relays, Custom)
- ✅ Extended database schema for teams, competitions, and relationships
- ✅ Enhanced file upload section with team context display and back navigation
- ✅ Team API endpoints and storage layer implementation
- ✅ Professional team workflow now precedes 4-step optimization process
- ✅ **PERFORMANCE OPTIMIZATION**: Implemented batch database operations for CSV uploads
- ✅ **STATE PERSISTENCE**: Added automatic workflow step tracking and resumption
- ✅ **TEAM STATUS TRACKING**: Teams show "Selected" status after completion
- ✅ **DATABASE INTEGRATION**: Replaced in-memory storage with PostgreSQL for persistence

### Previous Session Fixes (2025-01-30)
- ✅ Prepared complete GitHub repository structure
- ✅ Created comprehensive README with workflow documentation
- ✅ Added LICENSE, .gitignore, and CONTRIBUTING.md files
- ✅ Documented complete code flow from upload to results
- ✅ Ready for GitHub publication and sharing

## User Preferences
- Professional, technical documentation preferred
- Clear step-by-step workflow explanations
- Comprehensive code flow documentation
- Ready for public GitHub repository sharing

## Deployment Notes
- Application runs on port 5000 in development
- Uses Replit workflow management for server automation  
- Optimized for Replit deployment with minimal configuration
- Environment variables managed through Replit secrets
- Hot reload enabled for efficient development

## Future Enhancements
- Mobile application for poolside management
- Integration with swimming federation databases
- Advanced analytics and performance tracking
- Multi-meet season planning capabilities
- Coaching insights and swimmer development metrics