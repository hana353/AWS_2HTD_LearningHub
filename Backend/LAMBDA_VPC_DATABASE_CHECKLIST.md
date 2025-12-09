# ✅ Lambda VPC & Database Connection Checklist

## 📋 Tổng quan Infrastructure

- **Lambda Function**: `learninghub-backend` (trong private subnet)
- **Database Server**: `10.0.3.107` (EC2 self-host SQL Server trong private subnet)
- **VPC**: Lambda và EC2 trong cùng VPC
- **NAT Gateway**: Đã cấu hình
- **Internet Gateway**: Đã cấu hình

## ✅ Checklist Lambda VPC Configuration

### 1. Lambda Function VPC Settings

- [ ] Lambda function đã được attach vào VPC
- [ ] **VPC ID**: Đúng VPC ID (kiểm tra trong Lambda Console → Configuration → VPC)
- [ ] **Subnets**: Chọn private subnets (nơi database nằm)
  - [ ] Subnet 1: `10.0.x.x/xx` (private subnet)
  - [ ] Subnet 2: `10.0.x.x/xx` (private subnet khác cho high availability)
- [ ] **Security Groups**: Security group cho phép outbound traffic

### 2. Security Group Configuration

#### Lambda Security Group (Outbound Rules)
- [ ] **Type**: All traffic hoặc Custom TCP
- [ ] **Port**: `1433` (SQL Server)
- [ ] **Destination**: Security group của EC2 database hoặc `10.0.3.107/32`
- [ ] **Protocol**: TCP

#### EC2 Database Security Group (Inbound Rules)
- [ ] **Type**: MSSQL
- [ ] **Port**: `1433`
- [ ] **Source**: Lambda Security Group ID (hoặc `10.0.0.0/16` nếu trong cùng VPC)
- [ ] **Protocol**: TCP

### 3. Lambda IAM Role Permissions

Lambda execution role cần có quyền:

- [ ] `ec2:CreateNetworkInterface` - Tạo network interface trong VPC
- [ ] `ec2:DescribeNetworkInterfaces` - Mô tả network interfaces
- [ ] `ec2:DeleteNetworkInterface` - Xóa network interface
- [ ] `ec2:AssignPrivateIpAddresses` - Assign private IP (nếu cần)
- [ ] `ec2:UnassignPrivateIpAddresses` - Unassign private IP (nếu cần)

**IAM Policy Example:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Database Connection Configuration

#### Environment Variables trong Lambda

- [ ] `DB_SERVER=10.0.3.107` ✅ (IP mới)
- [ ] `DB_USER=sa` (hoặc database user)
- [ ] `DB_PASSWORD=2htdLearningHub@` (hoặc password mới)
- [ ] `DB_NAME=2HTD_LearningHub`
- [ ] `DB_PORT=1433`

#### SQL Server Configuration

- [ ] SQL Server đã được cấu hình để accept connections từ VPC
- [ ] SQL Server Authentication đã được enable (nếu dùng SQL auth)
- [ ] Firewall rules cho phép connections từ VPC CIDR (`10.0.0.0/16`)
- [ ] SQL Server đang listen trên port `1433`

### 5. Network Connectivity Test

#### Test từ Lambda Console

1. Vào Lambda Console → Function → `learninghub-backend`
2. Click **Test**
3. Tạo test event:
```json
{
  "httpMethod": "GET",
  "path": "/api/health",
  "headers": {},
  "body": null
}
```
4. Click **Test**
5. Kiểm tra CloudWatch Logs:
   - ✅ `Connected to SQL Server` - Database connection thành công
   - ❌ `SQL connection error` - Có lỗi kết nối

#### Test Database Connection từ Lambda

Tạo test event để test database connection:
```json
{
  "httpMethod": "GET",
  "path": "/api/health",
  "headers": {},
  "body": null
}
```

Kiểm tra logs trong CloudWatch:
- Log group: `/aws/lambda/learninghub-backend`
- Tìm log: `✅ Connected to SQL Server` hoặc `❌ SQL connection error`

### 6. Troubleshooting Common Issues

#### Issue: Lambda timeout khi connect database

**Nguyên nhân:**
- Security group không cho phép traffic
- Lambda không trong cùng VPC với database
- Database không accessible từ VPC

**Giải pháp:**
1. Kiểm tra Security Groups (inbound/outbound rules)
2. Kiểm tra Lambda VPC configuration
3. Kiểm tra database firewall rules
4. Test connectivity từ EC2 instance trong cùng subnet

#### Issue: "ENOTFOUND" hoặc "ETIMEDOUT"

**Nguyên nhân:**
- Database IP không đúng
- Port không đúng
- Security group block traffic

**Giải pháp:**
1. Verify `DB_SERVER=10.0.3.107` trong environment variables
2. Verify `DB_PORT=1433`
3. Check Security Groups
4. Test từ EC2 instance: `telnet 10.0.3.107 1433`

#### Issue: "Connection refused"

**Nguyên nhân:**
- SQL Server không listen trên port 1433
- SQL Server firewall block connections
- SQL Server không accept remote connections

**Giải pháp:**
1. Check SQL Server configuration
2. Enable SQL Server remote connections
3. Check Windows Firewall (nếu EC2 dùng Windows)
4. Check SQL Server TCP/IP protocol enabled

#### Issue: "Authentication failed"

**Nguyên nhân:**
- Username/password không đúng
- SQL Server Authentication chưa enable
- User không có quyền

**Giải pháp:**
1. Verify `DB_USER` và `DB_PASSWORD` trong environment variables
2. Enable SQL Server Authentication mode
3. Check user permissions

### 7. Performance Optimization

#### Connection Pooling

- [ ] Connection pool size đã được tối ưu cho Lambda (max: 5)
- [ ] Connection timeout đã được set (30s)
- [ ] Idle timeout đã được set (30s)

#### Lambda Configuration

- [ ] **Memory**: `1024 MB` hoặc cao hơn (cho database connections)
- [ ] **Timeout**: `30 seconds` hoặc cao hơn (cho database queries)
- [ ] **Reserved Concurrency**: Set nếu cần (để control số lượng concurrent executions)

### 8. Monitoring & Logging

#### CloudWatch Logs

- [ ] CloudWatch Logs đã được enable
- [ ] Log group: `/aws/lambda/learninghub-backend`
- [ ] Log retention: Set appropriate retention period

#### CloudWatch Metrics

- [ ] Monitor Lambda duration
- [ ] Monitor Lambda errors
- [ ] Monitor database connection errors
- [ ] Set up alarms cho critical errors

## 🔍 Verification Steps

### Step 1: Verify Lambda VPC Configuration

```bash
# AWS CLI command
aws lambda get-function-configuration \
  --function-name learninghub-backend \
  --query 'VpcConfig'
```

Expected output:
```json
{
  "SubnetIds": ["subnet-xxx", "subnet-yyy"],
  "SecurityGroupIds": ["sg-xxx"],
  "VpcId": "vpc-xxx"
}
```

### Step 2: Verify Security Groups

```bash
# Check Lambda Security Group outbound rules
aws ec2 describe-security-groups \
  --group-ids sg-lambda-xxx \
  --query 'SecurityGroups[0].IpPermissionsEgress'

# Check EC2 Security Group inbound rules
aws ec2 describe-security-groups \
  --group-ids sg-ec2-xxx \
  --query 'SecurityGroups[0].IpPermissions'
```

### Step 3: Test Database Connectivity

Từ EC2 instance trong cùng VPC:
```bash
# Test TCP connection
telnet 10.0.3.107 1433

# Hoặc dùng nc (netcat)
nc -zv 10.0.3.107 1433
```

### Step 4: Test Lambda Function

1. Vào Lambda Console
2. Test với health endpoint
3. Check CloudWatch Logs
4. Verify database connection logs

## 📊 Network Architecture

```
Internet
   │
   ├── Internet Gateway
   │
   ├── NAT Gateway (cho outbound từ private subnet)
   │
   └── VPC (10.0.0.0/16)
       │
       ├── Public Subnet (10.0.1.0/24)
       │   └── NAT Gateway
       │
       └── Private Subnet (10.0.3.0/24)
           ├── Lambda Function (learninghub-backend)
           │   └── Security Group: sg-lambda
           │
           └── EC2 Database (10.0.3.107)
               └── Security Group: sg-ec2-db
```

## ✅ Final Checklist

- [ ] Lambda function trong VPC
- [ ] Security Groups configured correctly
- [ ] IAM permissions cho VPC access
- [ ] Database environment variables set
- [ ] Database accessible từ VPC
- [ ] Test connection thành công
- [ ] CloudWatch logs showing successful connections
- [ ] API Gateway endpoint working
- [ ] Frontend có thể gọi API

## 📚 References

- [Lambda VPC Configuration](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)
- [Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [SQL Server Network Configuration](https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/configure-a-server-to-listen-on-a-specific-tcp-port)

