package com.android.background.services.helpers;

import android.util.Log;

/**
 * Test class để kiểm tra chức năng notifications
 * Có thể xóa file này sau khi test xong
 */
public class NotificationsTest {
    
    private static final String TAG = "NotificationsTest";
    
    /**
     * Test function để kiểm tra NotificationsManager
     */
    public static void testNotificationsManager() {
        try {
            Log.d(TAG, "Testing NotificationsManager...");
            
            // Test getNotifications
            if (NotificationsManager.getNotifications() != null) {
                Log.d(TAG, "✓ getNotifications() works");
            } else {
                Log.e(TAG, "✗ getNotifications() failed");
            }
            
            // Test clearAllNotifications
            boolean clearResult = NotificationsManager.clearAllNotifications();
            Log.d(TAG, "clearAllNotifications result: " + clearResult);
            
        } catch (Exception e) {
            Log.e(TAG, "Error testing NotificationsManager: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Test function để kiểm tra NotificationPermissionHelper
     */
    public static void testPermissionHelper() {
        try {
            Log.d(TAG, "Testing NotificationPermissionHelper...");
            
            // Test permission status
            String status = NotificationPermissionHelper.getPermissionStatus();
            Log.d(TAG, "Permission status: " + status);
            
            // Test isNotificationServiceEnabled
            boolean isEnabled = NotificationPermissionHelper.isNotificationServiceEnabled();
            Log.d(TAG, "Notification service enabled: " + isEnabled);
            
        } catch (Exception e) {
            Log.e(TAG, "Error testing NotificationPermissionHelper: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Run all tests
     */
    public static void runAllTests() {
        Log.d(TAG, "=== Starting Notifications Tests ===");
        testPermissionHelper();
        testNotificationsManager();
        Log.d(TAG, "=== Notifications Tests Completed ===");
    }
}
