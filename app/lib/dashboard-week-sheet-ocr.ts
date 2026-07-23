import { runTextractForS3Key } from "@/app/lib/ocr-textract";
import { getBucketName } from "@/app/lib/s3-storage";

export async function extractPdfTextFromS3(s3Key: string, _maxWaitMs = 90_000): Promise<string> {
  // getBucketName() pour valider le contexte ; runTextractForS3Key gère le bucket en interne.
  await getBucketName();
  const result = await runTextractForS3Key(s3Key);
  return result.text;
}
