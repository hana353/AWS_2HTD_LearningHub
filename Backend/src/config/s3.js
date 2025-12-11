// src/config/s3.js
// Cấu hình AWS S3 client
// Hỗ trợ cả Local (dùng credentials) và Lambda (dùng IAM Role)

import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';

dotenv.config();

// Detect nếu đang chạy trên Lambda
// Lambda tự động set các biến môi trường này
const isLambda = !!(
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.AWS_EXECUTION_ENV
);

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || process.env.COGNITO_REGION || 'ap-southeast-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'learninghub-app-bucket';

// Cấu hình S3 Client
let s3ClientConfig = {
  region: AWS_REGION,
};

if (isLambda) {
  // Trên Lambda: Sử dụng IAM Role (không cần credentials)
  // AWS SDK sẽ tự động lấy credentials từ Lambda execution role
  console.log('✅ AWS S3 Configuration (Lambda - IAM Role):');
  console.log(`   Region: ${AWS_REGION}`);
  console.log(`   Bucket: ${S3_BUCKET_NAME}`);
  console.log(`   Authentication: IAM Role (automatic)`);
} else {
  // Local development: Cần credentials từ .env
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS Credentials Missing!');
    console.error('Running in LOCAL mode - credentials are required.');
    console.error('Please set the following environment variables in your .env file:');
    console.error('  - AWS_ACCESS_KEY_ID');
    console.error('  - AWS_SECRET_ACCESS_KEY');
    console.error('  - AWS_REGION (optional, default: ap-southeast-1)');
    console.error('  - S3_BUCKET_NAME (optional, default: learninghub-app-bucket)');
    console.error('\nMake sure your .env file exists in the Backend/ directory.');
    throw new Error('AWS credentials are not configured. Please check your .env file.');
  }

  // Validate credentials format
  if (AWS_ACCESS_KEY_ID.length < 16 || AWS_SECRET_ACCESS_KEY.length < 20) {
    console.error('❌ AWS Credentials appear to be invalid!');
    console.error('Access Key ID should be at least 16 characters');
    console.error('Secret Access Key should be at least 20 characters');
    throw new Error('AWS credentials format is invalid. Please check your .env file.');
  }

  // Thêm credentials vào config
  s3ClientConfig.credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };

  console.log('✅ AWS S3 Configuration (Local - Credentials):');
  console.log(`   Region: ${AWS_REGION}`);
  console.log(`   Bucket: ${S3_BUCKET_NAME}`);
  console.log(`   Access Key ID: ${AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
}

const s3Client = new S3Client(s3ClientConfig);

// Helper để tạo S3 key (path) cho file
export function getS3Key(prefix, filename) {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${prefix}/${timestamp}-${sanitizedFilename}`;
}

// Helper để tạo S3 URL
export function getS3Url(key) {
  if (!key) return null;
  // Nếu đã là full URL thì return luôn
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  return `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

export { s3Client, S3_BUCKET_NAME, AWS_REGION };

