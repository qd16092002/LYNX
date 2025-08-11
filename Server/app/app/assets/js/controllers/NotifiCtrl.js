const { remote } = require('electron');
const { ipcRenderer } = require('electron');
var app = angular.module('myappy', []);



var victim = remote.getCurrentWebContents().victim;


app.controller("NotifiCtrl", function ($scope, $location) {
    $NotifiCtrl = $scope;

    $NotifiCtrl.victimSocket = victim.ip + ":" + victim.port;
    $NotifiCtrl.victimModel = victim.model;
    $NotifiCtrl.victimCountry = victim.country;
    $NotifiCtrl.victimNote = victim.note || '';

    // Hiển thị thông báo khác nhau nếu có ghi chú
    if ($NotifiCtrl.victimNote) {
        $NotifiCtrl.notificationMessage = `Device reconnected with note: "${$NotifiCtrl.victimNote}"`;
    } else {
        $NotifiCtrl.notificationMessage = 'New device connected';
    }
});