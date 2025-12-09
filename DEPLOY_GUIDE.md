# 🚀 Hướng dẫn Deploy Backend lên AWS Lambda

## 📋 Prerequisites

Trước khi deploy, đảm bảo bạn đã có:

1. ✅ **AWS CLI** đã cài đặt và cấu hình
   ```bash
   aws --version
   aws configure
   ```

2. ✅ **Node.js** 18.x hoặc 20.x đã cài đặt
   ```bash
   node --version
   ```

3. ✅ **Lambda Function** đã được tạo trong AWS Console
   - Function name: `learninghub-backend`
   - Runtime: `Node.js 20.x`
   - Handler: `src/lambda.handler`

4. ✅ **IAM Permissions** cho AWS CLI user:
   - `lambda:UpdateFunctionCode`
   - `lambda:GetFunction`

## 🎯 Cách sử dụng Deploy Script

### Basic Usage

```powershell
# Chạy script từ thư mục root của project
.\deploy-backend.ps1
```

Script sẽ tự động:
1. Kiểm tra AWS CLI và Node.js
2. Kiểm tra AWS credentials
3. Cài đặt dependencies (nếu chưa có)
4. Tạo deployment package (zip file)
5. Upload lên Lambda

### Force Reinstall Dependencies

Nếu muốn force reinstall dependencies:

```powershell
.\deploy-backend.ps1 --force-install
# hoặc
.\deploy-backend.ps1 -f
```

## 📝 Deploy Process

### Step 1: Pre-flight Checks

Script sẽ kiểm tra:
- ✅ AWS CLI có sẵn không
- ✅ AWS credentials có hợp lệ không
- ✅ Node.js có sẵn không
- ✅ Các file/folder cần thiết có tồn tại không

### Step 2: Install Dependencies

- Nếu `node_modules` chưa tồn tại → chạy `npm install --production`
- Nếu `node_modules` đã tồn tại → skip (trừ khi dùng `--force-install`)

### Step 3: Create Deployment Package

Script sẽ zip các file/folder sau:
- `src/` - Source code
- `node_modules/` - Dependencies
- `package.json` - Package configuration
- `package-lock.json` - Lock file

**Lưu ý**: File `.env` KHÔNG được include trong package. Environment variables phải được set trong Lambda Console.

### Step 4: Upload to Lambda

Script sẽ upload package lên Lambda function:
```bash
aws lambda update-function-code \
  --function-name learninghub-backend \
  --zip-file fileb://Backend/function.zip \
  --region ap-southeast-1
```

### Step 5: Verify Deployment

Sau khi deploy thành công, script sẽ hiển thị:
- Function name
- Region
- Package size
- Runtime, Memory, Timeout
- Last modified time
- API Gateway URL

## 🔍 Troubleshooting

### Error: AWS CLI not found

**Giải pháp:**
```bash
# Cài đặt AWS CLI
# Windows: Download từ https://aws.amazon.com/cli/
# Hoặc dùng: winget install Amazon.AWSCLI
```

### Error: AWS credentials not configured

**Giải pháp:**
```bash
aws configure
# Nhập:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-southeast-1
# - Default output format: json
```

### Error: npm install failed

**Giải pháp:**
```powershell
# Thử force reinstall
.\deploy-backend.ps1 --force-install

# Hoặc manual install
cd Backend
npm install --production
cd ..
```

### Error: Package size exceeds 50MB

**Giải pháp:**
- Sử dụng Lambda Layers cho `node_modules`
- Hoặc deploy từ S3 thay vì upload trực tiếp
- Xem: [AWS Lambda Deployment Package](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-package.html)

### Error: Lambda function not found

**Giải pháp:**
1. Kiểm tra function name trong script: `$FunctionName = "learninghub-backend"`
2. Kiểm tra region: `$Region = "ap-southeast-1"`
3. Tạo Lambda function trong AWS Console trước

### Error: Permission denied

**Giải pháp:**
- Kiểm tra IAM permissions cho AWS CLI user
- Cần quyền: `lambda:UpdateFunctionCode`, `lambda:GetFunction`

## 📊 Package Size Limits

- **Zipped**: 50 MB
- **Unzipped**: 250 MB

Nếu package vượt quá giới hạn, script sẽ cảnh báo và đề xuất sử dụng Lambda Layers hoặc S3 deployment.

## 🔄 Workflow

```
1. Code changes
   ↓
2. Run deploy script
   ↓
3. Script checks prerequisites
   ↓
4. Install dependencies (if needed)
   ↓
5. Create zip package
   ↓
6. Upload to Lambda
   ↓
7. Verify deployment
   ↓
8. Test Lambda function
   ↓
9. Test API Gateway
```

## ✅ Post-Deployment Checklist

Sau khi deploy thành công:

- [ ] Test Lambda function trong AWS Console
- [ ] Kiểm tra CloudWatch Logs
- [ ] Test API Gateway endpoint
- [ ] Test từ frontend
- [ ] Verify database connection (check logs)
- [ ] Monitor Lambda metrics

## 📚 Related Documentation

- `Backend/LAMBDA_DEPLOY_CHECKLIST.md` - Deployment checklist chi tiết
- `Backend/LAMBDA_VPC_DATABASE_CHECKLIST.md` - VPC & Database checklist
- `Backend/DEPLOYMENT_CONFIG.md` - Configuration summary
- `Backend/DEPLOY_LAMBDA.md` - Lambda deployment guide

## 💡 Tips

1. **Development**: Deploy thường xuyên để test
2. **Production**: Chỉ deploy khi đã test kỹ local
3. **Version Control**: Tag git commit trước khi deploy production
4. **Monitoring**: Luôn check CloudWatch Logs sau khi deploy
5. **Rollback**: Giữ lại các version cũ trong Lambda để có thể rollback nếu cần

## 🆘 Support

Nếu gặp vấn đề:
1. Kiểm tra CloudWatch Logs
2. Kiểm tra Lambda function configuration
3. Kiểm tra IAM permissions
4. Kiểm tra VPC configuration (nếu Lambda trong VPC)
5. Xem troubleshooting section ở trên

