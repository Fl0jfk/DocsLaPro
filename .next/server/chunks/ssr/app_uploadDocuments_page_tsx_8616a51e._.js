module.exports = [
"[project]/app/uploadDocuments/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UploadAndAnalyzeDocument
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
function UploadAndAnalyzeDocument() {
    const [file, setFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [ocrText, setOcrText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mistralResult, setmistralResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [logs, setLogs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [moveResult, setMoveResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const fileRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const addLog = (msg)=>setLogs((prev)=>[
                ...prev,
                msg
            ]);
    const generateFileName = (type, eleve)=>{
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const safeEleve = eleve.replace(/[^a-zA-Z0-9_]/g, '_');
        return `${type}_${safeEleve}_${dateStr}_${timeStr}.pdf`;
    };
    const handleUploadAndAnalyze = async ()=>{
        setmistralResult(null);
        setMoveResult(null);
        setOcrText('');
        setLogs([]);
        if (!file) return;
        setStatus('Récupération de l’URL signée...');
        addLog('Demande de l’URL signée pour ' + file.name);
        const res1 = await fetch('/api/upload-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type
            })
        });
        if (!res1.ok) {
            const err = await res1.text();
            addLog('Erreur API upload-url: ' + err);
            setStatus('Erreur lors de la génération de l’URL signée');
            return;
        }
        let url, key;
        try {
            const data = await res1.json();
            url = data.url;
            key = data.key;
        } catch (e) {
            addLog('Erreur de parsing JSON sur la réponse API upload-url');
            setStatus('Erreur lors de la génération de l’URL signée');
            console.log(e);
            return;
        }
        if (!url || !key) {
            addLog('Clé S3 ou URL manquante dans la réponse API! Réponse brute: ' + JSON.stringify({
                url,
                key
            }));
            setStatus('Erreur: clé S3 ou URL manquante');
            return;
        }
        addLog('URL signée reçue, clé S3 : ' + key);
        setStatus('Upload sur S3 en cours...');
        addLog('Upload du fichier sur S3...');
        const uploadRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        if (!uploadRes.ok) {
            addLog('Erreur lors de l’upload S3: ' + uploadRes.statusText);
            setStatus('Erreur lors de l’upload S3');
            return;
        }
        addLog('Upload terminé.');
        setStatus('Lancement de l\'OCR AWS Textract...');
        addLog('Appel de /api/ocr-process avec la clé S3...');
        const res2 = await fetch('/api/ocr-process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key
            })
        });
        if (!res2.ok) {
            const err = await res2.text();
            addLog('Erreur API ocr-process: ' + err);
            setStatus('Erreur lors du lancement de l\'OCR');
            return;
        }
        let jobId;
        try {
            const data = await res2.json();
            jobId = data.jobId;
        } catch (e) {
            addLog('Erreur de parsing JSON sur la réponse API ocr-process');
            setStatus('Erreur lors du lancement de l\'OCR');
            console.log(e);
            return;
        }
        if (!jobId) {
            addLog('JobId manquant dans la réponse API ocr-process!');
            setStatus('Erreur: jobId manquant');
            return;
        }
        addLog('Job Textract lancé, jobId : ' + jobId);
        setStatus('Attente du résultat OCR...');
        let ocrStatus = '';
        let text = '';
        let tries = 0;
        do {
            addLog(`Polling OCR (tentative ${tries + 1})...`);
            const res3 = await fetch('/api/ocr-result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobId
                })
            });
            if (!res3.ok) {
                const err = await res3.text();
                addLog('Erreur API ocr-result: ' + err);
                setStatus('Erreur lors de la récupération du résultat OCR');
                return;
            }
            const data = await res3.json();
            ocrStatus = data.status || (data.text ? 'SUCCEEDED' : '');
            if (ocrStatus === 'SUCCEEDED' && data.text) {
                text = data.text;
                addLog('OCR terminé, texte récupéré.');
                break;
            } else {
                addLog('OCR pas encore prêt, statut : ' + ocrStatus);
                await new Promise((r)=>setTimeout(r, 5000));
            }
            tries++;
        }while (tries < 30)
        if (text) {
            setOcrText(text);
            setStatus('OCR terminé ! Envoi à Mistral AI...');
            addLog('Envoi du texte OCR à Mistral AI (route /api/analyze-doc)...');
            const res4 = await fetch('/api/analyze-doc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text
                })
            });
            if (!res4.ok) {
                const err = await res4.text();
                addLog('Erreur API analyze-doc: ' + err);
                setStatus('Erreur lors de l\'analyse mistral');
                return;
            }
            const mistral = await res4.json();
            setmistralResult(mistral);
            addLog('Réponse mistral reçue : ' + JSON.stringify(mistral));
            if (mistral.eleve && mistral.type) {
                const newFileName = generateFileName(mistral.type, mistral.eleve);
                const eleveId = mistral.eleve.replace(/[^a-zA-Z0-9_]/g, '_');
                setStatus(`Déplacement du fichier dans le dossier de l’élève ${mistral.eleve}...`);
                addLog(`Appel de /api/move-file avec eleveId : ${eleveId}, newFileName : ${newFileName}`);
                const res5 = await fetch('/api/move-file', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sourceKey: key,
                        eleveId,
                        newFileName
                    })
                });
                if (!res5.ok) {
                    const err = await res5.text();
                    addLog('Erreur API move-file: ' + err);
                    setStatus('Erreur lors du déplacement du fichier');
                    return;
                }
                const move = await res5.json();
                setMoveResult(move);
                addLog('Résultat du déplacement : ' + JSON.stringify(move));
                setStatus('Document déplacé dans le dossier élève !');
            } else {
                setStatus('Impossible d’identifier l’élève. À traiter manuellement.');
                addLog('Aucun élève trouvé par mistral.');
            }
        } else {
            setStatus('OCR non terminé après 1 minute. Réessayez plus tard.');
            addLog('OCR non terminé après 20 essais.');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-xl mx-auto p-4 pt-[10vh]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "font-bold mb-2",
                children: "Upload + OCR + Analyse IA + MoveFile"
            }, void 0, false, {
                fileName: "[project]/app/uploadDocuments/page.tsx",
                lineNumber: 179,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "file",
                ref: fileRef,
                onChange: (e)=>setFile(e.target.files?.[0] || null),
                className: "mb-2"
            }, void 0, false, {
                fileName: "[project]/app/uploadDocuments/page.tsx",
                lineNumber: 180,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleUploadAndAnalyze,
                disabled: !file,
                className: "bg-blue-600 text-white px-4 py-2 rounded",
                children: "Uploader et tout analyser"
            }, void 0, false, {
                fileName: "[project]/app/uploadDocuments/page.tsx",
                lineNumber: 181,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "my-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Statut :"
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    " ",
                    status
                ]
            }, void 0, true, {
                fileName: "[project]/app/uploadDocuments/page.tsx",
                lineNumber: 182,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-gray-100 p-2 rounded mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Logs :"
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 186,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "text-xs",
                        children: logs.map((log, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: log
                            }, i, false, {
                                fileName: "[project]/app/uploadDocuments/page.tsx",
                                lineNumber: 189,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/uploadDocuments/page.tsx",
                lineNumber: 185,
                columnNumber: 7
            }, this),
            ocrText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-green-100 p-2 rounded mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Texte OCR :"
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 195,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                        className: "whitespace-pre-wrap",
                        children: ocrText
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 196,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/uploadDocuments/page.tsx",
                lineNumber: 194,
                columnNumber: 9
            }, this),
            mistralResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-yellow-100 p-2 rounded mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Réponse Mistral AI :"
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 201,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                        className: "whitespace-pre-wrap",
                        children: JSON.stringify(mistralResult, null, 2)
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 202,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/uploadDocuments/page.tsx",
                lineNumber: 200,
                columnNumber: 9
            }, this),
            moveResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-blue-100 p-2 rounded",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Résultat MoveFile :"
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 209,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                        className: "whitespace-pre-wrap",
                        children: JSON.stringify(moveResult, null, 2)
                    }, void 0, false, {
                        fileName: "[project]/app/uploadDocuments/page.tsx",
                        lineNumber: 210,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/uploadDocuments/page.tsx",
                lineNumber: 208,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/uploadDocuments/page.tsx",
        lineNumber: 178,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=app_uploadDocuments_page_tsx_8616a51e._.js.map