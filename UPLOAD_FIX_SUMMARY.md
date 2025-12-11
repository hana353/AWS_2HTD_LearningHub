# Sửa lỗi Upload File lên S3

## Vấn đề phát hiện:
Khi tải file từ S3 về và mở trên máy tính, file không mở được → file bị lỗi khi upload.

## Nguyên nhân:

### 1. **Thay đổi ContentType không đúng** (LỖI NGHIÊM TRỌNG)
Code cũ đang thay đổi ContentType tùy tiện:
- `video/quicktime` → `video/mp4` 
- `video/x-msvideo` → `video/avi`

**Vấn đề**: Điều này làm S3 lưu file với ContentType sai, khiến file không mở được vì:
- File thực tế vẫn là QuickTime (.mov) nhưng được đánh dấu là MP4
- File thực tế vẫn là AVI nhưng được đánh dấu là AVI với ContentType khác
- Browser/OS dựa vào ContentType để xác định cách mở file

### 2. **Thiếu validation cho buffer**
- Không kiểm tra buffer có hợp lệ không
- Không kiểm tra buffer có rỗng không
- Không log thông tin debug để troubleshoot

### 3. **Không đảm bảo binary data được giữ nguyên**
- Cần đảm bảo buffer không bị modify trong quá trình upload

## Các thay đổi đã thực hiện:

### 1. Sửa `s3.service.js`:
- ✅ **Loại bỏ việc thay đổi ContentType tùy tiện**: Giữ nguyên ContentType từ client
- ✅ **Thêm validation cho buffer**: Kiểm tra buffer hợp lệ và không rỗng
- ✅ **Thêm logging chi tiết**: Log buffer info (first/last bytes) để debug
- ✅ **Đảm bảo binary data**: AWS SDK tự xử lý đúng, không cần can thiệp

### 2. Sửa `upload.controller.js`:
- ✅ **Thêm validation cho tất cả upload functions**:
  - `uploadLectureFile`: Validate buffer trước khi upload
  - `uploadAvatar`: Validate buffer trước khi upload
  - `uploadFlashcardFile`: Validate buffer trước khi upload
  - `uploadImage`: Validate buffer trước khi upload
- ✅ **Thêm logging chi tiết**: Log size mismatch nếu có
- ✅ **Kiểm tra buffer type**: Đảm bảo là Buffer object

## Code changes:

### `s3.service.js`:
```javascript
// TRƯỚC (SAI):
if (normalizedContentType === 'video/quicktime') {
  normalizedContentType = 'video/mp4'; // ❌ SAI - làm file không mở được
}

// SAU (ĐÚNG):
// Giữ nguyên ContentType từ client
let normalizedContentType = contentType || 'application/octet-stream';
// Không thay đổi ContentType tùy tiện
```

### `upload.controller.js`:
```javascript
// Thêm validation:
if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
  return res.status(400).json({ message: 'Invalid file: buffer is corrupted' });
}

if (req.file.buffer.length === 0) {
  return res.status(400).json({ message: 'Invalid file: file is empty' });
}
```

## Cách test:

1. **Upload file video** (ví dụ: .mov, .mp4, .avi):
   - Upload file lên S3
   - Tải file về từ S3
   - Mở file trên máy tính → Phải mở được

2. **Upload file PDF**:
   - Upload PDF lên S3
   - Tải file về từ S3
   - Mở file bằng PDF reader → Phải mở được

3. **Upload file image**:
   - Upload image lên S3
   - Tải file về từ S3
   - Mở file bằng image viewer → Phải mở được

4. **Kiểm tra logs**:
   - Xem console logs để đảm bảo:
     - Buffer size đúng
     - ContentType đúng (không bị thay đổi)
     - First/last bytes được log

## Lưu ý quan trọng:

1. **KHÔNG thay đổi ContentType** trừ khi thực sự cần thiết
2. **Giữ nguyên định dạng file** từ client
3. **Validate buffer** trước khi upload
4. **Log đầy đủ** để debug khi có vấn đề

## Kết quả mong đợi:

- ✅ File upload lên S3 với ContentType đúng
- ✅ File tải về từ S3 mở được trên máy tính
- ✅ Video stream được trong browser
- ✅ Không có lỗi về buffer corruption
