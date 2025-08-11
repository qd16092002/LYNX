# Cập nhật Quản lý Thiết bị - LYNX

## Tổng quan
Đã cập nhật hệ thống để sử dụng `deviceId` thay vì `fcmToken` và giới hạn tối đa 50 thiết bị.

## Các thay đổi chính

### 1. Sử dụng DeviceId thay vì FCM Token
- **Trước**: Sử dụng FCM token làm key chính để lưu trữ thiết bị
- **Sau**: Sử dụng deviceId làm key chính, loại bỏ hoàn toàn FCM token

### 2. Giới hạn thiết bị
- **Giới hạn**: Tối đa 50 thiết bị
- **Hành vi**: Khi đạt giới hạn, thiết bị mới sẽ không thể kết nối
- **Thông báo**: Hiển thị cảnh báo khi đạt giới hạn

### 3. Cải thiện giao diện

#### Thống kê thiết bị
- Hiển thị tổng số thiết bị đã lưu
- Hiển thị số thiết bị online
- Hiển thị số thiết bị có ghi chú
- Hiển thị giới hạn tối đa (50)

#### Tab Navigation
- **Tab "Online Devices"**: Chỉ hiển thị thiết bị đang online
- **Tab "All Saved Devices"**: Hiển thị tất cả thiết bị đã lưu (online + offline)

#### Cột Status
- Hiển thị trạng thái Online/Offline của thiết bị
- Màu xanh cho online, đỏ cho offline

### 4. Cập nhật DeviceManager

#### Các phương thức mới:
- `getDeviceCount()`: Lấy số lượng thiết bị hiện tại
- `canAddDevice()`: Kiểm tra có thể thêm thiết bị mới không
- `updateDeviceStatus(deviceId, isOnline)`: Cập nhật trạng thái online/offline
- `clearAllDevices()`: Xóa tất cả thiết bị

#### Cải thiện:
- Giới hạn tối đa 50 thiết bị
- Tự động cập nhật trạng thái khi thiết bị kết nối/ngắt kết nối
- Lưu trữ thông tin deviceId trong database

### 5. Cập nhật Victim Model
- Loại bỏ fcmToken
- Sử dụng deviceId làm identifier chính
- Cập nhật các phương thức để sử dụng deviceId

### 6. Cải thiện UX
- Thông báo khi thiết bị offline được chọn
- Nút "Open Lab" bị vô hiệu hóa cho thiết bị offline
- Hiển thị cảnh báo khi đạt giới hạn thiết bị

## Cách sử dụng

### Xem thiết bị online
1. Chọn tab "Online Devices"
2. Chỉ hiển thị thiết bị đang kết nối
3. Có thể mở lab và tương tác với thiết bị

### Xem tất cả thiết bị đã lưu
1. Chọn tab "All Saved Devices"
2. Hiển thị cả thiết bị online và offline
3. Thiết bị offline không thể mở lab

### Thêm ghi chú
- Click vào icon edit trong cột Note
- Nhập ghi chú và nhấn Enter hoặc click ra ngoài để lưu

### Theo dõi giới hạn
- Xem thống kê ở panel phía trên
- Cảnh báo sẽ hiển thị khi đạt 50 thiết bị

## Lưu ý kỹ thuật

### Database
- File: `devices.json` trong thư mục user data
- Format: JSON với deviceId làm key
- Tự động backup khi có lỗi

### Performance
- Giới hạn 50 thiết bị giúp tối ưu hiệu suất
- Tự động cập nhật trạng thái real-time
- Lazy loading cho danh sách thiết bị

### Security
- Loại bỏ FCM token để tăng bảo mật
- Sử dụng deviceId duy nhất cho mỗi thiết bị
- Validation khi thêm thiết bị mới

## Tương lai
- Có thể mở rộng giới hạn thiết bị nếu cần
- Thêm tính năng export/import danh sách thiết bị
- Thêm tính năng backup/restore database 