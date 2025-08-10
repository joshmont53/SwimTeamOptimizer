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