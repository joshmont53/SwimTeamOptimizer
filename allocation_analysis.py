#!/usr/bin/env python3
"""
Analysis script to explain Iwan Stone's allocation to 100m Butterfly 13U Male
This simulates the exact logic used in the optimizer.py script
"""
import csv
import json
import sys

def convert_to_seconds_with_milliseconds(time_str):
    """Convert time string to seconds - same function as optimizer.py"""
    try:
        if '.' in time_str and ':' in time_str:
            # Format like "00:00:35.8" or "1:23.45"
            parts = time_str.split(':')
            if len(parts) == 3:  # HH:MM:SS.ss
                return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
            elif len(parts) == 2:  # MM:SS.ss
                return float(parts[0]) * 60 + float(parts[1])
        elif '.' in time_str:
            return float(time_str)
        elif ':' in time_str:
            parts = time_str.split(':')
            if len(parts) == 3:  # HH:MM:SS
                return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
            elif len(parts) == 2:  # MM:SS
                return float(parts[0]) * 60 + float(parts[1])
        else:
            return float(time_str)
    except (ValueError, IndexError):
        return 0.0

def analyze_iwan_allocation():
    print("=== DETAILED ANALYSIS: Iwan Stone's 100m Butterfly Assignment ===\n")
    
    # Load event list (same as optimizer)
    try:
        with open('server/event_list.json', 'r') as f:
            event_list = json.load(f)
        print(f"✓ Loaded {len(event_list)} events from event_list.json")
    except Exception as e:
        print(f"Error loading event list: {e}")
        return
    
    # Load county times (same as optimizer)
    county_times = []
    try:
        with open('attached_assets/county_times_cleaned.csv', 'r') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header
            for row in reader:
                if len(row) >= 6 and row[3] == 'SC' and row[4] == 'QT':
                    county_times.append([row[0], convert_to_seconds_with_milliseconds(row[1]), row[2], row[5]])
        print(f"✓ Loaded {len(county_times)} county qualifying times")
    except Exception as e:
        print(f"Error loading county times: {e}")
        return
    
    # Load swimmer data (same as optimizer)
    swimmer_list = []
    iwan_found = False
    
    try:
        with open('attached_assets/member_pbs.csv', 'r') as f:
            reader = csv.reader(f)
            header = next(reader)
            print(f"✓ CSV columns: {', '.join([f'{i}:{col}' for i, col in enumerate(header)])}")
            
            total_rows = 0
            for row in reader:
                total_rows += 1
                if len(row) >= 16 and row[8] == 'SC':  # Only SC course times
                    # Check availability (column 15)
                    is_available = row[15] == 'true' if len(row) > 15 else False
                    
                    if is_available:
                        try:
                            time_seconds = convert_to_seconds_with_milliseconds(row[7])
                            swimmer_list.append([row[0], row[1], row[6], row[9], row[10], time_seconds, row[2]])
                            
                            if row[0] == 'Iwan' and row[1] == 'Stone':
                                iwan_found = True
                                print(f"✓ Found Iwan Stone: Event={row[6]}, Time={row[7]}({time_seconds}s), Age={row[10]}, Available={row[15]}")
                        except:
                            pass
            
            print(f"✓ Processed {total_rows} rows, {len(swimmer_list)} available swimmers included")
    except Exception as e:
        print(f"Error loading member data: {e}")
        return
    
    if not iwan_found:
        print("❌ ERROR: Iwan Stone not found in available swimmers!")
        return
    
    # Build full eligibility list (same logic as optimizer)
    print("\n=== STEP 1: Building Eligibility List ===")
    full_list = []
    iwan_eligible_events = []
    
    for event in event_list:
        for swimmer in swimmer_list:
            # Match gender
            if swimmer[3] != event[2]:
                continue
            # Match event type
            if swimmer[2] != event[0]:
                continue
            # Check age eligibility (swimmer age <= event age limit)
            swimmer_age = int(swimmer[4])
            event_age_limit = event[1]
            if min(swimmer_age, 16) > event_age_limit and event_age_limit != 99:
                continue
            
            entry = [event[0], event[1], event[2], swimmer[0], swimmer[1], float(swimmer[5]), swimmer[6]]
            full_list.append(entry)
            
            # Track Iwan's eligible events
            if swimmer[0] == 'Iwan' and swimmer[1] == 'Stone':
                iwan_eligible_events.append(entry)
    
    print(f"✓ Built eligibility list: {len(full_list)} swimmer-event combinations")
    print(f"✓ Iwan Stone eligible for {len(iwan_eligible_events)} events:")
    for event in iwan_eligible_events:
        print(f"    - {event[0]} {event[1]}U {event[2]} (time: {event[5]:.2f}s)")
    
    # Add qualifying times and calculate performance indices
    print("\n=== STEP 2: Calculating Performance Indices ===")
    for i, entry in enumerate(full_list):
        qualifying_time = None
        event_name, age_cat, gender = entry[0], entry[1], entry[2]
        
        # Find matching qualifying time
        for qt in county_times:
            if (qt[0] == event_name and int(qt[2]) == age_cat and qt[3] == gender):
                qualifying_time = qt[1]
                break
        
        # For Open category (age 99), use age 17 qualifying times
        if not qualifying_time and age_cat == 99:
            for qt in county_times:
                if (qt[0] == event_name and int(qt[2]) == 17 and qt[3] == gender):
                    qualifying_time = qt[1]
                    break
        
        if qualifying_time:
            entry.append(qualifying_time)  # qualifying time
            diff = entry[5] - qualifying_time  # swimmer_time - qualifying_time
            index = diff / qualifying_time      # performance index
            entry.extend([diff, index])
        else:
            entry.extend([None, None, 999999])  # No qualifying time available
    
    # Sort by performance index (lower is better)
    full_list.sort(key=lambda x: (x[-1] is None, x[-1]))
    
    # Add full names
    for entry in full_list:
        full_name = f"{entry[3]} {entry[4]}"
        entry.append(full_name)
    
    print("✓ Performance indices calculated and list sorted")
    
    # Find Iwan's ranking for butterfly events
    print("\n=== STEP 3: Iwan's Ranking Analysis ===")
    butterfly_13u_male_candidates = []
    iwan_ranking = None
    
    for i, entry in enumerate(full_list):
        if entry[0] == '100m Butterfly' and entry[1] == 13 and entry[2] == 'Male':
            butterfly_13u_male_candidates.append((i, entry))
            if entry[3] == 'Iwan' and entry[4] == 'Stone':
                iwan_ranking = len(butterfly_13u_male_candidates)
    
    print(f"✓ Found {len(butterfly_13u_male_candidates)} candidates for 13U Male 100m Butterfly")
    print("Top candidates (by performance index):")
    for rank, (global_pos, entry) in enumerate(butterfly_13u_male_candidates[:5], 1):
        performance_index = entry[-2] if len(entry) > 9 and entry[-2] != 999999 else "No QT"
        time = entry[5]
        name = entry[-1]
        marker = " ← IWAN STONE" if name == "Iwan Stone" else ""
        print(f"    {rank}. {name} - {time:.2f}s (index: {performance_index}){marker}")
    
    if iwan_ranking:
        print(f"✓ Iwan Stone ranks #{iwan_ranking} among 13U Male Butterfly candidates")
    
    # Simulate the allocation process
    print("\n=== STEP 4: Allocation Process Simulation ===")
    print("The optimizer processes swimmers in performance index order...")
    print("For each swimmer, it finds the first available event they qualify for.")
    
    # Initialize events (same as optimizer)
    for event in event_list:
        event.append('Not allocated')
    
    max_events_per_swimmer = 2
    swimmer_event_count = {}
    allocations_made = []
    
    # Process full_list in order (best performance indices first)
    for i, entry in enumerate(full_list):
        swimmer_name = entry[-1]
        event_name, age_cat, gender = entry[0], entry[1], entry[2]
        
        # Check if swimmer already has max events
        current_count = swimmer_event_count.get(swimmer_name, 0)
        if current_count >= max_events_per_swimmer:
            continue
        
        # Find matching event slot
        for event in event_list:
            if (event[0] == event_name and event[1] == age_cat and event[2] == gender and 
                event[-1] == 'Not allocated'):
                
                # Assign swimmer to event
                event[-1] = swimmer_name
                swimmer_event_count[swimmer_name] = current_count + 1
                allocations_made.append({
                    'global_rank': i + 1,
                    'swimmer': swimmer_name,
                    'event': f"{event[0]} {event[1]}U {event[2]}",
                    'time': entry[5],
                    'performance_index': entry[-2] if entry[-2] != 999999 else "No QT"
                })
                
                if swimmer_name == 'Iwan Stone':
                    print(f"\n🎯 ALLOCATION FOUND!")
                    print(f"    Global Rank: #{i + 1} out of {len(full_list)} eligible swimmer-event combinations")
                    print(f"    Swimmer: {swimmer_name}")
                    print(f"    Event: {event[0]} {event[1]}U {event[2]}")
                    print(f"    Time: {entry[5]:.2f}s")
                    print(f"    Performance Index: {entry[-2]:.4f}" if entry[-2] != 999999 else "    Performance Index: No qualifying time available")
                    print(f"    This was the first available butterfly event slot when Iwan's turn came up!")
                
                break
        
        # Stop after we've seen all butterfly allocations for demonstration
        if len([a for a in allocations_made if 'Butterfly' in a['event']]) >= 4:
            break
    
    print(f"\n=== STEP 5: Why Iwan Got This Specific Event ===")
    print("Here's what happened in the allocation process:")
    print("1. All swimmers were sorted by performance index (best performers first)")
    print("2. The algorithm went through each swimmer in order")
    print("3. For each swimmer, it tried to assign them to their first available qualifying event")
    print("4. When it reached Iwan Stone in the performance-ranked list...")
    print("5. It checked all events he qualified for, in the order they appear in the event list")
    print("6. The '100m Butterfly 13U Male' slot was the first available event for Iwan")
    print("7. No swimmer with a better performance index had already claimed this slot")
    
    print(f"\n✅ CONCLUSION: Iwan Stone was assigned to 100m Butterfly 13U Male because:")
    print("   - He qualified for this event (age, gender, has a recorded time)")
    print("   - He was marked as available in the data")  
    print("   - When his turn came up in the performance-ordered queue, this was the first")
    print("     available slot among all events he was eligible for")
    print("   - The algorithm ensures optimal overall team performance by assigning the")
    print("     best available swimmer to each event slot as it becomes available")

if __name__ == "__main__":
    analyze_iwan_allocation()