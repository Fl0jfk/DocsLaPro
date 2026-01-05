// lib/googleTokensStore.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.BUCKET_NAME!
const FILE_KEY = 'tokensGoogle.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readTokens(): Promise<Record<string, any>> {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: FILE_KEY })
    const url = await getSignedUrl(s3, command, { expiresIn: 60 })
    const res = await fetch(url)
    if (!res.ok) return {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await res.json()) as Record<string, any>
  } catch (err) {
    console.error('Erreur lecture JSON S3 :', err)
    return {}
  }
}
