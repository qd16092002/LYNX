# Numbering Consistency Fix

## Problem
The numbering between the location history panel and map markers was inconsistent. When a user clicked on a location in the history panel, the selected marker on the map would show a different number than what was displayed in the panel.

## Root Cause
In the `goToLocation` function in `LabCtrl.js`, the selected marker was using `(index + 1)` for numbering, while the `displayAllMarkers` function and the location history panel were using `(locationHistory.length - index)` to show 10 as the latest and 1 as the oldest.

## Solution
Modified the `goToLocation` function in `app/app/assets/js/controllers/LabCtrl.js` to use the same numbering logic:

```javascript
// Before (inconsistent)
html: '<div style="...">' + (index + 1) + '</div>'

// After (consistent)
var markerNumber = $LocCtrl.locationHistory.length - index; // Số từ 10 đến 1
html: '<div style="...">' + markerNumber + '</div>'
```

## Result
Now all numbering is consistent:
- **Location History Panel**: Shows 10 (latest) to 1 (oldest)
- **Map Markers**: Show 10 (latest) to 1 (oldest)  
- **Selected Marker**: Shows the same number as the history panel item

When a user clicks on "Vị trí #1" in the history panel (which displays number 10), the selected marker on the map will also show number 10, ensuring perfect alignment between the UI elements.

## Files Modified
- `app/app/assets/js/controllers/LabCtrl.js`: Updated `goToLocation` function numbering logic 