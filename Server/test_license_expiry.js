// Test script for immediate license expiry (gracePeriod = 0)
const licenseManager = require('./app/licenseManager');

async function testImmediateExpiry() {
    console.log('=== LYNX License Immediate Expiry Test ===\n');

    // Lưu config gốc
    const originalConfig = { ...licenseManager.config };

    try {
        // Test 1: License hết hạn ngay lập tức (gracePeriod = 0)
        console.log('1. Testing immediate expiry (gracePeriod = 0):');
        licenseManager.config.gracePeriod = 0;
        licenseManager.config.expireDate = '01/01/2020'; // Ngày trong quá khứ

        const expiredStatus = await licenseManager.checkLicense();
        console.log('   Valid:', expiredStatus.valid ? 'Yes' : 'No');
        console.log('   Message:', expiredStatus.message);
        console.log('   Expired:', expiredStatus.expired ? 'Yes' : 'No');
        console.log('');

        // Test 2: License với grace period (so sánh)
        console.log('2. Testing with grace period (gracePeriod = 7):');
        licenseManager.config.gracePeriod = 7;
        licenseManager.config.expireDate = '01/01/2020'; // Ngày trong quá khứ

        const graceStatus = await licenseManager.checkLicense();
        console.log('   Valid:', graceStatus.valid ? 'Yes' : 'No');
        console.log('   Message:', graceStatus.message);
        console.log('   Warning:', graceStatus.warning ? 'Yes' : 'No');
        console.log('   Days left in grace:', graceStatus.daysLeftInGrace || 'N/A');
        console.log('');

        // Test 3: License hợp lệ
        console.log('3. Testing valid license:');
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const nextYearStr = nextYear.getDate().toString().padStart(2, '0') + '/' +
            (nextYear.getMonth() + 1).toString().padStart(2, '0') + '/' +
            nextYear.getFullYear();

        licenseManager.config.expireDate = nextYearStr;
        licenseManager.config.gracePeriod = 0; // Vẫn giữ gracePeriod = 0

        const validStatus = await licenseManager.checkLicense();
        console.log('   Valid:', validStatus.valid ? 'Yes' : 'No');
        console.log('   Message:', validStatus.message);
        console.log('   Days until expiry:', validStatus.daysUntilExpiry || 'N/A');
        console.log('');

        // Test 4: Test với ngày hết hạn hôm nay
        console.log('4. Testing expiry today:');
        const today = new Date();
        const todayStr = today.getDate().toString().padStart(2, '0') + '/' +
            (today.getMonth() + 1).toString().padStart(2, '0') + '/' +
            today.getFullYear();

        licenseManager.config.expireDate = todayStr;
        licenseManager.config.gracePeriod = 0;

        const todayStatus = await licenseManager.checkLicense();
        console.log('   Valid:', todayStatus.valid ? 'Yes' : 'No');
        console.log('   Message:', todayStatus.message);
        console.log('   Days until expiry:', todayStatus.daysUntilExpiry || 'N/A');
        console.log('');

        // Test 5: Test với ngày hết hạn ngày mai
        console.log('5. Testing expiry tomorrow:');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.getDate().toString().padStart(2, '0') + '/' +
            (tomorrow.getMonth() + 1).toString().padStart(2, '0') + '/' +
            tomorrow.getFullYear();

        licenseManager.config.expireDate = tomorrowStr;
        licenseManager.config.gracePeriod = 0;

        const tomorrowStatus = await licenseManager.checkLicense();
        console.log('   Valid:', tomorrowStatus.valid ? 'Yes' : 'No');
        console.log('   Message:', tomorrowStatus.message);
        console.log('   Warning:', tomorrowStatus.warning ? 'Yes' : 'No');
        console.log('   Days until expiry:', tomorrowStatus.daysUntilExpiry || 'N/A');
        console.log('');

    } finally {
        // Khôi phục config gốc
        licenseManager.config = originalConfig;
    }

    console.log('=== Test completed ===');
    console.log('\n📝 Summary:');
    console.log('- gracePeriod = 0: License hết hạn ngay lập tức');
    console.log('- gracePeriod > 0: License có thời gian gia hạn');
    console.log('- Khuyến nghị: Sử dụng gracePeriod = 0 cho bảo mật cao');
}

// Chạy test
testImmediateExpiry().catch(console.error);
