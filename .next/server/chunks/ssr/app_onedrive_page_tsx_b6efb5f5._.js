module.exports = [
"[project]/app/onedrive/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>OneDriveUpDocsOCRAI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$azure$2f$msal$2d$browser$2f$dist$2f$app$2f$PublicClientApplication$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@azure/msal-browser/dist/app/PublicClientApplication.mjs [app-ssr] (ecmascript)");
"use client";
;
;
;
const msalConfig = {
    auth: {
        clientId: ("TURBOPACK compile-time value", "671a25ff-77d0-4b2d-98c6-d10e43ec6d20"),
        authority: `https://login.microsoftonline.com/${("TURBOPACK compile-time value", "adca1e7f-3a06-4ba4-8e5b-f18580c0e9ae")}`,
        redirectUri: `${("TURBOPACK compile-time value", "http://localhost:3000/")}onedrive`
    }
};
const msalInstance = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$azure$2f$msal$2d$browser$2f$dist$2f$app$2f$PublicClientApplication$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PublicClientApplication"](msalConfig);
function OneDriveUpDocsOCRAI() {
    const [account, setAccount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [files, setFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [msalReady, setMsalReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentFolder, setCurrentFolder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [currentFolderPath, setCurrentFolderPath] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [ocrProcessing, setOcrProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ocrResults, setOcrResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [processingStatus, setProcessingStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        total: 0,
        completed: 0,
        failed: 0
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const init = async ()=>{
            try {
                await msalInstance.initialize();
                setMsalReady(true);
                const accounts = msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    const token = await getAccessToken(accounts[0]);
                    fetchFiles(token, null, "");
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err) {
                setError("Erreur init MSAL: " + err.message);
            }
        };
        init();
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!msalReady) return;
        const handleRedirect = async ()=>{
            try {
                const result = await msalInstance.handleRedirectPromise();
                if (result?.account) {
                    setAccount(result.account);
                    const token = await getAccessToken(result.account);
                    fetchFiles(token, null, "");
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err) {
                setError("Erreur login redirect: " + err.message);
            }
        };
        handleRedirect();
    }, [
        msalReady
    ]);
    const login = async ()=>{
        if (!msalReady) {
            setError("MSAL n'est pas encore initialisé.");
            return;
        }
        try {
            await msalInstance.loginRedirect({
                scopes: [
                    "Files.ReadWrite",
                    "User.Read"
                ]
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            setError("Erreur login: " + err.message);
        }
    };
    const getAccessToken = async (acc)=>{
        const usedAccount = acc || account;
        if (!usedAccount) throw new Error("Aucun compte connecté");
        const tokenResponse = await msalInstance.acquireTokenSilent({
            account: usedAccount,
            scopes: [
                "Files.ReadWrite",
                "User.Read"
            ]
        });
        return tokenResponse.accessToken;
    };
    const fetchFiles = async (accessToken, folderId, folderPath)=>{
        try {
            const url = folderId ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children` : folderPath ? `https://graph.microsoft.com/v1.0/me/drive/root:/${folderPath}:/children` : "https://graph.microsoft.com/v1.0/me/drive/root/children";
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setFiles(data.value || []);
            setCurrentFolder(folderId);
            setCurrentFolderPath(folderPath);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            setError("Erreur Graph API: " + err.message);
        }
    };
    const handleUpload = async (file)=>{
        if (!file || !account) return;
        try {
            const accessToken = await getAccessToken();
            const uploadPath = currentFolderPath ? `${currentFolderPath}/${file.name}` : file.name;
            const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${uploadPath}:/content`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": file.type || "application/octet-stream"
                },
                body: file
            });
            if (!res.ok) throw new Error(await res.text());
            await fetchFiles(accessToken, currentFolder, currentFolderPath);
            alert("Upload terminé !");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            setError("Erreur upload: " + err.message);
        }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openFile = async (file)=>{
        if (file.folder) {
            const token = await getAccessToken();
            const newPath = currentFolderPath ? `${currentFolderPath}/${file.name}` : file.name;
            fetchFiles(token, file.id, newPath);
        } else {
            window.open(file.webUrl, "_blank");
        }
    };
    async function processInBatches(items, batchSize, processFn) {
        const results = [];
        for(let i = 0; i < items.length; i += batchSize){
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(processFn));
            results.push(...batchResults);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentCompleted = results.filter((r)=>r.success).length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentFailed = results.filter((r)=>!r.success).length;
            setProcessingStatus((prev)=>({
                    total: prev.total,
                    completed: currentCompleted,
                    failed: currentFailed
                }));
            if (i + batchSize < items.length) {
                await new Promise((r)=>setTimeout(r, 2000));
            }
        }
        return results;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processSingleFile = async (file)=>{
        try {
            const r1 = await fetch("/api/upload-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type
                })
            });
            if (!r1.ok) throw new Error(await r1.text());
            const { url, key } = await r1.json();
            const upload = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type
                },
                body: file
            });
            if (!upload.ok) throw new Error("Échec upload S3 : " + await upload.text());
            const r2 = await fetch("/api/ocr-process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    key
                })
            });
            if (!r2.ok) throw new Error(await r2.text());
            const { jobId } = await r2.json();
            if (!jobId) throw new Error("Impossible de lancer Textract");
            let extractedText = "";
            for(let i = 0; i < 30; i++){
                const r3 = await fetch("/api/ocr-result", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        jobId
                    })
                });
                if (!r3.ok) throw new Error(await r3.text());
                const data = await r3.json();
                if (data.text) {
                    extractedText = data.text;
                    break;
                }
                if (data.status === "IN_PROGRESS") {
                    await new Promise((r)=>setTimeout(r, 5000));
                } else {
                    throw new Error("OCR Textract a échoué : " + JSON.stringify(data));
                }
            }
            if (!extractedText) throw new Error("Timeout OCR : aucun texte retourné");
            const r4 = await fetch("/api/analyze-doc", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: extractedText
                })
            });
            if (!r4.ok) throw new Error(await r4.text());
            const ai = await r4.json();
            if (ai?.fileName && ai?.eleve?.nom && ai?.eleve?.prénom) {
                const newFileName = `${ai.fileName}.pdf`;
                const accessToken = await getAccessToken();
                const uploadPath = currentFolderPath ? `${currentFolderPath}/${newFileName}` : newFileName;
                const fileRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${uploadPath}:/content`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": file.type || "application/pdf"
                    },
                    body: file
                });
                if (!fileRes.ok) throw new Error("Erreur upload OneDrive : " + await fileRes.text());
            }
            return {
                success: true,
                result: ai,
                fileName: file.name
            };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            console.error(`Erreur pour ${file.name}:`, err);
            return {
                success: false,
                error: err.message,
                fileName: file.name
            };
        }
    };
    const handleMultipleOcrUploadAndAnalyse = async (fileList)=>{
        if (!fileList || fileList.length === 0) return;
        const filesArray = Array.from(fileList);
        try {
            setOcrProcessing(true);
            setError("");
            setOcrResults([]);
            setProcessingStatus({
                total: filesArray.length,
                completed: 0,
                failed: 0
            });
            const results = await processInBatches(filesArray, 2, processSingleFile);
            const completed = results.filter((r)=>r.success).length;
            const failed = results.filter((r)=>!r.success).length;
            setProcessingStatus({
                total: filesArray.length,
                completed,
                failed
            });
            setOcrResults(results);
            const accessToken = await getAccessToken();
            await fetchFiles(accessToken, currentFolder, currentFolderPath);
            alert(`Traitement terminé!\n✅ Réussis: ${completed}\n❌ Échecs: ${failed}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            console.error(err);
            setError("Erreur globale OCR / Analyse: " + err.message);
        } finally{
            setOcrProcessing(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-4 max-w-[80%] mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-bold mb-4",
                children: "Mon OneDrive"
            }, void 0, false, {
                fileName: "[project]/app/onedrive/page.tsx",
                lineNumber: 268,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-red-500 mb-2",
                children: error
            }, void 0, false, {
                fileName: "[project]/app/onedrive/page.tsx",
                lineNumber: 269,
                columnNumber: 17
            }, this),
            !account ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: login,
                className: "p-2 bg-blue-600 text-white rounded mt-2",
                children: "Se connecter à OneDrive"
            }, void 0, false, {
                fileName: "[project]/app/onedrive/page.tsx",
                lineNumber: 271,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2 mb-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "p-2 bg-green-500 text-white rounded cursor-pointer",
                            children: [
                                "Choisir un fichier",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "file",
                                    className: "hidden",
                                    onChange: (e)=>e.target.files?.[0] && handleUpload(e.target.files[0])
                                }, void 0, false, {
                                    fileName: "[project]/app/onedrive/page.tsx",
                                    lineNumber: 276,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/onedrive/page.tsx",
                            lineNumber: 275,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/onedrive/page.tsx",
                        lineNumber: 274,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2 mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "p-2 bg-purple-500 text-white rounded cursor-pointer",
                                children: [
                                    "Envoyer plusieurs fichiers pour OCR + Analyse",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "file",
                                        className: "hidden",
                                        multiple: true,
                                        onChange: (e)=>handleMultipleOcrUploadAndAnalyse(e.target.files),
                                        disabled: ocrProcessing
                                    }, void 0, false, {
                                        fileName: "[project]/app/onedrive/page.tsx",
                                        lineNumber: 281,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/onedrive/page.tsx",
                                lineNumber: 280,
                                columnNumber: 13
                            }, this),
                            ocrProcessing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ml-2 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Traitement en cours…"
                                    }, void 0, false, {
                                        fileName: "[project]/app/onedrive/page.tsx",
                                        lineNumber: 291,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-gray-600",
                                        children: [
                                            "(",
                                            processingStatus.completed + processingStatus.failed,
                                            "/",
                                            processingStatus.total,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/onedrive/page.tsx",
                                        lineNumber: 292,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/onedrive/page.tsx",
                                lineNumber: 290,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/onedrive/page.tsx",
                        lineNumber: 279,
                        columnNumber: 11
                    }, this),
                    ocrResults.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-bold mb-2",
                                children: "Résultats du traitement:"
                            }, void 0, false, {
                                fileName: "[project]/app/onedrive/page.tsx",
                                lineNumber: 301,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2 max-h-96 overflow-y-auto",
                                children: ocrResults.map((result, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `p-3 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "font-semibold flex items-center gap-2",
                                                children: [
                                                    result.success ? '✅' : '❌',
                                                    " ",
                                                    result.fileName
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/onedrive/page.tsx",
                                                lineNumber: 308,
                                                columnNumber: 21
                                            }, this),
                                            result.success ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                className: "text-xs bg-white p-2 rounded mt-2 overflow-x-auto",
                                                children: JSON.stringify(result.result, null, 2)
                                            }, void 0, false, {
                                                fileName: "[project]/app/onedrive/page.tsx",
                                                lineNumber: 312,
                                                columnNumber: 23
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-red-600 text-sm mt-1",
                                                children: result.error
                                            }, void 0, false, {
                                                fileName: "[project]/app/onedrive/page.tsx",
                                                lineNumber: 316,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/app/onedrive/page.tsx",
                                        lineNumber: 304,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/onedrive/page.tsx",
                                lineNumber: 302,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/onedrive/page.tsx",
                        lineNumber: 300,
                        columnNumber: 13
                    }, this),
                    currentFolderPath && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: async ()=>{
                            const token = await getAccessToken();
                            const parentPath = currentFolderPath.split("/").slice(0, -1).join("");
                            fetchFiles(token, null, parentPath);
                        },
                        className: "mb-2 text-blue-500 underline",
                        children: "← Revenir à la racine"
                    }, void 0, false, {
                        fileName: "[project]/app/onedrive/page.tsx",
                        lineNumber: 325,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "border rounded p-2 space-y-1 bg-gray-50",
                        children: files.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded",
                                onClick: ()=>openFile(f),
                                children: [
                                    f.folder ? "📁" : "📄",
                                    " ",
                                    f.name
                                ]
                            }, f.id || f.name, true, {
                                fileName: "[project]/app/onedrive/page.tsx",
                                lineNumber: 339,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/onedrive/page.tsx",
                        lineNumber: 337,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/app/onedrive/page.tsx",
        lineNumber: 267,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=app_onedrive_page_tsx_b6efb5f5._.js.map