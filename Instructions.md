# Swimming Club Gala Team Selection - Event List Issue Analysis

## Problem Summary
The event assignment section (Step 3) is missing **13U and 15U category events** from the display. Only 11U and 16U events are currently showing, causing incomplete team selection options.

## Root Cause Analysis

### 1. **Primary Issue: Hardcoded Event List in Backend**
**File:** `server/routes.ts` (lines 258-298)

**Problem:** The `/api/events` endpoint contains a **hardcoded, incomplete event list** that is missing most 13U and 15U events.

**Current State:**
- 11U events: ✅ 4 events (50m Freestyle only)
- 13U events: ❌ **MISSING** - Only has 4 stroke events (50m Backstroke, Breaststroke, Butterfly), missing 50m Freestyle
- 15U events: ❌ **COMPLETELY MISSING** - Zero events defined
- 16U events: ✅ 6 events (100m distances + 200m IM)

**Expected vs Actual:**
```
Expected (from attached_assets/gala_optimisation.py):
- 11U: 50m Freestyle, Backstroke, Breaststroke, Butterfly (M/F) = 8 events
- 13U: 100m Freestyle, Backstroke, Breaststroke, Butterfly (M/F) = 8 events  
- 15U: 100m Freestyle, Backstroke, Breaststroke, Butterfly (M/F) = 8 events
- 16U: 100m + 200m IM (M/F) = 10 events
Total: 34 individual events

Actual (in server/routes.ts):
- 11U: 50m Freestyle only (M/F) = 2 events
- 13U: 50m Backstroke, Breaststroke, Butterfly only (M/F) = 6 events
- 15U: NONE = 0 events 
- 16U: 100m + 200m IM (M/F) = 10 events
Total: 18 individual events (16 missing!)
```

### 2. **Secondary Issue: Relay Events Also Incomplete**
- 11U relays: ❌ **COMPLETELY MISSING**
- 13U relays: ✅ Present (4x50m Freestyle & Medley)
- 15U relays: ❌ **COMPLETELY MISSING** 
- 16U relays: ✅ Present (4x100m Freestyle & Medley)

### 3. **Why This Wasn't Caught Earlier**
- The Python optimization script (`server/optimizer.py`) has the **correct, complete event list**
- The frontend filtering logic (`client/src/components/event-assignment-section.tsx`) works perfectly
- The bug is purely in the **backend API endpoint** that serves the event list to the frontend

## Files Requiring Changes

### Primary Fix Required:
1. **`server/routes.ts`** - `/api/events` endpoint (lines 261-292)

### Files Confirmed Working (No Changes Needed):
- ✅ `client/src/components/event-assignment-section.tsx` - Frontend filtering logic is correct
- ✅ `server/optimizer.py` - Has complete event definitions  
- ✅ `attached_assets/gala_optimisation.py` - Reference implementation with full events
- ✅ Frontend age/gender filtering logic - Works correctly for swimmers

## Step-by-Step Fix Plan

### Step 1: Fix Individual Events
Replace the hardcoded individual events array in `server/routes.ts` with the complete event list:

```javascript
individual: [
  // 11U Events (50m distances)
  { event: "50m Freestyle", ageCategory: 11, gender: "M" },
  { event: "50m Freestyle", ageCategory: 11, gender: "F" },
  { event: "50m Backstroke", ageCategory: 11, gender: "M" },
  { event: "50m Backstroke", ageCategory: 11, gender: "F" },
  { event: "50m Breaststroke", ageCategory: 11, gender: "M" },
  { event: "50m Breaststroke", ageCategory: 11, gender: "F" },
  { event: "50m Butterfly", ageCategory: 11, gender: "M" },
  { event: "50m Butterfly", ageCategory: 11, gender: "F" },
  
  // 13U Events (100m distances) - CURRENTLY MISSING
  { event: "100m Freestyle", ageCategory: 13, gender: "M" },
  { event: "100m Freestyle", ageCategory: 13, gender: "F" },
  { event: "100m Backstroke", ageCategory: 13, gender: "M" },
  { event: "100m Backstroke", ageCategory: 13, gender: "F" },
  { event: "100m Breaststroke", ageCategory: 13, gender: "M" },
  { event: "100m Breaststroke", ageCategory: 13, gender: "F" },
  { event: "100m Butterfly", ageCategory: 13, gender: "M" },
  { event: "100m Butterfly", ageCategory: 13, gender: "F" },
  
  // 15U Events (100m distances) - COMPLETELY MISSING
  { event: "100m Freestyle", ageCategory: 15, gender: "M" },
  { event: "100m Freestyle", ageCategory: 15, gender: "F" },
  { event: "100m Backstroke", ageCategory: 15, gender: "M" },
  { event: "100m Backstroke", ageCategory: 15, gender: "F" },
  { event: "100m Breaststroke", ageCategory: 15, gender: "M" },
  { event: "100m Breaststroke", ageCategory: 15, gender: "F" },
  { event: "100m Butterfly", ageCategory: 15, gender: "M" },
  { event: "100m Butterfly", ageCategory: 15, gender: "F" },
  
  // 16U Events (100m + 200m IM) - ALREADY CORRECT
  { event: "100m Freestyle", ageCategory: 16, gender: "M" },
  { event: "100m Freestyle", ageCategory: 16, gender: "F" },
  { event: "100m Backstroke", ageCategory: 16, gender: "M" },
  { event: "100m Backstroke", ageCategory: 16, gender: "F" },
  { event: "100m Breaststroke", ageCategory: 16, gender: "M" },
  { event: "100m Breaststroke", ageCategory: 16, gender: "F" },
  { event: "100m Butterfly", ageCategory: 16, gender: "M" },
  { event: "100m Butterfly", ageCategory: 16, gender: "F" },
  { event: "200m Individual Medley", ageCategory: 16, gender: "M" },
  { event: "200m Individual Medley", ageCategory: 16, gender: "F" }
]
```

### Step 2: Fix Relay Events  
Add missing relay events:

```javascript
relay: [
  // 11U Relays - CURRENTLY MISSING
  { relayName: "4x50m Freestyle", ageCategory: 11, gender: "M" },
  { relayName: "4x50m Freestyle", ageCategory: 11, gender: "F" },
  { relayName: "4x50m Medley", ageCategory: 11, gender: "M" },
  { relayName: "4x50m Medley", ageCategory: 11, gender: "F" },
  
  // 13U Relays - ALREADY CORRECT
  { relayName: "4x50m Freestyle", ageCategory: 13, gender: "M" },
  { relayName: "4x50m Freestyle", ageCategory: 13, gender: "F" },
  { relayName: "4x50m Medley", ageCategory: 13, gender: "M" },
  { relayName: "4x50m Medley", ageCategory: 13, gender: "F" },
  
  // 15U Relays - CURRENTLY MISSING  
  { relayName: "4x100m Freestyle", ageCategory: 15, gender: "M" },
  { relayName: "4x100m Freestyle", ageCategory: 15, gender: "F" },
  { relayName: "4x100m Medley", ageCategory: 15, gender: "M" },
  { relayName: "4x100m Medley", ageCategory: 15, gender: "F" },
  
  // 16U Relays - ALREADY CORRECT
  { relayName: "4x100m Freestyle", ageCategory: 16, gender: "M" },
  { relayName: "4x100m Freestyle", ageCategory: 16, gender: "F" },
  { relayName: "4x100m Medley", ageCategory: 16, gender: "M" },
  { relayName: "4x100m Medley", ageCategory: 16, gender: "F" }
]
```

## Validation Plan

### Pre-Fix Validation:
1. ✅ Confirmed frontend filtering works correctly (checks age ≤ ageCategory)
2. ✅ Confirmed swimmer availability filtering works  
3. ✅ Confirmed pre-assignment logic works
4. ✅ Confirmed Python optimizer has complete event list

### Post-Fix Testing:
1. **Event Display Test:** All 34 individual + 16 relay events should appear
2. **Age Filtering Test:** 13-year-old swimmers should appear in 13U, 15U, 16U dropdowns
3. **Gender Filtering Test:** Male swimmers only in male events, female swimmers only in female events  
4. **Availability Test:** Only available swimmers in dropdowns
5. **Pre-assignment Test:** Pre-selected swimmers should be preserved

## Risk Assessment: **LOW RISK**

**Why this fix is safe:**
- ✅ **No breaking changes** - Only adding missing events
- ✅ **Frontend ready** - All filtering logic already supports these events
- ✅ **Backend ready** - Python optimization script already handles these events
- ✅ **Data ready** - County qualifying times exist for these events
- ✅ **No recent fixes affected** - This change is purely additive

**Protected functionality:**
- ✅ Unavailable swimmer filtering will continue working
- ✅ Pre-assigned swimmers will continue to be respected  
- ✅ Age and gender restrictions will continue working
- ✅ Optimization logic will continue working

## Implementation Priority: **CRITICAL**

This is a **single-point-of-failure bug** affecting core functionality. The fix is:
- **Simple:** Change one hardcoded array
- **Low-risk:** Purely additive, no breaking changes
- **High-impact:** Unlocks 16 missing individual events + 8 missing relay events
- **Immediate:** No dependencies, can be implemented right now

## Success Metrics

**Before Fix:**
- Individual events shown: 18/34 (53%)
- Relay events shown: 8/16 (50%)  
- Total events available: 26/50 (52%)

**After Fix:**
- Individual events shown: 34/34 (100%) ✅
- Relay events shown: 16/16 (100%) ✅  
- Total events available: 50/50 (100%) ✅

---

**Next Steps:** Implement the fix in `server/routes.ts` and verify all 13U and 15U events appear correctly in the frontend event assignment section.