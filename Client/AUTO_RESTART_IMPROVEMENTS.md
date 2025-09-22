# Cải tiến Auto-Restart cho Android App

## Tổng quan
Đã cải thiện app Android để tự động khởi động lại và kết nối lại ngay cả khi người dùng vuốt để tắt app (swipe to close), tương tự như các app như Jagat.

## Các cải tiến đã thực hiện

### 1. AndroidManifest.xml
- **Task Affinity và Launch Mode**: Thêm `launchMode="singleTask"`, `taskAffinity=""`, `excludeFromRecents="true"` để làm cho app khó bị tắt hơn
- **Permissions mới**: Thêm các quyền cần thiết:
  - `SCHEDULE_EXACT_ALARM` và `USE_EXACT_ALARM` cho Alarm Manager
  - `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` để bỏ qua tối ưu hóa pin
  - `DISABLE_KEYGUARD` và `SYSTEM_ALERT_WINDOW` cho các tính năng nâng cao
- **Broadcast Receiver cải tiến**: Thêm nhiều intent filter để lắng nghe các sự kiện:
  - `USER_PRESENT`, `SCREEN_ON`, `SCREEN_OFF`
  - `MY_PACKAGE_REPLACED`, `PACKAGE_REPLACED`

### 2. MainService.java
- **Cơ chế tự khởi động lại**: 
  - `onDestroy()`: Tự động khởi động lại service khi bị destroy
  - `onTaskRemoved()`: Khởi động lại khi task bị xóa
  - `setupAutoRestartAlarm()`: Sử dụng Alarm Manager để kiểm tra định kỳ
- **Notification cải tiến**: Thêm `PRIORITY_MAX` và `CATEGORY_SERVICE` để notification quan trọng hơn
- **WorkManager integration**: Tích hợp WorkManager để đảm bảo service chạy liên tục

### 3. MyReceiver.java
- **Xử lý nhiều sự kiện**: Lắng nghe và xử lý nhiều loại broadcast:
  - Boot completed, Quick boot
  - Package replaced
  - User present, Screen on/off
  - SMS received, Outgoing calls
- **Tự động khởi động**: Tự động khởi động cả service và activity khi cần

### 4. WorkManager Integration
- **ServiceWorker.java**: Worker class để kiểm tra và khởi động lại service
- **WorkManagerHelper.java**: Helper class để quản lý periodic work
- **Periodic Work**: Chạy mỗi 15 phút để đảm bảo service luôn hoạt động

### 5. MainActivity.java
- **Battery Optimization Exemption**: Tự động yêu cầu quyền bỏ qua tối ưu hóa pin
- **Cải thiện permission handling**: Xử lý quyền tốt hơn

## Cách hoạt động

1. **Khi app khởi động**: 
   - Yêu cầu quyền bỏ qua tối ưu hóa pin
   - Khởi động MainService với foreground notification
   - Thiết lập Alarm Manager và WorkManager

2. **Khi app bị tắt**:
   - `onDestroy()` tự động khởi động lại service
   - `onTaskRemoved()` khởi động lại khi task bị xóa
   - Alarm Manager kiểm tra mỗi 30 giây
   - WorkManager kiểm tra mỗi 15 phút

3. **Khi có sự kiện hệ thống**:
   - MyReceiver lắng nghe và tự động khởi động lại
   - Các sự kiện như boot, screen on/off, user present

## Lưu ý quan trọng

- **Battery Optimization**: Người dùng cần cho phép app bỏ qua tối ưu hóa pin
- **Auto-start Permission**: Trên một số thiết bị, cần cấp quyền auto-start
- **Background App Refresh**: Đảm bảo tính năng này được bật
- **Notification Permission**: App cần quyền hiển thị notification

## Testing

Để test tính năng:
1. Cài đặt app và cấp tất cả quyền
2. Vuốt để tắt app từ recent apps
3. Kiểm tra notification - app sẽ tự động khởi động lại
4. Kiểm tra log để xem các sự kiện restart

## Dependencies mới

- `androidx.work:work-runtime:2.9.0` - WorkManager cho background tasks
