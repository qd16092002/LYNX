# Tính năng Location History

## Mô tả
Tính năng này cho phép lưu trữ và hiển thị 10 vị trí gần nhất của mỗi thiết bị. Mỗi khi thiết bị refresh location, vị trí mới sẽ được tự động lưu vào lịch sử.

## Tính năng chính

### 1. Lưu trữ tự động
- Tự động lưu vị trí mới khi thiết bị refresh location
- Giữ lại tối đa 10 vị trí gần nhất cho mỗi thiết bị
- Lưu thông tin: tọa độ (lat, lng), thời gian, độ chính xác

### 2. Hiển thị danh sách
- Hiển thị danh sách 10 vị trí gần nhất trong panel bên phải
- Mỗi vị trí hiển thị:
  - Tên vị trí (#1, #2, #3...)
  - Tọa độ (Lat, Lng)
  - Thời gian lưu
  - Độ chính xác (nếu có)

### 3. Tương tác
- Click vào vị trí để xem trên bản đồ
- Nút "Xem" để điều hướng đến vị trí cụ thể
- Nút "Clear History" để xóa tất cả lịch sử

## Cách sử dụng

### 1. Mở Location Lab
- Chọn thiết bị từ danh sách
- Click vào "Location" để mở lab window

### 2. Xem Location History
- Panel bên phải sẽ hiển thị danh sách 10 vị trí gần nhất
- Vị trí mới nhất sẽ ở đầu danh sách

### 3. Tương tác với vị trí
- Click vào bất kỳ vị trí nào để xem trên bản đồ
- Bản đồ sẽ tự động điều hướng đến vị trí đó
- Vị trí được chọn sẽ được highlight

### 4. Refresh Location
- Click nút "Refresh location" để lấy vị trí mới
- Vị trí mới sẽ tự động được lưu vào lịch sử

### 5. Xóa lịch sử
- Click nút "Clear History" để xóa tất cả lịch sử vị trí
- Xác nhận trước khi xóa

## Cấu trúc dữ liệu

### Location History Object
```javascript
{
  lat: number,           // Vĩ độ
  lng: number,           // Kinh độ
  timestamp: string,     // Thời gian lưu (ISO string)
  accuracy: number,      // Độ chính xác (mét)
  address: string        // Địa chỉ (nếu có)
}
```

## Files đã được cập nhật

### Backend
- `deviceManager.js`: Thêm các phương thức quản lý location history
- `main.js`: Thêm xử lý location data và IPC handlers

### Frontend
- `location.html`: Cập nhật UI để hiển thị location history
- `LabCtrl.js`: Thêm controller cho location history

## Lưu ý
- Mỗi thiết bị chỉ lưu tối đa 10 vị trí gần nhất
- Dữ liệu được lưu trong file `devices.json`
- Vị trí cũ sẽ tự động bị xóa khi vượt quá giới hạn
- Tính năng hoạt động độc lập với từng thiết bị 