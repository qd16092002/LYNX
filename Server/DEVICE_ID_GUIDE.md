# LYNX Device ID Management Guide

## Tổng quan
Hệ thống Device ID cho phép kiểm soát việc sử dụng LYNX dựa trên Device ID duy nhất của từng máy tính. Chỉ những máy có Device ID trong whitelist mới được phép chạy ứng dụng.

## Cách hoạt động

### 1. Device ID được tạo từ:
- **MAC Address** của card mạng chính
- **CPU Model và Speed** 
- **Hostname** của máy tính
- **Hash MD5** để tạo ID ngắn gọn và bảo mật

### 2. Kiểm tra bảo mật:
- Device ID được kiểm tra khi khởi động ứng dụng
- Nếu Device ID không có trong whitelist → Ứng dụng sẽ đóng
- Không thể bypass bằng cách chỉnh sửa file config

## Cách sử dụng

### Lấy Device ID của máy server hiện tại:
```bash
cd Server
node get_server_device_id.js
```

### Lấy Device ID của máy khác:
1. Copy file `get_server_device_id.js` sang máy khác
2. Chạy: `node get_server_device_id.js`
3. Copy Device ID được hiển thị

### Thêm Device ID vào whitelist:
1. Mở file `Server/app/config.js`
2. Thêm Device ID vào mảng `allowedDevices`:

```javascript
deviceWhitelist: {
    enabled: true,
    allowedDevices: [
        "31AEF13F-2C80-6BFC-1365-64BA23E0FFE8", // Device ID của máy server
        "CFF2F79A-FEF2-429C-A4CF-0B318BADBC03", // Device ID khác
        "6bb7693c-eb3a-4871-9b60-54fe76602dd1"  // Device ID khác
    ]
}
```

### Test Device ID:
```bash
cd Server
node test_device_id.js
```

## Cấu hình

### Bật/tắt Device ID checking:
```javascript
deviceWhitelist: {
    enabled: true,  // true = bật, false = tắt
    allowedDevices: [...]
}
```

### Thêm/xóa Device ID:
- **Thêm**: Thêm vào mảng `allowedDevices`
- **Xóa**: Xóa khỏi mảng `allowedDevices`

## Bảo mật

### Ưu điểm:
- ✅ **Duy nhất**: Mỗi máy có Device ID riêng biệt
- ✅ **Khó fake**: Dựa trên thông tin phần cứng thực
- ✅ **Không bypass**: Kiểm tra ngay khi khởi động
- ✅ **Dễ quản lý**: Chỉ cần thêm/xóa Device ID

### Lưu ý:
- ⚠️ **Backup config**: Luôn backup file config.js
- ⚠️ **Test trước**: Test trên máy khác trước khi deploy
- ⚠️ **Quản lý cẩn thận**: Không để lộ danh sách Device ID

## Troubleshooting

### Lỗi "Device Not Authorized":
1. Kiểm tra Device ID có trong whitelist không
2. Chạy `node get_server_device_id.js` để lấy Device ID chính xác
3. Thêm Device ID vào config.js
4. Khởi động lại server

### Device ID thay đổi:
- Device ID có thể thay đổi nếu:
  - Thay đổi card mạng
  - Thay đổi CPU
  - Thay đổi hostname
- Giải pháp: Lấy Device ID mới và cập nhật whitelist

### Test kết nối:
```bash
# Test Device ID
node test_device_id.js

# Test toàn bộ hệ thống
npm start
```

## API Reference

### deviceIdManager.getCurrentDeviceId()
Lấy Device ID của máy hiện tại

### deviceIdManager.isDeviceAllowed(deviceId)
Kiểm tra Device ID có được phép không

### deviceIdManager.checkDeviceStatus()
Lấy thông tin chi tiết về Device ID

### deviceIdManager.getAllowedDevices()
Lấy danh sách Device ID được phép

## Kết hợp với License System

Device ID system hoạt động cùng với License system:
1. **Device ID check** → Kiểm tra máy có được phép không
2. **License check** → Kiểm tra license có còn hạn không
3. **Internet check** → Kiểm tra kết nối mạng

Cả 3 điều kiện phải thỏa mãn thì ứng dụng mới chạy được.
