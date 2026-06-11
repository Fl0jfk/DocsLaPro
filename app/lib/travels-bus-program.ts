import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function loadBusProgramAttachments(
  data: Record<string, unknown>,
): Promise<Array<{ filename: string; content: Buffer; contentType: string }>> {
  const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
  const transportRequest = data.transportRequest as { busProgramFile?: { url?: string; name?: string } } | undefined;
  const busFile = transportRequest?.busProgramFile;
  if (!busFile?.url) return attachments;

  try {
    const urlObj = new URL(busFile.url);
    const fileKey = decodeURIComponent(urlObj.pathname.substring(1));
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    const command = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: fileKey });
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 120 });
    const fileRes = await fetch(presignedUrl);
    if (fileRes.ok) {
      const arrayBuffer = await fileRes.arrayBuffer();
      attachments.push({
        filename: busFile.name || "Programme_de_route.pdf",
        content: Buffer.from(arrayBuffer),
        contentType: "application/pdf",
      });
    }
  } catch (e) {
    console.error("[travels-bus-program]", e);
  }
  return attachments;
}
