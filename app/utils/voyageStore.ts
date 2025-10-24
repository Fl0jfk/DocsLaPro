// app/utils/voyageStore.ts
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { currentUser } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";

export const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.BUCKET_NAME!;

export type VoyagePieceJointe = {
  filename: string;
  url: string;
  type: string;
};

export type VoyageStatus =
  | "draft"
  | "direction_validation"
  | "requests_stage"
  | "compta_validation"
  | "final_validation"
  | "validated"
  | "rejected";

export type VoyageEntry = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  direction_cible: string;
  date_depart: string;
  date_retour: string;
  lieu: string;
  activite: string;
  classes: string;
  effectif_eleves: number;
  effectif_accompagnateurs: number;
  commentaire?: string;
  pieces_jointes?: VoyagePieceJointe[] | null;
  date_declaration: string;
  status: VoyageStatus;
};

export async function saveVoyage(userId: string, voyage: VoyageEntry) {
  const key = `travels/${userId}/${voyage.id}/voyage.json`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(voyage, null, 2),
      ContentType: "application/json",
    })
  );
  return key;
}

export async function listVoyages(userId: string) {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `travels/${userId}/`,
    })
  );
  return (res.Contents || []).filter((obj) => obj.Key?.endsWith("voyage.json"));
}

export async function getVoyage(userId: string, voyageId: string) {
  const key = `travels/${userId}/${voyageId}/voyage.json`;
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body = await obj.Body?.transformToString();
  return JSON.parse(body!);
}

export async function getPresignedUploadUrl(
  voyageId: string,
  filename: string,
  type: string
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const key = `travels/${user.id}/${voyageId}/${filename}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: type,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const fileUrl = `https://${BUCKET}.s3.eu-west-3.amazonaws.com/${key}`;
  return { uploadUrl, fileUrl, key };
}
