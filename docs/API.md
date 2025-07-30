# API Documentation

## Base URL
`http://localhost:5000/api`

## Endpoints

### Swimmers

#### Get All Swimmers
```
GET /api/swimmers
```
Returns array of all swimmers with their availability status.

**Response:**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith", 
    "asaNo": "12345",
    "dateOfBirth": "2008-03-15",
    "gender": "Male",
    "age": 16,
    "isAvailable": true
  }
]
```

#### Update Swimmer Availability
```
PATCH /api/swimmers/:id
```

**Request Body:**
```json
{
  "isAvailable": false
}
```

#### Upload Swimmers CSV
```
POST /api/upload-swimmers
```

**Request:** Multipart form data with `file` field containing CSV
**Response:** Success message with count of imported swimmers

### Events

#### Get All Events
```
GET /api/events
```
Returns available events grouped by individual and relay categories.

**Response:**
```json
{
  "individual": [
    {
      "event": "50m Freestyle",
      "ageCategory": 15,
      "gender": "Male"
    }
  ],
  "relay": [
    {
      "relayName": "4x50m Freestyle Relay",
      "ageCategory": 15,
      "gender": "Male"
    }
  ]
}
```

### Event Assignments

#### Save Individual Event Pre-Assignment
```
POST /api/event-assignments
```

**Request Body:**
```json
{
  "event": "50m Freestyle",
  "ageCategory": 15,
  "gender": "Male",
  "swimmerId": "12345",
  "isPreAssigned": true
}
```

#### Save Relay Pre-Assignment
```
POST /api/relay-assignments
```

**Request Body:**
```json
{
  "relayName": "4x50m Freestyle Relay",
  "ageCategory": 15,
  "gender": "Male",
  "position": 1,
  "stroke": "Freestyle",
  "swimmerId": 1,
  "isPreAssigned": true
}
```

### County Times

#### Upload County Times CSV  
```
POST /api/upload-county-times
```

**Request:** Multipart form data with `file` field containing CSV
**Response:** Success message with count of imported standards

### Optimization

#### Run Team Optimization
```
POST /api/optimize
```

Executes the Python optimization algorithm and returns optimized team selections.

**Response:**
```json
{
  "individual": [
    {
      "event": "50m Freestyle 15 Male",
      "swimmer": "John Smith (12345)",
      "time": "28.50",
      "isQualifying": false
    }
  ],
  "relay": [
    {
      "event": "4x50m Freestyle Relay 15 Male",
      "swimmers": [
        "John Smith (12345)",
        "Mike Williams (12347)",
        "Alex Davis (12349)", 
        "James Miller (12351)"
      ],
      "totalTime": "1:58.30"
    }
  ],
  "stats": {
    "qualifyingTimes": 15,
    "averageIndex": 0.85,
    "relayTeams": 4,
    "totalEvents": 42
  }
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "message": "Error description",
  "error": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## File Upload Formats

### Member Personal Bests CSV
Required columns:
- `First_Name` - Swimmer's first name
- `Last_Name` - Swimmer's last name  
- `ASA_No` - Unique ASA registration number
- `Date_of_Birth` - Format: YYYY-MM-DD
- `Gender` - Male/Female
- `Event` - Event name (e.g., "50m Freestyle")
- `SC_Time` - Time in MM:SS.HH format
- `Course` - SC (Short Course) or LC (Long Course)
- `Meet` - Meet name where time was achieved
- `Date` - Date of the meet

### County Times CSV
Required columns:
- `Event` - Event name
- `Time` - Qualifying time in MM:SS.HH format
- `Age Category` - Age group (11-17)
- `Course` - SC or LC
- `Time Type` - CT (County Time) or QT (Qualifying Time)
- `Gender` - Male/Female

## Rate Limiting

The optimization endpoint has built-in protection against concurrent executions. Only one optimization can run at a time to prevent resource conflicts.