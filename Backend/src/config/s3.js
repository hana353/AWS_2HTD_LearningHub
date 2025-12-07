// src/config/s3.js
// Cấu hình AWS S3 client

import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || process.env.COGNITO_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'learninghub-app-bucket';
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';

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

