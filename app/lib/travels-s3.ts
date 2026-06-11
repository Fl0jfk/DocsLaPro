import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { s3Key } from "@/app/lib/s3-path";



function travelsS3Client() {

  return new S3Client({

    region: process.env.REGION,

    credentials: {

      accessKeyId: process.env.ACCESS_KEY_ID!,

      secretAccessKey: process.env.SECRET_ACCESS_KEY!,

    },

  });

}



export function encodeS3KeyForUrl(key: string): string {

  return key

    .split("/")

    .map((segment) => encodeURIComponent(segment))

    .join("/");

}



export function publicS3UrlForKey(key: string): string {

  const bucket = process.env.BUCKET_NAME;

  const region = process.env.REGION;

  if (!bucket || !region) throw new Error("BUCKET_NAME ou REGION manquant");

  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeS3KeyForUrl(key)}`;

}



/** Extrait la clé objet depuis une URL S3 (publique, signée ou path-style). */

export function parseTravelsS3KeyFromUrl(fileUrl: string): string | null {

  const raw = String(fileUrl || "").trim();

  if (!raw) return null;



  const bucket = process.env.BUCKET_NAME;

  const region = process.env.REGION;

  if (!bucket) return null;



  const decodePath = (path: string) => {

    try {

      return decodeURIComponent(path.replace(/^\//, ""));

    } catch {

      return path.replace(/^\//, "");

    }

  };



  try {

    const u = new URL(raw);

    const host = u.hostname;

    const pathKey = decodePath(u.pathname);



    if (host === `${bucket}.s3.${region}.amazonaws.com` || host === `${bucket}.s3.amazonaws.com`) {

      return pathKey || null;

    }

    if (host === `s3.${region}.amazonaws.com` && pathKey.startsWith(`${bucket}/`)) {

      return pathKey.slice(bucket.length + 1) || null;

    }

    if (host === "s3.amazonaws.com" && pathKey.startsWith(`${bucket}/`)) {

      return pathKey.slice(bucket.length + 1) || null;

    }

  } catch {

    /* pas une URL absolue — traité comme clé relative ci-dessous */

  }



  const markers = [

    `${bucket}.s3.${region}.amazonaws.com/`,

    `${bucket}.s3.amazonaws.com/`,

    `s3.${region}.amazonaws.com/${bucket}/`,

    `s3.amazonaws.com/${bucket}/`,

  ];

  for (const marker of markers) {

    const idx = raw.indexOf(marker);

    if (idx !== -1) {

      const rest = raw.slice(idx + marker.length).split("?")[0].split("#")[0];

      const key = decodePath(rest);

      if (key) return key;

    }

  }



  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {

    return s3Key(raw.split("?")[0].split("#")[0]);

  }



  return null;

}



/** Variantes de clés à tester (URL, chemin relatif, ancien préfixe tenants/… dans l’URL). */

export function candidateTravelsS3Keys(fileUrl: string, explicitKey?: string | null): string[] {

  const out: string[] = [];

  const add = (k: string | null | undefined) => {

    const n = s3Key(String(k || "").split("?")[0].split("#")[0]);

    if (n && !out.includes(n)) out.push(n);

  };



  if (explicitKey) add(explicitKey);



  const parsed = parseTravelsS3KeyFromUrl(fileUrl);

  if (parsed) add(parsed);



  const raw = String(fileUrl || "").trim();

  if (raw && !raw.startsWith("http://") && !raw.startsWith("https://")) {

    add(raw);

  }



  for (const k of [...out]) {

    if (k.startsWith("tenants/")) {

      const parts = k.split("/");

      if (parts.length >= 3) add(parts.slice(2).join("/"));

    }

  }



  return out;

}



async function s3ObjectExists(bucket: string, key: string): Promise<boolean> {

  const client = travelsS3Client();

  try {

    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

    return true;

  } catch {

    try {

      const res = await client.send(

        new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-0" }),

      );

      await res.Body?.transformToByteArray();

      return true;

    } catch {

      return false;

    }

  }

}



/** Trouve la clé S3 réelle d'un fichier. */

export async function resolveTravelsS3ObjectKey(

  fileUrl: string,

  explicitKey?: string | null,

): Promise<string | null> {

  const bucket = process.env.BUCKET_NAME;

  if (!bucket) return null;



  for (const key of candidateTravelsS3Keys(fileUrl, explicitKey)) {

    if (await s3ObjectExists(bucket, key)) return key;

  }

  return null;

}



/** Télécharge un PDF devis depuis S3 (devis manuels) ou via fetch si URL publique externe. */

export async function fetchTravelsPdfBytes(

  fileUrl: string,

  explicitKey?: string | null,

): Promise<Buffer> {

  const key = await resolveTravelsS3ObjectKey(fileUrl, explicitKey);

  const bucket = process.env.BUCKET_NAME;



  if (key && bucket) {

    const res = await travelsS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    const bytes = await res.Body?.transformToByteArray();

    if (!bytes?.length) throw new Error("Fichier PDF vide ou introuvable sur S3.");

    return Buffer.from(bytes);

  }



  const response = await fetch(fileUrl);

  if (!response.ok) throw new Error("Impossible de récupérer le PDF du devis.");

  return Buffer.from(await response.arrayBuffer());

}


