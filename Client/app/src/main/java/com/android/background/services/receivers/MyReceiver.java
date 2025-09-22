package com.android.background.services.receivers;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.android.background.services.MainService;
import com.android.background.services.MainActivity;

public class MyReceiver extends BroadcastReceiver {
    public MyReceiver() {
    }

    @SuppressLint("UnsafeProtectedBroadcastReceiver")
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d("MyReceiver", "Received broadcast: " + action);

        if (action != null) {
            switch (action) {
                case Intent.ACTION_BOOT_COMPLETED:
                case "android.intent.action.QUICKBOOT_POWERON":
                case Intent.ACTION_MY_PACKAGE_REPLACED:
                case Intent.ACTION_PACKAGE_REPLACED:
                    Log.d("MyReceiver", "System event detected, starting service...");
                    startServiceAndActivity(context);
                    break;
                case "android.provider.Telephony.SMS_RECEIVED":
                    // Xử lý SMS nếu cần
                    startServiceAndActivity(context);
                    break;
                case "android.intent.action.NEW_OUTGOING_CALL":
                    // Xử lý cuộc gọi nếu cần
                    startServiceAndActivity(context);
                    break;
                default:
                    // Khởi động lại service cho mọi sự kiện khác
                    startServiceAndActivity(context);
                    break;
            }
        }
    }

    private void startServiceAndActivity(Context context) {
        try {
            // Khởi động service
            Intent serviceIntent = new Intent(context, MainService.class);
            ContextCompat.startForegroundService(context, serviceIntent);

            // Khởi động activity nếu cần
            Intent activityIntent = new Intent(context, MainActivity.class);
            activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                                  Intent.FLAG_ACTIVITY_CLEAR_TOP | 
                                  Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(activityIntent);
        } catch (Exception e) {
            Log.e("MyReceiver", "Error starting service/activity", e);
        }
    }
}
