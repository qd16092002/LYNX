const deviceIdManager = require('./app/deviceIdManager');

console.log('=== LYNX Server Device ID Generator ===\n');

// Lấy Device ID của máy server hiện tại
const deviceId = deviceIdManager.getCurrentDeviceId();

if (deviceId) {
    console.log('✅ Server MAC Address:', deviceId);
    console.log('\n📋 Hướng dẫn sử dụng:');
    console.log('1. Copy MAC Address trên vào file config.js');
    console.log('2. Thêm vào mảng allowedDevices trong deviceWhitelist');
    console.log('3. Khởi động lại server');

    console.log('\n📝 Cấu hình mẫu cho config.js:');
    console.log(`deviceWhitelist: {
    enabled: true,
    allowedDevices: [
        "${deviceId}"  // MAC Address của máy server này
    ]
}`);

    console.log('\n🔧 Để thêm MAC Address khác:');
    console.log('- Chạy script này trên máy khác');
    console.log('- Hoặc chạy "getmac" trong CMD để lấy MAC Address');
    console.log('- Copy MAC Address và thêm vào allowedDevices');

    console.log('\n💡 Ưu điểm của MAC Address:');
    console.log('- Thông tin phần cứng thực tế (card mạng)');
    console.log('- Dễ lấy: chỉ cần chạy "getmac" trong CMD');
    console.log('- Dễ đọc và quản lý: CC-28-AA-34-79-A9');
    console.log('- Không thay đổi trừ khi thay card mạng');

} else {
    console.log('❌ Không thể lấy Windows Product ID của server');
    console.log('Vui lòng kiểm tra quyền truy cập và thử lại');
}

console.log('\n=== Hoàn thành ===');
