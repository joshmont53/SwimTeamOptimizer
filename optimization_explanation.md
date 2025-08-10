# Swimming Team Optimization System - Data Flow & Python Script Explanation

## Overview
The swimming team management system uses a sophisticated optimization algorithm to assign swimmers to events while considering availability, performance times, and pre-assignments.

## Data Flow: Frontend to Python Script

### Step 1: File Upload & Swimmer Data Processing
**Frontend**: `client/src/components/file-upload-section.tsx`
- User uploads CSV file with swimmer personal bests
- Frontend sends file to `/api/upload-csv`

**Backend**: `server/routes.ts` (lines 80-153)
- Parses CSV data and extracts swimmer information
- Creates swimmer records with availability status (default: `isAvailable: true`)
- Stores swimmer times with performance data
- CSV structure: `First_Name,Last_Name,ASA_No,Date_of_Birth,Meet,Date,Event,SC_Time,Course,Gender,AgeTime,County_QT,Count_CT,County_Qualify,time_in_seconds,isAvailable`

### Step 2: Squad Selection & Availability Management
**Frontend**: `client/src/components/squad-selection-section.tsx`
- Displays all swimmers with filtering options (search, gender, age)
- Users can toggle swimmer availability using checkboxes
- When availability changes, sends PATCH request to `/api/swimmers/:id` with `isAvailable` status

**Backend**: `server/routes.ts` (lines 209-224)
- Updates swimmer's `isAvailable` status in storage
- This status determines whether swimmer is included in optimization

### Step 3: Event Pre-Assignment
**Frontend**: `client/src/components/event-assignment-section.tsx`
- Users can pre-assign specific swimmers to events before optimization
- Pre-assignments are saved via POST requests to `/api/event-assignments`
- Each assignment includes: event, ageCategory, gender, swimmerId (ASA number)

### Step 4: Optimization Trigger
**Frontend**: `client/src/components/event-assignment-section.tsx` (lines 80-132)
- When "Run Optimization" is clicked, saves all pre-assignments
- Then calls `/api/optimize` POST endpoint

**Backend**: `server/routes.ts` (lines 353-500+)
1. Retrieves pre-assignments from storage
2. Filters swimmers to only include available ones
3. Generates CSV file (`member_pbs.csv`) with ALL swimmers but includes availability status
4. Creates pre-assignments JSON file (`pre_assignments.json`)
5. Executes Python script: `python3 server/optimizer.py`

## Python Script Detailed Breakdown

### File: `server/optimizer.py`

#### Core Function: `convert_to_seconds_with_milliseconds()`
- Converts time strings (MM:SS.MS format) to decimal seconds
- Handles various time formats (HH:MM:SS.MS, MM:SS.MS, SS.MS)

#### Main Process Flow:

#### 1. Data Loading (lines 66-140)
```python
# Load swimmer data - ONLY AVAILABLE SWIMMERS
swimmer_list = []
with open(member_pbs_file, newline='') as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) >= 16:  # Has explicit availability column
            availability_value = row[15]
        elif len(row) == 15:  # Old format - default to available
            availability_value = "true"
        
        is_available = availability_value.strip().lower() == 'true'
        
        if is_available:  # Only include available swimmers
            swimmer_list.append([row[0], row[1], row[6], row[9], row[10], row[14], row[2]])
```

**Key Point**: The Python script filters out unavailable swimmers at this stage. Swimmers marked as `isAvailable: false` in the frontend are completely excluded from optimization.

#### 2. County Times Loading (lines 160-167)
- Loads qualifying times from `county_times_cleaned.csv`
- These are the target times swimmers need to meet for qualification

#### 3. Event List Definition (lines 169-205)
- Defines all possible events with age categories and genders
- 50m events for 11U, 100m events for 13U/15U/16U, 200m IM for 16U

#### 4. Performance Analysis (lines 207-245)
- Matches swimmers to events they're eligible for based on:
  - Gender match
  - Event type match (stroke)
  - Age eligibility
- Calculates performance indices by comparing swimmer times to qualifying times
- Sorts swimmers by performance index (best performers first)

#### 5. Pre-Assignment Processing (lines 255-355)
```python
for assignment in pre_assignments.get("individual", []):
    # Find swimmer by ASA number
    target_asa = str(assignment['swimmerId']).strip()
    
    for time_row in full_list:
        swimmer_asa = str(time_row[6]).strip()
        if target_asa == swimmer_asa:
            swimmer_name = f"{time_row[3]} {time_row[4]}"
            break
    
    if swimmer_name:
        # Assign swimmer to pre-assigned event
        # Mark event as "protected" from optimization
        protected_events.add((event[0], event[1], event[2]))
```

**Key Point**: Pre-assignments are processed BEFORE optimization and are protected from being overwritten.

#### 6. Optimization Algorithm (lines 356-385)
```python
for time in full_list:  # Sorted by performance index
    swimmer_name = time[-1]
    current_count = swimmer_event_count.get(swimmer_name, 0)
    
    if current_count >= 2:  # Max 2 events per swimmer
        continue
        
    for event in event_list:
        # Skip protected (pre-assigned) events
        if event_key in protected_events:
            continue
            
        if event[-1] == 'Not allocated':
            event[-1] = swimmer_name  # Assign swimmer
            break
```

**Optimization Strategy**:
- Assigns swimmers to events based on performance ranking
- Respects the 2-event limit per swimmer
- Prioritizes best performers for each event
- Never overwrites pre-assignments

#### 7. Relay Team Generation (lines 406-500+)
- Groups swimmers by stroke specialties
- Generates optimal relay combinations for each age/gender category
- Considers both freestyle and medley relays

#### 8. Results Output
- Returns JSON with individual assignments and relay teams
- Includes performance statistics and optimization metadata

## How Unavailable Swimmers Are Removed

### Frontend Level:
1. User unchecks "Available" checkbox in squad selection
2. PATCH request updates swimmer's `isAvailable` status to `false`
3. Frontend filters display to show only available swimmers in subsequent steps

### Backend Level:
1. When generating CSV for Python script, ALL swimmers are included but with availability status
2. Python script reads availability column and filters out unavailable swimmers immediately
3. Unavailable swimmers never enter the optimization algorithm

### Critical Code in Python Script:
```python
if is_available:  # Only include available swimmers
    swimmer_list.append([...])  # Add to optimization
else:
    print(f"EXCLUDING unavailable swimmer {row[0]} {row[1]}")  # Skip
```

## Result Processing

After optimization completes:
1. Python script outputs JSON with assignments
2. Backend processes results and stores them
3. Frontend displays optimized assignments in results section
4. Users can navigate back to modify availability or pre-assignments and re-run optimization

This system ensures that swimmer availability is strictly enforced throughout the optimization process, and unavailable swimmers are completely excluded from event assignments.