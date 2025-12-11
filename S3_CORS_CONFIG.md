# S3 CORS Configuration cho Video Streaming

## Vấn đề hiện tại
CORS configuration hiện tại thiếu một số settings quan trọng cho video streaming:
- Thiếu `HEAD` method (cần cho video metadata và range requests)
- Thiếu `Accept-Ranges` trong `ExposeHeaders` (cần cho video streaming)

## CORS Configuration đúng cho Video Streaming

Cập nhật CORS configuration trong S3 bucket với cấu hình sau:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "https://2htdlearninghub.xyz",
            "https://www.2htdlearninghub.xyz",
            "https://*.vercel.app"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type",
            "Accept-Ranges",
            "Content-Range"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

## Thay đổi chính:
1. **Thêm `HEAD` method**: Cần thiết cho browser kiểm tra metadata video và range requests
2. **Thêm `Accept-Ranges` vào ExposeHeaders**: Cho phép browser biết server hỗ trợ range requests (cần cho video streaming)
3. **Thêm `Content-Range` vào ExposeHeaders**: Cần cho partial content requests

## Bucket Policy (đã đúng)
Bucket policy hiện tại đã đúng:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowPresignedUrlGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::learninghub-app-bucket/*"
        }
    ]
}
```

## Cách cập nhật CORS trong AWS Console:
1. Vào S3 Console
2. Chọn bucket `learninghub-app-bucket`
3. Vào tab "Permissions"
4. Scroll xuống "Cross-origin resource sharing (CORS)"
5. Click "Edit"
6. Paste cấu hình CORS mới ở trên
7. Save changes

## Kiểm tra sau khi cập nhật:
1. Upload video mới và kiểm tra xem có stream được không
2. Kiểm tra browser console có lỗi CORS không
3. Kiểm tra Network tab xem có HEAD request thành công không
