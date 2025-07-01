// app/api/move-file/route.ts
import { NextResponse } from 'next/server';
import { S3Client, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getAuth } from '@clerk/nextjs/server';

const s3 = new S3Client({ region: 'eu-west-3' });

async function listElevesFolders(s3: S3Client, bucket: string) {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Delimiter: '/',
    Prefix: 'eleves/',
  });
  const result = await s3.send(command);
  return result.CommonPrefixes
    ?.map(p => p.Prefix?.split('/')[1])
    .filter(Boolean) || [];
}

export async function POST(req: Request) {
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { sourceKey, eleveId, newFileName } = await req.json();
  const bucket = process.env.AWS_S3_BUCKET_NAME!;

  // Récupère la liste des dossiers élèves
  const existingFolders = await listElevesFolders(s3, bucket);

  // Nettoyage du nom de dossier
  const safeEleveId = eleveId.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();

  // Recherche du dossier correspondant
  const matchedFolder = existingFolders.find(folder =>
  folder && folder.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase() === safeEleveId
);


  if (!matchedFolder) {
    return NextResponse.json(
      { error: 'Aucun dossier élève correspondant trouvé. À valider manuellement.' },
      { status: 404 }
    );
  }

  // Utilise le nom exact du dossier existant
  const destKey = `eleves/${matchedFolder}/${newFileName}`;

  try {
    // Copie le fichier dans le dossier élève
    await s3.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destKey,
    }));
    // Supprime l’original (optionnel)
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: sourceKey,
    }));
    return NextResponse.json({ success: true, destKey });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

