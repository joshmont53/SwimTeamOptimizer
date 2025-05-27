swimmer_list = []
county_times = []

import csv

with open('member_pbs.csv', newline='') as f:
    reader = csv.reader(f)
    #next(reader)  # Skip header
    for row in reader:
        if row[8] == 'SC':
            #print(row)
            swimmer_list.append([row[0], row[1], row[6],row[9],row[10], row[14]])

#for row in swimmer_list:
  # print(row)

import csv

with open('county_times_cleaned.csv', newline='') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header
    for row in reader:
        if row[3] == 'SC' and row[4] == 'QT':
            county_times.append([row[0],row[1],row[2],row[5]])

print('All County Times:\n\n')
for row in county_times:
   print(row)

def convert_to_seconds_with_milliseconds(time_str):
    if not time_str or time_str.strip() == '':
        return ''

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
        return ''

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


for row in county_times:
    row[1] = convert_to_seconds_with_milliseconds(row[1])

#for row in county_times:
#    print(row)

#list of all possible events

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

full_list = []

'''for row in swimmer_list[:]:
    if (row[0] == 'Iwan' and row[1] == 'Stone') or (row[0] == 'Sam' and row[1] == 'Law Chin Yung'):
        swimmer_list.remove(row)'''

for event in event_list:

    for swimmer in swimmer_list:
        if swimmer[3] != event[2]:
            continue
        if swimmer[2] != event[0]:
            continue
        if min(int(swimmer[4]), 16) > event[1]:
            continue
        else:
            full_list.append([event[0],event[1],event[2],swimmer[0],swimmer[1],swimmer[5]])

'''for row in full_list:
    print(row)'''

# Append qualifying time to each entry in full_list
for i in range(len(full_list)):
    for time in county_times:
        if (
            time[0] == full_list[i][0] and  # event name
            int(time[2]) == full_list[i][1] and  # age
            time[3] == full_list[i][2]  # gender
        ):
            full_list[i].append(time[1])  # append QT time
            break  # stop after finding the match


'''for row in full_list:
    print(row)'''

for row in full_list:
    if len(row) > 6:
        diff = round(float(row[5]) - row[6],2)
        index = round(diff / row[6],3)
        row.append(diff)
        row.append(index)
    else:
        row.append(None)


'''for row in full_list:
    print(row)'''

full_list.sort(key=lambda x: (x[-1] is None, x[-1]))

print('\n\n\nFull list starts now!!\n\n\n')

for row in full_list:
    print(row)

for event in event_list:
    event.append('Not allocated')

'''for row in event_list:
    print(row)'''

for row in full_list:
    full_name = ' '.join([row[3], row[4]])
    row.append(full_name)




for time in full_list:
    swimmer_name = time[-1]  # full name appended previously

    # Count how many events this swimmer is already allocated to
    allocated_count = sum(1 for event in event_list if event[-1] == swimmer_name)

    if allocated_count >= 2:
        # Swimmer already has 3 or more events allocated, skip allocation
        continue

    for event in event_list:
        if event[0] == time[0] and event[1] == time[1] and event[2] == time[2]:
            if event[-1] == 'Not allocated':
                event[-1] = swimmer_name
                break  # Allocated this event, move to next swimmer time


print('\n\n\n\n\n\nFinal list!\n\n\n')

for row in event_list:
    print(row)

from dataclasses import dataclass
import itertools

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

# Step 1: Build relay swimmer objects from swimmer_list
relay_swimmers = {}

for row in swimmer_list:
    name = f"{row[0]} {row[1]}"
    stroke = row[2]
    time_str = row[5]

    # Convert time string to float safely
    try:
        time = float(time_str)
    except (TypeError, ValueError):
        continue  # skip swimmers with invalid or None times

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

# Step 2: Define relay categories
relay_age_groups = [11, 13, 15, 16]
relay_genders = ['Male', 'Female']

medley_relay_teams = []
freestyle_relay_teams = []

# Step 3: Allocate relays
for age in relay_age_groups:
    for gender in relay_genders:
        # Filter swimmers by age and gender
        group = [s for s in relay_swimmers.values() if s.age <= age and s.gender == gender]

        # Freestyle relay — pick 4 fastest freestylers
        freestyle_swimmers = sorted([s for s in group if s.freestyle is not None], key=lambda x: x.freestyle)[:4]
        if len(freestyle_swimmers) == 4:
            total_time = round(sum(s.freestyle for s in freestyle_swimmers), 2)
            freestyle_relay_teams.append([f'{age}U {gender} 4x50 Freestyle Relay', total_time] + [s.name for s in freestyle_swimmers])

        # Medley relay — find all possible teams with one swimmer per stroke
        # We need to find teams of 4 swimmers where:
        # one has backstroke time,
        # one has breaststroke time,
        # one has butterfly time,
        # one has freestyle time,
        # and all 4 swimmers are distinct people.

        possible_teams = []

        # Filter swimmers by strokes they can swim
        backstrokers = [s for s in group if s.backstroke is not None]
        breaststrokers = [s for s in group if s.breaststroke is not None]
        butterflies = [s for s in group if s.butterfly is not None]
        freestylers = [s for s in group if s.freestyle is not None]

        # Generate all possible combinations of one swimmer per stroke
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
                        total = b.backstroke + br.breaststroke + fly.butterfly + free.freestyle
                        possible_teams.append({
                            'time': round(total, 2),
                            'team': [(b.name, 'Backstroke', b.backstroke),
                                     (br.name, 'Breaststroke', br.breaststroke),
                                     (fly.name, 'Butterfly', fly.butterfly),
                                     (free.name, 'Freestyle', free.freestyle)]
                        })

        # Pick best team if any
        if possible_teams:
            best_team = min(possible_teams, key=lambda x: x['time'])
            medley_relay_teams.append([f'{age}U {gender} 4x50 Medley Relay', best_team['time']] + best_team['team'])

# Step 4: Print final relay teams

print("\n\nFinal Freestyle Relays:\n")
for team in freestyle_relay_teams:
    relay_name = team[0]
    total_time = team[1]
    swimmers = team[2:]
    swimmer_times = [relay_swimmers[name].freestyle for name in swimmers]
    swimmer_info = [f"{name} ({time})" for name, time in zip(swimmers, swimmer_times)]
    print(f"{relay_name} - Total: {total_time} - Swimmers: {', '.join(swimmer_info)}")

print("\n\nFinal Medley Relays:\n")
for team in medley_relay_teams:
    relay_name = team[0]
    total_time = team[1]
    swimmer_info = [f"{name} ({stroke}: {time})" for name, stroke, time in team[2:]]
    print(f"{relay_name} - Total: {total_time} - Swimmers: {', '.join(swimmer_info)}")

# Next steps: User needs to be able to 1) Determine who is and isn't available for the meet. So need to be able to remove swimmers from the list.
# 2) User needs to be able to pre-populate certain swims. For example, decide who is going to do what event.