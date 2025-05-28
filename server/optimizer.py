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
    freestyle: float = None
    backstroke: float = None
    breaststroke: float = None
    butterfly: float = None

    def __hash__(self):
        return hash(self.name)

def main():
    # Use fixed file names like the original script
    member_pbs_file = 'member_pbs.csv'
    county_times_file = 'county_times_cleaned.csv'
    pre_assignments_file = 'pre_assignments.json'

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
        print(f"PYTHON DEBUG: CSV Header: {header}", file=sys.stderr)
        
        for row in reader:
            total_rows_processed += 1
            print(f"PYTHON DEBUG: Row {total_rows_processed}: Length={len(row)}, Course={row[8] if len(row) > 8 else 'N/A'}", file=sys.stderr)
            
            if len(row) >= 16 and row[8] == 'SC':
                # CSV: First_Name,Last_Name,ASA_No,Date_of_Birth,Meet,Date,Event,SC_Time,Course,Gender,AgeTime,County_QT,Count_CT,County_Qualify,time_in_seconds,isAvailable
                #      0         1          2      3             4     5    6      7        8       9       10      11        12       13             14             15
                
                # Debug the availability value
                availability_value = row[15] if len(row) > 15 else "MISSING"
                print(f"PYTHON DEBUG: Swimmer {row[0]} {row[1]} - availability: '{availability_value}'", file=sys.stderr)
                
                is_available = availability_value.lower() == 'true'
                if is_available:
                    swimmer_list.append([row[0], row[1], row[6], row[9], row[10], row[14], row[2]])  # Added ASA number at end
                    print(f"PYTHON: ✓ Including available swimmer {row[0]} {row[1]}", file=sys.stderr)
                else:
                    print(f"PYTHON: ✗ EXCLUDING unavailable swimmer {row[0]} {row[1]}", file=sys.stderr)
            else:
                print(f"PYTHON DEBUG: Skipping row - Length: {len(row)}, Course: {row[8] if len(row) > 8 else 'N/A'}", file=sys.stderr)
    
    print(f"PYTHON: Processed {total_rows_processed} total rows from CSV", file=sys.stderr)
    
    print(f"PYTHON: Final swimmer count after availability filtering: {len(swimmer_list)} swimmers", file=sys.stderr)
    
    # Write detailed debug output to file
    with open('debug_output.txt', 'w') as debug_file:
        debug_file.write("=== SWIMMER AVAILABILITY DEBUG OUTPUT ===\n\n")
        debug_file.write(f"Total swimmers processed from CSV: {total_rows_processed}\n")
        debug_file.write(f"Swimmers included in optimization: {len(swimmer_list)}\n\n")
        
        debug_file.write("SWIMMERS INCLUDED IN OPTIMIZATION:\n")
        for i, swimmer in enumerate(swimmer_list):
            debug_file.write(f"  {i+1}. {swimmer[0]} {swimmer[1]} (ASA: {swimmer[6]})\n")
        
        if len(swimmer_list) == 0:
            debug_file.write("  >>> NO SWIMMERS INCLUDED - THIS IS THE BUG! <<<\n")
        
        debug_file.write(f"\nEvent list contains {len(event_list)} events\n\n")

    # Load county times
    county_times = []
    with open(county_times_file, newline='') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        for row in reader:
            if len(row) >= 6 and row[3] == 'SC' and row[4] == 'QT':
                county_times.append([row[0], convert_to_seconds_with_milliseconds(row[1]), row[2], row[5]])

    # Event list from original script
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

    # Build full list with qualifying times
    full_list = []
    for event in event_list:
        for swimmer in swimmer_list:
            if swimmer[3] != event[2]:
                continue
            if swimmer[2] != event[0]:
                continue
            if min(int(swimmer[4]), 16) > event[1]:
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
            row.append(None)

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
            if original_gender in ['M', 'Male']:
                gender_match = "Male"
            elif original_gender in ['F', 'Female']:
                gender_match = "Female"
            else:
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

        if total_count >= 2:
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

        age = int(min(int(row[4]), 16))
        gender = row[3]

        if name not in relay_swimmers:
            relay_swimmers[name] = RelaySwimmer(name=name, age=age, gender=gender)

        if stroke == "50m Freestyle":
            relay_swimmers[name].freestyle = time
        elif stroke == "50m Backstroke":
            relay_swimmers[name].backstroke = time
        elif stroke == "50m Breaststroke":
            relay_swimmers[name].breaststroke = time
        elif stroke == "50m Butterfly":
            relay_swimmers[name].butterfly = time

    # Generate relay teams
    relay_age_groups = [11, 13, 15, 16]
    relay_genders = ['Male', 'Female']
    freestyle_relay_teams = []
    medley_relay_teams = []

    for age in relay_age_groups:
        for gender in relay_genders:
            group = [s for s in relay_swimmers.values() if s.age <= age and s.gender == gender]

            # Freestyle relay
            freestyle_swimmers = sorted([s for s in group if s.freestyle is not None], key=lambda x: x.freestyle)[:4]
            if len(freestyle_swimmers) == 4:
                total_time = round(sum(s.freestyle for s in freestyle_swimmers), 2)
                freestyle_relay_teams.append({
                    'relay': f'{age}U {gender} 4x50m Freestyle Relay',
                    'totalTime': f'{int(total_time // 60):02d}:{total_time % 60:05.2f}',
                    'swimmers': [{'name': s.name, 'time': f'{s.freestyle:.2f}s'} for s in freestyle_swimmers]
                })

            # Medley relay
            possible_teams = []
            backstrokers = [s for s in group if s.backstroke is not None]
            breaststrokers = [s for s in group if s.breaststroke is not None]
            butterflies = [s for s in group if s.butterfly is not None]
            freestylers = [s for s in group if s.freestyle is not None]

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
                                
                            total = b.backstroke + br.breaststroke + fly.butterfly + free.freestyle
                            possible_teams.append({
                                'time': round(total, 2),
                                'team': [
                                    {'name': b.name, 'stroke': 'Backstroke', 'time': f'{b.backstroke:.2f}s'},
                                    {'name': br.name, 'stroke': 'Breaststroke', 'time': f'{br.breaststroke:.2f}s'},
                                    {'name': fly.name, 'stroke': 'Butterfly', 'time': f'{fly.butterfly:.2f}s'},
                                    {'name': free.name, 'stroke': 'Freestyle', 'time': f'{free.freestyle:.2f}s'}
                                ]
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
                medley_relay_teams.append({
                    'relay': f'{age}U {gender} 4x50m Medley Relay',
                    'totalTime': f'{int(total_time // 60):02d}:{total_time % 60:05.2f}',
                    'swimmers': best_team['team']
                })

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
        'relay': freestyle_relay_teams + medley_relay_teams
    }

    print(json.dumps(results))

if __name__ == "__main__":
    main()
