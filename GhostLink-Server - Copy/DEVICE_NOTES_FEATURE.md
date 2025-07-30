# Tính năng Ghi chú Thiết bị - Device Notes Feature

## Tổng quan
Tính năng ghi chú thiết bị cho phép bạn lưu trữ và quản lý ghi chú cho từng thiết bị kết nối. Khi thiết bị kết nối lại, hệ thống sẽ tự động hiển thị ghi chú đã lưu trước đó.

## Tính năng chính

### 1. Lưu trữ ghi chú
- Ghi chú được lưu vào file `app/devices.json` trong local storage
- Mỗi thiết bị có một ghi chú riêng biệt
- Ghi chú được giữ lại ngay cả khi thiết bị ngắt kết nối

### 2. Chỉnh sửa ghi chú
- **Trong bảng thiết bị**: Click vào icon edit (✏️) bên cạnh ghi chú
- **Trong panel thiết bị**: Click nút "Edit" bên cạnh thông tin ghi chú
- Nhấn Enter hoặc click ra ngoài để lưu ghi chú

### 3. Hiển thị ghi chú
- **Bảng thiết bị**: Cột "Note" hiển thị ghi chú của từng thiết bị
- **Panel thiết bị**: Hiển thị ghi chú khi chọn thiết bị
- **Thông báo**: Hiển thị ghi chú khi thiết bị kết nối lại

### 4. Thống kê thiết bị
- **Total Devices**: Tổng số thiết bị đã từng kết nối
- **Online**: Số thiết bị đang kết nối
- **With Notes**: Số thiết bị có ghi chú

## Cách sử dụng

### Thêm ghi chú cho thiết bị mới
1. Khi thiết bị kết nối, click vào icon edit trong cột Note
2. Nhập ghi chú và nhấn Enter
3. Ghi chú sẽ được lưu và hiển thị ngay lập tức

### Chỉnh sửa ghi chú thiết bị đã chọn
1. Chọn thiết bị từ bảng
2. Trong panel bên phải, click nút "Edit" bên cạnh Note
3. Nhập ghi chú mới và nhấn OK

### Xem ghi chú khi thiết bị kết nối lại
- Khi thiết bị có ghi chú kết nối lại, thông báo sẽ hiển thị: "Device reconnected with note: [ghi chú]"
- Ghi chú sẽ tự động được tải và hiển thị trong bảng

## Cấu trúc dữ liệu

### File devices.json
```json
{
  "device_id_1": {
    "ip": "192.168.1.100",
    "port": 8080,
    "country": "vn",
    "manf": "Samsung",
    "model": "Galaxy S21",
    "release": "Android 12",
    "fcmToken": "token_here",
    "note": "Thiết bị của CEO",
    "lastSeen": "2024-01-01T12:00:00.000Z",
    "connectionCount": 5,
    "lastNoteUpdate": "2024-01-01T12:00:00.000Z"
  }
}
```

## API Endpoints

### Main Process (IPC)
- `updateDeviceNote(deviceId, note)`: Cập nhật ghi chú cho thiết bị
- `getDeviceNote(deviceId)`: Lấy ghi chú của thiết bị
- `getAllDevices()`: Lấy tất cả thiết bị đã lưu

### DeviceManager Methods
- `updateDeviceNote(deviceId, note)`: Cập nhật ghi chú
- `getDeviceNote(deviceId)`: Lấy ghi chú
- `addDevice(deviceId, deviceInfo)`: Thêm thiết bị mới
- `getDeviceStats()`: Lấy thống kê thiết bị

## Lưu ý
- Ghi chú được lưu tự động khi thiết bị kết nối
- Không có giới hạn độ dài ghi chú
- Ghi chú được mã hóa UTF-8 để hỗ trợ tiếng Việt
- File devices.json được backup tự động khi cần thiết

## Troubleshooting
- Nếu ghi chú không hiển thị, kiểm tra file `app/devices.json`
- Nếu có lỗi, xem log trong console để debug
- Đảm bảo quyền ghi file trong thư mục app/ 