# License Management Feature

## Tổng quan
Tính năng quản lý license cho phép kiểm soát thời gian sử dụng của ứng dụng LYNX. Sau khi hết hạn, ứng dụng sẽ không thể sử dụng được nữa.

## Cấu hình License

### File cấu hình: `Server/app/config.js`

```javascript
module.exports = {
    maxDevice: 10,
    maxLocationHistory: 10,
    expire: "10/9/2025",
    // License configuration
    license: {
        enabled: true,                    // Bật/tắt kiểm tra license
        expireDate: "10/9/2025",         // Ngày hết hạn (DD/MM/YYYY)
        gracePeriod: 0,                  // Số ngày gia hạn sau khi hết hạn (0 = không có gia hạn)
        warningDays: 30,                 // Số ngày cảnh báo trước khi hết hạn
        useInternetTime: true,           // Sử dụng thời gian internet (bảo mật cao hơn)
        timeServer: "worldtimeapi.org"   // Server thời gian internet
    }
};
```

## Các tính năng chính

### 1. Kiểm tra License tự động
- Ứng dụng tự động kiểm tra license khi khởi động
- Kiểm tra license khi có kết nối mới từ thiết bị
- Hiển thị cảnh báo nếu license sắp hết hạn

### 2. Các trạng thái License

#### License hợp lệ
- Ứng dụng hoạt động bình thường
- Hiển thị thông tin license trong modal

#### License sắp hết hạn (trong vòng warningDays)
- Hiển thị cảnh báo màu vàng
- Thông báo số ngày còn lại
- Vẫn cho phép sử dụng

#### License đã hết hạn (với grace period > 0)
- Hiển thị cảnh báo màu cam
- Thông báo số ngày còn lại trong grace period
- Vẫn cho phép sử dụng

#### License đã hết hạn (với grace period = 0)
- Hiển thị lỗi màu đỏ ngay lập tức
- Chặn hoàn toàn việc sử dụng ứng dụng
- Tự động đóng ứng dụng
- Không có thời gian gia hạn

### 3. Giao diện người dùng

#### Modal License
- Hiển thị khi có cảnh báo hoặc lỗi license
- Thông tin chi tiết về license
- Nút tiếp tục hoặc đóng

#### Thông tin hiển thị
- Ngày hết hạn
- Số ngày còn lại
- Số ngày còn lại trong grace period (nếu có)

## Cách sử dụng

### 1. Cấu hình License
Chỉnh sửa file `Server/app/config.js`:

```javascript
license: {
    enabled: true,                    // Bật kiểm tra license
    expireDate: "31/12/2024",        // Thay đổi ngày hết hạn
    gracePeriod: 0,                  // 0 = không có gia hạn, >0 = có gia hạn
    warningDays: 30                  // Thay đổi số ngày cảnh báo
}
```

#### Các tùy chọn Grace Period:
- `gracePeriod: 0` - **Hết hạn ngay lập tức** (khuyến nghị cho bảo mật cao)
- `gracePeriod: 7` - Có 7 ngày gia hạn sau khi hết hạn
- `gracePeriod: 30` - Có 30 ngày gia hạn sau khi hết hạn

### 2. Tắt kiểm tra License (cho development)
```javascript
license: {
    enabled: false,                  // Tắt kiểm tra license
    // ... các cấu hình khác
}
```

### 3. Gia hạn License
Để gia hạn license, chỉ cần thay đổi `expireDate` trong file config:

```javascript
expireDate: "31/12/2025",           // Gia hạn đến cuối năm 2025
```

## Cấu trúc Code

### Backend (Server)
- `licenseManager.js`: Module quản lý license chính
- `main.js`: Tích hợp license checking vào server
- `config.js`: Cấu hình license

### Frontend (Client)
- `AppCtrl.js`: Xử lý license checking và hiển thị modal
- `index.html`: Giao diện modal license

## API Endpoints

### IPC Handlers
- `checkLicense`: Kiểm tra thông tin license
- `getLicenseStatus`: Lấy trạng thái license hiện tại

### Response Format
```javascript
{
    success: true,
    licenseInfo: {
        valid: true,
        message: "License is valid",
        daysUntilExpiry: 30,
        expireDate: "2025-10-22T00:00:00.000Z",
        config: { ... }
    },
    userMessage: {
        type: "info", // "info", "warning", "error"
        title: "License Valid",
        message: "Your license is valid until 22/10/2025.",
        canContinue: true
    }
}
```

## Bảo mật

### Kiểm tra thời gian
- **Thời gian local**: Dễ bị bypass bằng cách thay đổi thời gian hệ thống
- **Thời gian internet**: An toàn hơn, lấy từ server thời gian quốc tế
- **Fallback**: Nếu không kết nối được internet, sẽ dùng thời gian local

### Cấu hình bảo mật
```javascript
license: {
    useInternetTime: true,           // Bật kiểm tra thời gian internet
    timeServer: "worldtimeapi.org"   // Server thời gian (có thể thay đổi)
}
```

### Lưu ý quan trọng
- License checking được thực hiện ở cả client và server
- Không nên dựa vào client-side checking để bảo mật
- Server-side checking là chính để đảm bảo bảo mật
- Sử dụng thời gian internet để tránh bypass

### Khuyến nghị
- Luôn bật `useInternetTime: true` cho production
- Mã hóa thông tin license nếu cần
- Sử dụng license server riêng cho production
- Thêm checksum hoặc signature cho license
- Kiểm tra kết nối internet trước khi deploy

## Troubleshooting

### License không hoạt động
1. Kiểm tra `enabled: true` trong config
2. Kiểm tra format ngày tháng (DD/MM/YYYY)
3. Kiểm tra console logs để xem lỗi

### Modal không hiển thị
1. Kiểm tra AngularJS binding
2. Kiểm tra CSS z-index
3. Kiểm tra JavaScript errors

### License hết hạn nhưng vẫn hoạt động
1. Kiểm tra grace period setting
2. Kiểm tra timezone của server
3. Restart ứng dụng để áp dụng thay đổi

## Development Notes

### Testing License
Để test các trạng thái license khác nhau:

1. **Test warning**: Đặt `expireDate` gần với ngày hiện tại
2. **Test expired**: Đặt `expireDate` trong quá khứ
3. **Test grace period**: Đặt `expireDate` trong quá khứ nhưng trong grace period

### Customization
- Thay đổi UI trong `index.html`
- Thay đổi logic trong `licenseManager.js`
- Thay đổi cấu hình trong `config.js`
