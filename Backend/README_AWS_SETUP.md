# 🚀 Hướng dẫn Setup AWS Services cho LearningHub Backend

## ✅ Đã hoàn thành tích hợp

Tất cả các AWS services đã được tích hợp vào backend:

1. ✅ **EC2 SQL Server** - Database connection
2. ✅ **S3** - File storage (upload/download)
3. ✅ **Cognito** - Authentication
4. ✅ **Lambda** - Backend API (ready for deployment)
5. ✅ **API Gateway** - HTTP endpoint
6. ✅ **VPC** - Network configuration
7. ✅ **IAM** - Permissions
8. ✅ **CloudWatch** - Logging

## 📋 Bước 1: Cài đặt Dependencies

```bash
cd Backend
npm install
```

## 📋 Bước 2: Tạo file .env

**Cách 1: Copy từ ENV_SETUP.md**
Xem file `ENV_SETUP.md` để copy nội dung và tạo file `.env` thủ công.

**Cách 2: Dùng PowerShell (Windows)**
Chạy lệnh trong `ENV_SETUP.md`

**Cách 3: Tạo thủ công**
Tạo file `.env` trong thư mục `Backend/` với nội dung từ `ENV_SETUP.md`

## 📋 Bước 3: Kiểm tra file .env

Đảm bảo file `.env` có đầy đủ các biến:

- ✅ `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- ✅ `COGNITO_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`
- ✅ `AWS_REGION`, `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- ✅ `PORT`, `NODE_ENV`, `ADMIN_EMAIL`

## 📋 Bước 4: Test Local

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:4000`

Test endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/signup` - Đăng ký (test Cognito)
- `POST /api/upload/lecture` - Upload file (test S3)

## 📋 Bước 5: Test Upload File S3

### Test với cURL:

```bash
# Upload lecture file
curl -X POST http://localhost:4000/api/upload/lecture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/video.mp4" \
  -F "courseId=YOUR_COURSE_ID"
```

### Test với Postman:
1. Method: `POST`
2. URL: `http://localhost:4000/api/upload/lecture`
3. Headers: `Authorization: Bearer <token>`
4. Body: `form-data`
   - Key: `file` (type: File)
   - Key: `courseId` (type: Text)

## 🔄 Workflow Upload File

1. **Frontend** gửi file → `POST /api/upload/lecture`
2. **Backend** upload lên S3 → Trả về `s3Key` và `url`
3. **Frontend** lưu `s3Key` vào database khi tạo/update lecture
4. **Frontend** dùng `url` để hiển thị file

## 🎯 API Endpoints mới

### Upload Lecture File
```
POST /api/upload/lecture
Content-Type: multipart/form-data
Body: file, courseId
```

### Upload Avatar
```
POST /api/upload/avatar
Content-Type: multipart/form-data
Body: file
```

### Upload Flashcard File
```
POST /api/upload/flashcard
Content-Type: multipart/form-data
Body: file, setId
```

### Delete File
```
DELETE /api/upload/:s3Key
```

### Get Presigned URL
```
GET /api/upload/presigned/:s3Key?expiresIn=3600
```

## ⚠️ Lưu ý quan trọng

### 1. Bảo mật
- ✅ **KHÔNG commit file `.env`** lên Git
- ✅ File `.env` đã có trong `.gitignore`
- ⚠️ **AWS Credentials** chỉ dùng cho local development
- ⚠️ Khi deploy Lambda, dùng **IAM Role** thay vì Access Key

### 2. Multer Security Warning
Có cảnh báo về multer 1.x. Đã cập nhật lên 2.x trong package.json.

### 3. EC2 Database
- EC2 database đang có public IP: `52.74.234.40`
- Nên cân nhắc move vào private subnet
- Hoặc restrict access bằng Security Group

### 4. S3 Bucket Permissions
Đảm bảo S3 bucket `learninghub-app-bucket` có:
- ✅ CORS configuration cho frontend
- ✅ Public read access (nếu cần) hoặc dùng presigned URLs

## 🚀 Deploy lên Lambda (Khi sẵn sàng)

### Bước 1: Tạo Lambda Handler

Tạo file `src/lambda.js`:

```javascript
import serverless from 'serverless-http';
import app from './app.js';

export const handler = serverless(app);
```

### Bước 2: Cài đặt serverless-http
```bash
npm install serverless-http
```

### Bước 3: Setup Lambda Environment Variables
Trong Lambda Console, thêm tất cả biến từ `.env` (trừ `PORT`)

### Bước 4: Cấu hình Lambda
- Timeout: 30s (cho upload file lớn)
- Memory: 512MB hoặc 1024MB
- Handler: `src/lambda.handler`

### Bước 5: Setup API Gateway Integration
- Connect API Gateway với Lambda function
- Method: `ANY`
- Resource path: `/{proxy+}`

## 📚 Tài liệu tham khảo

- `ENV_SETUP.md` - Hướng dẫn tạo file .env
- `AWS_INTEGRATION.md` - Chi tiết tích hợp AWS services
- `src/config/s3.js` - Cấu hình S3
- `src/services/s3.service.js` - Service upload/delete S3

## 🔍 Troubleshooting

### Lỗi kết nối Database
- Kiểm tra EC2 Security Group cho phép port 1433
- Kiểm tra `DB_SERVER`, `DB_USER`, `DB_PASSWORD` trong `.env`

### Lỗi upload S3
- Kiểm tra AWS credentials trong `.env`
- Kiểm tra S3 bucket name
- Kiểm tra IAM permissions

### Lỗi Cognito
- Kiểm tra User Pool ID và Client ID
- Kiểm tra region

## ✅ Checklist hoàn thành

- [x] Tạo file .env
- [x] Cài đặt dependencies
- [x] Test local server
- [x] Test database connection
- [x] Test Cognito authentication
- [x] Test S3 upload
- [ ] Deploy lên Lambda (optional)
- [ ] Setup API Gateway integration (optional)

