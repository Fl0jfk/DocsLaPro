import { NextResponse } from 'next/server';
import { S3Client, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getAuth } from '@clerk/nextjs/server';

const s3 = new S3Client({ region: 'eu-west-3' });

function normalizeAndSortName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.toUpperCase())
    .sort()
    .join('_');
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] =
        a[i - 1] === b[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1);
    }
  }
  return matrix[a.length][b.length];
}

async function listElevesFolders(s3: S3Client, bucket: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Delimiter: '/',
    Prefix: 'eleves/',
  });
  const result = await s3.send(command);
  return (
    result.CommonPrefixes
      ?.map(p => p.Prefix?.split('/')[1])
      .filter((folder): folder is string => !!folder && folder !== '')
    || []
  );
}

function findBestFolder(inputName: string, folders: string[], tolerance = 5): { folder: string | null, distance: number } {
  const normalizedInput = normalizeAndSortName(inputName);
  let bestMatch: string | null = null;
  let bestScore = Infinity;
  for (const folder of folders) {
    const normFolder = normalizeAndSortName(folder);
    if (normFolder === normalizedInput) {
      return { folder, distance: 0 };
    }
    const dist = levenshtein(normalizedInput, normFolder);
    if (dist < bestScore) {
      bestScore = dist;
      bestMatch = folder;
    }
  }
  return bestScore <= tolerance ? { folder: bestMatch, distance: bestScore } : { folder: null, distance: bestScore };
}

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { sourceKey, eleveId, newFileName } = await req.json();
    const bucket = process.env.AWS_S3_BUCKET_NAME!;
    const existingFolders = await listElevesFolders(s3, bucket);
    const { folder: matchedFolder, distance } = findBestFolder(eleveId, existingFolders, 5);
    if (!matchedFolder) {
      return NextResponse.json(
        {
          error: 'Aucun dossier élève correspondant trouvé. À valider manuellement.',
          dossiersExistants: existingFolders,
          distanceMin: distance,
          eleveNormalise: normalizeAndSortName(eleveId)
        },
        { status: 404 }
      );
    }
    const destKey = `eleves/${matchedFolder}/${newFileName}`;
    await s3.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destKey,
    }));
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: sourceKey,
    }));
    return NextResponse.json({ success: true, destKey, dossierTrouve: matchedFolder, distance });
  } catch (err) {
    console.error('Erreur move-file:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}