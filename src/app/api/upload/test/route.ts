/**
 * R2 Configuration Test API
 * Test your R2 setup without uploading files
 */

import { NextRequest, NextResponse } from 'next/server';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getR2Client, getR2Config } from '@/lib/r2Client';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, bucketName, publicUrl } = getR2Config();

    const config = {
      hasAccountId: true,
      hasBucketName: true,
      hasPublicUrl: true,
      hasAccessKey: true,
      hasSecretKey: true,
      accountId: `${accountId.substring(0, 8)}...`,
      bucketName,
      publicUrl,
    };

    console.log('R2 Configuration Check:', config);

    // Test R2 connection
    const s3Client = getR2Client();
    
    console.log('Testing R2 connection...');
    
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
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
        hasAccountId: true,
        hasBucketName: true,
        hasPublicUrl: true,
        hasAccessKey: true,
        hasSecretKey: true,
      },
    });
  }
} 