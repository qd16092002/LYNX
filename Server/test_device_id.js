const deviceIdManager = require('./app/deviceIdManager');

console.log('=== LYNX Device ID Test ===\n');

// Test 1: Lấy Device ID hiện tại
console.log('1. Getting current Device ID:');
const deviceId = deviceIdManager.getCurrentDeviceId();
console.log(`   Device ID: ${deviceId}\n`);

// Test 2: Kiểm tra Device ID có được phép không
console.log('2. Checking if device is allowed:');
const isAllowed = deviceIdManager.isDeviceAllowed();
console.log(`   Allowed: ${isAllowed}\n`);

// Test 3: Lấy thông tin chi tiết
console.log('3. Getting detailed device status:');
const status = deviceIdManager.checkDeviceStatus();
console.log(`   Device ID: ${status.deviceId}`);
console.log(`   Is Allowed: ${status.isAllowed}`);
console.log(`   Whitelist Enabled: ${status.whitelistEnabled}`);
console.log(`   Message: ${status.message}`);
console.log(`   Allowed Devices: ${status.allowedDevices.length} devices\n`);

// Test 4: Hiển thị danh sách devices được phép
console.log('4. Allowed devices list:');
const allowedDevices = deviceIdManager.getAllowedDevices();
allowedDevices.forEach((device, index) => {
    const isCurrent = device === deviceId;
    console.log(`   ${index + 1}. ${device} ${isCurrent ? '(Current Device)' : ''}`);
});

console.log('\n=== Test completed ===');
