#!/usr/bin/env python3
"""
Upload all swimmers data via API
"""

import csv
import json
import sys
import urllib.request
import urllib.parse
from datetime import datetime

def convert_date_format(date_str):
    """Convert date from DD/MM/YYYY to YYYY-MM-DD format"""
    try:
        date_obj = datetime.strptime(date_str.strip(), '%d/%m/%Y')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        print(f"Warning: Invalid date format: {date_str}")
        return date_str

def upload_swimmers_via_api(csv_file, api_base_url="http://localhost:5000"):
    """Upload swimmers data via API import endpoint"""
    
    swimmers_data = []
    seen_asa_numbers = set()
    
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
                
                # Skip rows with missing essential data or empty ASA numbers
                if not first_name or not last_name or not asa_no or not gender or asa_no == '':
                    continue
                
                # Skip duplicates based on ASA number
                if asa_no in seen_asa_numbers:
                    continue
                seen_asa_numbers.add(asa_no)
                
                swimmer_data = {
                    "firstName": first_name,
                    "lastName": last_name,
                    "dateOfBirth": convert_date_format(date_of_birth),
                    "gender": gender,
                    "asaNo": asa_no
                }
                
                swimmers_data.append(swimmer_data)
    
    print(f"Uploading {len(swimmers_data)} unique swimmers...")
    
    # Upload in batches of 50 to avoid potential timeout issues
    batch_size = 50
    total_imported = 0
    
    for i in range(0, len(swimmers_data), batch_size):
        batch = swimmers_data[i:i+batch_size]
        
        try:
            data = json.dumps({"swimmers": batch}).encode('utf-8')
            req = urllib.request.Request(
                f"{api_base_url}/api/swimmers-registry/import",
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())
                batch_imported = result.get('imported', 0)
                total_imported += batch_imported
                print(f"Batch {i//batch_size + 1}: Imported {batch_imported}/{len(batch)} swimmers")
                
        except Exception as e:
            print(f"Error uploading batch {i//batch_size + 1}: {e}")
    
    print(f"\nTotal swimmers imported: {total_imported}/{len(swimmers_data)}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python upload_swimmers_api.py <swimmers_csv_file>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    upload_swimmers_via_api(csv_file)

if __name__ == "__main__":
    main()