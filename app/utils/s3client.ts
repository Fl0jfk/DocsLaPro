import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.BUCKET_NAME!;
