#!/usr/bin/env python3
"""
Import swimmers data into the database for gender lookup functionality
"""

import csv
import sys
from datetime import datetime
import requests
import json

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

def import_swimmers_data(csv_file, api_base_url="http://localhost:5000"):
    """Import swimmers data from CSV into database via API"""
    
    swimmers_data = []
    
    # Read CSV file
    with open(csv_file, 'r', newline='', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)  # Skip header
        
        for row in reader:
            if len(row) >= 5:  # Need at least 5 columns
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
    
    print(f"Processed {len(swimmers_data)} swimmers from CSV")
    
    # Import via API (we'll create this endpoint)
    try:
        response = requests.post(
            f"{api_base_url}/api/swimmers-registry/import",
            json={"swimmers": swimmers_data},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Successfully imported {result.get('imported', 0)} swimmers")
            print(f"Skipped {result.get('skipped', 0)} existing swimmers")
        else:
            print(f"Import failed: {response.status_code} - {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python import_swimmers_data.py <swimmers_csv_file>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    import_swimmers_data(csv_file)

if __name__ == "__main__":
    main()