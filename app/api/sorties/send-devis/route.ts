// app/api/sorties/send-devis/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { S3Client} from '@aws-sdk/client-s3';

//const s3 = new S3Client({ region: 'eu-west-3' });

export async function POST(req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { userId } = getAuth(req as any);
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  //const { sortieId, compagnies } = await req.json();
  // Génère le PDF de la demande de devis (exemple simplifié)
  // const pdf = generatePdf(sortieId);

  // Envoie le PDF par email à chaque compagnie
  // compagnies.forEach(compagnie => sendEmail(compagnie.email, pdf));

  // Stocke la demande de devis dans S3
  //const key = `sorties/${sortieId}/demande_devis_${Date.now()}.pdf`;
  // await s3.send(new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME!, Key: key, Body: pdf }));

  return NextResponse.json({ success: true });
}
