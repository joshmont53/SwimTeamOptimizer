# Quick Setup Guide

## Prerequisites

- Node.js 18 or higher
- Python 3.8 or higher  
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/swimming-team-optimizer.git
   cd swimming-team-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## Sample Data

The `sample-data/` directory contains example CSV files to help you get started:

- `member_pbs_sample.csv` - Example swimmer personal best times
- `county_times_sample.csv` - Example county qualifying standards

## Usage

1. **Upload Data**: Use the sample CSV files or create your own following the same format
2. **Select Squad**: Mark swimmers as available/unavailable for the competition
3. **Assign Events**: Make any required pre-assignments, then run optimization
4. **View Results**: Review optimized team selections and export if needed

## CSV Format Requirements

### Member Personal Bests (member_pbs.csv)
Required columns:
- First Name
- Last Name  
- ASA Number (unique identifier)
- Date of Birth
- Gender (M/F)
- Age
- Event name
- Course (LC/SC)
- Time (MM:SS.HH format)
- Meet name
- Date

### County Times (county_times.csv)
Required columns:
- Event
- Time  
- Age Category
- Course (LC/SC)
- Time Type (County/Regional/National)
- Gender (M/F)

## Common Issues

**Port 5000 in use**: Kill other processes using port 5000 or modify the port in `server/index.ts`

**Python not found**: Ensure Python 3 is installed and accessible as `python3`

**CSV upload fails**: Check that your CSV matches the exact column names in the sample files

## Support

If you encounter issues, please check the existing GitHub issues or create a new one with:
- Steps to reproduce the problem
- Sample data that causes the issue
- Error messages or screenshots