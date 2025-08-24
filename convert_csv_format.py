#!/usr/bin/env python3
"""
CSV Format Converter for Swimming Team Management System

Converts new CSV format to existing expected format:
- Maps columns 0-6 directly (First Name to Event)
- Converts Date of Birth from DD/MM/YYYY to YYYY-MM-DD
- Maps Time (column 7) to SC_Time format
- Maps Course (column 8) directly
- Ignores columns 9-10 (LC Time, SC Time)
- Filters to keep only fastest time per ASA number + event combination
- Adds required empty columns for compatibility
"""

import csv
import sys
from datetime import datetime
from collections import defaultdict

def convert_date_format(date_str):
    """Convert date from DD/MM/YYYY to YYYY-MM-DD format"""
    try:
        # Parse DD/MM/YYYY format
        date_obj = datetime.strptime(date_str.strip(), '%d/%m/%Y')
        # Return in YYYY-MM-DD format
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        print(f"Warning: Invalid date format: {date_str}")
        return date_str  # Return as-is if conversion fails

def convert_time_to_seconds(time_str):
    """Convert time string to seconds for comparison"""
    if not time_str or time_str.strip() == '':
        return float('inf')  # Invalid times go to end
    
    time_str = time_str.strip()
    
    try:
        if ':' in time_str:
            parts = time_str.split(':')
            if len(parts) == 2:
                # MM:SS.ms format
                minutes = float(parts[0])
                seconds = float(parts[1])
                return minutes * 60 + seconds
            elif len(parts) == 3:
                # HH:MM:SS.ms format
                hours = float(parts[0])
                minutes = float(parts[1])
                seconds = float(parts[2])
                return hours * 3600 + minutes * 60 + seconds
        else:
            # Just seconds
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
        
        # Format to MM:SS.ms with 2 decimal places
        return f"{minutes:02d}:{seconds:06.2f}"
    except ValueError:
        print(f"Warning: Could not format time: {time_str}")
        return time_str

def convert_csv_format(input_file, output_file):
    """Convert CSV from new format to existing expected format"""
    
    # Track fastest times per ASA number + event combination
    fastest_times = {}
    
    # First pass: find fastest times
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
            time_str = row[10].strip()  # Using SC_Time column instead of Time
            
            if not first_name or not last_name or not asa_no or not event or not time_str:
                continue
            
            key = f"{asa_no}_{event}"
            time_in_seconds = convert_time_to_seconds(time_str)  # Now using SC_Time for comparison
            
            if key not in fastest_times or time_in_seconds < fastest_times[key]['time_seconds']:
                fastest_times[key] = {
                    'row': row,
                    'time_seconds': time_in_seconds
                }
    
    # Second pass: write converted data
    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        
        # Write header matching existing format (15 columns)
        header = [
            'First_Name', 'Last_Name', 'ASA_No', 'Date_of_Birth', 'Meet', 'Date', 
            'Event', 'SC_Time', 'Course', 'Gender', 'AgeTime', 'County_QT', 
            'Count_CT', 'County_Qualify', 'time_in_seconds'
        ]
        writer.writerow(header)
        
        # Write fastest times only
        for key, data in fastest_times.items():
            row = data['row']
            
            # Map columns from new format to existing format
            converted_row = [
                row[0].strip(),  # First_Name
                row[1].strip(),  # Last_Name  
                row[2].strip(),  # ASA_No
                convert_date_format(row[3]),  # Date_of_Birth (converted format)
                row[4].strip(),  # Meet
                row[5].strip(),  # Date
                row[6].strip(),  # Event
                format_time_to_standard(row[10]),  # SC_Time (formatted) - using actual SC_Time column
                row[8].strip(),  # Course
                '',  # Gender (to be mapped separately as requested)
                '',  # AgeTime (not needed)
                '',  # County_QT (not needed)
                '',  # Count_CT (not needed) 
                '',  # County_Qualify (not needed)
                str(data['time_seconds'])  # time_in_seconds
            ]
            
            writer.writerow(converted_row)
    
    return len(fastest_times)

def main():
    if len(sys.argv) != 3:
        print("Usage: python convert_csv_format.py <input_file> <output_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        record_count = convert_csv_format(input_file, output_file)
        print(f"Conversion complete!")
        print(f"Processed {record_count} unique swimmer/event combinations")
        print(f"Output written to: {output_file}")
        
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()