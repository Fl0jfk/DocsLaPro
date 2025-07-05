import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'text requis' }, { status: 400 });

    const prompt = `
      Voici le texte d’un document scolaire. Peux-tu me dire le type de document et à quel élève il appartient (nom/prénom/ID s’il est présent) ?
      ---
      ${text}
      ---
      Réponds sous la forme : { "type": "...", "eleve": "..." }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });
    const result = completion.choices[0].message.content;
    try {
      return NextResponse.json(JSON.parse(result || '{}'));
    } catch {
      return NextResponse.json({ error: "GPT n'a pas retourné un JSON valide" });
    }
  } catch (error) {
    console.error('Erreur analyse GPT:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
