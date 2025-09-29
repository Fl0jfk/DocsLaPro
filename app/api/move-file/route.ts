import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';

const s3 = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { sourceKey, eleveId, newFileName } = await req.json();
    if (!sourceKey || !eleveId || !newFileName) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }
    const getCommand = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: sourceKey });
    const s3Object = await s3.send(getCommand);
    const chunks: Uint8Array[] = [];
    // @ts-ignore
    for await (const chunk of s3Object.Body as any) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    const sharePointFolderPath = `eleves/${eleveId}`;
    const graphUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.SP_SITE_ID}/drive/root:/${sharePointFolderPath}/${newFileName}:/content`;
    const graphRes = await fetch(graphUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.GRAPH_ACCESS_TOKEN}`, // <--- À remplacer par ton token valide
        'Content-Type': 'application/pdf',
      },
      body: fileBuffer,
    });
    if (!graphRes.ok) {
      const errText = await graphRes.text();
      return NextResponse.json({ error: 'Erreur Graph API', details: errText }, { status: graphRes.status });
    }
    const uploadedFile = await graphRes.json();
    const delCommand = new DeleteObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: sourceKey });
    await s3.send(delCommand);
    return NextResponse.json({ success: true, sharepointFile: uploadedFile });
  } catch (err: any) {
    console.error('Erreur move-file:', err);
    return NextResponse.json({ error: err.message || 'Erreur inconnue' }, { status: 500 });
  }
}
