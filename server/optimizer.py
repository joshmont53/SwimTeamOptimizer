#!/usr/bin/env python3
import sys
import json
import csv
from dataclasses import dataclass
import itertools

def convert_to_seconds_with_milliseconds(time_str):
    if not time_str or time_str.strip() == '':
        return 0

    parts = time_str.strip().split(':')

    if len(parts) == 3:
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds_part = parts[2]
    elif len(parts) == 2:
        hours = 0
        minutes = int(parts[0])
        seconds_part = parts[1]
    else:
        return 0

    # Split seconds and milliseconds correctly
    if '.' in seconds_part:
        seconds, hundredths = seconds_part.split('.')
        seconds = int(seconds)
        hundredths = int(hundredths.ljust(2, '0'))  # Ensure 2-digit hundredths
    else:
        seconds = int(seconds_part)
        hundredths = 0

    total = hours * 3600 + minutes * 60 + seconds + hundredths / 100
    return round(total, 2)

@dataclass
class RelaySwimmer:
    name: str
    age: int
    gender: str
    # Store times for different distances
    freestyle_50: float = None
    freestyle_100: float = None
    freestyle_200: float = None
    backstroke_50: float = None
    backstroke_100: float = None
    backstroke_200: float = None
    breaststroke_50: float = None
    breaststroke_100: float = None
    breaststroke_200: float = None
    butterfly_50: float = None
    butterfly_100: float = None
    butterfly_200: float = None

    def __hash__(self):
        return hash(self.name)

def extract_relay_distance(event_name):
    """Extract the distance per leg from relay event name"""
    import re
    # Look for patterns like "4 x 100m" or "4x100m"
    match = re.search(r'(\d+)\s*x\s*(\d+)m', event_name)
    if match:
        return int(match.group(2))  # Return the distance (100, 200, etc.)
    return 50  # Default to 50m if no distance found

def main():
    # Use fixed file names like the original script
    member_pbs_file = 'member_pbs.csv'
    county_times_file = 'county_times_cleaned.csv'
    pre_assignments_file = 'pre_assignments.json'
    event_list_file = 'event_list.json'
    config_file = 'optimization_config.json'

    # Load optimization configuration
    optimization_config = {"maxIndividualEvents": 2, "competitionType": "arena_league"}
    try:
        with open(config_file, 'r') as f:
            optimization_config = json.load(f)
        print(f"LOADED OPTIMIZATION CONFIG: {optimization_config}", file=sys.stderr)
    except Exception as e:
        print(f"ERROR LOADING CONFIG: {e}", file=sys.stderr)
        pass  # Use defaults
    
    # Load dynamic event list
    event_list = []
    try:
        with open(event_list_file, 'r') as f:
            event_list = json.load(f)
        print(f"LOADED EVENT LIST: {len(event_list)} events", file=sys.stderr)
        if event_list:
            print(f"FIRST FEW EVENTS: {event_list[:3]}", file=sys.stderr)
    except Exception as e:
        print(f"ERROR LOADING EVENT LIST: {e}", file=sys.stderr)
        # Fallback to default Arena League events
        event_list = [
            ['50m Freestyle', 11, 'Male'],
            ['50m Backstroke', 11, 'Male'],
            ['50m Breaststroke', 11, 'Male'],
            ['50m Butterfly', 11, 'Male'],
            ['50m Freestyle', 11, 'Female'],
            ['50m Backstroke', 11, 'Female'],
            ['50m Breaststroke', 11, 'Female'],
            ['50m Butterfly', 11, 'Female'],
            ['100m Freestyle', 13, 'Male'],
            ['100m Backstroke', 13, 'Male'],
            ['100m Breaststroke', 13, 'Male'],
            ['100m Butterfly', 13, 'Male'],
            ['100m Freestyle', 13, 'Female'],
            ['100m Backstroke', 13, 'Female'],
            ['100m Breaststroke', 13, 'Female'],
            ['100m Butterfly', 13, 'Female'],
            ['100m Freestyle', 15, 'Male'],
            ['100m Backstroke', 15, 'Male'],
            ['100m Breaststroke', 15, 'Male'],
            ['100m Butterfly', 15, 'Male'],
            ['100m Freestyle', 15, 'Female'],
            ['100m Backstroke', 15, 'Female'],
            ['100m Breaststroke', 15, 'Female'],
            ['100m Butterfly', 15, 'Female'],
            ['100m Freestyle', 16, 'Male'],
            ['100m Backstroke', 16, 'Male'],
            ['100m Breaststroke', 16, 'Male'],
            ['100m Butterfly', 16, 'Male'],
            ['200m Individual Medley', 16, 'Male'],
            ['100m Freestyle', 16, 'Female'],
            ['100m Backstroke', 16, 'Female'],
            ['100m Breaststroke', 16, 'Female'],
            ['100m Butterfly', 16, 'Female'],
            ['200m Individual Medley', 16, 'Female']
        ]
        print(f"USING FALLBACK EVENT LIST: {len(event_list)} events", file=sys.stderr)

    # Load pre-assignments
    pre_assignments = {"individual": [], "relay": []}
    try:
        with open(pre_assignments_file, 'r') as f:
            pre_assignments = json.load(f)
        print(f"LOADED PRE-ASSIGNMENTS: {pre_assignments}", file=sys.stderr)
    except Exception as e:
        print(f"ERROR LOADING PRE-ASSIGNMENTS: {e}", file=sys.stderr)
        pass  # No pre-assignments file or empty

    # Load swimmer data - ONLY AVAILABLE SWIMMERS
    swimmer_list = []
    total_rows_processed = 0
    with open(member_pbs_file, newline='') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header
        print(f"PYTHON DEBUG: CSV Header has {len(header)} columns: {header}", file=sys.stderr)
        
        for row in reader:
            total_rows_processed += 1
            print(f"PYTHON DEBUG: Row {total_rows_processed}: Length={len(row)}, Course={row[8] if len(row) > 8 else 'N/A'}", file=sys.stderr)
            
            if len(row) >= 14:  # Include all courses - SC and LC times
                # CSV: First_Name,Last_Name,ASA_No,Date_of_Birth,Meet,Date,Event,SC_Time,Course,Gender,AgeTime,County_QT,Count_CT,County_Qualify,time_in_seconds,isAvailable
                #      0         1          2      3             4     5    6      7        8       9       10      11        12       13             14             15
                
                # Check what's actually in the last column - if it's a time value, there's a backend issue
                last_column = row[-1] if len(row) > 0 else "EMPTY"
                second_last = row[-2] if len(row) > 1 else "EMPTY"
                
                print(f"PYTHON DEBUG: Swimmer {row[0]} {row[1]} - Row length: {len(row)}", file=sys.stderr)
                print(f"  Last column (index {len(row)-1}): '{last_column}'", file=sys.stderr)
                print(f"  Second last (index {len(row)-2}): '{second_last}'", file=sys.stderr)
                
                # Robust availability detection
                if len(row) >= 16:  # Has explicit availability column
                    availability_value = row[15]
                    print(f"PYTHON DEBUG: Using explicit availability column (index 15): '{availability_value}'", file=sys.stderr)
                elif len(row) == 15:  # Old format without availability column
                    # If no availability column, assume all swimmers are available by default
                    availability_value = "true"
                    print(f"PYTHON DEBUG: No availability column found, defaulting to available", file=sys.stderr)
                else:
                    availability_value = "true"  # Default fallback
                    print(f"PYTHON DEBUG: Unexpected row length {len(row)}, defaulting to available", file=sys.stderr)
                
                # Parse availability value
                if availability_value and availability_value.strip():
                    is_available = availability_value.strip().lower() == 'true'
                else:
                    is_available = True  # Default to available if missing or empty
                
                print(f"PYTHON DEBUG: Final availability decision: '{availability_value}' -> is_available: {is_available}", file=sys.stderr)
                if is_available:
                    # CSV structure: First_Name,Last_Name,ASA_No,Date_of_Birth,Meet,Date,Event,SC_Time,Course,Gender,AgeTime,County_QT,Count_CT,County_Qualify,time_in_seconds,isAvailable
                    #                0           1          2       3             4     5    6      7        8       9       10      11        12       13             14             15
                    # time_in_seconds is at index 14, availability is at index 15
                    time_seconds = row[14]  # time_in_seconds column
                    swimmer_list.append([row[0], row[1], row[6], row[9], row[10], time_seconds, row[2]])  # Added ASA number at end
                    print(f"PYTHON: ✓ Including available swimmer {row[0]} {row[1]} (time: {time_seconds})", file=sys.stderr)
                else:
                    print(f"PYTHON: ✗ EXCLUDING unavailable swimmer {row[0]} {row[1]}", file=sys.stderr)
            else:
                print(f"PYTHON DEBUG: Skipping row - Length: {len(row)}, Course: {row[8] if len(row) > 8 else 'N/A'}", file=sys.stderr)
    
    print(f"PYTHON: Processed {total_rows_processed} total rows from CSV", file=sys.stderr)
    
    print(f"PYTHON: Final swimmer count after availability filtering: {len(swimmer_list)} swimmers", file=sys.stderr)
    
    # Early exit if no swimmers are available
    if len(swimmer_list) == 0:
        print("ERROR: No available swimmers found after filtering", file=sys.stderr)
        error_result = {
            "individual": [],
            "relay": [],
            "stats": {
                "qualifyingTimes": 0,
                "averageIndex": 0,
                "relayTeams": 0,
                "totalEvents": 0
            },
            "error": "No available swimmers found for optimization"
        }
        print(json.dumps(error_result))
        sys.exit(1)
    
    # Write detailed debug output to file
    try:
        with open('debug_output.txt', 'w') as debug_file:
            debug_file.write("=== SWIMMER AVAILABILITY DEBUG OUTPUT ===\n\n")
            debug_file.write(f"Total swimmers processed from CSV: {total_rows_processed}\n")
            debug_file.write(f"Swimmers included in optimization: {len(swimmer_list)}\n\n")
            
            debug_file.write("SWIMMERS INCLUDED IN OPTIMIZATION:\n")
            for i, swimmer in enumerate(swimmer_list):
                debug_file.write(f"  {i+1}. {swimmer[0]} {swimmer[1]} (ASA: {swimmer[6]})\n")
            
            if len(swimmer_list) == 0:
                debug_file.write("  >>> NO SWIMMERS INCLUDED - FILTERING BUG DETECTED! <<<\n")
            
            debug_file.write(f"\nProceeding to optimization with {len(swimmer_list)} swimmers...\n\n")
    except Exception as e:
        print(f"DEBUG FILE ERROR: {e}", file=sys.stderr)

    # Load county times
    county_times = []
    with open(county_times_file, newline='') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        for row in reader:
            if len(row) >= 6 and row[4] == 'QT':
                county_times.append([row[0], convert_to_seconds_with_milliseconds(row[1]), row[2], row[5]])

    # Event list is now loaded dynamically from event_list.json file above

    # Build full list with qualifying times
    full_list = []
    for event in event_list:
        for swimmer in swimmer_list:
            if swimmer[3] != event[2]:
                continue
            if swimmer[2] != event[0]:
                continue
            if int(swimmer[4]) > event[1]:
                continue
            else:
                full_list.append([event[0], event[1], event[2], swimmer[0], swimmer[1], float(swimmer[5]), swimmer[6]])  # swimmer[6] is now ASA number

    # Append qualifying time to each entry
    for i in range(len(full_list)):
        for time in county_times:
            if (
                time[0] == full_list[i][0] and
                int(time[2]) == full_list[i][1] and
                time[3] == full_list[i][2]
            ):
                full_list[i].append(time[1])
                break
        else:
            # For Open category (age 99), use age 17 county times as baseline
            if full_list[i][1] == 99:  # Open category
                for time in county_times:
                    if (
                        time[0] == full_list[i][0] and
                        int(time[2]) == 17 and  # Use age 17 baseline for Open
                        time[3] == full_list[i][2]
                    ):
                        full_list[i].append(time[1])
                        break
            # For age 10 and under, use age 11 county times as minimum
            elif full_list[i][1] <= 10:
                for time in county_times:
                    if (
                        time[0] == full_list[i][0] and
                        int(time[2]) == 11 and  # Use age 11 as minimum baseline
                        time[3] == full_list[i][2]
                    ):
                        full_list[i].append(time[1])
                        break

    # Calculate differences and indices
    for row in full_list:
        if len(row) > 7:  # Now we have 8 elements: event, age, gender, first_name, last_name, time, asa_no, qualifying_time
            swimmer_time = float(row[5])  # swimmer time
            qualifying_time = row[7]      # qualifying time (appended in previous loop)
            diff = round(swimmer_time - qualifying_time, 2)
            index = round(diff / qualifying_time, 3)
            row.append(diff)
            row.append(index)
        else:
            # This should rarely happen now since Open category uses age 17 baseline
            row.append(None)  # diff
            row.append(999999)  # High index for entries without qualifying time

    # Sort by index
    full_list.sort(key=lambda x: (x[-1] is None, x[-1]))

    # Initialize event assignments
    for event in event_list:
        event.append('Not allocated')

    # Add full names
    for row in full_list:
        full_name = ' '.join([row[3], row[4]])
        row.append(full_name)

    # Handle pre-assigned individual events BEFORE optimization
    swimmer_event_count = {}
    protected_events = set()  # Tracks pre-assigned events to prevent overwrites
    print(f"PYTHON: Processing {len(pre_assignments.get('individual', []))} pre-assignments", file=sys.stderr)
    
    if len(pre_assignments.get('individual', [])) > 0:
        first_assignment = pre_assignments['individual'][0]
        print(f"PYTHON: First assignment is {first_assignment}", file=sys.stderr)
    
    print(f"Processing {len(pre_assignments.get('individual', []))} pre-assignments", file=sys.stderr)
    
    for assignment in pre_assignments.get("individual", []):
        print(f"Processing assignment: {assignment}", file=sys.stderr)
        # Find swimmer by ASA number (index 6 in full_list)
        swimmer_name = None
        
        # Enhanced debugging for ASA number matching
        target_asa = str(assignment['swimmerId']).strip()
        print(f"DEBUG: Looking for ASA '{target_asa}' (type: {type(assignment['swimmerId'])}) in {len(full_list)} swimmers", file=sys.stderr)
        
        # Show sample of available ASA numbers for debugging
        for i, time_row in enumerate(full_list[:10]):  # Show first 10 for debugging
            row_asa = str(time_row[6]).strip()
            print(f"  Row {i}: ASA='{row_asa}' (type: {type(time_row[6])}), Name={time_row[3]} {time_row[4]}", file=sys.stderr)
        
        # Fixed ASA matching - ASA number is now correctly at index 6
        for time_row in full_list:
            if len(time_row) >= 7:  # Ensure we have enough columns
                # full_list structure: [event, age, gender, first_name, last_name, time, asa_no]
                swimmer_asa = str(time_row[6]).strip() if time_row[6] else None
                
                if target_asa == swimmer_asa:
                    swimmer_name = f"{time_row[3]} {time_row[4]}"
                    print(f"SUCCESS: Found swimmer '{swimmer_name}' for ASA '{target_asa}'", file=sys.stderr)
                    break
        
        # Fallback: try name-based matching if ASA fails
        if not swimmer_name:
            print(f"WARNING: ASA match failed for '{target_asa}', attempting name-based fallback...", file=sys.stderr)
            # This would require swimmer name in assignment data - skip for now
        
        if swimmer_name:
            event_match = assignment['event']
            age_match = assignment['ageCategory']
            
            # Enhanced gender conversion with debugging
            original_gender = assignment['gender']
            gender_mapping = {
                'M': 'Male',
                'F': 'Female', 
                'Male': 'Male',
                'Female': 'Female'
            }
            gender_match = gender_mapping.get(original_gender)
            if not gender_match:
                print(f"ERROR: Unknown gender format '{original_gender}' in assignment", file=sys.stderr)
                continue
            
            print(f"DEBUG: Gender conversion '{original_gender}' -> '{gender_match}'", file=sys.stderr)
            print(f"Looking for event: {event_match}, {age_match}, {gender_match}", file=sys.stderr)
            print(f"Available events: {len(event_list)}", file=sys.stderr)
            for i, event in enumerate(event_list[:5]):  # Show first 5 events
                print(f"  Event {i}: {event[0]}, {event[1]}, {event[2]}, Status: {event[-1]}", file=sys.stderr)
            
            event_found = False
            event_already_assigned = False
            
            # Check if event exists and get its current status
            for event in event_list:
                if (event[0] == event_match and 
                    event[1] == age_match and 
                    event[2] == gender_match):
                    
                    if event[-1] == 'Not allocated':
                        # Event is available - assign it
                        event[-1] = swimmer_name
                        protected_events.add((event[0], event[1], event[2]))  # Protect this event
                        print(f"SUCCESS: Pre-assigned {swimmer_name} to {event_match} {age_match} {gender_match}", file=sys.stderr)
                        swimmer_event_count[swimmer_name] = swimmer_event_count.get(swimmer_name, 0) + 1
                        event_found = True
                    else:
                        # Event already has someone assigned
                        print(f"WARNING: Event {event_match} {age_match} {gender_match} already assigned to {event[-1]}", file=sys.stderr)
                        event_already_assigned = True
                    break
            
            if not event_found and not event_already_assigned:
                print(f"ERROR: Event not found in event list: {event_match} {age_match} {gender_match}", file=sys.stderr)
                print(f"Available events matching gender {gender_match}:", file=sys.stderr)
                for event in event_list[:10]:
                    if event[2] == gender_match:
                        print(f"  - {event[0]} {event[1]} {event[2]}", file=sys.stderr)
        else:
            print(f"ERROR: Could not find swimmer with ASA: {assignment['swimmerId']}", file=sys.stderr)
            print("Available ASA numbers:", [row[6] for row in full_list[:5]], file=sys.stderr)

    # Show summary of pre-assignments before optimization
    print(f"SUMMARY: {len(protected_events)} events are protected from optimization:", file=sys.stderr)
    for protected in protected_events:
        print(f"  - {protected[0]} {protected[1]} {protected[2]}", file=sys.stderr)

    # Allocate swimmers to events (max 2 per swimmer)
    optimization_assignments = 0
    for time in full_list:
        swimmer_name = time[-1]
        
        # Check current allocation count including pre-assignments
        current_count = swimmer_event_count.get(swimmer_name, 0)
        allocated_count = sum(1 for event in event_list if event[-1] == swimmer_name)
        total_count = max(current_count, allocated_count)

        if total_count >= optimization_config.get("maxIndividualEvents", 2):
            continue

        for event in event_list:
            if event[0] == time[0] and event[1] == time[1] and event[2] == time[2]:
                # Skip protected events - THIS IS CRITICAL
                event_key = (event[0], event[1], event[2])
                if event_key in protected_events:
                    print(f"PROTECTION: Skipping protected event {event[0]} {event[1]} {event[2]} (assigned to {event[-1]})", file=sys.stderr)
                    continue
                    
                if event[-1] == 'Not allocated':
                    event[-1] = swimmer_name
                    swimmer_event_count[swimmer_name] = swimmer_event_count.get(swimmer_name, 0) + 1
                    optimization_assignments += 1
                    print(f"AUTO-ASSIGNED: {swimmer_name} to {event[0]} {event[1]} {event[2]}", file=sys.stderr)
                    break
    
    print(f"OPTIMIZATION COMPLETE: {optimization_assignments} events auto-assigned, {len(protected_events)} pre-assigned", file=sys.stderr)
    
    # Process relay pre-assignments BEFORE relay optimization
    relay_protected_assignments = {}  # Track pre-assigned positions per relay
    print(f"PYTHON: Processing {len(pre_assignments.get('relay', []))} relay pre-assignments", file=sys.stderr)
    
    for relay_assignment in pre_assignments.get("relay", []):
        print(f"Processing relay assignment: {relay_assignment}", file=sys.stderr)
        
        # Extract relay assignment details
        relay_name = relay_assignment['relayName']
        age_category = relay_assignment['ageCategory']
        gender = relay_assignment['gender']
        position = relay_assignment['position']  # 1-4 for relay positions
        stroke = relay_assignment.get('stroke', None)  # For medley relays
        swimmer_id = relay_assignment['swimmerId']
        
        # Find swimmer by ASA number in the original swimmer_list (used for relay building)
        swimmer_name = None
        target_asa = str(swimmer_id).strip()
        print(f"DEBUG: Looking for relay swimmer ASA '{target_asa}' in swimmer_list", file=sys.stderr)
        
        for swimmer_row in swimmer_list:
            # swimmer_list structure: [firstName, lastName, event, gender, ageTime, timeSeconds, asaNo]
            if len(swimmer_row) >= 7:
                swimmer_asa = str(swimmer_row[6]).strip() if swimmer_row[6] else None  # ASA number at index 6
                if target_asa == swimmer_asa:
                    swimmer_name = f"{swimmer_row[0]} {swimmer_row[1]}"  # First_Name is index 0, Last_Name is index 1
                    print(f"SUCCESS: Found relay swimmer '{swimmer_name}' for ASA '{target_asa}'", file=sys.stderr)
                    break
        
        if not swimmer_name:
            # Debug: Show a sample of swimmers in swimmer_list for troubleshooting
            print(f"RELAY DEBUG: swimmer_list contains {len(swimmer_list)} entries. Sample of swimmers:", file=sys.stderr)
            unique_swimmers = set()
            for row in swimmer_list:
                if len(row) >= 7:
                    swimmer_info = f"{row[0]} {row[1]} (ASA: {row[6]})"
                    unique_swimmers.add(swimmer_info)
                    if len(unique_swimmers) <= 5:  # Show first 5 unique swimmers
                        print(f"  - {swimmer_info}", file=sys.stderr)
        
        if swimmer_name:
            # Normalize gender format for consistent key matching
            gender_mapping = {
                'M': 'Male',
                'F': 'Female', 
                'Male': 'Male',
                'Female': 'Female'
            }
            normalized_gender = gender_mapping.get(gender, gender)
            
            relay_key = (relay_name, age_category, normalized_gender)
            if relay_key not in relay_protected_assignments:
                relay_protected_assignments[relay_key] = {}
            
            relay_protected_assignments[relay_key][position] = {
                'swimmer': swimmer_name,
                'stroke': stroke
            }
            print(f"SUCCESS: Pre-assigned {swimmer_name} to {relay_name} {age_category} {normalized_gender} position {position} ({stroke or 'freestyle'})", file=sys.stderr)
        else:
            print(f"ERROR: Could not find relay swimmer with ASA: {swimmer_id}", file=sys.stderr)
    
    # Show summary of relay pre-assignments
    print(f"RELAY SUMMARY: {len(relay_protected_assignments)} relays have pre-assignments:", file=sys.stderr)
    for relay_key, positions in relay_protected_assignments.items():
        relay_name, age_cat, gender = relay_key
        print(f"  - {relay_name} {age_cat} {gender}: {len(positions)} pre-assigned positions", file=sys.stderr)
        for pos, assignment in positions.items():
            print(f"    Position {pos}: {assignment['swimmer']} ({assignment['stroke'] or 'freestyle'})", file=sys.stderr)
    
    # Add optimization results to debug file
    with open('debug_output.txt', 'a') as debug_file:
        debug_file.write("=== OPTIMIZATION RESULTS ===\n")
        debug_file.write(f"Events auto-assigned: {optimization_assignments}\n")
        debug_file.write(f"Events pre-assigned: {len(protected_events)}\n\n")
        
        debug_file.write("FINAL EVENT ASSIGNMENTS:\n")
        assigned_events = [event for event in event_list if event[-1] != 'Not allocated']
        unassigned_events = [event for event in event_list if event[-1] == 'Not allocated']
        
        for i, event in enumerate(assigned_events):
            debug_file.write(f"  {i+1}. {event[1]}U {event[2]} {event[0]} -> {event[-1]}\n")
        
        debug_file.write(f"\nUnassigned events: {len(unassigned_events)}\n")
        for event in unassigned_events[:5]:  # Show first 5 unassigned
            debug_file.write(f"  - {event[1]}U {event[2]} {event[0]}\n")
        
        if len(assigned_events) == 0:
            debug_file.write("  >>> NO EVENTS ASSIGNED - OPTIMIZATION FAILED! <<<\n")

    # Build relay swimmers
    relay_swimmers = {}
    for row in swimmer_list:
        name = f"{row[0]} {row[1]}"
        stroke = row[2]
        try:
            time = float(row[5])
        except (TypeError, ValueError):
            continue

        age = int(row[4])
        gender = row[3]

        if name not in relay_swimmers:
            relay_swimmers[name] = RelaySwimmer(name=name, age=age, gender=gender)

        # Store times for all distances
        if "Freestyle" in stroke:
            if stroke == "50m Freestyle":
                relay_swimmers[name].freestyle_50 = time
            elif stroke == "100m Freestyle":
                relay_swimmers[name].freestyle_100 = time
            elif stroke == "200m Freestyle":
                relay_swimmers[name].freestyle_200 = time
        elif "Backstroke" in stroke:
            if stroke == "50m Backstroke":
                relay_swimmers[name].backstroke_50 = time
            elif stroke == "100m Backstroke":
                relay_swimmers[name].backstroke_100 = time
            elif stroke == "200m Backstroke":
                relay_swimmers[name].backstroke_200 = time
        elif "Breaststroke" in stroke:
            if stroke == "50m Breaststroke":
                relay_swimmers[name].breaststroke_50 = time
            elif stroke == "100m Breaststroke":
                relay_swimmers[name].breaststroke_100 = time
            elif stroke == "200m Breaststroke":
                relay_swimmers[name].breaststroke_200 = time
        elif "Butterfly" in stroke:
            if stroke == "50m Butterfly":
                relay_swimmers[name].butterfly_50 = time
            elif stroke == "100m Butterfly":
                relay_swimmers[name].butterfly_100 = time
            elif stroke == "200m Butterfly":
                relay_swimmers[name].butterfly_200 = time

    # Generate relay teams from dynamic event list
    freestyle_relay_teams = []
    medley_relay_teams = []
    
    # Extract relay events from the loaded event list
    relay_events = [event for event in event_list if len(event) >= 3 and ('relay' in event[0].lower() or 'x' in event[0].lower() or 'squadrun' in event[0].lower())]
    
    # If no relay events in the dynamic list, fall back to age group iteration for all relays
    if not relay_events:
        # Fallback to hardcoded age groups only if no relay events are defined
        relay_age_groups = [11, 13, 15, 16]
        relay_genders = ['Male', 'Female']
        for age in relay_age_groups:
            for gender in relay_genders:
                relay_events.extend([
                    ['4x50m Freestyle Relay', age, gender],
                    ['4x50m Medley Relay', age, gender]
                ])
    
    # Group relay events by age and gender for processing
    relay_events_dict = {}
    for event in relay_events:
        if len(event) >= 3:
            key = (event[1], event[2])  # (age, gender)
            if key not in relay_events_dict:
                relay_events_dict[key] = []
            relay_events_dict[key].append(event[0])  # event name
    
    print(f"PYTHON: Processing {len(relay_events)} relay events from dynamic list", file=sys.stderr)
    for event in relay_events[:5]:  # Show first 5
        print(f"PYTHON: Relay event: {event}", file=sys.stderr)
    
    # Process each age/gender combination
    for (age, gender) in relay_events_dict:
        event_names = relay_events_dict[(age, gender)]
        
        # Use appropriate age filter based on Open events (age 99 means Open, so no age limit)
        if age == 99:
            group = [s for s in relay_swimmers.values() if s.gender == gender]
        else:
            group = [s for s in relay_swimmers.values() if s.age <= age and s.gender == gender]

        # Process each relay event for this age/gender combination
        for event_name in event_names:
            if 'freestyle' in event_name.lower() and 'medley' not in event_name.lower():
                # Freestyle relay - determine number of swimmers needed
                import re
                match = re.search(r'(\d+)\s*x', event_name)
                swimmers_needed = int(match.group(1)) if match else 4
                
                # Detect relay distance and use appropriate times
                distance = extract_relay_distance(event_name)
                
                # Normalize gender format to match what we use for relay key matching
                gender_mapping = {
                    'M': 'Male',
                    'F': 'Female', 
                    'Male': 'Male',
                    'Female': 'Female'
                }
                normalized_gender = gender_mapping.get(gender, gender)
                
                # Check if this relay has pre-assignments (use normalized gender for key matching)
                relay_key = (event_name, age, normalized_gender)
                has_pre_assignments = relay_key in relay_protected_assignments
                
                if has_pre_assignments:
                    print(f"FREESTYLE RELAY: Processing pre-assignments for {event_name} {age} {normalized_gender}", file=sys.stderr)
                    
                    # Build team with pre-assigned swimmers in correct positions
                    team_slots = [None] * swimmers_needed
                    pre_assigned_swimmers_set = set()
                    
                    # Fill pre-assigned positions
                    for pos, assignment in relay_protected_assignments[relay_key].items():
                        if 1 <= pos <= swimmers_needed:
                            team_slots[pos - 1] = assignment['swimmer']  # Convert to 0-based index
                            pre_assigned_swimmers_set.add(assignment['swimmer'])
                            print(f"  Pre-assigned position {pos}: {assignment['swimmer']}", file=sys.stderr)
                    
                    # Get all available swimmers for this distance
                    if distance == 50:
                        all_swimmers = sorted([s for s in group if s.freestyle_50 is not None], key=lambda x: x.freestyle_50)
                        time_attr = 'freestyle_50'
                    elif distance == 100:
                        all_swimmers = sorted([s for s in group if s.freestyle_100 is not None], key=lambda x: x.freestyle_100)
                        time_attr = 'freestyle_100'
                    elif distance == 200:
                        all_swimmers = sorted([s for s in group if s.freestyle_200 is not None], key=lambda x: x.freestyle_200)
                        time_attr = 'freestyle_200'
                    else:
                        # Fallback to 50m
                        all_swimmers = sorted([s for s in group if s.freestyle_50 is not None], key=lambda x: x.freestyle_50)
                        time_attr = 'freestyle_50'
                    
                    # Validate pre-assigned swimmers have required times
                    valid_team = True
                    for pos, assignment in relay_protected_assignments[relay_key].items():
                        if 1 <= pos <= swimmers_needed:
                            swimmer_name = assignment['swimmer']
                            # Find swimmer object
                            swimmer_obj = None
                            for s in all_swimmers:
                                if s.name == swimmer_name:
                                    swimmer_obj = s
                                    break
                            
                            if swimmer_obj is None or getattr(swimmer_obj, time_attr) is None:
                                print(f"  WARNING: Pre-assigned swimmer {swimmer_name} has no {distance}m freestyle time - skipping pre-assignment", file=sys.stderr)
                                valid_team = False
                                break
                    
                    if valid_team:
                        # Get available swimmers (excluding pre-assigned ones)
                        available_swimmers = [s for s in all_swimmers if s.name not in pre_assigned_swimmers_set]
                        
                        # Fill remaining positions with fastest available swimmers
                        available_index = 0
                        for i in range(swimmers_needed):
                            if team_slots[i] is None and available_index < len(available_swimmers):
                                team_slots[i] = available_swimmers[available_index].name
                                available_index += 1
                        
                        # Build final team if all positions filled
                        if all(slot is not None for slot in team_slots):
                            # Calculate total time and create swimmer_times array
                            total_time = 0
                            swimmer_times = []
                            
                            for swimmer_name in team_slots:
                                # Find swimmer object
                                swimmer_obj = None
                                for s in all_swimmers:
                                    if s.name == swimmer_name:
                                        swimmer_obj = s
                                        break
                                
                                if swimmer_obj:
                                    swimmer_time = getattr(swimmer_obj, time_attr)
                                    total_time += swimmer_time
                                    swimmer_times.append({'name': swimmer_name, 'time': f'{swimmer_time:.2f}s'})
                            
                            total_time = round(total_time, 2)
                            
                            # Format age display: 99 -> Open, others -> XU
                            age_display = "Open" if age == 99 else f"{age}U"
                            
                            freestyle_relay_teams.append({
                                'relay': f'{age_display} {normalized_gender} {event_name}',
                                'totalTime': f'{int(total_time // 60):02d}:{total_time % 60:05.2f}',
                                'swimmers': swimmer_times
                            })
                            print(f"  SUCCESS: Built pre-assigned freestyle relay with time {total_time:.2f}s", file=sys.stderr)
                        else:
                            print(f"  WARNING: Could not fill all positions for pre-assigned freestyle relay", file=sys.stderr)
                    else:
                        # Fall back to optimal selection if pre-assignments are invalid
                        print(f"  Falling back to optimal selection for {event_name}", file=sys.stderr)
                        has_pre_assignments = False
                
                # Original optimal logic (used when no pre-assignments or fallback)
                if not has_pre_assignments:
                    if distance == 50:
                        freestyle_swimmers = sorted([s for s in group if s.freestyle_50 is not None], key=lambda x: x.freestyle_50)[:swimmers_needed]
                        if len(freestyle_swimmers) == swimmers_needed:
                            total_time = round(sum(s.freestyle_50 for s in freestyle_swimmers), 2)
                            swimmer_times = [{'name': s.name, 'time': f'{s.freestyle_50:.2f}s'} for s in freestyle_swimmers]
                    elif distance == 100:
                        freestyle_swimmers = sorted([s for s in group if s.freestyle_100 is not None], key=lambda x: x.freestyle_100)[:swimmers_needed]
                        if len(freestyle_swimmers) == swimmers_needed:
                            total_time = round(sum(s.freestyle_100 for s in freestyle_swimmers), 2)
                            swimmer_times = [{'name': s.name, 'time': f'{s.freestyle_100:.2f}s'} for s in freestyle_swimmers]
                    elif distance == 200:
                        freestyle_swimmers = sorted([s for s in group if s.freestyle_200 is not None], key=lambda x: x.freestyle_200)[:swimmers_needed]
                        if len(freestyle_swimmers) == swimmers_needed:
                            total_time = round(sum(s.freestyle_200 for s in freestyle_swimmers), 2)
                            swimmer_times = [{'name': s.name, 'time': f'{s.freestyle_200:.2f}s'} for s in freestyle_swimmers]
                    else:
                        # Fallback to 50m if distance not recognized
                        freestyle_swimmers = sorted([s for s in group if s.freestyle_50 is not None], key=lambda x: x.freestyle_50)[:swimmers_needed]
                        if len(freestyle_swimmers) == swimmers_needed:
                            total_time = round(sum(s.freestyle_50 for s in freestyle_swimmers), 2)
                            swimmer_times = [{'name': s.name, 'time': f'{s.freestyle_50:.2f}s'} for s in freestyle_swimmers]
                    
                    if len(freestyle_swimmers) == swimmers_needed:
                        # Format age display: 99 -> Open, others -> XU
                        age_display = "Open" if age == 99 else f"{age}U"
                        
                        freestyle_relay_teams.append({
                            'relay': f'{age_display} {normalized_gender} {event_name}',
                            'totalTime': f'{int(total_time // 60):02d}:{total_time % 60:05.2f}',
                            'swimmers': swimmer_times
                        })

            elif 'medley' in event_name.lower():
                # Medley relay - detect distance and use appropriate times
                distance = extract_relay_distance(event_name)
                
                # Normalize gender format to match what we use for relay key matching
                gender_mapping = {
                    'M': 'Male',
                    'F': 'Female', 
                    'Male': 'Male',
                    'Female': 'Female'
                }
                normalized_gender = gender_mapping.get(gender, gender)
                
                # Check if this relay has pre-assignments (use normalized gender for key matching)
                relay_key = (event_name, age, normalized_gender)
                has_pre_assignments = relay_key in relay_protected_assignments
                
                if has_pre_assignments:
                    print(f"MEDLEY RELAY: Processing pre-assignments for {event_name} {age} {normalized_gender}", file=sys.stderr)
                    
                    # Build stroke pools considering pre-assignments
                    stroke_assignments = {}
                    pre_assigned_swimmers_set = set()
                    
                    # Track pre-assigned strokes and swimmers
                    for pos, assignment in relay_protected_assignments[relay_key].items():
                        stroke = assignment['stroke']
                        swimmer_name = assignment['swimmer']
                        stroke_assignments[stroke] = swimmer_name
                        pre_assigned_swimmers_set.add(swimmer_name)
                        print(f"  Pre-assigned {stroke}: {swimmer_name}", file=sys.stderr)
                    
                    # Build stroke pools with pre-assignment validation
                    def get_stroke_pool(stroke_name, time_attr, all_group_swimmers):
                        if stroke_name in stroke_assignments:
                            # Find pre-assigned swimmer
                            pre_assigned_swimmer = stroke_assignments[stroke_name]
                            swimmer_obj = None
                            for s in all_group_swimmers:
                                if s.name == pre_assigned_swimmer:
                                    swimmer_obj = s
                                    break
                            
                            if swimmer_obj and getattr(swimmer_obj, time_attr) is not None:
                                return [swimmer_obj]  # Return only pre-assigned swimmer
                            else:
                                print(f"  WARNING: Pre-assigned swimmer {pre_assigned_swimmer} has no {distance}m {stroke_name.lower()} time - falling back to optimal", file=sys.stderr)
                                return []  # Invalid pre-assignment
                        else:
                            # Return top 10 swimmers excluding pre-assigned ones
                            eligible = [s for s in all_group_swimmers if s.name not in pre_assigned_swimmers_set and getattr(s, time_attr) is not None]
                            return sorted(eligible, key=lambda x: getattr(x, time_attr))[:10]
                    
                    # Build stroke pools based on distance
                    if distance == 50:
                        backstrokers = get_stroke_pool('Backstroke', 'backstroke_50', group)
                        breaststrokers = get_stroke_pool('Breaststroke', 'breaststroke_50', group)
                        butterflies = get_stroke_pool('Butterfly', 'butterfly_50', group)
                        freestylers = get_stroke_pool('Freestyle', 'freestyle_50', group)
                        time_attrs = ('backstroke_50', 'breaststroke_50', 'butterfly_50', 'freestyle_50')
                    elif distance == 100:
                        backstrokers = get_stroke_pool('Backstroke', 'backstroke_100', group)
                        breaststrokers = get_stroke_pool('Breaststroke', 'breaststroke_100', group)
                        butterflies = get_stroke_pool('Butterfly', 'butterfly_100', group)
                        freestylers = get_stroke_pool('Freestyle', 'freestyle_100', group)
                        time_attrs = ('backstroke_100', 'breaststroke_100', 'butterfly_100', 'freestyle_100')
                    elif distance == 200:
                        backstrokers = get_stroke_pool('Backstroke', 'backstroke_200', group)
                        breaststrokers = get_stroke_pool('Breaststroke', 'breaststroke_200', group)
                        butterflies = get_stroke_pool('Butterfly', 'butterfly_200', group)
                        freestylers = get_stroke_pool('Freestyle', 'freestyle_200', group)
                        time_attrs = ('backstroke_200', 'breaststroke_200', 'butterfly_200', 'freestyle_200')
                    else:
                        # Fallback to 50m
                        backstrokers = get_stroke_pool('Backstroke', 'backstroke_50', group)
                        breaststrokers = get_stroke_pool('Breaststroke', 'breaststroke_50', group)
                        butterflies = get_stroke_pool('Butterfly', 'butterfly_50', group)
                        freestylers = get_stroke_pool('Freestyle', 'freestyle_50', group)
                        time_attrs = ('backstroke_50', 'breaststroke_50', 'butterfly_50', 'freestyle_50')
                    
                    # Check if all stroke pools have at least one swimmer
                    if all(len(pool) > 0 for pool in [backstrokers, breaststrokers, butterflies, freestylers]):
                        possible_teams = []
                        max_combinations = 1000
                        combination_count = 0
                        
                        for b in backstrokers:
                            for br in breaststrokers:
                                if br.name == b.name:
                                    continue
                                for fly in butterflies:
                                    if fly.name in {b.name, br.name}:
                                        continue
                                    for free in freestylers:
                                        if free.name in {b.name, br.name, fly.name}:
                                            continue
                                        
                                        combination_count += 1
                                        if combination_count > max_combinations:
                                            break
                                        
                                        # Calculate total time and build team data
                                        total = (getattr(b, time_attrs[0]) + getattr(br, time_attrs[1]) + 
                                                getattr(fly, time_attrs[2]) + getattr(free, time_attrs[3]))
                                        
                                        team_data = [
                                            {'name': b.name, 'stroke': 'Backstroke', 'time': f'{getattr(b, time_attrs[0]):.2f}s'},
                                            {'name': br.name, 'stroke': 'Breaststroke', 'time': f'{getattr(br, time_attrs[1]):.2f}s'},
                                            {'name': fly.name, 'stroke': 'Butterfly', 'time': f'{getattr(fly, time_attrs[2]):.2f}s'},
                                            {'name': free.name, 'stroke': 'Freestyle', 'time': f'{getattr(free, time_attrs[3]):.2f}s'}
                                        ]
                                        
                                        possible_teams.append({
                                            'time': round(total, 2),
                                            'team': team_data
                                        })
                                    if combination_count > max_combinations:
                                        break
                                if combination_count > max_combinations:
                                    break
                            if combination_count > max_combinations:
                                break
                        
                        if possible_teams:
                            best_team = min(possible_teams, key=lambda x: x['time'])
                            total_time = best_team['time']
                            
                            # Format age display: 99 -> Open, others -> XU
                            age_display = "Open" if age == 99 else f"{age}U"
                            
                            medley_relay_teams.append({
                                'relay': f'{age_display} {normalized_gender} {event_name}',
                                'totalTime': f'{int(total_time // 60):02d}:{total_time % 60:05.2f}',
                                'swimmers': best_team['team']
                            })
                            print(f"  SUCCESS: Built pre-assigned medley relay with time {total_time:.2f}s", file=sys.stderr)
                        else:
                            print(f"  WARNING: No valid combinations found for pre-assigned medley relay", file=sys.stderr)
                    else:
                        print(f"  WARNING: Missing swimmers for pre-assigned strokes - falling back to optimal", file=sys.stderr)
                        has_pre_assignments = False
                
                # Original optimal logic (used when no pre-assignments or fallback)
                if not has_pre_assignments:
                    possible_teams = []
                    
                    # Select swimmers based on distance and sort by time (fastest first)
                    if distance == 50:
                        backstrokers = sorted([s for s in group if s.backstroke_50 is not None], key=lambda x: x.backstroke_50)
                        breaststrokers = sorted([s for s in group if s.breaststroke_50 is not None], key=lambda x: x.breaststroke_50)
                        butterflies = sorted([s for s in group if s.butterfly_50 is not None], key=lambda x: x.butterfly_50)
                        freestylers = sorted([s for s in group if s.freestyle_50 is not None], key=lambda x: x.freestyle_50)
                    elif distance == 100:
                        backstrokers = sorted([s for s in group if s.backstroke_100 is not None], key=lambda x: x.backstroke_100)
                        breaststrokers = sorted([s for s in group if s.breaststroke_100 is not None], key=lambda x: x.breaststroke_100)
                        butterflies = sorted([s for s in group if s.butterfly_100 is not None], key=lambda x: x.butterfly_100)
                        freestylers = sorted([s for s in group if s.freestyle_100 is not None], key=lambda x: x.freestyle_100)
                    elif distance == 200:
                        backstrokers = sorted([s for s in group if s.backstroke_200 is not None], key=lambda x: x.backstroke_200)
                        breaststrokers = sorted([s for s in group if s.breaststroke_200 is not None], key=lambda x: x.breaststroke_200)
                        butterflies = sorted([s for s in group if s.butterfly_200 is not None], key=lambda x: x.butterfly_200)
                        freestylers = sorted([s for s in group if s.freestyle_200 is not None], key=lambda x: x.freestyle_200)
                    else:
                        # Fallback to 50m
                        backstrokers = sorted([s for s in group if s.backstroke_50 is not None], key=lambda x: x.backstroke_50)
                        breaststrokers = sorted([s for s in group if s.breaststroke_50 is not None], key=lambda x: x.breaststroke_50)
                        butterflies = sorted([s for s in group if s.butterfly_50 is not None], key=lambda x: x.butterfly_50)
                        freestylers = sorted([s for s in group if s.freestyle_50 is not None], key=lambda x: x.freestyle_50)
    
                    # Limit combinations to prevent performance issues
                    max_combinations = 1000
                    combination_count = 0
                    
                    for b in backstrokers[:10]:  # Limit to top 10 swimmers per stroke
                        for br in breaststrokers[:10]:
                            if br.name == b.name:
                                continue
                            for fly in butterflies[:10]:
                                if fly.name in {b.name, br.name}:
                                    continue
                                for free in freestylers[:10]:
                                    if free.name in {b.name, br.name, fly.name}:
                                        continue
                                    
                                    combination_count += 1
                                    if combination_count > max_combinations:
                                        break
                                    
                                    # Get times based on distance
                                    if distance == 50:
                                        total = b.backstroke_50 + br.breaststroke_50 + fly.butterfly_50 + free.freestyle_50
                                        team_data = [
                                            {'name': b.name, 'stroke': 'Backstroke', 'time': f'{b.backstroke_50:.2f}s'},
                                            {'name': br.name, 'stroke': 'Breaststroke', 'time': f'{br.breaststroke_50:.2f}s'},
                                            {'name': fly.name, 'stroke': 'Butterfly', 'time': f'{fly.butterfly_50:.2f}s'},
                                            {'name': free.name, 'stroke': 'Freestyle', 'time': f'{free.freestyle_50:.2f}s'}
                                        ]
                                    elif distance == 100:
                                        total = b.backstroke_100 + br.breaststroke_100 + fly.butterfly_100 + free.freestyle_100
                                        team_data = [
                                            {'name': b.name, 'stroke': 'Backstroke', 'time': f'{b.backstroke_100:.2f}s'},
                                            {'name': br.name, 'stroke': 'Breaststroke', 'time': f'{br.breaststroke_100:.2f}s'},
                                            {'name': fly.name, 'stroke': 'Butterfly', 'time': f'{fly.butterfly_100:.2f}s'},
                                            {'name': free.name, 'stroke': 'Freestyle', 'time': f'{free.freestyle_100:.2f}s'}
                                        ]
                                    elif distance == 200:
                                        total = b.backstroke_200 + br.breaststroke_200 + fly.butterfly_200 + free.freestyle_200
                                        team_data = [
                                            {'name': b.name, 'stroke': 'Backstroke', 'time': f'{b.backstroke_200:.2f}s'},
                                            {'name': br.name, 'stroke': 'Breaststroke', 'time': f'{br.breaststroke_200:.2f}s'},
                                            {'name': fly.name, 'stroke': 'Butterfly', 'time': f'{fly.butterfly_200:.2f}s'},
                                            {'name': free.name, 'stroke': 'Freestyle', 'time': f'{free.freestyle_200:.2f}s'}
                                        ]
                                    else:
                                        # Fallback to 50m
                                        total = b.backstroke_50 + br.breaststroke_50 + fly.butterfly_50 + free.freestyle_50
                                        team_data = [
                                            {'name': b.name, 'stroke': 'Backstroke', 'time': f'{b.backstroke_50:.2f}s'},
                                            {'name': br.name, 'stroke': 'Breaststroke', 'time': f'{br.breaststroke_50:.2f}s'},
                                            {'name': fly.name, 'stroke': 'Butterfly', 'time': f'{fly.butterfly_50:.2f}s'},
                                            {'name': free.name, 'stroke': 'Freestyle', 'time': f'{free.freestyle_50:.2f}s'}
                                        ]
                                        
                                    possible_teams.append({
                                        'time': round(total, 2),
                                        'team': team_data
                                    })
                                if combination_count > max_combinations:
                                    break
                            if combination_count > max_combinations:
                                break
                        if combination_count > max_combinations:
                            break
    
                    if possible_teams:
                        best_team = min(possible_teams, key=lambda x: x['time'])
                        total_time = best_team['time']
                        
                        # Format age display: 99 -> Open, others -> XU
                        age_display = "Open" if age == 99 else f"{age}U"
                        
                        medley_relay_teams.append({
                            'relay': f'{age_display} {normalized_gender} {event_name}',
                            'totalTime': f'{int(total_time // 60):02d}:{total_time % 60:05.2f}',
                            'swimmers': best_team['team']
                        })

    # SPECIAL HANDLING FOR SQUADRUN RELAY (8x50m Mixed Age/Gender Freestyle)
    squadrun_relay_teams = []
    
    # Check if Squadrun event exists in the relay events list
    squadrun_events = [event for event in relay_events if 'squadrun' in event[0].lower()]
    
    if squadrun_events:
        print(f"PYTHON: Processing Squadrun relay event", file=sys.stderr)
        
        # Check for Squadrun pre-assignments
        squadrun_relay_key = ('Squadrun', 998, 'Mixed')
        has_pre_assignments = squadrun_relay_key in relay_protected_assignments and relay_protected_assignments[squadrun_relay_key]
        
        squadrun_team = []
        total_squadrun_time = 0
        
        if has_pre_assignments:
            print(f"SQUADRUN: Processing pre-assignments for {squadrun_relay_key}", file=sys.stderr)
            
            # Position mapping: 1=11U Female, 2=11U Male, 3=13U Female, 4=13U Male, 5=15U Female, 6=15U Male, 7=Open Female, 8=Open Male
            position_mapping = [
                ('11U', 'Female'), ('11U', 'Male'),    # positions 1, 2
                ('13U', 'Female'), ('13U', 'Male'),    # positions 3, 4  
                ('15U', 'Female'), ('15U', 'Male'),    # positions 5, 6
                ('Open', 'Female'), ('Open', 'Male')   # positions 7, 8
            ]
            
            # Initialize team slots (8 positions)
            team_slots = [None] * 8
            pre_assigned_swimmers_set = set()
            
            # Fill pre-assigned positions
            for pos, assignment in relay_protected_assignments[squadrun_relay_key].items():
                if 1 <= pos <= 8:
                    team_slots[pos - 1] = assignment['swimmer']  # Convert to 0-based index
                    pre_assigned_swimmers_set.add(assignment['swimmer'])
                    age_group, gender = position_mapping[pos - 1]
                    print(f"  Pre-assigned position {pos} ({age_group} {gender}): {assignment['swimmer']}", file=sys.stderr)
            
            # Fill remaining positions with fastest available swimmers
            for i, (age_group, gender) in enumerate(position_mapping):
                if team_slots[i] is None:  # Position not pre-assigned
                    # Determine age limit
                    if age_group == 'Open':
                        eligible_swimmers = list(relay_swimmers.values())
                    else:
                        age_limit = int(age_group.replace('U', ''))
                        eligible_swimmers = [s for s in relay_swimmers.values() if s.age <= age_limit]
                    
                    # Filter by gender, 50m freestyle time, and not already assigned
                    available_swimmers = [
                        s for s in eligible_swimmers 
                        if (s.gender == gender and 
                            s.freestyle_50 is not None and 
                            s.name not in pre_assigned_swimmers_set)
                    ]
                    
                    # Sort by 50m freestyle time and select fastest
                    if available_swimmers:
                        fastest = sorted(available_swimmers, key=lambda x: x.freestyle_50)[0]
                        team_slots[i] = fastest.name
                        pre_assigned_swimmers_set.add(fastest.name)
                        print(f"  Auto-selected position {i+1} ({age_group} {gender}): {fastest.name}", file=sys.stderr)
                    else:
                        print(f"  WARNING: No available swimmers for position {i+1} ({age_group} {gender})", file=sys.stderr)
            
            # Build final team if all positions filled
            if all(slot is not None for slot in team_slots):
                for i, swimmer_name in enumerate(team_slots):
                    # Find swimmer object to get time
                    swimmer_obj = relay_swimmers.get(swimmer_name)
                    if swimmer_obj and swimmer_obj.freestyle_50 is not None:
                        age_group, gender = position_mapping[i]
                        squadrun_team.append({
                            'name': swimmer_name,
                            'ageGroup': age_group,
                            'gender': gender,
                            'time': f'{swimmer_obj.freestyle_50:.2f}s'
                        })
                        total_squadrun_time += swimmer_obj.freestyle_50
                        print(f"SQUADRUN: Using {swimmer_name} ({age_group} {gender}) - {swimmer_obj.freestyle_50:.2f}s", file=sys.stderr)
                    else:
                        print(f"SQUADRUN: ERROR - Could not find time for {swimmer_name}", file=sys.stderr)
                        has_pre_assignments = False  # Fall back to automatic selection
                        break
                
                if has_pre_assignments:
                    print(f"SQUADRUN: SUCCESS - Built pre-assigned relay with time {total_squadrun_time:.2f}s", file=sys.stderr)
            else:
                print(f"SQUADRUN: WARNING - Could not fill all pre-assigned positions, falling back to automatic selection", file=sys.stderr)
                has_pre_assignments = False
        
        # Original automatic selection logic (used when no pre-assignments or fallback)
        if not has_pre_assignments:
            # Define age groups for Squadrun (11U, 13U, 15U, Open)
            squadrun_age_groups = [11, 13, 15, 99]  # 99 = Open
            squadrun_team = []
            total_squadrun_time = 0
            
            # For each age group, find fastest male and female 50m Freestyle swimmers
            for age_group in squadrun_age_groups:
                age_display = "Open" if age_group == 99 else f"{age_group}U"
                
                # Filter swimmers by age group
                if age_group == 99:
                    # Open category - no age limit
                    eligible_swimmers = list(relay_swimmers.values())
                else:
                    # Age-limited category
                    eligible_swimmers = [s for s in relay_swimmers.values() if s.age <= age_group]
                
                # Find fastest male and female with 50m Freestyle times
                males_with_times = [s for s in eligible_swimmers if s.gender == 'Male' and s.freestyle_50 is not None]
                females_with_times = [s for s in eligible_swimmers if s.gender == 'Female' and s.freestyle_50 is not None]
                
                # Sort by 50m Freestyle time (fastest first)
                males_with_times.sort(key=lambda x: x.freestyle_50)
                females_with_times.sort(key=lambda x: x.freestyle_50)
                
                # Select fastest male and female for this age group
                if males_with_times:
                    fastest_male = males_with_times[0]
                    squadrun_team.append({
                        'name': fastest_male.name,
                        'ageGroup': age_display,
                        'gender': 'Male',
                        'time': f'{fastest_male.freestyle_50:.2f}s'
                    })
                    total_squadrun_time += fastest_male.freestyle_50
                    print(f"SQUADRUN: Selected {fastest_male.name} ({age_display} Male) - {fastest_male.freestyle_50:.2f}s", file=sys.stderr)
                else:
                    print(f"SQUADRUN: WARNING - No male swimmers with 50m Freestyle time for {age_display}", file=sys.stderr)
                
                if females_with_times:
                    fastest_female = females_with_times[0]
                    squadrun_team.append({
                        'name': fastest_female.name,
                        'ageGroup': age_display,
                        'gender': 'Female',
                        'time': f'{fastest_female.freestyle_50:.2f}s'
                    })
                    total_squadrun_time += fastest_female.freestyle_50
                    print(f"SQUADRUN: Selected {fastest_female.name} ({age_display} Female) - {fastest_female.freestyle_50:.2f}s", file=sys.stderr)
                else:
                    print(f"SQUADRUN: WARNING - No female swimmers with 50m Freestyle time for {age_display}", file=sys.stderr)
        
        # If we have all 8 swimmers (2 per age group), create the Squadrun relay team
        if len(squadrun_team) == 8:
            squadrun_relay_teams.append({
                'relay': 'Mixed Squadrun',
                'totalTime': f'{int(total_squadrun_time // 60):02d}:{total_squadrun_time % 60:05.2f}',
                'swimmers': squadrun_team
            })
            print(f"SQUADRUN: SUCCESS - Created 8-person mixed relay team with total time {total_squadrun_time:.2f}s", file=sys.stderr)
        else:
            print(f"SQUADRUN: ERROR - Only found {len(squadrun_team)} swimmers, need 8 for complete team", file=sys.stderr)

    # Prepare results
    individual_results = []
    for event in event_list:
        if event[-1] != 'Not allocated':
            # Find the time for this swimmer in this event
            swimmer_time = None
            for entry in full_list:
                if (entry[0] == event[0] and entry[1] == event[1] and 
                    entry[2] == event[2] and entry[-1] == event[-1]):
                    swimmer_time = entry[5]
                    index = entry[-2] if len(entry) > 7 else None
                    break
            
            if swimmer_time:
                individual_results.append({
                    'event': f'{event[1]}U {event[2]} {event[0]}',
                    'swimmer': event[-1],
                    'time': f'{swimmer_time:.2f}s',
                    'index': index,
                    'status': 'QT' if index and index < 0 else 'CT'
                })

    # Output results as JSON
    results = {
        'individual': individual_results,
        'relay': freestyle_relay_teams + medley_relay_teams + squadrun_relay_teams
    }

    print(json.dumps(results))

if __name__ == "__main__":
    main()
