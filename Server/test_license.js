// Test script for license functionality
const licenseManager = require('./app/licenseManager');

async function testLicense() {
    console.log('=== LYNX License Test ===\n');

    // Test 1: License hiện tại
    console.log('1. Testing current license status:');
    const currentStatus = await licenseManager.checkLicense();
    console.log('Status:', currentStatus);
    console.log('');

    // Test 2: Thông tin license
    console.log('2. Testing license info:');
    const licenseInfo = licenseManager.getLicenseInfo();
    console.log('License Info:', JSON.stringify(licenseInfo, null, 2));
    console.log('');

    // Test 3: Thông báo người dùng
    console.log('3. Testing user message:');
    const userMessage = licenseManager.getUserMessage();
    console.log('User Message:', userMessage);
    console.log('');

    // Test 4: Kiểm tra thời gian internet
    console.log('4. Testing internet time:');
    try {
        const internetTime = await licenseManager.getInternetTime();
        console.log('Internet Time:', internetTime.toISOString());
        console.log('Local Time:', new Date().toISOString());
        console.log('Time Difference (minutes):', Math.round((internetTime - new Date()) / 60000));
    } catch (error) {
        console.log('Internet time failed:', error.message);
    }
    console.log('');

    // Test 5: Test với ngày hết hạn khác nhau
    console.log('5. Testing different expiry scenarios:');

    // Lưu config gốc
    const originalConfig = licenseManager.config;

    // Test license hết hạn
    console.log('   a) Expired license:');
    licenseManager.config.expireDate = '01/01/2020';
    const expiredStatus = await licenseManager.checkLicense();
    console.log('   Result:', expiredStatus.valid ? 'Valid' : 'Invalid');
    console.log('   Message:', expiredStatus.message);

    // Test license sắp hết hạn
    console.log('   b) License expiring soon:');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.getDate().toString().padStart(2, '0') + '/' +
        (tomorrow.getMonth() + 1).toString().padStart(2, '0') + '/' +
        tomorrow.getFullYear();
    licenseManager.config.expireDate = tomorrowStr;
    const expiringStatus = await licenseManager.checkLicense();
    console.log('   Result:', expiringStatus.valid ? 'Valid' : 'Invalid');
    console.log('   Message:', expiringStatus.message);
    console.log('   Warning:', expiringStatus.warning ? 'Yes' : 'No');

    // Test license hợp lệ
    console.log('   c) Valid license:');
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.getDate().toString().padStart(2, '0') + '/' +
        (nextYear.getMonth() + 1).toString().padStart(2, '0') + '/' +
        nextYear.getFullYear();
    licenseManager.config.expireDate = nextYearStr;
    const validStatus = await licenseManager.checkLicense();
    console.log('   Result:', validStatus.valid ? 'Valid' : 'Invalid');
    console.log('   Message:', validStatus.message);
    console.log('   Days until expiry:', validStatus.daysUntilExpiry);

    // Khôi phục config gốc
    licenseManager.config = originalConfig;
    console.log('');

    console.log('=== Test completed ===');
}

// Chạy test
testLicense().catch(console.error);
