/**
 * Image Upload API - Cloudflare R2 Integration
 * 
 * Required Environment Variables:
 * - R2_ACCOUNT_ID: Your Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 access key ID
 * - R2_SECRET_ACCESS_KEY: R2 secret access key
 * - R2_BUCKET_NAME: Name of your R2 bucket
 * - R2_PUBLIC_URL: (Required) Custom domain or R2 dev subdomain for public URLs
 * 
 * Detailed Setup Instructions:
 * 
 * 1. Create R2 Bucket:
 *    - Go to Cloudflare Dashboard > R2 Object Storage
 *    - Create a new bucket
 *    - Note the bucket name
 * 
 * 2. Generate R2 API Tokens:
 *    - Go to Cloudflare Dashboard > My Profile > API Tokens
 *    - Create token with "Custom token" template
 *    - Permissions: Zone:Zone:Read, Account:Cloudflare R2:Edit
 *    - Account Resources: Include your account
 *    - Zone Resources: Include all zones (or specific if using custom domain)
 * 
 * 3. Set up Public Access:
 *    Option A - Custom Domain (Recommended):
 *    - Set up a custom domain pointing to your R2 bucket
 *    - Set R2_PUBLIC_URL to your custom domain (e.g., https://cdn.yourdomain.com)
 *    
 *    Option B - R2 Dev Subdomain:
 *    - Enable public access on your R2 bucket
 *    - Find your bucket's dev subdomain in R2 dashboard
 *    - Set R2_PUBLIC_URL to the dev subdomain (e.g., https://pub-xxxxx.r2.dev)
 * 
 * 4. Configure CORS (if needed):
 *    - In R2 bucket settings, add CORS policy:
 *    [
 *      {
 *        "AllowedOrigins": ["https://yourdomain.com"],
 *        "AllowedMethods": ["GET", "PUT", "POST"],
 *        "AllowedHeaders": ["*"]
 *      }
 *    ]
 * 
 * 5. Environment Variables (.env.local):
 *    R2_ACCOUNT_ID=your-account-id
 *    R2_ACCESS_KEY_ID=your-access-key
 *    R2_SECRET_ACCESS_KEY=your-secret-key
 *    R2_BUCKET_NAME=your-bucket-name
 *    R2_PUBLIC_URL=https://your-custom-domain-or-dev-subdomain
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fileTypeFromBuffer } from 'file-type';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function createR2Client() {
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing R2 configuration');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false, // Use virtual-hosted-style URLs
  });
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("Starting image upload process");

    // Get environment variables
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

    // Check R2 configuration
    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
      console.error('Missing R2 configuration:', { 
        hasAccountId: !!R2_ACCOUNT_ID, 
        hasBucketName: !!R2_BUCKET_NAME 
      });
      return NextResponse.json({ error: 'R2 storage not configured' }, { status: 500 });
    }

    if (!R2_PUBLIC_URL) {
      console.error('R2_PUBLIC_URL not configured - required for public image access');
      return NextResponse.json({ 
        error: 'R2 public URL not configured. Please set R2_PUBLIC_URL environment variable.' 
      }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log("Processing file:", { name: file.name, size: file.size, type: file.type });

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

    console.log("File validation passed:", { detectedType: fileType.mime });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `images/${timestamp}_${randomString}.${fileType.ext}`;

    console.log("Generated filename:", fileName);

    // Create R2 client and upload
    const s3Client = createR2Client();

    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: fileType.mime,
      ContentLength: buffer.length,
    });

    console.log("Attempting upload to R2...");
    await s3Client.send(uploadCommand);
    console.log("Upload successful!");

    // Construct public URL using the configured public URL
    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${fileName}`;
    
    console.log("Generated public URL:", publicUrl);

    return NextResponse.json({
      url: publicUrl,
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