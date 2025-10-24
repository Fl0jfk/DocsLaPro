import { NextRequest, NextResponse } from "next/server";
import {  ListObjectsV2Command,  ListObjectsV2CommandOutput, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/app/utils/voyageStore";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  console.log(req)
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const voyages: any[] = [];
    let continuationToken: string | undefined = undefined;
    do {
      const list: ListObjectsV2CommandOutput = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: "travels/",
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      );
      for (const obj of list.Contents || []) {
        if (!obj.Key) continue;
        if (!obj.Key.endsWith("voyage.json")) continue;
        try {
          const data = await s3.send(
            new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key })
          );
          const body = await data.Body?.transformToString();
          if (!body) continue;
          const voyage = JSON.parse(body);
          voyages.push(voyage);
        } catch (err) {
          console.error(`Impossible de lire ${obj.Key}:`, err);
        }
      }
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    return NextResponse.json({ voyages });
  } catch (err) {
    console.error("Erreur GET /api/travels/list:", err);
    return NextResponse.json(
      { error: "Impossible de lister les voyages" },
      { status: 500 }
    );
  }
}
