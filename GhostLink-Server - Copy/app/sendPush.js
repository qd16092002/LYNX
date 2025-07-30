// Simple push notification system without Firebase Admin SDK
// This will simulate sending push notifications

// Function để gửi push notification đến thiết bị cụ thể
function sendPushToDevice(fcmToken, title, body, data = {}) {
  console.log(`[📱] Sending push notification to device with token: ${fcmToken.substring(0, 20)}...`);
  console.log(`[📱] Title: ${title}`);
  console.log(`[📱] Body: ${body}`);
  console.log(`[📱] Data:`, data);

  // Simulate sending push notification
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate success (90% success rate)
      const success = Math.random() > 0.1;
      if (success) {
        console.log(`[✓] Push notification sent successfully to device`);
        resolve({ success: true, messageId: `msg_${Date.now()}` });
      } else {
        console.log(`[✗] Failed to send push notification`);
        reject(new Error('Simulated failure'));
      }
    }, 1000); // Simulate network delay
  });
}

// Function để gửi push notification đến nhiều thiết bị
function sendPushToMultipleDevices(fcmTokens, title, body, data = {}) {
  console.log(`[📱] Sending push notification to ${fcmTokens.length} devices`);
  console.log(`[📱] Title: ${title}`);
  console.log(`[📱] Body: ${body}`);
  console.log(`[📱] Data:`, data);

  // Simulate sending to multiple devices
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const results = {
        successCount: 0,
        failureCount: 0,
        responses: []
      };

      fcmTokens.forEach((token, index) => {
        const success = Math.random() > 0.1;
        if (success) {
          results.successCount++;
          results.responses.push({
            token: token.substring(0, 20) + '...',
            success: true,
            messageId: `msg_${Date.now()}_${index}`
          });
        } else {
          results.failureCount++;
          results.responses.push({
            token: token.substring(0, 20) + '...',
            success: false,
            error: 'Simulated failure'
          });
        }
      });

      console.log(`[✓] Push notifications sent: ${results.successCount} success, ${results.failureCount} failed`);
      resolve(results);
    }, 2000); // Simulate network delay
  });
}

// Export functions để sử dụng trong main.js
module.exports = {
  sendPushToDevice,
  sendPushToMultipleDevices
};

// Test function
function testPushNotification() {
  const testToken = "f3t2pjV5R1yHHAbXNz79KQ:APA91bEZ7ySqrUW4Zxj-RryYWkiwOZjPB_Nr-3pFQNWR_k_q1HnTAe6OQuc8hBsmWAqg_RxpjdCxPwcESE2cmVkX2KKyXAQ9JiK8NBSWT6z_bSILMtU0Aqc";

  sendPushToDevice(testToken, "Test Notification", "This is a test message", {
    action: "test",
    timestamp: new Date().toISOString()
  })
    .then((response) => {
      console.log("Test notification sent successfully:", response);
    })
    .catch((error) => {
      console.log("Test notification failed:", error);
    });
}

// Run test if this file is executed directly
if (require.main === module) {
  testPushNotification();
}
