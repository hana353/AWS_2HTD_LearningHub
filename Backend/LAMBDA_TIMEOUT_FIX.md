# 🔧 Fix Lambda Timeout cho Upload File

## Vấn đề: "Request too long" khi upload avatar

Khi upload file lên Lambda qua API Gateway, có thể gặp lỗi timeout nếu:
1. Lambda timeout quá ngắn
2. API Gateway timeout (29 giây max)
3. File quá lớn

## Giải pháp

### 1. Tăng Lambda Timeout

**Trong AWS Lambda Console:**

1. Vào Lambda function: `learninghub-backend`
2. **Configuration** → **General configuration** → **Edit**
3. **Timeout**: Tăng lên **60 seconds** (hoặc cao hơn nếu cần)
4. **Memory**: Tăng lên **2048 MB** (cho upload file lớn)

**Hoặc dùng AWS CLI:**
```bash
aws lambda update-function-configuration \
  --function-name learninghub-backend \
  --timeout 60 \
  --memory-size 2048 \
  --region ap-southeast-1
```

### 2. Cấu hình API Gateway Timeout

**Lưu ý:** API Gateway có timeout tối đa là **29 giây** cho HTTP API và **30 giây** cho REST API.

Nếu cần upload file lớn hơn, nên:
- **Option 1:** Giảm kích thước file upload (đã giảm avatar xuống 5MB)
- **Option 2:** Dùng S3 presigned URL để frontend upload trực tiếp lên S3
- **Option 3:** Dùng S3 Multipart Upload cho file lớn

### 3. Giảm kích thước file upload

**Đã cập nhật:**
- Avatar: **5MB max** (thay vì 500MB)
- Lecture/Flashcard: **500MB max** (giữ nguyên)

### 4. Tối ưu Upload Process

**Đã cải thiện:**
- Tách riêng upload config cho avatar (nhẹ hơn)
- Validate file type sớm hơn
- Giảm memory usage

## Khuyến nghị cấu hình Lambda

### Cho Upload File:
- **Timeout**: 60 seconds
- **Memory**: 2048 MB
- **Ephemeral storage**: 512 MB (nếu cần)

### Cho các API khác:
- **Timeout**: 30 seconds
- **Memory**: 1024 MB

## Kiểm tra sau khi cập nhật

1. Test upload avatar (< 5MB) - phải thành công
2. Test upload lecture file (< 500MB) - phải thành công
3. Kiểm tra CloudWatch logs để xem có timeout không

## Nếu vẫn bị timeout

### Option A: Dùng S3 Presigned URL (Recommended)

Thay vì upload qua Lambda, frontend upload trực tiếp lên S3:

1. Frontend gọi API: `GET /api/upload/presigned-url?filename=avatar.jpg`
2. Backend trả về presigned URL
3. Frontend upload trực tiếp lên S3 bằng presigned URL
4. Frontend gọi API: `POST /api/my/profile` với S3 key

**Lợi ích:**
- Không bị timeout
- Nhanh hơn (upload trực tiếp)
- Giảm tải cho Lambda

### Option B: Tăng Lambda timeout lên tối đa

Lambda có thể tăng timeout lên **15 phút** (900 giây), nhưng:
- API Gateway vẫn giới hạn 29-30 giây
- Cần dùng Lambda Function URL thay vì API Gateway
- Hoặc dùng S3 presigned URL (khuyến nghị)

## Tài liệu tham khảo

- [AWS Lambda Limits](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
- [API Gateway Limits](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

