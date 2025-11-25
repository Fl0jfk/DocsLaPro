import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'text requis' }, { status: 400 });
    const extractionPrompt = `
Analyse ce document scolaire et extrais UNIQUEMENT les informations suivantes si elles sont clairement présentes dans le texte :
- Type de document (bulletin, relevé de notes, certificat de scolarité, diplôme, bac, etc.)
- Nom de famille de l'élève
- Prénom de l'élève
- Classe ou niveau (si mentionné)
- Période (trimestre 1/2/3, semestre 1/2, année scolaire, etc.)

Si une information n'est PAS présente dans le document, écris exactement "non_trouvé" pour ce champ.
Ne devine JAMAIS, n'invente JAMAIS.

IMPORTANT : Réponds UNIQUEMENT avec du JSON valide, sans aucun commentaire, remarque, note explicative, ou texte supplémentaire.
Pas de markdown, pas de \`\`\`json, pas de notes entre parenthèses, pas de remarques après les valeurs.

Texte du document :
---
${text}
---

Format de réponse (JSON uniquement) :
{"type":"...","nom":"...","prénom":"...","classe":"...","période":"..."}
    `;
    
    const extractionResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [{ role: "user", content: extractionPrompt }],
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });
    if (!extractionResponse.ok) {
      const err = await extractionResponse.text();
      return NextResponse.json({ error: `Erreur Mistral extraction: ${err}` }, { status: extractionResponse.status });
    }
    const extractionData = await extractionResponse.json();
    let extractionResult = extractionData.choices?.[0]?.message?.content || '';
    extractionResult = extractionResult.trim();
    extractionResult = extractionResult.replace(/`{3}json/gi, '');
    extractionResult = extractionResult.replace(/`{3}/g, '');
    extractionResult = extractionResult.replace(/\n/g, ' ');
    extractionResult = extractionResult.trim();
    extractionResult = extractionResult.replace(/\/\*[\s\S]*?\*\//g, "")
                                      .replace(/\/\/.*/g, "")
                                      .replace(/,\s*\*\(.*?\)\*/g, "");
    const jsonStartIndex = extractionResult.indexOf('{');
    const jsonEndIndex = extractionResult.lastIndexOf('}');
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      return NextResponse.json({
        error: "Aucun JSON trouvé dans la réponse",
        brut: extractionResult
      }, { status: 500 });
    }
    const cleanJson = extractionResult.substring(jsonStartIndex, jsonEndIndex + 1);
    let extracted;
    try {
      extracted = JSON.parse(cleanJson);
    } catch (parseError) {
      const superCleanJson = cleanJson
        .replace(/\s+/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      try {
        extracted = JSON.parse(superCleanJson);
      } catch {
        return NextResponse.json({ 
          error: "JSON invalide après extraction", 
          brut: extractionResult,
          cleaned: cleanJson,
          parseError: String(parseError)
        }, { status: 500 });
      }
    }
    const namingPrompt = `
Tu es un système de nommage de fichiers pour une école.
Voici les informations extraites d'un document :
- Type : ${extracted.type || "non_trouvé"}
- Nom : ${extracted.nom || "non_trouvé"}
- Prénom : ${extracted.prénom || "non_trouvé"}
- Classe : ${extracted.classe || "non_trouvé"}
- Période : ${extracted.période || "non_trouvé"}
Génère un nom de fichier selon ces règles :
1. Format général : Type Période Classe NOM Prénom
2. Si une information vaut "non_trouvé", ne l'inclus PAS dans le nom
3. Garde les accents et caractères spéciaux
4. Exemples :
   - Bulletin trimestre1 3eme DUPONT Jean
   - Baccalauréat MARTIN Sophie
   - Certificat de scolarité BERNARD Luc
   - Relevé de notes du semestre2 2nde PETIT Marie
Réponds UNIQUEMENT avec le nom de fichier (sans extension), rien d'autre. Pas de ponctuation finale.
    `;
    const namingResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [{ role: "user", content: namingPrompt }],
        temperature: 0
      })
    });
    if (!namingResponse.ok) {
      const err = await namingResponse.text();
      return NextResponse.json({ error: `Erreur Mistral naming: ${err}` }, { status: namingResponse.status });
    }
    const namingData = await namingResponse.json();
    let fileName = namingData.choices?.[0]?.message?.content?.trim() || '';
    fileName = fileName.replace(/[<>:"/\\|?*]/g, '_')
                      .replace(/_+/g, '_')
                      .replace(/^_|_$/g, '');
    return NextResponse.json({
      ...extracted,
      eleve: {
        nom: extracted.nom !== "non_trouvé" ? extracted.nom : null,
        prénom: extracted.prénom !== "non_trouvé" ? extracted.prénom : null,
        classe: extracted.classe !== "non_trouvé" ? extracted.classe : null
      },
      fileName: fileName,
      rawExtraction: extracted
    });
  } catch (error) {
    console.error('Erreur analyse Mistral:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}