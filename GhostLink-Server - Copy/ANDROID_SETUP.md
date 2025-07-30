# Hướng dẫn thiết lập FCM Token cho thiết bị Android

## 1. Thiết lập Firebase trong ứng dụng Android

### Bước 1: Thêm dependencies vào build.gradle
```gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
    implementation 'com.google.firebase:firebase-analytics:21.0.0'
}
```

### Bước 2: Tạo FirebaseMessagingService
```java
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Lưu token mới
        saveTokenToSharedPrefs(token);
        // Gửi token lên server
        sendTokenToServer(token);
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        // Xử lý push notification
        String action = remoteMessage.getData().get("action");
        if ("restart".equals(action)) {
            // Thực hiện restart
            restartDevice();
        }
    }
}
```

### Bước 3: Lấy FCM Token
```java
FirebaseMessaging.getInstance().getToken()
    .addOnCompleteListener(new OnCompleteListener<String>() {
        @Override
        public void onComplete(@NonNull Task<String> task) {
            if (!task.isSuccessful()) {
                Log.w("FCM", "Fetching FCM registration token failed", task.getException());
                return;
            }

            String token = task.getResult();
            Log.d("FCM", "Token: " + token);
            
            // Gửi token lên server
            sendTokenToServer(token);
        }
    });
```

## 2. Gửi FCM Token lên LYNX Server

### Khi kết nối Socket.IO:
```javascript
// Kết nối với server
const socket = io('http://your-server:port', {
  query: {
    id: deviceId,
    manf: manufacturer,
    model: model,
    release: androidVersion,
    fcmToken: fcmToken // Thêm FCM token vào query
  }
});

// Hoặc gửi token sau khi kết nối
socket.on('connect', () => {
  // Gửi FCM token nếu có
  if (fcmToken) {
    socket.emit('sendFCMToken', {
      fcmToken: fcmToken,
      deviceId: deviceId,
      timestamp: new Date().toISOString()
    });
  }
});

// Lắng nghe yêu cầu gửi FCM token
socket.on('requestFCMToken', (data) => {
  console.log('Server requesting FCM token:', data);
  
  // Lấy FCM token mới
  FirebaseMessaging.getInstance().getToken()
    .addOnCompleteListener(task -> {
      if (task.isSuccessful() && task.getResult() != null) {
        String token = task.getResult();
        
        // Gửi token lên server
        socket.emit('sendFCMToken', {
          fcmToken: token,
          deviceId: data.deviceId,
          timestamp: new Date().toISOString()
        });
      }
    });
});
```

## 3. Xử lý Push Notification

### Khi nhận được notification:
```java
@Override
public void onMessageReceived(RemoteMessage remoteMessage) {
    super.onMessageReceived(remoteMessage);
    
    // Lấy data từ notification
    Map<String, String> data = remoteMessage.getData();
    String action = data.get("action");
    String deviceId = data.get("deviceId");
    
    // Hiển thị notification
    showNotification(remoteMessage.getNotification().getTitle(), 
                    remoteMessage.getNotification().getBody());
    
    // Xử lý action
    if ("restart".equals(action)) {
        // Thực hiện restart device
        restartDevice();
    }
}

private void restartDevice() {
    // Code để restart device
    Intent intent = new Intent("android.intent.action.ACTION_REQUEST_SHUTDOWN");
    intent.putExtra("android.intent.extra.KEY_CONFIRM", true);
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    startActivity(intent);
}
```

## 4. Cấu hình AndroidManifest.xml

```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>

<permission android:name="android.permission.INTERNET" />
<permission android:name="android.permission.WAKE_LOCK" />
<permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

## 5. Kiểm tra

1. Chạy ứng dụng Android
2. Kết nối với LYNX Server
3. Kiểm tra log để xem FCM token được gửi
4. Trong LYNX Server, kiểm tra cột FCM Token có hiển thị "✓ Connected"
5. Thử gửi restart notification

## Lưu ý

- FCM token có thể thay đổi, nên cập nhật thường xuyên
- Cần có kết nối internet để nhận push notification
- Đảm bảo ứng dụng có quyền nhận notification 