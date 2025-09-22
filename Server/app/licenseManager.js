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

    // Lấy thời gian từ internet (tăng cường bảo mật)
    async getInternetTime() {
        return new Promise((resolve, reject) => {
            const timeServer = this.config.timeServer || 'worldtimeapi.org';
            const options = {
                hostname: timeServer,
                port: 443,
                path: '/api/timezone/UTC',
                method: 'GET',
                timeout: 5000
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const timeData = JSON.parse(data);
                        const internetTime = new Date(timeData.utc_datetime);
                        resolve(internetTime);
                    } catch (error) {
                        console.warn('Failed to parse internet time, using local time:', error.message);
                        resolve(new Date());
                    }
                });
            });

            req.on('error', (error) => {
                console.warn('Failed to get internet time, using local time:', error.message);
                resolve(new Date());
            });

            req.on('timeout', () => {
                console.warn('Internet time request timeout, using local time');
                req.destroy();
                resolve(new Date());
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
            console.warn('Internet time check failed, falling back to local time:', error.message);
            // Fallback về kiểm tra local time
            return this.isLicenseValid();
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
    shouldShowWarning() {
        const status = this.isLicenseValid();
        return status.warning || false;
    }

    // Kiểm tra xem có nên chặn hoàn toàn không
    shouldBlock() {
        const status = this.isLicenseValid();
        return !status.valid && status.expired;
    }

    // Lấy thông báo cho người dùng
    getUserMessage() {
        const status = this.isLicenseValid();

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
