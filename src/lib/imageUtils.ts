
import imageCompression from 'browser-image-compression';
import { ImageAttachment } from '@/types/chat';

interface UploadResponse {
  url: string;
  filename: string;
  fileId: string;
  fileKey: string;
}

export const compressImage = async (imageFile: File): Promise<File> => {
  const options = {
    maxSizeMB: 1, // (max file size and will not compress if file size is under this) Mb
    maxWidthOrHeight: 1024, // max width or height in pixels
    useWebWorker: true,
    fileType: "image/webp",
    alwaysKeepResolution: true,
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    console.log(
      `Compressed image from ${imageFile.size / 1024 / 1024} MB to ${compressedFile.size / 1024 / 1024} MB`,
    );
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

export const uploadImage = async (compressedFile: File, originalFile: File): Promise<ImageAttachment> => {
  const formData = new FormData();
  formData.append('file', compressedFile);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const uploadResponse: UploadResponse = await response.json();
  
  return {
    url: uploadResponse.url,
    filename: uploadResponse.filename,
    mimeType: originalFile.type,
    size: originalFile.size
  };
}; 