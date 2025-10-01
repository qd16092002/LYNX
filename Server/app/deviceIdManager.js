const os = require('os');
const crypto = require('crypto');
const config = require('./config');

class DeviceIdManager {
    constructor() {
        this.config = config.deviceWhitelist || {};
    }

    // Lấy MAC Address của máy hiện tại (Device ID)
    getCurrentDeviceId() {
        try {
            // Phương pháp 1: Lấy MAC Address từ getmac command (nhanh và đơn giản)
            const { execSync } = require('child_process');

            let macAddress = null;

            // Thử lấy MAC Address từ getmac command
            try {
                const result = execSync('getmac', { encoding: 'utf8', timeout: 5000 });
                const lines = result.split('\n');

                for (const line of lines) {
                    // Tìm dòng có địa chỉ MAC (format: XX-XX-XX-XX-XX-XX)
                    const match = line.match(/([0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2})/i);
                    if (match && !line.includes('Media disconnected')) {
                        macAddress = match[1].toUpperCase();
                        console.log('🔍 MAC Address (getmac):', macAddress);
                        return macAddress;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Cannot get MAC from getmac:', error.message);
            }

            // Phương pháp 2: Lấy từ Node.js os.networkInterfaces() (backup)
            if (!macAddress) {
                const networkInterfaces = os.networkInterfaces();

                for (const interfaceName in networkInterfaces) {
                    const interfaces = networkInterfaces[interfaceName];
                    for (const iface of interfaces) {
                        // Chỉ lấy interface không phải loopback và có MAC address thực
                        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                            macAddress = iface.mac.toUpperCase().replace(/:/g, '-');
                            console.log('🔍 MAC Address (Node.js):', macAddress);
                            return macAddress;
                        }
                    }
                }
            }

            // Phương pháp 3: Lấy từ PowerShell (fallback)
            if (!macAddress) {
                try {
                    const psCommand = 'powershell -Command "Get-NetAdapter | Where-Object {$_.Status -eq \'Up\'} | Select-Object -First 1 -ExpandProperty MacAddress"';
                    const result = execSync(psCommand, { encoding: 'utf8', timeout: 5000 });
                    macAddress = result.trim().toUpperCase();

                    if (macAddress && macAddress !== 'null' && macAddress !== '') {
                        console.log('🔍 MAC Address (PowerShell):', macAddress);
                        return macAddress;
                    }
                } catch (error) {
                    console.warn('⚠️ Cannot get MAC from PowerShell:', error.message);
                }
            }

            // Nếu vẫn không lấy được, fallback về custom method
            if (!macAddress) {
                console.warn('⚠️ Falling back to custom Device ID generation');
                return this.getCustomDeviceId();
            }

            return macAddress;

        } catch (error) {
            console.error('❌ Error getting MAC Address:', error.message);
            console.warn('⚠️ Falling back to custom Device ID generation');
            return this.getCustomDeviceId();
        }
    }

    // Fallback method - tạo custom Device ID
    getCustomDeviceId() {
        try {
            // Tạo Device ID dựa trên thông tin phần cứng
            const networkInterfaces = os.networkInterfaces();
            const cpus = os.cpus();

            // Lấy MAC address đầu tiên
            let macAddress = '';
            for (const interfaceName in networkInterfaces) {
                const interfaces = networkInterfaces[interfaceName];
                for (const iface of interfaces) {
                    if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                        macAddress = iface.mac;
                        break;
                    }
                }
                if (macAddress) break;
            }

            // Lấy thông tin CPU
            const cpuInfo = cpus[0] ? `${cpus[0].model}-${cpus[0].speed}` : 'unknown';

            // Lấy hostname
            const hostname = os.hostname();

            // Tạo chuỗi duy nhất từ thông tin phần cứng
            const hardwareInfo = `${macAddress}-${cpuInfo}-${hostname}`;

            // Tạo hash MD5 để có Device ID ngắn gọn
            const deviceId = crypto.createHash('md5').update(hardwareInfo).digest('hex').toUpperCase();

            // Format thành UUID-like format để dễ đọc
            const formattedDeviceId = this.formatDeviceId(deviceId);

            console.log('🔍 Custom Device ID:', formattedDeviceId);
            return formattedDeviceId;

        } catch (error) {
            console.error('❌ Error getting custom Device ID:', error.message);
            return null;
        }
    }

    // Format Device ID thành dạng UUID
    formatDeviceId(deviceId) {
        return deviceId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    }

    // Kiểm tra Device ID có trong whitelist không
    isDeviceAllowed(deviceId = null) {
        if (!this.config.enabled) {
            console.log('⚠️ Device whitelist is disabled');
            return true;
        }

        const currentDeviceId = deviceId || this.getCurrentDeviceId();
        if (!currentDeviceId) {
            console.error('❌ Cannot get Device ID');
            return false;
        }

        const allowedDevices = this.config.allowedDevices || [];
        const isAllowed = allowedDevices.includes(currentDeviceId);

        console.log(`🔍 Device ID: ${currentDeviceId}`);
        console.log(`📋 Allowed devices: ${allowedDevices.length}`);
        console.log(`✅ Device allowed: ${isAllowed}`);

        return isAllowed;
    }

    // Thêm Device ID vào whitelist
    addDeviceToWhitelist(deviceId) {
        if (!this.config.allowedDevices) {
            this.config.allowedDevices = [];
        }

        if (!this.config.allowedDevices.includes(deviceId)) {
            this.config.allowedDevices.push(deviceId);
            console.log(`✅ Added device to whitelist: ${deviceId}`);
            return true;
        } else {
            console.log(`⚠️ Device already in whitelist: ${deviceId}`);
            return false;
        }
    }

    // Xóa Device ID khỏi whitelist
    removeDeviceFromWhitelist(deviceId) {
        if (!this.config.allowedDevices) {
            return false;
        }

        const index = this.config.allowedDevices.indexOf(deviceId);
        if (index > -1) {
            this.config.allowedDevices.splice(index, 1);
            console.log(`✅ Removed device from whitelist: ${deviceId}`);
            return true;
        } else {
            console.log(`⚠️ Device not found in whitelist: ${deviceId}`);
            return false;
        }
    }

    // Lấy danh sách Device ID được phép
    getAllowedDevices() {
        return this.config.allowedDevices || [];
    }

    // Kiểm tra và trả về thông tin chi tiết
    checkDeviceStatus(deviceId = null) {
        const currentDeviceId = deviceId || this.getCurrentDeviceId();
        const isAllowed = this.isDeviceAllowed(currentDeviceId);
        const allowedDevices = this.getAllowedDevices();

        return {
            deviceId: currentDeviceId,
            isAllowed: isAllowed,
            allowedDevices: allowedDevices,
            whitelistEnabled: this.config.enabled,
            message: isAllowed ? 'Device is authorized' : 'Device is not authorized'
        };
    }
}

module.exports = new DeviceIdManager();
