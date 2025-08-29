# Notifications Screen Improvements

## Tổng quan
Màn hình notifications đã được cải tiến để hiển thị 2 bên riêng biệt với chức năng tự động lưu trữ và refresh nhanh hơn.

## Các tính năng mới

### 1. Giao diện 2 bên
- **Bên trái (Live Notifications)**: Hiển thị các thông báo trực tiếp từ thiết bị
- **Bên phải (All Stored Notifications)**: Hiển thị tất cả thông báo đã được lưu trữ, kể cả những thông báo đã bị xóa

### 2. Auto Refresh 0.5s
- Tự động lấy dữ liệu mỗi 0.5 giây thay vì 3 giây như trước
- Giúp theo dõi notifications real-time tốt hơn

### 3. Lưu trữ tự động
- Tất cả notifications được tự động lưu vào danh sách "All Stored Notifications"
- Không mất dữ liệu khi notifications bị xóa khỏi thiết bị
- Hỗ trợ lưu trữ notifications đã bị xóa

### 4. Chức năng riêng biệt cho mỗi bên

#### Bên trái (Live Notifications):
- **Refresh**: Lấy notifications hiện tại từ thiết bị
- **Clear**: Xóa tất cả notifications trên thiết bị
- **Save**: Lưu danh sách notifications hiện tại ra file CSV
- **Search**: Tìm kiếm trong notifications hiện tại

#### Bên phải (All Stored Notifications):
- **Clear All**: Xóa tất cả notifications đã lưu trữ (chỉ xóa local, không ảnh hưởng thiết bị)
- **Save**: Lưu tất cả notifications đã lưu trữ ra file CSV
- **Search**: Tìm kiếm trong tất cả notifications đã lưu trữ

### 5. Cải tiến giao diện
- Thiết kế responsive với 2 cột
- Màu sắc phân biệt rõ ràng giữa 2 bên
- Icons và labels trực quan
- Kích thước nhỏ gọn hơn để hiển thị nhiều thông tin hơn

## Cấu trúc dữ liệu

### Live Notifications
```javascript
$NotificationsCtrl.liveNotificationsList = []; // Danh sách notifications hiện tại
$NotificationsCtrl.liveNotificationsSize = 0;  // Số lượng
$NotificationsCtrl.liveBarLimit = 50;          // Giới hạn hiển thị
$NotificationsCtrl.liveSearchQuery = '';       // Từ khóa tìm kiếm
```

### All Stored Notifications
```javascript
$NotificationsCtrl.allNotificationsList = []; // Danh sách tất cả notifications đã lưu trữ
$NotificationsCtrl.allNotificationsSize = 0;  // Số lượng
$NotificationsCtrl.allBarLimit = 50;          // Giới hạn hiển thị
$NotificationsCtrl.allSearchQuery = '';       // Từ khóa tìm kiếm
```

## Các hàm chính

### Live Notifications Functions:
- `refreshLiveNotifications()`: Lấy notifications mới từ thiết bị
- `clearLiveNotifications()`: Xóa tất cả notifications trên thiết bị
- `clearSingleLiveNotification(key)`: Xóa notification cụ thể
- `saveLiveNotifications()`: Lưu notifications hiện tại ra CSV
- `liveSearchFilter()`: Lọc notifications theo từ khóa

### All Stored Notifications Functions:
- `clearAllStoredNotifications()`: Xóa tất cả notifications đã lưu trữ
- `saveAllNotifications()`: Lưu tất cả notifications đã lưu trữ ra CSV
- `allSearchFilter()`: Lọc notifications đã lưu trữ theo từ khóa

## Auto Refresh Logic
```javascript
// Auto refresh mỗi 0.5s
autoRefreshInterval = setInterval(() => {
    if ($NotificationsCtrl.$$destroyed) return;
    $NotificationsCtrl.load = 'loading';
    pendingQuiet++; // đánh dấu emit im lặng
    socket.emit(ORDER, { order: notifications });
}, 500);
```

## Lưu trữ tự động
Khi nhận được notifications mới:
1. Cập nhật live notifications (bên trái)
2. **Kiểm tra nội dung trước khi thêm vào danh sách lưu trữ** (tránh trùng lặp nội dung)
3. Mỗi notification được thêm với:
   - `storedTimestamp`: Thời gian lưu trữ
   - `uniqueId`: ID duy nhất để phân biệt các notifications
4. Chỉ lưu trữ notifications có nội dung khác với những cái đã có trong danh sách
5. So sánh dựa trên: `appName`, `title`, `bigText`, `subText`, `tickerText`

## File CSV Output
- **Live Notifications**: `LiveNotifications_DD-MM-YYYY_HH-MM.csv`
- **All Stored Notifications**: `AllStoredNotifications_DD-MM-YYYY_HH-MM.csv`

Cả hai file đều bao gồm:
- App Name, Package Name, Title, Text
- Info Text, Ticker Text, Summary Text
- Post Time, Is Ongoing, Is Clearable
- Notification Key (chỉ có trong All Stored)
- Stored Timestamp, Unique ID (chỉ có trong All Stored)

## Lưu ý
- Auto refresh 0.5s có thể tăng tải cho thiết bị, nhưng giúp theo dõi real-time tốt hơn
- All Stored Notifications sẽ tích lũy theo thời gian, có thể cần clear định kỳ
- Cả hai bên đều có chức năng search riêng biệt
- Mỗi bên có nút Save riêng để lưu dữ liệu theo nhu cầu
- **Hệ thống kiểm tra trùng lặp nội dung để tránh lưu trữ notifications giống nhau**
- **Chỉ lưu trữ notifications có nội dung khác biệt, giúp tiết kiệm bộ nhớ và dễ quản lý**
- **Hiển thị thời gian lưu trữ để phân biệt các notifications được lưu ở các thời điểm khác nhau**
