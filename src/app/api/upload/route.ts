import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fileTypeFromBuffer } from 'file-type';
import { getR2Client, getR2Config } from '@/lib/r2Client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get R2 configuration
    const { bucketName, publicUrl } = getR2Config();

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    // Get file buffer and validate type
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `images/${timestamp}_${randomString}.${fileType.ext}`;

    // Create R2 client and upload
    const s3Client = getR2Client();

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: fileType.mime,
      ContentLength: buffer.length,
    });

    await s3Client.send(uploadCommand);

    // Construct public URL using the configured public URL
    const filePublicUrl = `${publicUrl.replace(/\/$/, '')}/${fileName}`;

    return NextResponse.json({
      url: filePublicUrl,
      filename: file.name,
      mimeType: fileType.mime,
      size: file.size,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Missing R2 configuration')) {
        return NextResponse.json({ error: 'R2 storage not properly configured' }, { status: 500 });
      }
      if (error.message.includes('InvalidAccessKeyId')) {
        return NextResponse.json({ error: 'Invalid R2 access key' }, { status: 500 });
      }
      if (error.message.includes('SignatureDoesNotMatch')) {
        return NextResponse.json({ error: 'Invalid R2 secret key' }, { status: 500 });
      }
      if (error.message.includes('NoSuchBucket')) {
        return NextResponse.json({ error: 'R2 bucket not found' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
} 