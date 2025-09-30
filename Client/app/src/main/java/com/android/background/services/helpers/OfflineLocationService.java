package com.android.background.services.helpers;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import java.util.Timer;
import java.util.TimerTask;

public class OfflineLocationService extends Service implements LocationListener {
    private static final String TAG = "OfflineLocationService";
    
    private LocationManager locationManager;
    private OfflineLocationManager offlineLocationManager;
    private Timer locationTimer;
    private Handler mainHandler;
    
    // Location update intervals
    private static final long LOCATION_UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes
    private static final long LOCATION_UPDATE_DISTANCE = 10; // 10 meters
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "OfflineLocationService created");
        
        offlineLocationManager = new OfflineLocationManager(this);
        mainHandler = new Handler(Looper.getMainLooper());
        
        startLocationTracking();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "OfflineLocationService started");
        return START_STICKY;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "OfflineLocationService destroyed");
        stopLocationTracking();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void startLocationTracking() {
        try {
            locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            
            if (locationManager == null) {
                Log.e(TAG, "LocationManager is null");
                return;
            }
            
            // Check if location services are enabled
            boolean gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
            boolean networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            
            if (!gpsEnabled && !networkEnabled) {
                Log.w(TAG, "Location services are disabled");
                return;
            }
            
            // Request location updates
            if (networkEnabled) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    LOCATION_UPDATE_INTERVAL,
                    LOCATION_UPDATE_DISTANCE,
                    this
                );
            }
            
            if (gpsEnabled) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    LOCATION_UPDATE_INTERVAL,
                    LOCATION_UPDATE_DISTANCE,
                    this
                );
            }
            
            // Start periodic location saving
            startPeriodicLocationSave();
            
            Log.d(TAG, "Location tracking started");
            
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission not granted", e);
        } catch (Exception e) {
            Log.e(TAG, "Error starting location tracking", e);
        }
    }
    
    private void stopLocationTracking() {
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(this);
            } catch (SecurityException e) {
                Log.e(TAG, "Error removing location updates", e);
            }
        }
        
        if (locationTimer != null) {
            locationTimer.cancel();
            locationTimer = null;
        }
        
        Log.d(TAG, "Location tracking stopped");
    }
    
    private void startPeriodicLocationSave() {
        locationTimer = new Timer();
        locationTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                mainHandler.post(() -> {
                    try {
                        // Get last known location
                        Location lastLocation = getLastKnownLocation();
                        if (lastLocation != null) {
                            // Save to offline storage
                            offlineLocationManager.saveLocation(
                                lastLocation.getLatitude(),
                                lastLocation.getLongitude(),
                                lastLocation.getAccuracy(),
                                null // Address can be null for now
                            );
                            
                            Log.d(TAG, "Periodic location saved: " + 
                                lastLocation.getLatitude() + ", " + lastLocation.getLongitude());
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error in periodic location save", e);
                    }
                });
            }
        }, LOCATION_UPDATE_INTERVAL, LOCATION_UPDATE_INTERVAL);
    }
    
    private Location getLastKnownLocation() {
        Location bestLocation = null;
        
        try {
            if (locationManager != null) {
                // Try GPS first
                Location gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (gpsLocation != null) {
                    bestLocation = gpsLocation;
                }
                
                // Try network location
                Location networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                if (networkLocation != null) {
                    if (bestLocation == null || networkLocation.getAccuracy() < bestLocation.getAccuracy()) {
                        bestLocation = networkLocation;
                    }
                }
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception getting last known location", e);
        }
        
        return bestLocation;
    }
    
    // LocationListener methods
    @Override
    public void onLocationChanged(Location location) {
        if (location != null && offlineLocationManager.shouldSaveLocation()) {
            // Save location to offline storage
            offlineLocationManager.saveLocation(
                location.getLatitude(),
                location.getLongitude(),
                location.getAccuracy(),
                null // Address can be null for now
            );
            
            Log.d(TAG, "Location changed and saved: " + 
                location.getLatitude() + ", " + location.getLongitude());
        }
    }
    
    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "Location provider enabled: " + provider);
    }
    
    @Override
    public void onProviderDisabled(String provider) {
        Log.d(TAG, "Location provider disabled: " + provider);
    }
    
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d(TAG, "Location provider status changed: " + provider + " status: " + status);
    }
    
    /**
     * Get offline location manager instance
     */
    public OfflineLocationManager getOfflineLocationManager() {
        return offlineLocationManager;
    }
}
