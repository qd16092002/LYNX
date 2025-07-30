const fs = require('fs');
const path = require('path');
const electron = require('electron');

class DeviceManager {
    constructor() {
        let userDataPath;
        try {
            // Use Electron's app.getPath if available
            userDataPath = electron.app ? electron.app.getPath('userData') : null;
        } catch (e) {
            userDataPath = null;
        }
        if (userDataPath) {
            this.devicesFile = path.join(userDataPath, 'devices.json');
        } else {
            // Fallback to old path if not running in Electron
            this.devicesFile = path.join(__dirname, 'devices.json');
        }
        this.devices = this.loadDevices();
    }

    // Load devices từ file JSON
    loadDevices() {
        try {
            if (fs.existsSync(this.devicesFile)) {
                const data = fs.readFileSync(this.devicesFile, 'utf8');
                if (!data.trim()) return {}; // Nếu file rỗng, trả về object rỗng
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading devices:', error);
            // Nếu lỗi do JSON.parse hoặc file lỗi, trả về object rỗng
            return {};
        }
        return {};
    }

    // Lưu devices vào file JSON
    saveDevices() {
        try {
            fs.writeFileSync(this.devicesFile, JSON.stringify(this.devices, null, 2));
        } catch (error) {
            console.error('Error saving devices:', error);
        }
    }

    // Thêm hoặc cập nhật thiết bị
    addDevice(deviceId, deviceInfo) {
        // Ưu tiên fcmToken làm key nếu có
        const key = deviceInfo.fcmToken || deviceId;
        const existingNote = this.devices[key]?.note || '';

        this.devices[key] = {
            ...deviceInfo,
            note: existingNote, // Giữ lại ghi chú cũ
            lastSeen: new Date().toISOString(),
            connectionCount: (this.devices[key]?.connectionCount || 0) + 1
        };
        this.saveDevices();
        console.log(`[✓] Device ${key} saved to database`);
    }

    // Lấy thông tin thiết bị
    getDevice(deviceId) {
        return this.devices[deviceId] || null;
    }

    // Lấy tất cả thiết bị
    getAllDevices() {
        return this.devices;
    }

    // Xóa thiết bị
    removeDevice(deviceId) {
        if (this.devices[deviceId]) {
            delete this.devices[deviceId];
            this.saveDevices();
            console.log(`[✓] Device ${deviceId} removed from database`);
        }
    }

    // Cập nhật FCM token
    updateFCMToken(deviceId, fcmToken) {
        const key = fcmToken || deviceId;
        if (this.devices[key]) {
            this.devices[key].fcmToken = fcmToken;
            this.devices[key].lastTokenUpdate = new Date().toISOString();
            this.saveDevices();
            console.log(`[✓] FCM token updated for device ${key}`);
        }
    }

    // Thêm hoặc cập nhật ghi chú cho thiết bị
    updateDeviceNote(key, note) {
        // key có thể là fcmToken hoặc deviceId
        if (this.devices[key]) {
            this.devices[key].note = note;
            this.devices[key].lastNoteUpdate = new Date().toISOString();
            this.saveDevices();
            console.log(`[✓] Note updated for device ${key}: ${note}`);
            return true;
        }
        return false;
    }

    // Lấy ghi chú của thiết bị
    getDeviceNote(key) {
        return this.devices[key]?.note || '';
    }

    // Lấy thiết bị có FCM token
    getDevicesWithFCMToken() {
        const devicesWithToken = {};
        for (const [id, device] of Object.entries(this.devices)) {
            if (device.fcmToken) {
                devicesWithToken[id] = device;
            }
        }
        return devicesWithToken;
    }

    // Lấy thống kê thiết bị
    getDeviceStats() {
        const total = Object.keys(this.devices).length;
        const withToken = Object.keys(this.getDevicesWithFCMToken()).length;
        const withoutToken = total - withToken;
        const withNotes = Object.values(this.devices).filter(device => device.note && device.note.trim()).length;

        return {
            total,
            withToken,
            withoutToken,
            withNotes,
            lastUpdated: new Date().toISOString()
        };
    }

    // Backup devices
    backup() {
        const backupFile = path.join(__dirname, `devices_backup_${Date.now()}.json`);
        try {
            fs.writeFileSync(backupFile, JSON.stringify(this.devices, null, 2));
            console.log(`[✓] Devices backed up to ${backupFile}`);
            return backupFile;
        } catch (error) {
            console.error('Error backing up devices:', error);
            return null;
        }
    }
}

module.exports = new DeviceManager(); 