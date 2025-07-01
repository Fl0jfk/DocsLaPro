// components/UploadAndAnalyzeDocument.tsx
'use client';

import { useState, useRef } from 'react';

export default function UploadAndAnalyzeDocument() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [gptResult, setGptResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [moveResult, setMoveResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Ajoute un log dans la liste
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  // Génère un nom de fichier unique
  const generateFileName = (type: string, eleve: string) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const safeEleve = eleve.replace(/[^a-zA-Z0-9_]/g, '_');
    return `${type}_${safeEleve}_${dateStr}_${timeStr}.pdf`;
  };

  // Fonction principale
  const handleUploadAndAnalyze = async () => {
    setGptResult(null);
    setMoveResult(null);
    setOcrText('');
    if (!file) return;
    setStatus('Récupération de l’URL signée...');
    addLog('Demande de l’URL signée pour ' + file.name);

    // 1. Demande une URL signée
    const res1 = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const { url, key } = await res1.json();
    addLog('URL signée reçue, clé S3 : ' + key);

    // 2. Upload le fichier sur S3
    setStatus('Upload sur S3 en cours...');
    addLog('Upload du fichier sur S3...');
    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    addLog('Upload terminé.');

    // 3. Lance Textract OCR
    setStatus('Lancement de l\'OCR AWS Textract...');
    addLog('Appel de /api/ocr-process avec la clé S3...');
    const res2 = await fetch('/api/ocr-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    const { jobId } = await res2.json();
    addLog('Job Textract lancé, jobId : ' + jobId);

    // 4. Polling pour récupérer le résultat OCR
    setStatus('Attente du résultat OCR...');
    let ocrStatus = '';
    let text = '';
    let tries = 0;
    do {
      addLog(`Polling OCR (tentative ${tries + 1})...`);
      const res3 = await fetch('/api/ocr-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res3.json();
      ocrStatus = data.status || (data.text ? 'SUCCEEDED' : '');
      if (ocrStatus === 'SUCCEEDED' && data.text) {
        text = data.text;
        addLog('OCR terminé, texte récupéré.');
        break;
      } else {
        addLog('OCR pas encore prêt, statut : ' + ocrStatus);
        await new Promise(r => setTimeout(r, 3000)); // 3s entre chaque essai
      }
      tries++;
    } while (tries < 20);

    if (text) {
      setOcrText(text);
      setStatus('OCR terminé ! Envoi à GPT...');
      addLog('Envoi du texte OCR à GPT (route /api/analyze-doc)...');
      // 5. Appel GPT
      const res4 = await fetch('/api/analyze-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const gpt = await res4.json();
      setGptResult(gpt);
      addLog('Réponse GPT reçue : ' + JSON.stringify(gpt));

      // 6. Si GPT a trouvé l’élève, renomme et déplace le fichier
      if (gpt.eleve && gpt.type) {
        const newFileName = generateFileName(gpt.type, gpt.eleve);
        const eleveId = gpt.eleve.replace(/[^a-zA-Z0-9_]/g, '_'); // Sécurise le nom du dossier
        setStatus(`Déplacement du fichier dans le dossier de l’élève ${gpt.eleve}...`);
        addLog(`Appel de /api/move-file avec eleveId : ${eleveId}, newFileName : ${newFileName}`);
        const res5 = await fetch('/api/move-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceKey: key, eleveId, newFileName }),
        });
        const move = await res5.json();
        setMoveResult(move);
        addLog('Résultat du déplacement : ' + JSON.stringify(move));
        setStatus('Document déplacé dans le dossier élève !');
      } else {
        setStatus('Impossible d’identifier l’élève. À traiter manuellement.');
        addLog('Aucun élève trouvé par GPT.');
      }
    } else {
      setStatus('OCR non terminé après 1 minute. Réessayez plus tard.');
      addLog('OCR non terminé après 20 essais.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="font-bold mb-2">Upload + OCR + Analyse IA + MoveFile</h2>
      <input
        type="file"
        ref={fileRef}
        onChange={e => setFile(e.target.files?.[0] || null)}
        className="mb-2"
      />
      <button
        onClick={handleUploadAndAnalyze}
        disabled={!file}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Uploader et tout analyser
      </button>
      <div className="my-4">
        <strong>Statut :</strong> {status}
      </div>
      <div className="bg-gray-100 p-2 rounded mb-2">
        <strong>Logs :</strong>
        <ul className="text-xs">
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
      {ocrText && (
        <div className="bg-green-100 p-2 rounded mb-2">
          <strong>Texte OCR :</strong>
          <pre className="whitespace-pre-wrap">{ocrText}</pre>
        </div>
      )}
      {gptResult && (
        <div className="bg-yellow-100 p-2 rounded mb-2">
          <strong>Réponse GPT :</strong>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(gptResult, null, 2)}
          </pre>
        </div>
      )}
      {moveResult && (
        <div className="bg-blue-100 p-2 rounded">
          <strong>Résultat MoveFile :</strong>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(moveResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
