# LYNX MAC Address License System

## Tổng quan
Hệ thống license dựa trên MAC Address của card mạng. Chỉ những máy có MAC Address trong whitelist mới được phép chạy LYNX Server.

## Cách lấy MAC Address

### Cách 1: Sử dụng script tự động (Khuyến nghị)
```bash
cd Server
node get_server_device_id.js
```

### Cách 2: Sử dụng lệnh Windows
```bash
# Cách đơn giản nhất
getmac

# Hoặc xem chi tiết
ipconfig /all
```

### Cách 3: Xem trong Windows Settings
1. Mở **Settings** → **Network & Internet**
2. Chọn **Ethernet** hoặc **Wi-Fi**
3. Click **Properties**
4. Cuộn xuống xem **Physical address (MAC)**

## Cấu hình

### File: `Server/app/config.js`

```javascript
deviceWhitelist: {
    enabled: true,  // Bật/tắt kiểm tra MAC Address
    allowedDevices: [
        "CC-28-AA-34-79-A9",        // MAC Address card mạng Ethernet
        "D8-43-AE-73-20-90"         // MAC Address máy khác
    ]
}
```

## Cơ chế hoạt động

### 1. Khi khởi động ứng dụng:
```
┌─────────────────┐
│  App Start      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Get MAC Address│  ← Chạy "getmac" command
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Whitelist │  ← So sánh với allowedDevices
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────┐
│ ALLOW│  │BLOCK │
└──────┘  └──────┘
    │         │
    ▼         ▼
┌──────┐  ┌──────┐
│ Run  │  │ Quit │
└──────┘  └──────┘
```

### 2. Các phương pháp lấy MAC Address (theo thứ tự ưu tiên):

1. **getmac command** (Ưu tiên cao nhất)
   ```
   Lệnh: getmac
   Kết quả: CC-28-AA-34-79-A9
   ```

2. **Node.js os.networkInterfaces()** (Backup)
   ```javascript
   const interfaces = os.networkInterfaces();
   // Lấy MAC của interface đầu tiên không phải loopback
   ```

3. **PowerShell Get-NetAdapter** (Fallback)
   ```powershell
   Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Select-Object MacAddress
   ```

### 3. Xử lý kết quả:

#### ✅ MAC Address trong whitelist:
```
🔍 MAC Address: CC-28-AA-34-79-A9
✅ Device allowed: true
→ Ứng dụng chạy bình thường
```

#### ❌ MAC Address KHÔNG trong whitelist:
```
🔍 MAC Address: XX-XX-XX-XX-XX-XX
❌ Device allowed: false
→ Hiển thị dialog lỗi
→ Ứng dụng tự động đóng
```

## Ví dụ thực tế

### Máy Server của bạn:
```
Hostname: QuangDao
Ethernet: Realtek PCIe GbE Family Controller
MAC Address: CC-28-AA-34-79-A9
Status: ✅ Allowed
```

### Thêm máy mới:

#### Bước 1: Lấy MAC Address trên máy mới
```bash
getmac
# Kết quả: D8-43-AE-73-20-90
```

#### Bước 2: Thêm vào config.js
```javascript
allowedDevices: [
    "CC-28-AA-34-79-A9",        // Máy server chính
    "D8-43-AE-73-20-90"         // Máy mới thêm
]
```

#### Bước 3: Restart server
```bash
npm start
```

## Bảo mật

### ✅ Ưu điểm:
1. **Thông tin phần cứng thực** - Gắn với card mạng vật lý
2. **Khó fake** - Cần thay đổi phần cứng hoặc driver
3. **Dễ lấy** - Chỉ cần lệnh `getmac`
4. **Dễ quản lý** - Format ngắn gọn: XX-XX-XX-XX-XX-XX
5. **Không đổi** - Chỉ thay đổi khi thay card mạng

### ⚠️ Lưu ý:
1. **Thay card mạng** → MAC Address mới → Cần cập nhật whitelist
2. **Máy ảo** → MAC Address ảo → Có thể thay đổi
3. **Nhiều card mạng** → Lấy MAC của card đang hoạt động đầu tiên
4. **VPN/Virtual Adapter** → Bị bỏ qua (chỉ lấy card vật lý)

## Troubleshooting

### Lỗi "Device Not Authorized":
1. Chạy `getmac` trong CMD để lấy MAC Address hiện tại
2. So sánh với danh sách trong `config.js`
3. Nếu khác → Thêm MAC Address mới vào `allowedDevices`
4. Restart server

### MAC Address thay đổi:
```bash
# Lấy MAC Address mới
getmac

# Thêm vào config.js
"NEW-MAC-ADDRESS-HERE"

# Restart
npm start
```

### Nhiều card mạng:
- Hệ thống tự động lấy card đang **active** đầu tiên
- Bỏ qua card **disconnected** (như VPN adapter)
- Chỉ lấy card vật lý, không lấy card ảo

## So sánh với các phương pháp khác

| Phương pháp | Ưu điểm | Nhược điểm | Khuyến nghị |
|-------------|---------|------------|-------------|
| **MAC Address** | Phần cứng thực, dễ lấy | Thay đổi khi đổi card mạng | ⭐⭐⭐⭐⭐ |
| Windows Product ID | Chính thức Windows | Khó lấy, có thể null | ⭐⭐⭐ |
| Windows UUID | Ổn định, từ BIOS | Dài, khó nhớ | ⭐⭐⭐⭐ |
| Custom Hash | Linh hoạt | Dễ thay đổi | ⭐⭐ |

## Kết hợp với License System

Hệ thống bảo mật đầy đủ với 3 lớp:

```
Layer 1: MAC Address Check
    ↓
Layer 2: License Time Check  
    ↓
Layer 3: Internet Connection Check
    ↓
✅ App Running
```

Tất cả 3 lớp phải pass thì mới chạy được!
