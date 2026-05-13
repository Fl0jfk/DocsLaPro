import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { canSignTravelsDirectionForEtab, isTripOwner } from "@/app/lib/travels-direction-permissions";

const INDEX_KEY = "travels/index.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tripSummaryFromFullTrip(tripId: string, t: any) {
  const inner = t.data || {};
  return {
    id: tripId,
    ownerName: t.ownerName,
    status: t.status,
    type: t.type,
    createdAt: t.createdAt || new Date().toISOString(),
    data: {
      title: inner.title || "Titre introuvable",
      destination: inner.destination || "Destination introuvable",
      imageUrl: t.imageUrl,
      nbEleves: inner.nbEleves,
      nbAccompagnateurs: inner.nbAccompagnateurs,
      nomsAccompagnateurs: inner.nomsAccompagnateurs || [],
      classes: inner.classes || [],
      piqueNique: inner.piqueNique || false,
      piqueNiqueDetails: inner.piqueNiqueDetails || null,
      date: inner.date || null,
      startDate: inner.startDate || inner.date || null,
      endDate: inner.endDate || inner.date || null,
      startTime: inner.startTime || null,
      endTime: inner.endTime || null,
      needsBus: inner.needsBus || false,
      transportRequest: inner.transportRequest || null,
      objectifs: inner.objectifs || inner.pedagogicalObjectives || null,
      coutTotal: inner.coutTotal,
      etablissement: inner.etablissement || null,
      recurrenceSeriesId: inner.recurrenceSeriesId || null,
      recurrenceIndex: inner.recurrenceIndex ?? null,
      recurrenceTotal: inner.recurrenceTotal ?? null,
    },
  };
}

/**
 * POST { action: "validate_pedagogy_series", seriesId }
 * ou { action: "cancel_session", tripId } (dossier d’une série)
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  let body: { action?: string; seriesId?: string; tripId?: string; actorName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const actor =
    typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "Utilisateur";
  const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
  const bucket = process.env.BUCKET_NAME!;

  try {
    let currentIndex: unknown[] = [];
    try {
      const indexRes = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: INDEX_KEY }));
      const indexBody = await indexRes.Body?.transformToString();
      if (indexBody) currentIndex = JSON.parse(indexBody);
    } catch {
      /* vide */
    }

    const syncIndexEntry = (tripId: string, summary: ReturnType<typeof tripSummaryFromFullTrip>) => {
      const idx = currentIndex.findIndex((e: unknown) => (e as { id?: string }).id === tripId);
      if (idx > -1) (currentIndex as unknown[])[idx] = summary;
    };

    if (body.action === "validate_pedagogy_series" && body.seriesId) {
      const seriesId = body.seriesId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = currentIndex as any[];
      const ids: string[] = [];
      for (const row of rows) {
        if (row.type !== "SIMPLE" || row.status !== "EN_ATTENTE_DIR_INITIAL" || !row.id) continue;
        const data = row.data || {};
        let sid: string | null | undefined = data.recurrenceSeriesId;
        if (sid === undefined && !("recurrenceSeriesId" in data)) {
          try {
            const getOne = await s3Client.send(
              new GetObjectCommand({ Bucket: bucket, Key: `travels/${row.id}.json` })
            );
            const raw = await getOne.Body?.transformToString();
            if (!raw) continue;
            const full = JSON.parse(raw);
            sid = full?.data?.recurrenceSeriesId;
          } catch {
            continue;
          }
        }
        if (sid === seriesId) ids.push(row.id);
      }
      if (ids.length === 0) {
        return NextResponse.json({ error: "Aucun dossier de la série en attente pédagogie.", updated: 0 }, { status: 404 });
      }
      const me = await currentUser();
      if (!me?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      const firstGet = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: `travels/${ids[0]}.json` })
      );
      const firstRaw = await firstGet.Body?.transformToString();
      if (!firstRaw) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
      const firstTrip = JSON.parse(firstRaw);
      if (!canSignTravelsDirectionForEtab(me, firstTrip?.data?.etablissement)) {
        return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
      }
      const now = new Date().toISOString();
      let updated = 0;
      for (const tripId of ids) {
        const key = `travels/${tripId}.json`;
        const getRes = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const raw = await getRes.Body?.transformToString();
        if (!raw) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trip: any = JSON.parse(raw);
        if (trip.type !== "SIMPLE" || trip.status !== "EN_ATTENTE_DIR_INITIAL") continue;
        if (trip.data?.recurrenceSeriesId !== seriesId) continue;
        trip.status = "EN_ATTENTE_COMPTA";
        trip.updatedAt = now;
        trip.history = [
          ...(trip.history || []),
          {
            date: now,
            action: "EN_ATTENTE_COMPTA",
            note: "Pédagogie validée (toute la série)",
            user: actor,
          },
        ];
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(trip),
            ContentType: "application/json",
          })
        );
        syncIndexEntry(tripId, tripSummaryFromFullTrip(tripId, trip));
        updated++;
      }
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: INDEX_KEY,
          Body: JSON.stringify(currentIndex),
          ContentType: "application/json",
        })
      );
      return NextResponse.json({ success: true, updated });
    }

    if (body.action === "cancel_session" && body.tripId) {
      const tripId = body.tripId;
      const key = `travels/${tripId}.json`;
      const getRes = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const raw = await getRes.Body?.transformToString();
      if (!raw) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trip: any = JSON.parse(raw);
      const me = await currentUser();
      if (!me?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      if (!isTripOwner(trip.ownerId, me.id) && !canSignTravelsDirectionForEtab(me, trip.data?.etablissement)) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      if (!trip.data?.recurrenceSeriesId) {
        return NextResponse.json({ error: "Ce dossier ne fait pas partie d’une série récurrente." }, { status: 400 });
      }
      if (trip.status === "SEANCE_ANNULEE") {
        return NextResponse.json({ error: "Séance déjà annulée." }, { status: 400 });
      }
      if (trip.status === "VALIDE" || trip.status === "REJETE") {
        return NextResponse.json({ error: "Impossible d’annuler ce dossier à ce stade." }, { status: 400 });
      }
      const now = new Date().toISOString();
      trip.status = "SEANCE_ANNULEE";
      trip.updatedAt = now;
      trip.history = [
        ...(trip.history || []),
        {
          date: now,
          action: "SEANCE_ANNULEE",
          note: "Séance annulée (reste de la série inchangé)",
          user: actor,
        },
      ];
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: JSON.stringify(trip),
          ContentType: "application/json",
        })
      );
      syncIndexEntry(tripId, tripSummaryFromFullTrip(tripId, trip));
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: INDEX_KEY,
          Body: JSON.stringify(currentIndex),
          ContentType: "application/json",
        })
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("series-action:", e);
    return NextResponse.json({ error: "Échec" }, { status: 500 });
  }
}
