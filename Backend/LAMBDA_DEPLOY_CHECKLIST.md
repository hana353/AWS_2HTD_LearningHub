# ✅ Lambda Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Code Preparation
- [x] Lambda handler (`src/lambda.js`) đã được tạo và export `handler` function
- [x] Database connection đã được tối ưu cho Lambda (pool size, timeout)
- [x] CORS đã được cấu hình để hỗ trợ Vercel URLs
- [x] Không có `server.listen()` trong Lambda handler
- [x] `ensureSingleAdmin()` không được gọi trong Lambda (chỉ chạy local)

### 2. Dependencies
- [x] `serverless-http` đã được thêm vào `dependencies` (không phải devDependencies)
- [x] Tất cả dependencies đã được cài đặt (`npm install`)
- [x] Package size < 50MB (zipped) hoặc < 250MB (unzipped)

### 3. Environment Variables
Đảm bảo các biến sau được set trong Lambda Console:

**Database:**
- [ ] `DB_SERVER` - SQL Server address
- [ ] `DB_USER` - Database username
- [ ] `DB_PASSWORD` - Database password
- [ ] `DB_NAME` - Database name
- [ ] `DB_PORT` - Database port (default: 1433)

**AWS Services:**
- [ ] `AWS_REGION` - AWS region (e.g., `ap-southeast-1`)
- [ ] `S3_BUCKET_NAME` - S3 bucket name
- [ ] `COGNITO_REGION` - Cognito region
- [ ] `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- [ ] `COGNITO_CLIENT_ID` - Cognito Client ID

**Application:**
- [ ] `NODE_ENV` - Set to `production`
- [ ] `ADMIN_EMAIL` - Admin email address
- [ ] `FRONTEND_URL` - Frontend URL (Vercel)
- [ ] `VERCEL_URL` - Vercel URL (optional)

**⚠️ LƯU Ý:** KHÔNG thêm `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY` vào environment variables. Sử dụng IAM Role thay thế.

### 4. Lambda Configuration

#### Basic Settings:
- [ ] **Function name**: `learninghub-backend`
- [ ] **Runtime**: `Node.js 20.x` (hoặc 18.x)
- [ ] **Architecture**: `x86_64`
- [ ] **Handler**: `src/lambda.handler`
- [ ] **Memory**: `1024 MB` (hoặc cao hơn cho upload file)
- [ ] **Timeout**: `30 seconds` (hoặc cao hơn cho upload file)

#### IAM Role Permissions:
Lambda execution role cần có các quyền sau:

**S3:**
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:DeleteObject"
  ],
  "Resource": "arn:aws:s3:::learninghub-app-bucket/*"
}
```

**Cognito (nếu cần):**
```json
{
  "Effect": "Allow",
  "Action": [
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminCreateUser",
    "cognito-idp:AdminUpdateUserAttributes"
  ],
  "Resource": "arn:aws:cognito-idp:ap-southeast-1:*:userpool/*"
}
```

**VPC (nếu Lambda cần truy cập EC2 database):**
- [ ] Lambda được attach vào VPC
- [ ] Security Group cho phép outbound traffic đến database port (1433)
- [ ] Lambda có quyền `ec2:CreateNetworkInterface`, `ec2:DescribeNetworkInterfaces`, `ec2:DeleteNetworkInterface`

#### VPC Configuration (nếu cần):
- [ ] VPC ID đã được chọn
- [ ] Subnets (private subnets nơi database nằm)
- [ ] Security Groups (cho phép outbound đến database)

### 5. API Gateway Configuration

- [ ] API Gateway đã được tạo hoặc đã tồn tại
- [ ] Resource `{proxy+}` đã được tạo
- [ ] Method `ANY` đã được tạo và link đến Lambda function
- [ ] **Lambda Proxy Integration** đã được enable
- [ ] CORS đã được enable
- [ ] API đã được deploy lên stage (e.g., `default` hoặc `prod`)

### 6. Testing

#### Test Lambda Function:
```bash
# Test từ Lambda Console
{
  "httpMethod": "GET",
  "path": "/api/health",
  "headers": {},
  "body": null
}
```

#### Test API Gateway:
```bash
curl https://YOUR_API_GATEWAY_URL/api/health
```

#### Test Endpoints:
- [ ] `GET /api/health` - Health check
- [ ] `POST /api/auth/signup` - Đăng ký
- [ ] `POST /api/auth/login` - Đăng nhập
- [ ] `GET /api/courses` - Lấy danh sách khóa học
- [ ] `POST /api/upload/lecture` - Upload file (test S3)

### 7. Monitoring

- [ ] CloudWatch Logs đã được enable
- [ ] Log group: `/aws/lambda/learninghub-backend`
- [ ] Xem logs để kiểm tra errors

## 🚀 Deployment Steps

1. **Chạy deploy script:**
   ```powershell
   .\deploy-backend.ps1
   ```

2. **Kiểm tra deployment:**
   - Vào Lambda Console → Function → `learninghub-backend`
   - Kiểm tra "Last modified" timestamp
   - Xem "Code" tab để đảm bảo code đã được upload

3. **Test Lambda:**
   - Click "Test" trong Lambda Console
   - Tạo test event với `GET /api/health`
   - Kiểm tra response

4. **Test API Gateway:**
   - Lấy API Gateway URL từ API Gateway Console
   - Test với curl hoặc Postman

## 🔍 Troubleshooting

### Lambda Timeout
- Tăng timeout trong Lambda configuration
- Kiểm tra database connection (có thể bị timeout nếu không có VPC)

### Lambda Memory Issues
- Tăng memory allocation
- Kiểm tra package size (có thể cần Lambda Layers)

### Database Connection Errors
- Kiểm tra VPC configuration
- Kiểm tra Security Groups
- Kiểm tra database credentials trong environment variables

### CORS Errors
- Kiểm tra CORS configuration trong `app.js`
- Kiểm tra API Gateway CORS settings
- Đảm bảo frontend URL được thêm vào allowed origins

### Package Too Large
- Sử dụng Lambda Layers cho `node_modules`
- Hoặc deploy từ S3 thay vì upload trực tiếp

## 📚 References

- [AWS Lambda Node.js Documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [API Gateway Lambda Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html)
- [Serverless HTTP](https://github.com/dougmoscrop/serverless-http)

