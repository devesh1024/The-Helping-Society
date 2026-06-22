import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder',
  api_key: process.env.CLOUDINARY_API_KEY || 'placeholder',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder'
});

export const uploadBuffer = (
  buffer: Buffer,
  folder = 'academic_resources'
): Promise<{ public_id: string; secure_url: string }> => {
  return new Promise((resolve, reject) => {
    // Graceful fallback for test environments or missing configurations
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.CLOUDINARY_CLOUD_NAME === 'placeholder'
    ) {
      return resolve({
        public_id: `mock_public_id_${Date.now()}`,
        secure_url: `https://res.cloudinary.com/mock/image/upload/mock_file_${Date.now()}.pdf`
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'raw' },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url
          });
        } else {
          reject(new Error('Cloudinary upload stream returned undefined result.'));
        }
      }
    );
    
    uploadStream.end(buffer);
  });
};
