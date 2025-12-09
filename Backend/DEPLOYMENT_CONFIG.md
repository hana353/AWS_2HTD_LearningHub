# 🚀 Deployment Configuration Summary

## 📋 Infrastructure Overview

### Frontend
- **Platform**: Vercel
- **Domain**: `2htdlearninghub.xyz` (Route 53)
- **Environment Variables**: Đã setup trong Vercel

### Backend
- **Platform**: AWS Lambda
- **Function Name**: `learninghub-backend`
- **Runtime**: Node.js 20.x
- **Handler**: `src/lambda.handler`
- **VPC**: Private subnet (cùng VPC với database)
- **API Gateway**: `https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default`

### Database
- **Type**: SQL Server (self-hosted trên EC2)
- **Server IP**: `10.0.3.107` ✅ (IP mới)
- **Port**: `1433`
- **Location**: Private subnet trong VPC
- **Database Name**: `2HTD_LearningHub`

### Network
- **VPC**: Lambda và EC2 trong cùng VPC
- **NAT Gateway**: Đã cấu hình
- **Internet Gateway**: Đã cấu hình
- **Security Groups**: Đã cấu hình

### DNS
- **Route 53**: Quản lý domain `2htdlearninghub.xyz`
- **Frontend**: `2htdlearninghub.xyz` → Vercel
- **Backend API**: `api.2htdlearninghub.xyz` → API Gateway (nếu setup custom domain)

## 🔧 Lambda Environment Variables

Các biến môi trường đã được setup trong Lambda Console:

```env
# Database Configuration
DB_SERVER=10.0.3.107
DB_USER=sa
DB_PASSWORD=2htdLearningHub@
DB_NAME=2HTD_LearningHub
DB_PORT=1433

# AWS Services
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=learninghub-app-bucket
COGNITO_REGION=ap-southeast-1
COGNITO_USER_POOL_ID=ap-southeast-1_wgFLpZsho
COGNITO_CLIENT_ID=4quhrr2mrl5t2u4fatc4pdl44s

# Application
NODE_ENV=production
ADMIN_EMAIL=admin@2htdlearninghub.xyz
FRONTEND_URL=https://2htdlearninghub.xyz
VERCEL_URL=https://2htdlearninghub.xyz
```

**⚠️ LƯU Ý**: 
- KHÔNG thêm `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY`
- Sử dụng IAM Role cho Lambda

## 🌐 Frontend Environment Variables (Vercel)

Các biến môi trường đã được setup trong Vercel:

```env
VITE_API_URL=https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default
# Hoặc nếu đã setup custom domain:
# VITE_API_URL=https://api.2htdlearninghub.xyz
```

## 🔗 API Endpoints

### Health Check
```
GET https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/health
```

### Authentication
```
POST https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/auth/login
POST https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/auth/register
```

### Courses
```
GET https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/courses
GET https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/courses/:courseId
```

## ✅ Verification Checklist

### Lambda Function
- [x] Function name: `learninghub-backend`
- [x] Runtime: Node.js 20.x
- [x] Handler: `src/lambda.handler`
- [x] VPC: Attached to private subnet
- [x] Security Groups: Configured
- [x] Environment Variables: Set
- [x] IAM Role: VPC permissions

### Database Connection
- [x] Database IP: `10.0.3.107`
- [x] Port: `1433`
- [x] Security Group: Allows Lambda to connect
- [x] Connection pool: Optimized for Lambda

### API Gateway
- [x] API Gateway URL: `https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default`
- [x] Lambda integration: Configured
- [x] CORS: Enabled
- [x] Deployment: Deployed to `default` stage

### Frontend
- [x] Vercel deployment: Configured
- [x] Environment variables: Set
- [x] API endpoint: Configured
- [x] CORS: Allowed origins configured

### Network
- [x] VPC: Lambda và EC2 trong cùng VPC
- [x] NAT Gateway: Configured
- [x] Internet Gateway: Configured
- [x] Security Groups: Rules configured

## 🧪 Testing

### Test Lambda Function
```bash
# Test từ Lambda Console
{
  "httpMethod": "GET",
  "path": "/api/health",
  "headers": {},
  "body": null
}
```

### Test API Gateway
```bash
curl https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/health
```

### Test Database Connection
Kiểm tra CloudWatch Logs:
- ✅ `Connected to SQL Server` - Thành công
- ❌ `SQL connection error` - Có lỗi

### Test Frontend
1. Mở `https://2htdlearninghub.xyz`
2. Test login/register
3. Kiểm tra Network tab trong DevTools
4. Verify API calls đến đúng endpoint

## 📊 Monitoring

### CloudWatch Logs
- Log Group: `/aws/lambda/learninghub-backend`
- Monitor: Database connection errors, Lambda errors

### CloudWatch Metrics
- Lambda duration
- Lambda errors
- Lambda invocations
- Database connection errors

## 🔄 Deployment Process

1. **Update Code**
   ```powershell
   .\deploy-backend.ps1
   ```

2. **Verify Deployment**
   - Check Lambda Console → Last modified
   - Test Lambda function
   - Check CloudWatch Logs

3. **Test API Gateway**
   - Test health endpoint
   - Test authentication endpoints

4. **Test Frontend**
   - Verify API calls
   - Check CORS
   - Test full user flow

## 📚 Related Documentation

- `LAMBDA_DEPLOY_CHECKLIST.md` - Deployment checklist
- `LAMBDA_VPC_DATABASE_CHECKLIST.md` - VPC & Database checklist
- `ROUTE53_SETUP.md` - Route 53 setup guide
- `DEPLOY_LAMBDA.md` - Lambda deployment guide

