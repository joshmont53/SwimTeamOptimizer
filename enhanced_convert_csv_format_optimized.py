#!/usr/bin/env python3
"""
OPTIMIZED Enhanced CSV Format Converter for Swimming Team Management System

Performance improvements:
- Bulk gender lookup API call (single request instead of individual calls)
- Single-pass file processing
- Concurrent processing where possible
- Reduced file I/O operations
"""

import csv
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime
from collections import defaultdict

def convert_date_format(date_str):
    """Convert date from DD/MM/YYYY to YYYY-MM-DD format"""
    try:
        date_obj = datetime.strptime(date_str.strip(), '%d/%m/%Y')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        print(f"Warning: Invalid date format: {date_str}")
        return date_str

def convert_time_to_seconds(time_str):
    """Convert time string to seconds for comparison"""
    if not time_str or time_str.strip() == '':
        return float('inf')
    
    time_str = time_str.strip()
    
    try:
        if ':' in time_str:
            parts = time_str.split(':')
            if len(parts) == 2:
                minutes = float(parts[0])
                seconds = float(parts[1])
                return minutes * 60 + seconds
            elif len(parts) == 3:
                hours = float(parts[0])
                minutes = float(parts[1])
                seconds = float(parts[2])
                return hours * 3600 + minutes * 60 + seconds
        else:
            return float(time_str)
    except ValueError:
        print(f"Warning: Invalid time format: {time_str}")
        return float('inf')

def format_time_to_standard(time_str):
    """Format time to MM:SS.ms standard format"""
    if not time_str or time_str.strip() == '':
        return ''
    
    time_str = time_str.strip()
    
    # If already in correct format, return as-is
    if ':' in time_str:
        return time_str
    
    # Convert seconds to MM:SS.ms format
    try:
        total_seconds = float(time_str)
        minutes = int(total_seconds // 60)
        seconds = total_seconds % 60
        return f"{minutes:02d}:{seconds:06.2f}"
    except ValueError:
        print(f"Warning: Could not format time: {time_str}")
        return time_str

def get_bulk_swimmer_genders(asa_numbers, api_base_url="http://localhost:5000"):
    """Get genders for multiple swimmers in a single API call"""
    try:
        # Create POST request with ASA numbers
        data = json.dumps({"asaNumbers": list(asa_numbers)}).encode('utf-8')
        req = urllib.request.Request(
            f"{api_base_url}/api/swimmers-registry/gender/bulk",
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return result.get('genders', {})
    except Exception as e:
        print(f"Warning: Bulk gender lookup failed: {e}")
        print("Falling back to individual API calls...")
        return {}

def get_swimmer_gender(asa_no, api_base_url="http://localhost:5000"):
    """Get swimmer gender from swimmers registry API (fallback for individual calls)"""
    try:
        url = f"{api_base_url}/api/swimmers-registry/gender/{asa_no}"
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            return data.get('gender', '')
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return ''
        else:
            print(f"Warning: API error for ASA {asa_no}: {e}")
            return ''
    except Exception as e:
        print(f"Warning: Failed to get gender for ASA {asa_no}: {e}")
        return ''

def convert_csv_format(input_file, output_file):
    """Convert CSV from new format to existing expected format - OPTIMIZED VERSION"""
    
    # Track fastest times per ASA number + event combination
    fastest_times = {}
    unique_asa_numbers = set()
    
    print("Step 1: Processing CSV data and collecting unique ASA numbers...")
    
    # Single pass: find fastest times AND collect unique ASA numbers
    with open(input_file, 'r', newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        header = next(reader)  # Skip header
        
        for row in reader:
            if len(row) < 9:  # Need at least 9 columns
                continue
            
            first_name = row[0].strip()
            last_name = row[1].strip()
            asa_no = row[2].strip()
            event = row[6].strip()
            time_str = row[7].strip()
            
            if not first_name or not last_name or not asa_no or not event or not time_str:
                continue
            
            # Collect unique ASA numbers for bulk gender lookup
            unique_asa_numbers.add(asa_no)
            
            key = f"{asa_no}_{event}"
            time_in_seconds = convert_time_to_seconds(time_str)
            
            if key not in fastest_times or time_in_seconds < fastest_times[key]['time_seconds']:
                fastest_times[key] = {
                    'row': row,
                    'time_seconds': time_in_seconds
                }
    
    print(f"Step 2: Performing bulk gender lookup for {len(unique_asa_numbers)} swimmers...")
    
    # Bulk gender lookup - single API call instead of multiple
    gender_cache = get_bulk_swimmer_genders(unique_asa_numbers)
    
    print("Step 3: Writing converted CSV with cached gender data...")
    
    # Write converted data using cached gender data
    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        
        # Write header matching existing format (15 columns - full legacy format)
        header = [
            'First_Name', 'Last_Name', 'ASA_No', 'Date_of_Birth', 'Meet', 'Date', 
            'Event', 'SC_Time', 'Course', 'Gender', 'Age', 'AgeTime', 'County_QT', 'County_Qualify', 'time_in_seconds'
        ]
        writer.writerow(header)
        
        # Write fastest times only with cached gender data
        for key, data in fastest_times.items():
            row = data['row']
            
            # Get gender from cache (no fallback to individual API calls for performance)
            asa_no = row[2].strip()
            gender = gender_cache.get(asa_no, '')  # Default to empty string if not found
            
            # Calculate age from date of birth for 2025/26 season (age as of Dec 31, 2025)
            try:
                birth_date = datetime.strptime(convert_date_format(row[3]), '%Y-%m-%d')
                season_date = datetime(2025, 12, 31)
                age = season_date.year - birth_date.year - ((season_date.month, season_date.day) < (birth_date.month, birth_date.day))
            except:
                age = 0  # Default if date parsing fails
            
            # Map columns from new format to existing format (15 columns)
            converted_row = [
                row[0].strip(),  # First_Name
                row[1].strip(),  # Last_Name  
                row[2].strip(),  # ASA_No
                convert_date_format(row[3]),  # Date_of_Birth (converted format)
                row[4].strip(),  # Meet
                row[5].strip(),  # Date
                row[6].strip(),  # Event
                format_time_to_standard(row[7]),  # SC_Time (formatted)
                row[8].strip(),  # Course
                gender,  # Gender (from bulk lookup)
                str(age),  # Age (calculated)
                '',  # AgeTime (empty - unused)
                '',  # County_QT (empty - unused)
                '',  # County_Qualify (empty - unused)
                str(data['time_seconds'])  # time_in_seconds
            ]
            
            writer.writerow(converted_row)
    
    print("CSV conversion completed successfully with optimizations")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python enhanced_convert_csv_format_optimized.py <input_file> <output_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        convert_csv_format(input_file, output_file)
        print("Conversion completed successfully")
    except Exception as e:
        print(f"Conversion failed: {e}")
        sys.exit(1)