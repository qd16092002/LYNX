module.exports = {
    maxDevice: 20,
    maxLocationHistory: 50,
    expire: "25/10/2025",

    // Device ID whitelist configuration
    deviceWhitelist: {
        enabled: true, // Enable/disable device ID checking
        allowedDevices: [
            "CC-28-AA-34-79-A9",        // MAC Address card mạng Ethernet của máy server này
            "D8-43-AE-73-20-90"
        ]
    },

    // Offline location tracking configuration
    offlineLocation: {
        enabled: true,
        intervalMinutes: 15, // Save location every 15 minutes when offline
        maxOfflineLocations: 100 // Maximum number of offline locations to store
    },

    // License configuration
    license: {
        enabled: true,
        expireDate: "25/10/2025", // DD/MM/YYYY format
        gracePeriod: 0, // days after expiry before complete shutdown (0 = no grace period)
        warningDays: 30, // days before expiry to show warning
        useInternetTime: true, // use internet time for more security
        timeServer: "worldtimeapi.org", // time server API
        allowOfflineFallback: false, // allow fallback to local time when offline (false = more secure)
        requireInternetConnection: true // require internet connection to use the app (true = maximum security)
    }
};