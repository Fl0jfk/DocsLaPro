// app/api/eleves/list/route.ts
import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'eu-west-3' });

export async function GET() {
  const bucket = process.env.AWS_S3_BUCKET_NAME!;
  const foldersCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: 'eleves/',
    Delimiter: '/',
  });
  const foldersResult = await s3.send(foldersCommand);
  const folders = foldersResult.CommonPrefixes?.map(p => p.Prefix) || [];
  const eleves = [];
  for (const folder of folders) {
    const filesCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: folder,
    });
    const filesResult = await s3.send(filesCommand);
    const docs = filesResult.Contents
      ?.filter(f => !f.Key?.endsWith('fiche.json') && !f.Key?.endsWith('/'))
      .map(f => ({
        key: f.Key,
        name: f.Key?.split('/').pop(),
        url: `https://${bucket}.s3.eu-west-3.amazonaws.com/${f.Key}`
      })) || [];
    let fiche = null;
    try {
      const ficheFile = filesResult.Contents?.find(f => f.Key?.endsWith('fiche.json'));
      if (ficheFile) {
        const ficheRes = await fetch(`https://${bucket}.s3.eu-west-3.amazonaws.com/${ficheFile.Key}`);
        fiche = await ficheRes.json();
      }
    } catch (e) {
      console.log(e)
      fiche = null;
    }
    const photoFile = filesResult.Contents?.find(f =>
      f.Key && /\.(jpg|jpeg|png)$/i.test(f.Key) && !f.Key?.endsWith('/')
    );
    const photoUrl = photoFile
      ? `https://${bucket}.s3.eu-west-3.amazonaws.com/${photoFile.Key}`
      : null;
    eleves.push({
      dossier: folder,
      fiche,
      photoUrl,
      documents: docs,
    });
  }
  return NextResponse.json(eleves);
}
