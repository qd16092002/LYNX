# FileManager Improvements

## Các tính năng mới đã được thêm vào FileManager

### 1. Lọc sâu hơn (Enhanced Filtering)
- **Filter theo loại file chi tiết hơn:**
  - Images: jpg, jpeg, png, gif, bmp, tiff, tif, webp, svg, ico, raw, heic, heif
  - Videos: mp4, avi, mov, wmv, flv, webm, mkv, m4v, 3gp, mpg, mpeg, ts, vob, ogv, divx, xvid, rm, rmvb, asf, swf
  - Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, odt, ods, odp, md, log, csv, json, xml, html, htm, css, js, php, py, java, c, cpp, h, sql, sh, bat, ps1
  - Audio: mp3, wav, flac, aac, ogg, wma, m4a, aiff, au, ra, mid, midi
  - Archives: zip, rar, 7z, tar, gz, bz2, xz, lzma, arj, cab, iso, dmg

### 2. Tìm kiếm toàn bộ máy (Device-wide Search)
- **Tìm kiếm tất cả file cùng loại trong toàn bộ thiết bị:**
  - Search All Images: Tìm tất cả ảnh trong máy
  - Search All Videos: Tìm tất cả video trong máy
  - Search All Documents: Tìm tất cả tài liệu trong máy
  - Search All Audio: Tìm tất cả file âm thanh trong máy
  - Search All Archives: Tìm tất cả file nén trong máy

### 3. Tìm kiếm theo tên file (File Name Search)
- **Tìm kiếm file theo tên:**
  - Nhập tên file vào ô tìm kiếm
  - Nhấn Enter hoặc click nút Search
  - Tìm kiếm đệ quy trong toàn bộ thiết bị

### 4. Giao diện cải tiến (Enhanced UI)
- **Breadcrumb navigation:** Hiển thị đường dẫn hiện tại
- **Filter buttons:** Các nút lọc với màu sắc phân biệt
- **Search buttons:** Các nút tìm kiếm với màu sắc riêng cho từng loại file
- **Search results view:** Hiển thị kết quả tìm kiếm với thông tin chi tiết
- **Back to folder view:** Nút quay lại chế độ xem thư mục

### 5. Tính năng hàng loạt (Batch Operations)
- **Download All:** Tải xuống tất cả file trong kết quả tìm kiếm
- **Delete All:** Xóa tất cả file trong kết quả tìm kiếm (có xác nhận)

### 6. Hiển thị thông tin chi tiết (Detailed Information)
- **Trong chế độ tìm kiếm:**
  - Tên file
  - Đường dẫn thư mục cha
  - Kích thước file
  - Icon theo loại file

## Cách sử dụng

### Lọc file trong thư mục hiện tại:
1. Click vào các nút filter (All, Images, Videos, Documents, Audio, Archives)
2. Chỉ những file thuộc loại được chọn sẽ hiển thị

### Tìm kiếm toàn bộ máy:
1. Click vào các nút "Search All [Type]" (ví dụ: "Search All Images")
2. Hệ thống sẽ tìm kiếm tất cả file cùng loại trong toàn bộ thiết bị
3. Kết quả sẽ hiển thị với thông tin chi tiết

### Tìm kiếm theo tên:
1. Nhập tên file vào ô tìm kiếm
2. Nhấn Enter hoặc click nút Search
3. Hệ thống sẽ tìm tất cả file có tên chứa từ khóa

### Thao tác hàng loạt:
1. Sau khi có kết quả tìm kiếm
2. Click "Download All" để tải xuống tất cả file
3. Click "Delete All" để xóa tất cả file (có xác nhận)

### Quay lại chế độ thư mục:
1. Click "Back to Folder View" để quay lại chế độ xem thư mục bình thường

## Cải tiến kỹ thuật

### Backend (Java):
- Thêm các phương thức tìm kiếm đệ quy trong `FileManager.java`
- Hỗ trợ tìm kiếm theo loại file và tên file
- Tối ưu hóa bằng cách bỏ qua các thư mục hệ thống
- Cập nhật `ConnectionManager.java` để xử lý các yêu cầu tìm kiếm mới

### Frontend (JavaScript/Angular):
- Thêm các controller functions cho tìm kiếm
- Cải tiến giao diện với các nút và chế độ hiển thị mới
- Hỗ trợ infinite scrolling cho kết quả tìm kiếm
- Thêm các tính năng hàng loạt

### UI/UX:
- Giao diện responsive với flexbox
- Màu sắc phân biệt cho từng loại file
- Icon trực quan cho từng loại file
- Breadcrumb navigation
- Thông báo số lượng file tìm thấy

## Lưu ý bảo mật
- Hệ thống bỏ qua các thư mục hệ thống quan trọng để tránh lỗi
- Có xác nhận trước khi xóa hàng loạt
- Giới hạn số lượng file hiển thị để tránh quá tải
- Tải xuống tuần tự để tránh quá tải mạng
