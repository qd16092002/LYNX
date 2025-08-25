package com.android.background.services.helpers;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class NetworkManager {
    private static final String TAG = "NetworkManager";
    private Context context;
    private ConnectivityManager connectivityManager;
    private WifiManager wifiManager;
    private TelephonyManager telephonyManager;

    public NetworkManager(Context context) {
        this.context = context;
        this.connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        this.wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        this.telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
    }

    /**
     * Lấy thông tin tổng hợp về mạng
     */
    public JSONObject getNetworkInfo() {
        JSONObject networkInfo = new JSONObject();
        try {
            networkInfo.put("wifi", getWifiInfo());
            networkInfo.put("mobile", getMobileInfo());
            networkInfo.put("connection", getConnectionStatus());
            networkInfo.put("timestamp", System.currentTimeMillis());
        } catch (JSONException e) {
            Log.e(TAG, "Error creating network info JSON: " + e.getMessage());
        }
        return networkInfo;
    }

    /**
     * Lấy thông tin WiFi
     */
    public JSONObject getWifiInfo() {
        JSONObject wifiInfo = new JSONObject();
        try {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
                if (wifiManager.isWifiEnabled()) {
                    WifiInfo wifi = wifiManager.getConnectionInfo();
                    if (wifi != null && wifi.getNetworkId() != -1) {
                        wifiInfo.put("enabled", true);
                        wifiInfo.put("ssid", wifi.getSSID().replace("\"", "") + " (WiFi network name)");
                        wifiInfo.put("bssid", wifi.getBSSID() + " (Router MAC address)");
                        
                        // Chuyển đổi RSSI thành text dễ hiểu
                        int rssi = wifi.getRssi();
                        String signalText = getSignalStrengthText(rssi);
                        wifiInfo.put("signal_strength", signalText + " (" + rssi + " dBm)");
                        
                        wifiInfo.put("link_speed", wifi.getLinkSpeed() + " Mbps (Connection speed)");
                        
                        // Chuyển đổi frequency thành text dễ hiểu
                        int freq = wifi.getFrequency();
                        String freqText = getFrequencyText(freq);
                        wifiInfo.put("frequency", freqText + " (" + freq + " MHz)");
                        
                        wifiInfo.put("ip_address", intToIp(wifi.getIpAddress()) + " (IP Local)");
                        wifiInfo.put("mac_address", wifi.getMacAddress() + " (MAC device)");
                        wifiInfo.put("network_id", wifi.getNetworkId() + " (Network ID)");
                    } else {
                        wifiInfo.put("enabled", true);
                        wifiInfo.put("connected", false);
                        wifiInfo.put("message", "WiFi is enabled but not connected");
                    }
                } else {
                    wifiInfo.put("enabled", false);
                    wifiInfo.put("message", "WiFi is disabled");
                }
            } else {
                wifiInfo.put("enabled", false);
                wifiInfo.put("message", "WiFi permission not granted");
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error creating WiFi info JSON: " + e.getMessage());
        }
        return wifiInfo;
    }

    /**
     * Lấy thông tin mạng di động
     */
    public JSONObject getMobileInfo() {
        JSONObject mobileInfo = new JSONObject();
        try {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                NetworkInfo mobileNetworkInfo = connectivityManager.getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
                if (mobileNetworkInfo != null && mobileNetworkInfo.isConnected()) {
                    mobileInfo.put("enabled", true);
                    mobileInfo.put("connected", true);
                    mobileInfo.put("type", getMobileNetworkType());
                    mobileInfo.put("operator", telephonyManager.getNetworkOperatorName());
                    
                    // Lấy MCC và MNC một cách an toàn
                    String networkOperator = telephonyManager.getNetworkOperator();
                    if (networkOperator != null && networkOperator.length() >= 5) {
                        String mcc = networkOperator.substring(0, 3);
                        String mnc = networkOperator.substring(3);
                        mobileInfo.put("mcc", mcc + " (Country code)");
                        mobileInfo.put("mnc", mnc + " (Network code)");
                    } else {
                        mobileInfo.put("mcc", "Cannot determine country code");
                        mobileInfo.put("mnc", "Cannot determine network code");
                    }
                    
                    // Lấy thông tin SIM
                    String simCountry = telephonyManager.getSimCountryIso();
                    if (simCountry != null && !simCountry.isEmpty()) {
                        mobileInfo.put("sim_country", simCountry + " (SIM country)");
                    } else {
                        mobileInfo.put("sim_country", "Cannot determine SIM country");
                    }
                    
                    // Lấy device ID - sử dụng method hoàn toàn an toàn
                    try {
                        // Sử dụng Build.MODEL và Build.MANUFACTURER thay vì getSerial (không yêu cầu permission)
                        String deviceInfo = android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL;
                        mobileInfo.put("device_id", deviceInfo + " (Device)");
                    } catch (Exception e) {
                        mobileInfo.put("device_id", "Cannot determine device");
                    }
                    
                    // Lấy subscriber ID - sử dụng method hoàn toàn an toàn
                    try {
                        // Sử dụng getSimCountryIso() và getNetworkOperator() thay vì getSimSerialNumber (không yêu cầu permission đặc quyền)
                        String simInfo = telephonyManager.getSimCountryIso() + " - " + telephonyManager.getNetworkOperator();
                        mobileInfo.put("subscriber_id", simInfo + " (SIM info)");
                    } catch (Exception e) {
                        mobileInfo.put("subscriber_id", "Cannot determine SIM info");
                    }
                    
                    // Lấy số điện thoại
                    String phoneNumber = telephonyManager.getLine1Number();
                    if (phoneNumber != null && !phoneNumber.isEmpty()) {
                        mobileInfo.put("phone_number", phoneNumber + " (Phone number)");
                    } else {
                        mobileInfo.put("phone_number", "Cannot determine phone number");
                    }
                    
                    // Lấy IP public (nếu có thể)
                    try {
                        String publicIp = getPublicIP();
                        if (publicIp != null && !publicIp.isEmpty()) {
                            mobileInfo.put("public_ip", publicIp + " (IP Public)");
                        } else {
                            mobileInfo.put("public_ip", "Cannot get public IP");
                        }
                    } catch (Exception e) {
                        mobileInfo.put("public_ip", "Error getting public IP");
                    }
                } else {
                    mobileInfo.put("enabled", true);
                    mobileInfo.put("connected", false);
                    mobileInfo.put("message", "Mobile network not connected");
                }
            } else {
                mobileInfo.put("enabled", false);
                mobileInfo.put("message", "Phone state permission not granted");
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error creating mobile info JSON: " + e.getMessage());
        }
        return mobileInfo;
    }

    /**
     * Lấy trạng thái kết nối tổng thể
     */
    public JSONObject getConnectionStatus() {
        JSONObject connectionStatus = new JSONObject();
        try {
            Network activeNetwork = connectivityManager.getActiveNetwork();
            if (activeNetwork != null) {
                NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(activeNetwork);
                if (capabilities != null) {
                    connectionStatus.put("has_internet", capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) ? "Has internet" : "No internet");
                    connectionStatus.put("has_validated", capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) ? "Has validated" : "No validated");
                    connectionStatus.put("has_wifi", capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ? "Has WiFi" : "No WiFi");
                    connectionStatus.put("has_cellular", capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ? "Has mobile" : "No mobile");
                    connectionStatus.put("has_ethernet", capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ? "Has ethernet" : "No ethernet");
                    connectionStatus.put("has_bluetooth", capabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) ? "Has bluetooth" : "No bluetooth");
                    connectionStatus.put("has_vpn", capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN) ? "Has VPN" : "No VPN");
                }
            } else {
                connectionStatus.put("has_internet", false);
                connectionStatus.put("message", "No active network");
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error creating connection status JSON: " + e.getMessage());
        }
        return connectionStatus;
    }

    /**
     * Lấy danh sách các mạng WiFi có sẵn
     */
    public JSONArray getAvailableWifiNetworks() {
        JSONArray networks = new JSONArray();
        try {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
                if (wifiManager.isWifiEnabled()) {
                    List<android.net.wifi.ScanResult> scanResults = wifiManager.getScanResults();
                    for (android.net.wifi.ScanResult result : scanResults) {
                        JSONObject network = new JSONObject();
                        network.put("ssid", result.SSID);
                        network.put("bssid", result.BSSID);
                        network.put("capabilities", result.capabilities);
                        network.put("level", result.level);
                        network.put("frequency", result.frequency);
                        network.put("timestamp", result.timestamp);
                        networks.put(network);
                    }
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error creating WiFi networks JSON: " + e.getMessage());
        }
        return networks;
    }

    /**
     * Lấy thông tin chi tiết về mạng di động
     */
    public JSONObject getDetailedMobileInfo() {
        JSONObject detailedInfo = new JSONObject();
        try {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                detailedInfo.put("network_type", getMobileNetworkType());
                detailedInfo.put("data_state", getDataState());
                detailedInfo.put("roaming", telephonyManager.isNetworkRoaming());
                detailedInfo.put("sim_state", getSimState());
                detailedInfo.put("phone_type", getPhoneType());
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error creating detailed mobile info JSON: " + e.getMessage());
        }
        return detailedInfo;
    }

    /**
     * Chuyển đổi IP address từ int sang string
     */
    private String intToIp(int ip) {
        return String.format("%d.%d.%d.%d",
                (ip & 0xff),
                (ip >> 8 & 0xff),
                (ip >> 16 & 0xff),
                (ip >> 24 & 0xff));
    }
    
    /**
     * Lấy IP public từ internet
     */
    private String getPublicIP() {
        try {
            // Sử dụng multiple services để tăng khả năng thành công
            String[] ipServices = {
                "https://api.ipify.org",
                "https://checkip.amazonaws.com",
                "https://icanhazip.com"
            };
            
            for (String service : ipServices) {
                try {
                    java.net.URL url = new java.net.URL(service);
                    java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                    connection.setConnectTimeout(5000);
                    connection.setReadTimeout(5000);
                    connection.setRequestMethod("GET");
                    
                    if (connection.getResponseCode() == 200) {
                        java.io.BufferedReader reader = new java.io.BufferedReader(
                            new java.io.InputStreamReader(connection.getInputStream()));
                        String ip = reader.readLine().trim();
                        reader.close();
                        connection.disconnect();
                        return ip;
                    }
                    connection.disconnect();
                } catch (Exception e) {
                    // Tiếp tục với service tiếp theo
                    continue;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting public IP: " + e.getMessage());
        }
                return null;
    }
    
    /**
     * Chuyển đổi RSSI thành text dễ hiểu
     */
    private String getSignalStrengthText(int rssi) {
        if (rssi >= -50) return "Very strong signal";
        else if (rssi >= -60) return "Strong signal";
        else if (rssi >= -70) return "Good signal";
        else if (rssi >= -80) return "Average signal";
        else if (rssi >= -90) return "Weak signal";
        else return "Very weak signal";
    }
    
    /**
     * Chuyển đổi frequency thành text dễ hiểu
     */
    private String getFrequencyText(int frequency) {
        if (frequency >= 2400 && frequency <= 2500) return "2.4 GHz";
        else if (frequency >= 5000 && frequency <= 6000) return "5 GHz";
        else if (frequency >= 6000 && frequency <= 7000) return "6 GHz";
        else return "Unknown frequency";
    }
    
    /**
     * Lấy loại mạng di động
     */
    private String getMobileNetworkType() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            int networkType = telephonyManager.getDataNetworkType();
            
            switch (networkType) {
                case TelephonyManager.NETWORK_TYPE_GPRS:
                    return "GPRS (2G)";
                case TelephonyManager.NETWORK_TYPE_EDGE:
                    return "EDGE (2G)";
                case TelephonyManager.NETWORK_TYPE_UMTS:
                    return "UMTS (3G)";
                case TelephonyManager.NETWORK_TYPE_HSDPA:
                    return "HSDPA (3G)";
                case TelephonyManager.NETWORK_TYPE_HSUPA:
                    return "HSUPA (3G)";
                case TelephonyManager.NETWORK_TYPE_HSPA:
                    return "HSPA (3G)";
                case TelephonyManager.NETWORK_TYPE_HSPAP:
                    return "HSPA+ (3G)";
                case TelephonyManager.NETWORK_TYPE_LTE:
                    return "LTE (4G)";
                // NETWORK_TYPE_LTE_CA không tồn tại trong Android API
                case TelephonyManager.NETWORK_TYPE_EVDO_0:
                    return "EVDO 0 (3G)";
                case TelephonyManager.NETWORK_TYPE_EVDO_A:
                    return "EVDO A (3G)";
                case TelephonyManager.NETWORK_TYPE_EVDO_B:
                    return "EVDO B (3G)";
                case TelephonyManager.NETWORK_TYPE_1xRTT:
                    return "1xRTT (2G)";
                case TelephonyManager.NETWORK_TYPE_IDEN:
                    return "iDEN (2G)";
                case TelephonyManager.NETWORK_TYPE_CDMA:
                    return "CDMA (2G)";
                case TelephonyManager.NETWORK_TYPE_GSM:
                    return "GSM (2G)";
                case TelephonyManager.NETWORK_TYPE_TD_SCDMA:
                    return "TD-SCDMA (3G)";
                case TelephonyManager.NETWORK_TYPE_IWLAN:
                    return "IWLAN (4G)";
                default:
                    // Kiểm tra phiên bản Android trước khi sử dụng NETWORK_TYPE_NR
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                        if (networkType == 20) { // NETWORK_TYPE_NR = 20
                            return "5G NR (5G)";
                        }
                    }
                    // Nếu không nhận diện được, trả về giá trị số để debug
                    return "Unknown (" + networkType + ")";
            }
        }
        return "Permission denied";
    }

    /**
     * Lấy trạng thái dữ liệu
     */
    private String getDataState() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            switch (telephonyManager.getDataState()) {
                case TelephonyManager.DATA_DISCONNECTED:
                    return "Disconnected";
                case TelephonyManager.DATA_CONNECTING:
                    return "Connecting";
                case TelephonyManager.DATA_CONNECTED:
                    return "Connected";
                case TelephonyManager.DATA_SUSPENDED:
                    return "Suspended";
                default:
                    return "Unknown";
            }
        }
        return "Permission denied";
    }

    /**
     * Lấy trạng thái SIM
     */
    private String getSimState() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            switch (telephonyManager.getSimState()) {
                case TelephonyManager.SIM_STATE_UNKNOWN:
                    return "Unknown";
                case TelephonyManager.SIM_STATE_ABSENT:
                    return "Absent";
                case TelephonyManager.SIM_STATE_PIN_REQUIRED:
                    return "PIN Required";
                case TelephonyManager.SIM_STATE_PUK_REQUIRED:
                    return "PUK Required";
                case TelephonyManager.SIM_STATE_NETWORK_LOCKED:
                    return "Network Locked";
                case TelephonyManager.SIM_STATE_READY:
                    return "Ready";
                case TelephonyManager.SIM_STATE_NOT_READY:
                    return "Not Ready";
                case TelephonyManager.SIM_STATE_PERM_DISABLED:
                    return "Permanently Disabled";
                case TelephonyManager.SIM_STATE_CARD_IO_ERROR:
                    return "Card IO Error";
                case TelephonyManager.SIM_STATE_CARD_RESTRICTED:
                    return "Card Restricted";
                default:
                    return "Unknown";
            }
        }
        return "Permission denied";
    }

    /**
     * Lấy loại điện thoại
     */
    private String getPhoneType() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            switch (telephonyManager.getPhoneType()) {
                case TelephonyManager.PHONE_TYPE_NONE:
                    return "None";
                case TelephonyManager.PHONE_TYPE_GSM:
                    return "GSM";
                case TelephonyManager.PHONE_TYPE_CDMA:
                    return "CDMA";
                case TelephonyManager.PHONE_TYPE_SIP:
                    return "SIP";
                default:
                    // Kiểm tra phiên bản Android trước khi sử dụng PHONE_TYPE_NR
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                        if (telephonyManager.getPhoneType() == 4) { // PHONE_TYPE_NR = 4
                            return "5G NR";
                        }
                    }
                    return "Unknown";
            }
        }
        return "Permission denied";
    }
}
