'use client';

import React, { useState } from 'react';

export default function SignaturePreviewPage() {
  // On stocke le HTML pur ici. C'est CE bloc que tu modifies et que Thunderbird lira.
  const signatureHtml = `<table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff !important; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
  <tr>
    <td bgcolor="#ffffff" style="background-color: #ffffff !important; padding: 14px 18px;">
      <table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 14px; color: #333333 !important; line-height: 1.5; border-collapse: collapse; background-color: #ffffff !important;">
  <tr>
    <!-- Colonne gauche : logos établissement + Académie -->
    <td valign="top" bgcolor="#ffffff" style="background-color: #ffffff !important; padding-right: 20px; padding-top: 2px;">
      <table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse: collapse; background-color: #ffffff !important;">
        <tr>
          <td bgcolor="#ffffff" style="background-color: #ffffff !important; padding-bottom: 10px;">
            <img src="https://docslaproimage.s3.eu-west-3.amazonaws.com/autres/Logo+header.png"
                 alt="La Providence Nicolas Barré"
                 width="100"
                 style="display: block; width: 100px; max-width: 100px; height: auto; border: 0; background-color: #ffffff;" />
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color: #ffffff !important; padding: 6px 0;">
            <img src="https://docslaproimage.s3.eu-west-3.amazonaws.com/autres/Logo-Academie-fond-blanc.png"
                 alt="Académie de Normandie"
                 width="88"
                 style="display: block; width: 88px; max-width: 88px; height: auto; border: 0; background-color: #ffffff;" />
          </td>
        </tr>
      </table>
    </td>

    <!-- Ligne de séparation verticale stylée -->
    <td valign="top" bgcolor="#ffffff" style="background-color: #ffffff !important; border-left: 2px solid #4F46E5; padding-left: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse: collapse; background-color: #ffffff !important;">
        <tr>
          <td bgcolor="#ffffff" style="background-color: #ffffff !important; padding-bottom: 2px;">
            <span style="font-size: 16px; font-weight: 700; color: #111827 !important; letter-spacing: -0.01em;">Florian HACQUEVILLE-MATHI</span>
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color: #ffffff !important; padding-bottom: 12px;">
            <span style="font-size: 13px; color: #4F46E5 !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Gestionnaire Administratif et Comptable</span>
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color: #ffffff !important; font-size: 13px; color: #4B5563 !important; padding-bottom: 4px;">
            <span style="color: #6B7280 !important; font-weight: bold; padding-right: 4px;">📍</span> <span style="color: #4B5563 !important;">La Providence Nicolas Barré — Le Mesnil-Esnard</span>
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color: #ffffff !important; font-size: 13px; color: #4B5563 !important; padding-bottom: 4px;">
            <span style="color: #6B7280 !important; font-weight: bold; padding-right: 4px;">📞</span> <a href="tel:+33232865090" style="color: #4B5563 !important; text-decoration: none;">02 32 86 50 90</a>
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color: #ffffff !important; font-size: 13px; color: #4B5563 !important;">
            <span style="color: #6B7280 !important; font-weight: bold; padding-right: 4px;">🌐</span> <a href="https://laprovidence-nicolasbarre.fr/" target="_blank" style="color: #4F46E5 !important; text-decoration: none; font-weight: 500;">laprovidence-nicolasbarre.fr</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
    </td>
  </tr>
</table>`;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(signatureHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Email Signature Preview</h1>
            <p className="text-sm text-slate-400">Environnement de test local pour Thunderbird — fond blanc forcé pour le mode sombre</p>
          </div>
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              copied 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            {copied ? '✓ Code HTML copié !' : 'Copier le code HTML'}
          </button>
        </div>

        {/* Aperçu fond sombre (simule boîte mail en thème système) */}
        <div className="rounded-xl border border-slate-700 overflow-hidden bg-[#2d2d2d] shadow-2xl">
          <div className="px-4 py-2 border-b border-slate-600 text-xs text-slate-400">Aperçu thème sombre</div>
          <div className="p-6" dangerouslySetInnerHTML={{ __html: signatureHtml }} />
        </div>

        {/* Boîte Mail Simulée (Rendu) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-800">
          {/* Top bar de la fausse boîte mail */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-rose-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-400 font-medium pl-4">Nouveau message — Aperçu</span>
          </div>
          
          {/* Contenu du mail */}
          <div className="p-6 space-y-8 min-h-[300px] flex flex-col justify-between">
            <div className="space-y-2 text-sm text-slate-600">
              <p>Bonjour,</p>
              <p>Voici un aperçu en situation réelle de ta future signature d'email institutionnelle.</p>
              <p>Cordialement,</p>
            </div>

            {/* Injection de la signature HTML pure */}
            <div 
              className="pt-6 border-t border-slate-100"
              dangerouslySetInnerHTML={{ __html: signatureHtml }} 
            />
          </div>
        </div>

        {/* Code source pour débugger au besoin dans Cursor */}
        <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Raw HTML Output</span>
          <pre className="mt-2 text-xs font-mono text-indigo-400 overflow-x-auto max-h-40 whitespace-pre-wrap">
            {signatureHtml}
          </pre>
        </div>

      </div>
    </div>
  );
}