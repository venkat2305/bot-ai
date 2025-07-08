/**
 * R2 Configuration Test API
 * Test your R2 setup without uploading files
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    forcePathStyle: false,
  });
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

    const config = {
      hasAccountId: !!R2_ACCOUNT_ID,
      hasBucketName: !!R2_BUCKET_NAME,
      hasPublicUrl: !!R2_PUBLIC_URL,
      hasAccessKey: !!R2_ACCESS_KEY_ID,
      hasSecretKey: !!R2_SECRET_ACCESS_KEY,
      accountId: R2_ACCOUNT_ID ? `${R2_ACCOUNT_ID.substring(0, 8)}...` : null,
      bucketName: R2_BUCKET_NAME,
      publicUrl: R2_PUBLIC_URL,
    };

    console.log('R2 Configuration Check:', config);

    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Missing required R2 environment variables',
        config,
      });
    }

    if (!R2_PUBLIC_URL) {
      return NextResponse.json({
        success: false,
        error: 'R2_PUBLIC_URL is required for public image access',
        config,
      });
    }

    // Test R2 connection
    const s3Client = createR2Client();
    
    console.log('Testing R2 connection...');
    
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 1, // Just test connection, don't list all objects
    });

    await s3Client.send(listCommand);
    
    console.log('R2 connection successful!');

    return NextResponse.json({
      success: true,
      message: 'R2 configuration is valid and connection successful',
      config,
    });

  } catch (error) {
    console.error('R2 test error:', error);
    
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('InvalidAccessKeyId')) {
        errorMessage = 'Invalid R2 access key ID';
      } else if (error.message.includes('SignatureDoesNotMatch')) {
        errorMessage = 'Invalid R2 secret access key';
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = 'R2 bucket not found';
      } else if (error.message.includes('Missing R2 configuration')) {
        errorMessage = 'Missing R2 environment variables';
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      config: {
        hasAccountId: !!process.env.R2_ACCOUNT_ID,
        hasBucketName: !!process.env.R2_BUCKET_NAME,
        hasPublicUrl: !!process.env.R2_PUBLIC_URL,
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
} 