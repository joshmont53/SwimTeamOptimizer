#!/usr/bin/env python3
"""
Bulk import swimmers data from CSV directly to database using SQL
"""

import csv
import sys
import os
from datetime import datetime

def convert_date_format(date_str):
    """Convert date from DD/MM/YYYY to YYYY-MM-DD format"""
    try:
        date_obj = datetime.strptime(date_str.strip(), '%d/%m/%Y')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        print(f"Warning: Invalid date format: {date_str}")
        return date_str

def generate_sql_insert(csv_file):
    """Generate SQL INSERT statements for swimmers registry"""
    
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
                
                # Skip rows with missing essential data
                if not first_name or not last_name or not asa_no or not gender:
                    continue
                
                # Skip duplicates based on ASA number
                if asa_no in seen_asa_numbers:
                    continue
                seen_asa_numbers.add(asa_no)
                
                swimmer_data = {
                    "firstName": first_name.replace("'", "''"),  # Escape single quotes
                    "lastName": last_name.replace("'", "''"),
                    "dateOfBirth": convert_date_format(date_of_birth),
                    "gender": gender,
                    "asaNo": asa_no
                }
                
                swimmers_data.append(swimmer_data)
    
    # Generate SQL
    print("-- Clear existing data")
    print("DELETE FROM swimmers_registry;")
    print()
    
    print("-- Insert swimmers data")
    for swimmer in swimmers_data:
        sql = f"""INSERT INTO swimmers_registry (first_name, last_name, date_of_birth, gender, asa_no) 
VALUES ('{swimmer['firstName']}', '{swimmer['lastName']}', '{swimmer['dateOfBirth']}', '{swimmer['gender']}', '{swimmer['asaNo']}');"""
        print(sql)
    
    print(f"\n-- Total swimmers to insert: {len(swimmers_data)}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python bulk_import_swimmers.py <swimmers_csv_file>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    generate_sql_insert(csv_file)

if __name__ == "__main__":
    main()