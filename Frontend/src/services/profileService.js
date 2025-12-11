// src/services/profileService.js
import apiClient from './https';

/**
 * Lấy thông tin profile của user hiện tại
 * API: GET /api/my/profile
 * @returns {Promise<Object>} { id, email, fullName, phone, avatar, avatarS3Key, bio, roleName }
 */
export async function getMyProfile() {
  try {
    const res = await apiClient.get('/api/my/profile');
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || 'Failed to fetch profile');
    }

    return result.data || result;
  } catch (error) {
    throw error;
  }
}

/**
 * Cập nhật thông tin profile của user hiện tại
 * API: PUT /api/my/profile
 * @param {Object} payload - { fullName?, phone?, bio?, avatar? }
 *   - Tất cả fields đều optional
 *   - avatar: URL từ API upload/image → update avatar mới
 *            "" hoặc null → xóa avatar
 *            Không gửi field này → giữ nguyên avatar hiện tại
 * @returns {Promise<Object>} Profile đã cập nhật
 */
export async function updateMyProfile(payload) {
  try {
    const res = await apiClient.put('/api/my/profile', payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || 'Failed to update profile');
    }

    return result.data || result;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload image (avatar hoặc image khác) - Dùng presigned URL để upload trực tiếp lên S3
 * API: POST /api/upload/presigned-upload-url → Upload lên S3 → Trả về public URL
 * @param {File} file - File ảnh cần upload (image/jpeg, image/jpg, image/png, image/gif, image/webp)
 * @param {string} prefix - S3 prefix (default: 'avatars')
 * @returns {Promise<Object>} { s3Key, publicUrl }
 */
export async function uploadImage(file, prefix = 'avatars') {
  if (!file) {
    throw new Error('File is required');
  }

  // Validate image file
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only image files are allowed');
  }

  // Validate file size (5MB cho avatar, 500MB cho các file khác)
  const maxSize = prefix === 'avatars' ? 5 * 1024 * 1024 : 500 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${prefix === 'avatars' ? '5MB' : '500MB'} limit`);
  }

  try {
    // Bước 1: Lấy presigned URL từ backend
    const presignedRes = await apiClient.post('/api/upload/presigned-upload-url', {
      filename: file.name,
      contentType: file.type,
      prefix: prefix,
    });

    const presignedData = presignedRes.data?.data || presignedRes.data;
    if (!presignedData || !presignedData.presignedUrl || !presignedData.s3Key) {
      throw new Error('Failed to get presigned URL');
    }

    const { presignedUrl, s3Key, publicUrl } = presignedData;

    // Bước 2: Upload trực tiếp lên S3 bằng presigned URL
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('S3 upload error:', errorText);
      throw new Error(`Failed to upload to S3: ${uploadRes.status} ${uploadRes.statusText}`);
    }

    // Bước 3: Trả về kết quả với public URL
    return {
      message: 'Upload thành công',
      s3Key,
      url: publicUrl,
      urls: [publicUrl],
      folder: prefix,
    };
  } catch (error) {
    // Handle specific error messages
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Upload failed: ' + (error.toString() || 'Unknown error'));
  }
}

export default {
  getMyProfile,
  updateMyProfile,
  uploadImage,
};
