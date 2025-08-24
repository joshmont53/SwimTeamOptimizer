# Changelog

All notable changes to the Swimming Team Optimizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-08-24

### 🔧 Critical Bug Fixes

#### Squadrun Relay Pre-Assignment Key Format Fix (Critical)
- **Problem**: Squadrun relay pre-assignments were being ignored despite successful processing and storage
- **Root Cause**: Key format mismatch - Squadrun algorithm used string key format `'Squadrun 998 Mixed'` while other relays used tuple format `('RelayName', age, 'Gender')`
- **Solution**: Fixed single-line key format mismatch by changing `squadrun_relay_key` from string to tuple format `('Squadrun', 998, 'Mixed')`
- **Technical**: Updated line 1042 in `server/optimizer.py` to match exact pattern used by working 4x50m Freestyle and Medley relay algorithms
- **Impact**: Squadrun relay pre-assignments now work identically to all other relay types with full position-specific assignment support
- **Verification**: End-to-end testing confirms swimmers can be pre-assigned to specific age group positions (11U Female/Male, 13U Female/Male, 15U Female/Male, Open Female/Male)
- **Zero Impact**: All existing relay logic remains completely unchanged, ensuring backward compatibility

## [2.0.0] - 2025-08-20

### 🎉 Major Features Added

#### Comprehensive Relay Pre-Assignment System
- **Position-Specific Assignments**: Users can now assign swimmers to exact relay positions (1-4)
- **Stroke-Specific Medley Assignments**: Assign swimmers to specific medley strokes (Backstroke, Breaststroke, Butterfly, Freestyle)
- **Dynamic Relay Support**: Automatically handles 4x, 6x, 8x relay configurations
- **Pre-Assignment Preservation**: Relay assignments persist through optimization and remain in database
- **Universal Template Support**: Works across Arena League, County Relays, and Custom templates

### 🔧 Critical Bug Fixes

#### Database Clearing Issue (High Priority)
- **Problem**: Backend was clearing ALL assignments (including pre-assignments) before optimization
- **Solution**: Implemented selective clearing methods `clearNonPreAssignedEventAssignments()` and `clearNonPreAssignedRelayAssignments()`
- **Impact**: Pre-assignments now persist correctly through optimization

#### Frontend Relay Key Parsing (Critical)
- **Problem**: Relay key parsing logic was extracting age/gender values incorrectly
- **Root Cause**: Backward parsing logic causing wrong age/gender database values
- **Solution**: Fixed relay key parsing to correctly extract components from format `"RelayName_Age_Gender_Position_Stroke"`
- **Impact**: Python script can now find matching relay keys in `relay_protected_assignments` dictionary

#### Gender Format Normalization (Universal Fix)
- **Problem**: Gender format inconsistency between database storage ('M'/'F') and Python optimization processing ('Male'/'Female')
- **Root Cause**: Relay key matching failures due to format mismatch
- **Solution**: Implemented consistent gender normalization in both `relay_protected_assignments` dictionary building and relay key comparison logic
- **Technical**: Added gender mapping (`'M': 'Male', 'F': 'Female'`) in Python script lines 496-503 and 635-641
- **Impact**: Universal fix working for ALL teams - verified with end-to-end testing

### 🚀 Performance Improvements

#### Medley Relay Optimization Enhancement
- **Problem**: Script selected first 10 swimmers by database order instead of fastest 10 by stroke time
- **Solution**: Added sorting by stroke time before selecting top 10 swimmers for each stroke
- **Impact**: Medley relays now use fastest swimmers per stroke, achieving 4+ second improvements
- **Example**: Open Male 4x100m Medley improved from 4:10.99 → 4:06.10

#### Dynamic Relay Swimmer Count Detection
- **Problem**: Script only recognized "6x" pattern, defaulting all others to 4 swimmers
- **Solution**: Implemented regex-based dynamic extraction from event names (4x, 6x, 8x, etc.)
- **Impact**: Custom templates can now correctly specify any relay swimmer count

### 🔍 County Times Index for 10U Swimmers
- **Problem**: County times start at age 11, leaving swimmers aged 10 and under without qualifying time baselines
- **Solution**: Added fallback logic to use age 11 county times for swimmers aged 10 and under
- **Impact**: 10U swimmers now get proper county time indexing for optimization calculations

### 📈 System Improvements
- **End-to-End Testing**: Comprehensive testing completed across all team templates
- **Regression Testing**: All existing functionality verified to work correctly
- **Database Schema**: Enhanced with proper relay assignment structure
- **Error Handling**: Improved validation and graceful fallback mechanisms

### 🛠️ Technical Enhancements
- **Backend API**: Added missing GET and DELETE endpoints for relay assignments
- **Frontend UX**: Enhanced error handling and user feedback systems
- **Python Algorithm**: Improved swimmer lookup with proper ASA number matching
- **Database Operations**: Implemented batch operations for high-performance CSV uploads

### 🎯 Production Readiness
- ✅ All team templates (Arena League, County Relays, Custom Templates) fully functional
- ✅ Comprehensive relay pre-assignment support verified
- ✅ Universal gender normalization fix applied
- ✅ Performance optimizations completed
- ✅ Documentation updated for GitHub repository
- ✅ Ready for deployment and public use

---

## [1.0.0] - 2025-07-31

### Initial Release
- Basic swimming team optimization functionality
- CSV import for swimmer personal bests and county times
- Individual event optimization algorithm
- Basic relay team generation
- 4-step workflow interface
- PostgreSQL database integration
- Replit deployment configuration

---

## Future Enhancements

### Planned Features
- [ ] CSV/XLSX import flexibility for direct Swim Manager integration
- [ ] Session template selection (Arena League, County Relays, Custom)
- [ ] Mobile app conversion
- [ ] Swim Rankings API integration
- [ ] LC to SC time conversion
- [ ] Age calculation options (current age vs. age at end of year)

### Technical Improvements
- [ ] WebSocket support for real-time optimization progress
- [ ] Enhanced export formats for meet management systems
- [ ] Advanced analytics and performance tracking
- [ ] Multi-language support