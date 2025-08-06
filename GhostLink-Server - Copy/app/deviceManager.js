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
        this.maxDevices = 2; // Giới hạn tối đa 2 thiết bị
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
        // Kiểm tra giới hạn số lượng thiết bị
        const currentDeviceCount = Object.keys(this.devices).length;
        if (currentDeviceCount >= this.maxDevices && !this.devices[deviceId]) {
            console.log(`[x] Maximum device limit reached (${this.maxDevices}). Cannot add new device.`);
            return false;
        }

        const existingNote = this.devices[deviceId]?.note || '';

        this.devices[deviceId] = {
            ...deviceInfo,
            note: existingNote, // Giữ lại ghi chú cũ
            lastSeen: new Date().toISOString(),
            connectionCount: (this.devices[deviceId]?.connectionCount || 0) + 1,
            deviceId: deviceId // Đảm bảo deviceId được lưu
        };
        this.saveDevices();
        console.log(`[✓] Device ${deviceId} saved to database`);
        return true;
    }

    // Lấy thông tin thiết bị
    getDevice(deviceId) {
        return this.devices[deviceId] || null;
    }

    // Lấy tất cả thiết bị
    getAllDevices() {
        return this.devices;
    }

    // Lấy số lượng thiết bị hiện tại
    getDeviceCount() {
        return Object.keys(this.devices).length;
    }

    // Kiểm tra xem có thể thêm thiết bị mới không
    canAddDevice() {
        return this.getDeviceCount() < this.maxDevices;
    }

    // Xóa thiết bị
    removeDevice(deviceId) {
        if (this.devices[deviceId]) {
            delete this.devices[deviceId];
            this.saveDevices();
            console.log(`[✓] Device ${deviceId} removed from database`);
            return true;
        }
        return false;
    }

    // Thêm hoặc cập nhật ghi chú cho thiết bị
    updateDeviceNote(deviceId, note) {
        if (this.devices[deviceId]) {
            this.devices[deviceId].note = note;
            this.devices[deviceId].lastNoteUpdate = new Date().toISOString();
            this.saveDevices();
            console.log(`[✓] Note updated for device ${deviceId}: ${note}`);
            return true;
        }
        return false;
    }

    // Lấy ghi chú của thiết bị
    getDeviceNote(deviceId) {
        return this.devices[deviceId]?.note || '';
    }

    // Lấy thống kê thiết bị
    getDeviceStats() {
        const total = Object.keys(this.devices).length;
        const withNotes = Object.values(this.devices).filter(device => device.note && device.note.trim()).length;
        const online = Object.values(this.devices).filter(device => device.isOnline).length;

        return {
            total,
            online,
            withNotes,
            maxDevices: this.maxDevices,
            canAddMore: this.canAddDevice(),
            lastUpdated: new Date().toISOString()
        };
    }

    // Cập nhật trạng thái online/offline
    updateDeviceStatus(deviceId, isOnline) {
        if (this.devices[deviceId]) {
            this.devices[deviceId].isOnline = isOnline;
            this.devices[deviceId].lastSeen = new Date().toISOString();
            this.saveDevices();
        }
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

    // Xóa tất cả thiết bị
    clearAllDevices() {
        this.devices = {};
        this.saveDevices();
        console.log('[✓] All devices cleared from database');
    }
}

module.exports = new DeviceManager(); 