# 🔧 Troubleshooting 502 Bad Gateway Error

## Vấn đề

Khi đăng ký user, API Gateway trả về **502 Bad Gateway** nhưng:
- ✅ Cognito đã tạo user thành công
- ❌ Lambda function bị timeout hoặc throw unhandled error

## Nguyên nhân có thể

### 1. Lambda Timeout
- Lambda timeout quá ngắn (< 30s)
- Database connection trong VPC cần thời gian để establish

### 2. Database Connection Issues
- Lambda không thể connect đến database (10.0.3.107)
- Security Groups chưa được cấu hình đúng
- VPC configuration chưa đúng
- Database connection timeout

### 3. Unhandled Errors
- Database errors không được catch đúng cách
- Lambda function crash trước khi return response

## Giải pháp

### 1. Kiểm tra Lambda Configuration

**Trong AWS Lambda Console:**

1. Vào Lambda function: `learninghub-backend`
2. Kiểm tra **Configuration** → **General configuration**:
   - **Timeout**: Phải >= 30 seconds (khuyến nghị: 60s cho lần đầu)
   - **Memory**: Phải >= 1024 MB

**Cập nhật bằng AWS CLI:**
```bash
aws lambda update-function-configuration \
  --function-name learninghub-backend \
  --timeout 60 \
  --memory-size 1024 \
  --region ap-southeast-1
```

### 2. Kiểm tra CloudWatch Logs

**Xem logs để tìm lỗi cụ thể:**

1. Vào **CloudWatch** → **Log groups**
2. Tìm log group: `/aws/lambda/learninghub-backend`
3. Xem logs gần nhất khi đăng ký

**Tìm các lỗi phổ biến:**
- `SQL connection error` - Database connection failed
- `ETIMEDOUT` - Connection timeout
- `ECONNREFUSED` - Connection refused
- `ENOTFOUND` - Database server not found

### 3. Kiểm tra VPC và Security Groups

**Lambda VPC Configuration:**
- ✅ Lambda đã attach vào VPC
- ✅ Subnets: Private subnets (nơi database nằm)
- ✅ Security Group: Cho phép outbound đến port 1433

**EC2 Database Security Group:**
- ✅ Inbound rule: Cho phép port 1433 từ Lambda Security Group

**Test connectivity:**
```bash
# Từ Lambda Console, test với event:
{
  "httpMethod": "GET",
  "path": "/api/health",
  "headers": {},
  "body": null
}
```

### 4. Kiểm tra Database Connection

**Environment Variables trong Lambda:**
- ✅ `DB_SERVER=10.0.3.107`
- ✅ `DB_USER=sa`
- ✅ `DB_PASSWORD=2htdLearningHub@`
- ✅ `DB_NAME=2HTD_LearningHub`
- ✅ `DB_PORT=1433`

**Test database connection:**
- Xem CloudWatch Logs cho message: `✅ Connected to SQL Server`
- Nếu không thấy, có lỗi connection

### 5. Kiểm tra Error Handling

Code đã được cập nhật để:
- ✅ Catch database errors đúng cách
- ✅ Log errors chi tiết
- ✅ Return proper error responses
- ✅ Handle connection timeouts

## Debugging Steps

### Step 1: Test Health Endpoint

```bash
curl https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/health
```

**Expected:** `{"status":"ok","service":"2HTD LearningHub Backend"}`

**Nếu 502:**
- Lambda function có vấn đề
- Kiểm tra CloudWatch Logs

### Step 2: Test Register Endpoint với Logs

1. Mở CloudWatch Logs
2. Test đăng ký từ frontend
3. Xem logs real-time

**Tìm:**
- `Cognito SignUp error` - Lỗi Cognito
- `Database create user error` - Lỗi database
- `SQL connection error` - Lỗi connection

### Step 3: Test Database Connection

Từ Lambda Console, test với:
```json
{
  "httpMethod": "GET",
  "path": "/api/health",
  "headers": {},
  "body": null
}
```

**Kiểm tra logs:**
- Nếu thấy `✅ Connected to SQL Server` → Connection OK
- Nếu thấy `❌ SQL connection error` → Connection failed

### Step 4: Test Register với Simple Data

Test với Postman hoặc curl:
```bash
curl -X POST https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "fullName": "Test User",
    "phone": "0123456789",
    "role": "member"
  }'
```

## Common Fixes

### Fix 1: Tăng Lambda Timeout

```bash
aws lambda update-function-configuration \
  --function-name learninghub-backend \
  --timeout 60 \
  --region ap-southeast-1
```

### Fix 2: Kiểm tra Security Groups

**Lambda Security Group (Outbound):**
- Type: Custom TCP
- Port: 1433
- Destination: EC2 Database Security Group ID

**EC2 Security Group (Inbound):**
- Type: MSSQL
- Port: 1433
- Source: Lambda Security Group ID

### Fix 3: Re-deploy Code

```powershell
.\deploy-backend.ps1
```

### Fix 4: Check Database Server

Đảm bảo SQL Server:
- ✅ Đang chạy
- ✅ Listen trên port 1433
- ✅ Cho phép remote connections
- ✅ Firewall cho phép connections từ VPC

## Monitoring

### CloudWatch Metrics

Monitor các metrics sau:
- **Duration** - Thời gian execution
- **Errors** - Số lỗi
- **Throttles** - Số lần bị throttle
- **ConcurrentExecutions** - Số concurrent executions

### CloudWatch Alarms

Tạo alarms cho:
- Duration > 50s
- Errors > 0
- Throttles > 0

## Prevention

1. **Always set timeout >= 30s** cho Lambda functions có database access
2. **Monitor CloudWatch Logs** thường xuyên
3. **Test database connection** trong health check
4. **Handle errors properly** trong code
5. **Use connection pooling** để reuse connections

## Next Steps

Sau khi fix:
1. ✅ Test register endpoint
2. ✅ Verify user được tạo trong cả Cognito và Database
3. ✅ Monitor CloudWatch Logs
4. ✅ Test các endpoints khác

## Related Documentation

- `LAMBDA_VPC_DATABASE_CHECKLIST.md` - VPC & Database setup
- `DEPLOYMENT_CONFIG.md` - Deployment configuration
- `LAMBDA_DEPLOY_CHECKLIST.md` - Deployment checklist

