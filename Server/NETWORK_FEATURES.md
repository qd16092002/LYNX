# 🌐 Network Information Features

## Tổng quan
Dự án LYNX đã được bổ sung thêm các chức năng để lấy thông tin về WiFi và mạng di động của thiết bị Android. Các chức năng này cho phép bạn:

- Lấy thông tin tổng hợp về mạng
- Lấy thông tin chi tiết về WiFi
- Lấy thông tin về mạng di động
- Quét các mạng WiFi có sẵn
- Lấy thông tin chi tiết về mạng di động

## 📱 Các lệnh mới

### 1. `x0000net` - Thông tin tổng hợp về mạng
Lấy thông tin tổng hợp bao gồm WiFi, mạng di động và trạng thái kết nối.

**Request:**
```json
{
  "order": "x0000net",
  "extra": ""
}
```

**Response:**
```json
{
  "wifi": {
    "enabled": true,
    "ssid": "MyWiFi",
    "bssid": "00:11:22:33:44:55",
    "signal_strength": -45,
    "link_speed": 54,
    "frequency": 2412,
    "ip_address": "192.168.1.100",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "network_id": 1
  },
  "mobile": {
    "enabled": true,
    "connected": true,
    "type": "LTE",
    "operator": "Viettel",
    "mcc": "452",
    "mnc": "01",
    "sim_country": "vn",
    "device_id": "123456789",
    "subscriber_id": "987654321",
    "phone_number": "+84987654321"
  },
  "connection": {
    "has_internet": true,
    "has_validated": true,
    "has_wifi": true,
    "has_cellular": true,
    "has_ethernet": false,
    "has_bluetooth": false,
    "has_vpn": false
  },
  "timestamp": 1703123456789
}
```

### 2. `x0000wifi` - Thông tin WiFi
Lấy thông tin chi tiết về kết nối WiFi hiện tại.

**Request:**
```json
{
  "order": "x0000wifi",
  "extra": ""
}
```

**Response:**
```json
{
  "enabled": true,
  "ssid": "MyWiFi",
  "bssid": "00:11:22:33:44:55",
  "signal_strength": -45,
  "link_speed": 54,
  "frequency": 2412,
  "ip_address": "192.168.1.100",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "network_id": 1
}
```

### 3. `x0000mobile` - Thông tin mạng di động
Lấy thông tin cơ bản về mạng di động.

**Request:**
```json
{
  "order": "x0000mobile",
  "extra": ""
}
```

**Response:**
```json
{
  "enabled": true,
  "connected": true,
  "type": "LTE",
  "operator": "Viettel",
  "mcc": "452",
  "mnc": "01",
  "sim_country": "vn",
  "device_id": "123456789",
  "subscriber_id": "987654321",
  "phone_number": "+84987654321"
}
```

### 4. `x0000wifiScan` - Quét mạng WiFi
Lấy danh sách các mạng WiFi có sẵn trong khu vực.

**Request:**
```json
{
  "order": "x0000wifiScan",
  "extra": ""
}
```

**Response:**
```json
[
  {
    "ssid": "MyWiFi",
    "bssid": "00:11:22:33:44:55",
    "capabilities": "[WPA2-PSK-CCMP][ESS]",
    "level": -45,
    "frequency": 2412,
    "timestamp": 1703123456789
  },
  {
    "ssid": "NeighborWiFi",
    "bssid": "AA:BB:CC:DD:EE:FF",
    "capabilities": "[WPA2-PSK-CCMP][ESS]",
    "level": -65,
    "frequency": 2437,
    "timestamp": 1703123456789
  }
]
```

### 5. `x0000mobileDetail` - Thông tin chi tiết mạng di động
Lấy thông tin chi tiết về mạng di động bao gồm trạng thái SIM, loại điện thoại, v.v.

**Request:**
```json
{
  "order": "x0000mobileDetail",
  "extra": ""
}
```

**Response:**
```json
{
  "network_type": "LTE",
  "data_state": "Connected",
  "roaming": false,
  "sim_state": "Ready",
  "phone_type": "GSM"
}
```

## 🔧 Cài đặt và sử dụng

### 1. Build ứng dụng Android
```bash
cd Client
./gradlew assembleDebug
```

### 2. Cài đặt ứng dụng lên thiết bị
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 3. Khởi động server
```bash
cd Server
npm start
```

### 4. Test chức năng
Mở file `network_test.html` trong trình duyệt để test các chức năng mạng.

## 📋 Quyền cần thiết

Ứng dụng đã có sẵn các quyền cần thiết trong `AndroidManifest.xml`:

- `ACCESS_WIFI_STATE` - Truy cập thông tin WiFi
- `ACCESS_NETWORK_STATE` - Truy cập trạng thái mạng
- `READ_PHONE_STATE` - Đọc thông tin điện thoại

## 🚀 Tính năng nâng cao

### Thông tin WiFi
- **SSID**: Tên mạng WiFi
- **BSSID**: Địa chỉ MAC của router
- **Signal Strength**: Cường độ tín hiệu (dBm)
- **Link Speed**: Tốc độ kết nối (Mbps)
- **Frequency**: Tần số (MHz)
- **IP Address**: Địa chỉ IP của thiết bị
- **MAC Address**: Địa chỉ MAC của thiết bị

### Thông tin mạng di động
- **Network Type**: Loại mạng (GPRS, EDGE, UMTS, HSDPA, LTE, 5G NR)
- **Operator**: Tên nhà mạng
- **MCC/MNC**: Mã quốc gia và mã mạng
- **SIM State**: Trạng thái SIM card
- **Data State**: Trạng thái dữ liệu
- **Roaming**: Có đang roaming hay không

### Trạng thái kết nối
- **Internet**: Có kết nối internet hay không
- **Validated**: Kết nối đã được xác thực
- **Transport**: Loại kết nối (WiFi, Cellular, Ethernet, Bluetooth, VPN)

## ⚠️ Lưu ý

1. **Quyền**: Đảm bảo ứng dụng có đủ quyền cần thiết
2. **Android Version**: Một số API có thể không khả dụng trên Android cũ
3. **Privacy**: Thông tin mạng có thể chứa dữ liệu nhạy cảm
4. **Performance**: Quét WiFi có thể tiêu tốn pin

## 🐛 Xử lý lỗi

Tất cả các API đều có xử lý lỗi và trả về thông báo lỗi rõ ràng:

```json
{
  "error": "Failed to get network info: Permission denied"
}
```

## 📞 Hỗ trợ

Nếu gặp vấn đề hoặc cần hỗ trợ, vui lòng:
1. Kiểm tra log trong Android Studio
2. Xác nhận quyền đã được cấp
3. Kiểm tra phiên bản Android
4. Xem xét các yêu cầu quyền trong runtime
