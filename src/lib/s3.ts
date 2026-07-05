import { S3Client } from "bun";

// Read environment variables
const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET || process.env.AWS_BUCKET || "abyndotxyz";
const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT; // e.g. https://<id>.r2.cloudflarestorage.com
const region = process.env.S3_REGION || process.env.AWS_REGION || "auto";

// Check if S3 credentials are configured
export function isS3Enabled(): boolean {
  return !!(accessKeyId && secretAccessKey && endpoint);
}

let client: S3Client | null = null;

// Lazy initialization of S3Client to prevent crash if env variables are empty
export function getS3Client(): S3Client {
  if (!isS3Enabled()) {
    throw new Error("S3 is not configured. Please set S3 environment variables.");
  }

  if (!client) {
    client = new S3Client({
      accessKeyId,
      secretAccessKey,
      bucket: bucketName,
      endpoint,
      region,
    });
  }

  return client;
}

/**
 * Uploads a file to S3 storage
 * @param path File path in S3 (e.g., 'blog/assets/my-image.png')
 * @param content File contents (Buffer, ArrayBuffer, Blob, String)
 * @param contentType Optional mime type
 * @returns The public or presigned URL to access the uploaded file
 */
 export async function uploadFile(
   path: string,
   content: Buffer | ArrayBuffer | string | Blob,
   contentType?: string
 ): Promise<string> {
   const s3 = getS3Client();

   // Use the native S3 client instance write method directly
   const options = contentType ? { type: contentType } : undefined;
   await s3.write(path, content, options);

   // Return presigned URL valid for 30 days
   return getFileUrl(path, 60 * 60 * 24 * 30);
 }

/**
 * Downloads a file from S3 and returns its string content
 */
export async function downloadFileAsString(path: string): Promise<string> {
  const s3 = getS3Client();
  const fileRef = s3.file(path);
  return await fileRef.text();
}

/**
 * Downloads a file from S3 as JSON
 */
export async function downloadFileAsJson<T>(path: string): Promise<T | null> {
  const s3 = getS3Client();
  const fileRef = s3.file(path);
  try {
    return await fileRef.json() as T;
  } catch {
    return null;
  }
}

/**
 * Deletes a file from S3
 */
export async function deleteFile(path: string): Promise<void> {
  const s3 = getS3Client();
  const fileRef = s3.file(path);
  await fileRef.delete();
}

/**
 * Generates a presigned URL or public URL for a file
 * @param path File path in S3
 * @param expiresIn Expiration time in seconds (defaults to 1 day)
 */
export function getFileUrl(path: string, expiresIn = 60 * 60 * 24): string {
  if (!isS3Enabled()) {
    return "";
  }

  // Support custom domain for S3 public access (like https://s3.abyn.xyz)
  const publicDomain = process.env.S3_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN;
  if (publicDomain) {
    const domain = publicDomain.endsWith("/") ? publicDomain.slice(0, -1) : publicDomain;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${domain}/${cleanPath}`;
  }

  const s3 = getS3Client();
  const fileRef = s3.file(path);

  // Synchronous presigned URL generation (no network requests)
  return fileRef.presign({
    expiresIn,
  });
}
