import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CF_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CF_R2_SECRET_ACCESS_KEY,
  },
})

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: env.CF_R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return `${env.CF_R2_PUBLIC_URL}/${key}`
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: env.CF_R2_BUCKET, Key: key }))
}

export function keyFromUrl(url: string): string | null {
  const prefix = env.CF_R2_PUBLIC_URL + '/'
  return url.startsWith(prefix) ? url.slice(prefix.length) : null
}

/** Generate a short-lived presigned upload URL (for future direct-upload from browser) */
export async function presignUpload(key: string, contentType: string, expiresIn = 300) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: env.CF_R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  )
}
