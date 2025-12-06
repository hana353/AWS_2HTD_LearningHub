# Hướng dẫn thiết lập file .env

File `.env` đã được tạo với tất cả các biến môi trường cần thiết cho dự án LearningHub.

## Cách tạo file .env

Tạo file `.env` trong thư mục `Backend/` với nội dung sau:

```env
# ============================================
# DATABASE CONFIG (EC2 SQL Server)
# ============================================
DB_SERVER=52.74.234.40
DB_USER=sa
DB_PASSWORD=2htdLearningHub@
DB_NAME=2HTD_LearningHub
DB_PORT=1433

# ============================================
# AWS COGNITO CONFIG
# ============================================
COGNITO_REGION=ap-southeast-1
COGNITO_USER_POOL_ID=ap-southeast-1_wgFLpZsho
COGNITO_CLIENT_ID=4quhrr2mrl5t2u4fatc4pdl44s

# ============================================
# AWS S3 CONFIG
# ============================================
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=learninghub-app-bucket
AWS_ACCESS_KEY_ID=AKIA2VGKO3F4F3JHPJ53
AWS_SECRET_ACCESS_KEY=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

# ============================================
# API GATEWAY CONFIG
# ============================================
API_GATEWAY_ENDPOINT=https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default
API_GATEWAY_STAGE=default

# ============================================
# LAMBDA CONFIG
# ============================================
LAMBDA_FUNCTION_NAME=learninghub-backend
LAMBDA_FUNCTION_ARN=arn:aws:lambda:ap-southeast-1:732716521848:function:learninghub-backend

# ============================================
# VPC CONFIG
# ============================================
VPC_ID=vpc-0dcc30db69a11c12e
VPC_NAME=learninghub-vpc

# ============================================
# SERVER CONFIG
# ============================================
PORT=4000
NODE_ENV=development

# ============================================
# ADMIN CONFIG
# ============================================
ADMIN_EMAIL=admin@2htdlearninghub.xyz
```

## Lệnh tạo file (Windows PowerShell)

```powershell
cd Backend
@"
# ============================================
# DATABASE CONFIG (EC2 SQL Server)
# ============================================
DB_SERVER=52.74.234.40
DB_USER=sa
DB_PASSWORD=2htdLearningHub@
DB_NAME=2HTD_LearningHub
DB_PORT=1433

# ============================================
# AWS COGNITO CONFIG
# ============================================
COGNITO_REGION=ap-southeast-1
COGNITO_USER_POOL_ID=ap-southeast-1_wgFLpZsho
COGNITO_CLIENT_ID=4quhrr2mrl5t2u4fatc4pdl44s

# ============================================
# AWS S3 CONFIG
# ============================================
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=learninghub-app-bucket
AWS_ACCESS_KEY_ID=AKIA2VGKO3F4F3JHPJ53
AWS_SECRET_ACCESS_KEY=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

# ============================================
# API GATEWAY CONFIG
# ============================================
API_GATEWAY_ENDPOINT=https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default
API_GATEWAY_STAGE=default

# ============================================
# LAMBDA CONFIG
# ============================================
LAMBDA_FUNCTION_NAME=learninghub-backend
LAMBDA_FUNCTION_ARN=arn:aws:lambda:ap-southeast-1:732716521848:function:learninghub-backend

# ============================================
# VPC CONFIG
# ============================================
VPC_ID=vpc-0dcc30db69a11c12e
VPC_NAME=learninghub-vpc

# ============================================
# SERVER CONFIG
# ============================================
PORT=4000
NODE_ENV=development

# ============================================
# ADMIN CONFIG
# ============================================
ADMIN_EMAIL=admin@2htdlearninghub.xyz
"@ | Out-File -FilePath .env -Encoding utf8
```

## Kiểm tra file .env

Sau khi tạo file, đảm bảo:
1. File `.env` nằm trong thư mục `Backend/`
2. Không commit file `.env` lên Git (đã có trong `.gitignore`)
3. Tất cả các biến môi trường đều được điền đầy đủ

