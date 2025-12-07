# Tổng kết tích hợp AWS Services vào LearningHub Backend

## ✅ Đã hoàn thành

### 1. File .env
- ✅ Tạo file `.env` với tất cả biến môi trường từ `service.txt`
- ✅ Bao gồm: Database, Cognito, S3, API Gateway, Lambda, VPC

### 2. AWS S3 Integration
- ✅ Thêm `@aws-sdk/client-s3` và `@aws-sdk/s3-request-presigner` vào `package.json`
- ✅ Tạo `src/config/s3.js` - Cấu hình S3 client
- ✅ Tạo `src/services/s3.service.js` - Service upload/delete file S3
- ✅ Tạo `src/controllers/upload.controller.js` - Controller xử lý upload
- ✅ Tạo `src/routes/upload.routes.js` - Routes cho upload API
- ✅ Tích hợp vào `src/app.js`

### 3. AWS Services đang sử dụng

#### ✅ Amazon EC2 (SQL Server Database)
- **Config**: `src/config/db.js`
- **Biến môi trường**: `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **Status**: ✅ Đã tích hợp

#### ✅ Amazon S3 (File Storage)
- **Config**: `src/config/s3.js`
- **Service**: `src/services/s3.service.js`
- **Biến môi trường**: `AWS_REGION`, `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- **Status**: ✅ Đã tích hợp
- **API Endpoints**:
  - `POST /api/upload/lecture` - Upload file bài giảng
  - `POST /api/upload/avatar` - Upload avatar user
  - `POST /api/upload/flashcard` - Upload file flashcard (image/audio)
  - `DELETE /api/upload/:s3Key` - Xóa file
  - `GET /api/upload/presigned/:s3Key` - Lấy presigned URL để download

#### ✅ Amazon Cognito (Authentication)
- **Config**: `src/config/cognito.js`
- **Service**: `src/services/auth.service.js`
- **Middleware**: `src/middlewares/auth.middleware.js`
- **Biến môi trường**: `COGNITO_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`
- **Status**: ✅ Đã tích hợp

#### ✅ AWS Lambda (Backend API)
- **Function**: `learninghub-backend`
- **ARN**: `arn:aws:lambda:ap-southeast-1:732716521848:function:learninghub-backend`
- **Status**: ⚠️ Cần deploy code lên Lambda
- **Note**: Code hiện tại chạy local, cần setup Lambda handler

#### ✅ Amazon API Gateway (HTTP API)
- **Endpoint**: `https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default`
- **Type**: REST API
- **Status**: ⚠️ Cần cấu hình Lambda integration
- **Note**: API Gateway đã được setup, cần connect với Lambda function

#### ✅ AWS IAM (Permissions)
- **Status**: ⚠️ Cần đảm bảo Lambda role có quyền:
  - S3: PutObject, GetObject, DeleteObject
  - Cognito: Admin operations
  - EC2: Kết nối database (nếu Lambda trong VPC)

#### ✅ CloudWatch Logs
- **Status**: ✅ Tự động khi deploy Lambda
- **Note**: Lambda và API Gateway sẽ tự động log vào CloudWatch

#### ✅ VPC
- **VPC ID**: `vpc-0dcc30db69a11c12e`
- **Status**: ⚠️ Lambda cần được cấu hình trong VPC nếu cần truy cập EC2 database private
- **Note**: Nếu EC2 database public (có public IP), không cần VPC cho Lambda

## 📝 Các bước tiếp theo

### 1. Cài đặt dependencies
```bash
cd Backend
npm install
```

### 2. Tạo file .env
Xem file `ENV_SETUP.md` để tạo file `.env`

### 3. Test local
```bash
npm run dev
```

### 4. Deploy lên Lambda (Khi sẵn sàng)
- Setup Lambda handler
- Cấu hình environment variables trong Lambda
- Setup VPC nếu cần
- Test Lambda function
- Cấu hình API Gateway integration

## 🔒 Bảo mật

⚠️ **Lưu ý quan trọng**:
1. **KHÔNG commit file `.env`** lên Git
2. **AWS Credentials** trong `.env` chỉ dùng cho local development
3. Khi deploy lên Lambda, dùng **IAM Role** thay vì Access Key
4. EC2 database đang public - nên cân nhắc move vào private subnet

## 📚 API Endpoints mới (Upload)

### Upload Lecture File
```http
POST /api/upload/lecture
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- file: (file) - Video, PDF, etc.
- courseId: (string) - Course ID
```

**Response**:
```json
{
  "message": "File uploaded successfully",
  "data": {
    "s3Key": "lectures/{courseId}/{timestamp}-{filename}",
    "url": "https://learninghub-app-bucket.s3.ap-southeast-1.amazonaws.com/...",
    "filename": "original-name.mp4",
    "contentType": "video/mp4",
    "size": 1024000
  }
}
```

### Upload Avatar
```http
POST /api/upload/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- file: (image file)
```

### Upload Flashcard File
```http
POST /api/upload/flashcard
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- file: (image or audio file)
- setId: (string) - Flashcard set ID
```

### Delete File
```http
DELETE /api/upload/:s3Key
Authorization: Bearer <token>
```

### Get Presigned URL (Download private file)
```http
GET /api/upload/presigned/:s3Key?expiresIn=3600
Authorization: Bearer <token>
```

## 🔄 Workflow Upload File

1. **Frontend** gửi file lên `POST /api/upload/lecture`
2. **Backend** nhận file qua Multer
3. **Backend** upload file lên S3
4. **Backend** trả về `s3Key` và `url`
5. **Frontend** lưu `s3Key` vào database khi tạo lecture
6. **Frontend** dùng `url` hoặc `s3Key` để hiển thị file

## 📝 Ghi chú về Lambda Deployment

Khi deploy lên Lambda, cần:
1. Thay đổi `server.js` thành Lambda handler format
2. Setup environment variables trong Lambda console
3. Cấu hình Lambda timeout (ít nhất 30s cho upload file lớn)
4. Cấu hình Lambda memory (ít nhất 512MB)
5. Nếu cần truy cập EC2 database, setup VPC configuration cho Lambda
6. Đảm bảo Lambda IAM role có đủ quyền (S3, Cognito, etc.)

