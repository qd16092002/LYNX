module.exports = {
    maxDevice: 2,
    maxLocationHistory: 50,
    expire: "2/10/2025",
    // License configuration
    license: {
        enabled: true,
        expireDate: "2/10/2025", // DD/MM/YYYY format
        gracePeriod: 0, // days after expiry before complete shutdown (0 = no grace period)
        warningDays: 30, // days before expiry to show warning
        useInternetTime: true, // use internet time for more security
        timeServer: "worldtimeapi.org" // time server API
    }
};