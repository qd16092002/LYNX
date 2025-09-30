package com.android.background.services.helpers;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class OfflineLocationManager {
    private static final String TAG = "OfflineLocationManager";
    private static final String PREF_NAME = "offline_locations";
    private static final String KEY_LOCATIONS = "offline_locations_list";
    private static final String KEY_LAST_SAVE_TIME = "last_save_time";
    
    private final Context context;
    private final SharedPreferences sharedPreferences;
    private final SharedPreferences.Editor editor;
    
    // Default interval: 15 minutes (900000 ms)
    private static final long DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
    
    public OfflineLocationManager(Context context) {
        this.context = context;
        this.sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        this.editor = sharedPreferences.edit();
    }
    
    /**
     * Save location data to offline storage
     */
    public void saveLocation(double latitude, double longitude, float accuracy, String address) {
        try {
            long currentTime = System.currentTimeMillis();
            long lastSaveTime = sharedPreferences.getLong(KEY_LAST_SAVE_TIME, 0);
            
            // Check if enough time has passed since last save
            if (currentTime - lastSaveTime < DEFAULT_INTERVAL_MS) {
                Log.d(TAG, "Not enough time passed since last save. Skipping...");
                return;
            }
            
            JSONObject locationData = new JSONObject();
            locationData.put("lat", latitude);
            locationData.put("lng", longitude);
            locationData.put("accuracy", accuracy);
            locationData.put("address", address != null ? address : "");
            locationData.put("timestamp", currentTime);
            
            // Get existing locations
            JSONArray locationsArray = getOfflineLocations();
            
            // Add new location
            locationsArray.put(locationData);
            
            // Save to preferences
            editor.putString(KEY_LOCATIONS, locationsArray.toString());
            editor.putLong(KEY_LAST_SAVE_TIME, currentTime);
            editor.apply();
            
            Log.d(TAG, "Location saved offline: " + latitude + ", " + longitude);
            
        } catch (JSONException e) {
            Log.e(TAG, "Error saving location offline", e);
        }
    }
    
    /**
     * Get all offline locations
     */
    public JSONArray getOfflineLocations() {
        try {
            String locationsJson = sharedPreferences.getString(KEY_LOCATIONS, "[]");
            return new JSONArray(locationsJson);
        } catch (JSONException e) {
            Log.e(TAG, "Error getting offline locations", e);
            return new JSONArray();
        }
    }
    
    /**
     * Get offline locations as List
     */
    public List<JSONObject> getOfflineLocationsList() {
        List<JSONObject> locations = new ArrayList<>();
        try {
            JSONArray locationsArray = getOfflineLocations();
            for (int i = 0; i < locationsArray.length(); i++) {
                locations.add(locationsArray.getJSONObject(i));
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error converting offline locations to list", e);
        }
        return locations;
    }
    
    /**
     * Clear all offline locations
     */
    public void clearOfflineLocations() {
        editor.putString(KEY_LOCATIONS, "[]");
        editor.putLong(KEY_LAST_SAVE_TIME, 0);
        editor.apply();
        Log.d(TAG, "All offline locations cleared");
    }
    
    /**
     * Get count of offline locations
     */
    public int getOfflineLocationCount() {
        return getOfflineLocations().length();
    }
    
    /**
     * Check if there are offline locations to sync
     */
    public boolean hasOfflineLocations() {
        return getOfflineLocationCount() > 0;
    }
    
    /**
     * Get offline locations as JSON for sending to server
     */
    public JSONObject getOfflineLocationsForSync() {
        try {
            JSONObject syncData = new JSONObject();
            syncData.put("locations", getOfflineLocations());
            syncData.put("count", getOfflineLocationCount());
            syncData.put("timestamp", System.currentTimeMillis());
            return syncData;
        } catch (JSONException e) {
            Log.e(TAG, "Error creating sync data", e);
            return new JSONObject();
        }
    }
    
    /**
     * Remove specific location by index
     */
    public void removeLocation(int index) {
        try {
            JSONArray locationsArray = getOfflineLocations();
            if (index >= 0 && index < locationsArray.length()) {
                JSONArray newArray = new JSONArray();
                for (int i = 0; i < locationsArray.length(); i++) {
                    if (i != index) {
                        newArray.put(locationsArray.get(i));
                    }
                }
                editor.putString(KEY_LOCATIONS, newArray.toString());
                editor.apply();
                Log.d(TAG, "Location at index " + index + " removed");
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error removing location", e);
        }
    }
    
    /**
     * Get the interval in milliseconds
     */
    public long getIntervalMs() {
        return DEFAULT_INTERVAL_MS;
    }
    
    /**
     * Check if enough time has passed since last save
     */
    public boolean shouldSaveLocation() {
        long currentTime = System.currentTimeMillis();
        long lastSaveTime = sharedPreferences.getLong(KEY_LAST_SAVE_TIME, 0);
        return (currentTime - lastSaveTime) >= DEFAULT_INTERVAL_MS;
    }
}
