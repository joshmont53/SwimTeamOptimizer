#!/usr/bin/env python3
"""
Simple swimmers data import - outputs JSON for manual API import
"""

import csv
import sys
from datetime import datetime
import json

def convert_date_format(date_str):
    """Convert date from DD/MM/YYYY to YYYY-MM-DD format"""
    try:
        date_obj = datetime.strptime(date_str.strip(), '%d/%m/%Y')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        print(f"Warning: Invalid date format: {date_str}")
        return date_str

def process_swimmers_csv(csv_file):
    """Process swimmers CSV and return data for API import"""
    swimmers_data = []
    
    with open(csv_file, 'r', newline='', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)  # Skip header
        
        for row in reader:
            if len(row) >= 5:
                first_name = row[0].strip()
                last_name = row[1].strip() 
                date_of_birth = row[2].strip()
                gender = row[3].strip()
                asa_no = row[4].strip()
                
                # Skip rows with missing essential data
                if not first_name or not last_name or not asa_no or not gender:
                    continue
                
                swimmer_data = {
                    "firstName": first_name,
                    "lastName": last_name,
                    "dateOfBirth": convert_date_format(date_of_birth),
                    "gender": gender,
                    "asaNo": asa_no
                }
                
                swimmers_data.append(swimmer_data)
    
    return swimmers_data

def main():
    if len(sys.argv) != 2:
        print("Usage: python import_swimmers_simple.py <swimmers_csv_file>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    swimmers_data = process_swimmers_csv(csv_file)
    
    print(f"Processed {len(swimmers_data)} swimmers")
    print("\nJSON for API import:")
    print(json.dumps({"swimmers": swimmers_data}, indent=2))

if __name__ == "__main__":
    main()