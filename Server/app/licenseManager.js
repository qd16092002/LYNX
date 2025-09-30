const config = require('./config');
const https = require('https');

class LicenseManager {
    constructor() {
        this.config = config.license;
    }

    // Kiểm tra license có hợp lệ không
    isLicenseValid() {
        if (!this.config.enabled) {
            return { valid: true, message: 'License check disabled' };
        }

        // Sử dụng thời gian server thay vì thời gian local
        const now = this.getServerTime();
        const expireDate = this.parseDate(this.config.expireDate);

        if (!expireDate) {
            return { valid: false, message: 'Invalid license date format' };
        }

        const daysUntilExpiry = this.getDaysUntilExpiry(expireDate, now);

        if (daysUntilExpiry < 0) {
            // License đã hết hạn
            if (this.config.gracePeriod > 0) {
                const gracePeriodEnd = new Date(expireDate);
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.config.gracePeriod);

                if (now > gracePeriodEnd) {
                    return {
                        valid: false,
                        message: 'License has expired and grace period has ended',
                        expired: true,
                        gracePeriodEnd: gracePeriodEnd
                    };
                } else {
                    return {
                        valid: true,
                        message: 'License expired but within grace period',
                        warning: true,
                        gracePeriodEnd: gracePeriodEnd,
                        daysLeftInGrace: this.getDaysUntilExpiry(gracePeriodEnd, now)
                    };
                }
            } else {
                // Không có grace period - hết hạn ngay lập tức
                return {
                    valid: false,
                    message: 'License has expired. No grace period available.',
                    expired: true,
                    gracePeriodEnd: expireDate
                };
            }
        } else if (daysUntilExpiry <= this.config.warningDays) {
            // Sắp hết hạn
            return {
                valid: true,
                message: 'License is valid but expires soon',
                warning: true,
                daysUntilExpiry: daysUntilExpiry,
                expireDate: expireDate
            };
        } else {
            // License hợp lệ
            return {
                valid: true,
                message: 'License is valid',
                daysUntilExpiry: daysUntilExpiry,
                expireDate: expireDate
            };
        }
    }

    // Kiểm tra license với cấu hình bảo mật
    async checkLicense() {
        // Kiểm tra yêu cầu kết nối internet
        if (this.config.requireInternetConnection) {
            const hasInternet = await this.checkInternetConnection();
            if (!hasInternet) {
                return {
                    valid: false,
                    message: 'Internet connection is required to use this application. Please check your internet connection.',
                    expired: true,
                    internetRequired: true
                };
            }
        }

        if (this.config.useInternetTime) {
            return await this.isLicenseValidSecure();
        } else {
            return this.isLicenseValid();
        }
    }

    // Lấy thời gian server (có thể mở rộng để lấy từ API thời gian thực)
    getServerTime() {
        // Hiện tại sử dụng thời gian server local
        // Có thể mở rộng để lấy từ time server API
        return new Date();
    }

    // Kiểm tra kết nối internet
    async checkInternetConnection() {
        return new Promise((resolve) => {
            const options = {
                hostname: 'www.google.com',
                port: 443,
                path: '/',
                method: 'GET',
                timeout: 5000
            };

            const req = https.request(options, (res) => {
                console.log('✅ Internet connection verified');
                resolve(true);
            });

            req.on('error', (error) => {
                console.log('❌ No internet connection:', error.message);
                resolve(false);
            });

            req.on('timeout', () => {
                console.log('❌ Internet connection timeout');
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    // Lấy thời gian từ internet (sử dụng response headers - ổn định hơn)
    async getInternetTime() {
        // Danh sách các server ổn định để lấy thời gian từ response headers
        const timeServers = [
            {
                hostname: 'www.google.com',
                path: '/',
                name: 'Google'
            },
            {
                hostname: 'www.cloudflare.com',
                path: '/',
                name: 'Cloudflare'
            },
            {
                hostname: 'httpbin.org',
                path: '/get',
                name: 'HttpBin'
            }
        ];

        // Thử từng server cho đến khi thành công
        for (let i = 0; i < timeServers.length; i++) {
            const server = timeServers[i];
            try {
                console.log(`🔄 Trying time server ${i + 1}/${timeServers.length}: ${server.name}`);
                const time = await this.getTimeFromHeaders(server);
                console.log('✅ Internet time retrieved successfully:', time.toISOString());
                return time;
            } catch (error) {
                console.warn(`⚠️ Time server ${server.name} failed:`, error.message);
                if (i === timeServers.length - 1) {
                    // Tất cả server đều thất bại
                    throw new Error('All time servers failed: ' + error.message);
                }
            }
        }
    }

    // Lấy thời gian từ response headers (ổn định hơn)
    async getTimeFromHeaders(server) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: server.hostname,
                port: 443,
                path: server.path,
                method: 'HEAD', // Chỉ lấy headers, không cần body
                timeout: 5000
            };

            const req = https.request(options, (res) => {
                // Lấy thời gian từ Date header
                const dateHeader = res.headers.date;
                if (dateHeader) {
                    const internetTime = new Date(dateHeader);
                    resolve(internetTime);
                } else {
                    reject(new Error('No Date header in response'));
                }
            });

            req.on('error', (error) => {
                reject(new Error('Request failed: ' + error.message));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    // Kiểm tra license với thời gian internet (bảo mật cao hơn)
    async isLicenseValidSecure() {
        if (!this.config.enabled) {
            return { valid: true, message: 'License check disabled' };
        }

        try {
            // Thử lấy thời gian từ internet trước
            const now = await this.getInternetTime();
            const expireDate = this.parseDate(this.config.expireDate);

            if (!expireDate) {
                return { valid: false, message: 'Invalid license date format' };
            }

            const daysUntilExpiry = this.getDaysUntilExpiry(expireDate, now);

            if (daysUntilExpiry < 0) {
                // License đã hết hạn
                if (this.config.gracePeriod > 0) {
                    const gracePeriodEnd = new Date(expireDate);
                    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.config.gracePeriod);

                    if (now > gracePeriodEnd) {
                        return {
                            valid: false,
                            message: 'License has expired and grace period has ended',
                            expired: true,
                            gracePeriodEnd: gracePeriodEnd
                        };
                    } else {
                        return {
                            valid: true,
                            message: 'License expired but within grace period',
                            warning: true,
                            gracePeriodEnd: gracePeriodEnd,
                            daysLeftInGrace: this.getDaysUntilExpiry(gracePeriodEnd, now)
                        };
                    }
                } else {
                    // Không có grace period - hết hạn ngay lập tức
                    return {
                        valid: false,
                        message: 'License has expired. No grace period available.',
                        expired: true,
                        gracePeriodEnd: expireDate
                    };
                }
            } else if (daysUntilExpiry <= this.config.warningDays) {
                // Sắp hết hạn
                return {
                    valid: true,
                    message: 'License is valid but expires soon',
                    warning: true,
                    daysUntilExpiry: daysUntilExpiry,
                    expireDate: expireDate
                };
            } else {
                // License hợp lệ
                return {
                    valid: true,
                    message: 'License is valid',
                    daysUntilExpiry: daysUntilExpiry,
                    expireDate: expireDate
                };
            }
        } catch (error) {
            console.error('❌ Internet time check failed:', error.message);

            // Kiểm tra xem có cho phép fallback không
            if (this.config.allowOfflineFallback) {
                console.warn('⚠️ Falling back to local time (less secure)');
                return this.isLicenseValid();
            } else {
                // KHÔNG fallback về local time để tránh bypass
                return {
                    valid: false,
                    message: 'Cannot verify license due to internet connectivity issues. Please check your internet connection.',
                    expired: true,
                    internetError: true
                };
            }
        }
    }

    // Parse date từ format DD/MM/YYYY
    parseDate(dateString) {
        try {
            const parts = dateString.split('/');
            if (parts.length !== 3) return null;

            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[2], 10);

            if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
            if (day < 1 || day > 31 || month < 0 || month > 11) return null;

            return new Date(year, month, day);
        } catch (error) {
            console.error('Error parsing date:', error);
            return null;
        }
    }

    // Tính số ngày còn lại đến ngày hết hạn
    getDaysUntilExpiry(expireDate, currentTime = null) {
        const now = currentTime || this.getServerTime();
        const timeDiff = expireDate.getTime() - now.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    // Lấy thông tin license chi tiết
    getLicenseInfo() {
        const status = this.isLicenseValid();
        const expireDate = this.parseDate(this.config.expireDate);

        return {
            ...status,
            config: {
                enabled: this.config.enabled,
                expireDate: this.config.expireDate,
                gracePeriod: this.config.gracePeriod,
                warningDays: this.config.warningDays
            },
            expireDate: expireDate,
            currentDate: new Date().toISOString()
        };
    }

    // Kiểm tra xem có nên hiển thị cảnh báo không
    async shouldShowWarning() {
        const status = await this.checkLicense();
        return status.warning || false;
    }

    // Kiểm tra xem có nên chặn hoàn toàn không
    async shouldBlock() {
        const status = await this.checkLicense();
        return !status.valid && status.expired;
    }

    // Lấy thông báo cho người dùng
    async getUserMessage() {
        const status = await this.checkLicense();

        if (!status.valid && status.expired) {
            return {
                type: 'error',
                title: 'License Expired',
                message: 'Your license has expired and the grace period has ended. Please contact support to renew your license.',
                canContinue: false
            };
        } else if (status.warning && status.daysUntilExpiry !== undefined) {
            if (status.daysUntilExpiry <= 0) {
                return {
                    type: 'warning',
                    title: 'License Expired - Grace Period',
                    message: `Your license has expired but you have ${status.daysLeftInGrace} days left in the grace period. Please renew your license soon.`,
                    canContinue: true
                };
            } else {
                return {
                    type: 'warning',
                    title: 'License Expiring Soon',
                    message: `Your license will expire in ${status.daysUntilExpiry} days. Please consider renewing your license.`,
                    canContinue: true
                };
            }
        } else {
            return {
                type: 'info',
                title: 'License Valid',
                message: `Your license is valid until ${this.config.expireDate}.`,
                canContinue: true
            };
        }
    }
}

module.exports = new LicenseManager();
