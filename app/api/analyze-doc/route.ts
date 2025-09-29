import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId)
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { text } = await req.json();
    if (!text)
      return NextResponse.json({ error: 'text requis' }, { status: 400 });
    const prompt = `
      Voici le texte d’un document scolaire. Peux-tu me dire le type de document et à quel élève il appartient (nom/prénom/ID s’il est présent) ?
      ---
      ${text}
      ---
      Réponds sous la forme : { "type": "...", "eleve": "..." }
    `;
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });
    if (!mistralResponse.ok) {
      const err = await mistralResponse.text();
      return NextResponse.json({ error: `Erreur Mistral: ${err}` }, { status: mistralResponse.status });
    }
    const mistralData = await mistralResponse.json();
    const result = mistralData.choices?.[0]?.message?.content || '';
    const jsonMatch = result.match(/``````/i)
                   || result.match(/({[^}]+})/s); 
    let jsonString = '';
    if (jsonMatch) {
      jsonString = jsonMatch[1] || jsonMatch[0];
    } else {
      jsonString = result.trim();
    }
    try {
      return NextResponse.json(JSON.parse(jsonString));
    } catch {
      return NextResponse.json({ error: "Mistral n'a pas retourné un JSON valide après extraction", brut: result, extrait: jsonString }, { status: 500 });
    }
  } catch (error) {
    console.error('Erreur analyse Mistral:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

