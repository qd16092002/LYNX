package com.android.background.services.helpers;

import android.content.Context;
import android.util.Log;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

public class WorkManagerHelper {
    
    private static final String WORK_NAME = "service_keep_alive_work";
    
    public static void startPeriodicWork(Context context) {
        Log.d("WorkManagerHelper", "Starting periodic work...");
        
        // Tạo constraints cho work
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
                .setRequiresBatteryNotLow(false)
                .setRequiresCharging(false)
                .setRequiresDeviceIdle(false)
                .setRequiresStorageNotLow(false)
                .build();

        // Tạo periodic work request - chạy mỗi 15 phút
        PeriodicWorkRequest periodicWork = new PeriodicWorkRequest.Builder(
                ServiceWorker.class,
                15, // repeat interval
                TimeUnit.MINUTES
        )
                .setConstraints(constraints)
                .build();

        // Enqueue work với policy KEEP để không tạo duplicate
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                periodicWork
        );
        
        Log.d("WorkManagerHelper", "Periodic work enqueued");
    }
    
    public static void stopPeriodicWork(Context context) {
        Log.d("WorkManagerHelper", "Stopping periodic work...");
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME);
    }
}
