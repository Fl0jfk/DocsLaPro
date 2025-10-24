(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/travels/[id]/edit/form.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VoyageEditForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$react$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/shared/dist/react/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const statusLabels = {
    draft: "📝 Brouillon",
    direction_validation: "📋 En validation direction",
    requests_stage: "🚌 Demandes de devis",
    compta_validation: "💰 Validation compta",
    final_validation: "✅ Validation finale direction",
    validated: "🎉 Voyage validé",
    rejected: "❌ Rejeté"
};
function VoyageEditForm(param) {
    let { voyageId } = param;
    var _user_publicMetadata, _user_primaryEmailAddress, _voyage_pieces_jointes;
    _s();
    const { user, isLoaded } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$react$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUser"])();
    const [voyage, setVoyage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [formValues, setFormValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [success, setSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [newAttachments, setNewAttachments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [initialAttachments, setInitialAttachments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    console.log(initialAttachments);
    const [isModified, setIsModified] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VoyageEditForm.useEffect": ()=>{
            if (!isLoaded || !user) return;
            const fetchVoyage = {
                "VoyageEditForm.useEffect.fetchVoyage": async ()=>{
                    setLoading(true);
                    setError(null);
                    try {
                        const res = await fetch("/api/travels/get?voyageId=".concat(voyageId));
                        if (!res.ok) throw new Error("Impossible de récupérer le voyage");
                        const data = await res.json();
                        setVoyage(data.voyage);
                        setFormValues({
                            lieu: data.voyage.lieu,
                            activite: data.voyage.activite,
                            date_depart: data.voyage.date_depart,
                            date_retour: data.voyage.date_retour,
                            email: data.voyage.email,
                            classes: data.voyage.classes,
                            effectif_eleves: data.voyage.effectif_eleves,
                            direction_cible: data.voyage.direction_cible,
                            effectif_accompagnateurs: data.voyage.effectif_accompagnateurs,
                            commentaire: data.voyage.commentaire || ""
                        });
                        setInitialAttachments(data.voyage.pieces_jointes || []);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (err) {
                        setError(err.message);
                    } finally{
                        setLoading(false);
                    }
                }
            }["VoyageEditForm.useEffect.fetchVoyage"];
            fetchVoyage();
        }
    }["VoyageEditForm.useEffect"], [
        voyageId,
        isLoaded
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VoyageEditForm.useEffect": ()=>{
            if (!voyage || !formValues) return;
            const unchanged = formValues.lieu === voyage.lieu && formValues.activite === voyage.activite && formValues.date_depart === voyage.date_depart && formValues.date_retour === voyage.date_retour && formValues.classes === voyage.classes && formValues.effectif_eleves === voyage.effectif_eleves && formValues.effectif_accompagnateurs === voyage.effectif_accompagnateurs && formValues.commentaire === voyage.commentaire && newAttachments.length === 0;
            setIsModified(!unchanged);
        }
    }["VoyageEditForm.useEffect"], [
        formValues,
        voyage,
        newAttachments
    ]);
    const handleChange = (e)=>{
        const { name, value } = e.target;
        setFormValues((prev)=>prev ? {
                ...prev,
                [name]: value
            } : prev);
    };
    const handleFilesChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "VoyageEditForm.useCallback[handleFilesChange]": (files)=>{
            setNewAttachments({
                "VoyageEditForm.useCallback[handleFilesChange]": (prev)=>[
                        ...prev,
                        ...files
                    ]
            }["VoyageEditForm.useCallback[handleFilesChange]"]);
        }
    }["VoyageEditForm.useCallback[handleFilesChange]"], []);
    const uploadToS3 = async (file)=>{
        const res = await fetch("/api/travels/presign", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                voyageId,
                filename: file.name,
                type: file.type
            })
        });
        const { uploadUrl, fileUrl } = await res.json();
        await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type
            }
        });
        return {
            filename: file.name,
            url: fileUrl
        };
    };
    const removeAttachment = (index)=>{
        if (!(voyage === null || voyage === void 0 ? void 0 : voyage.pieces_jointes)) return;
        const updated = [
            ...voyage.pieces_jointes
        ];
        updated.splice(index, 1);
        setVoyage({
            ...voyage,
            pieces_jointes: updated
        });
    };
    const handleDragOver = (e)=>e.preventDefault();
    const handleDrop = (e)=>{
        var _e_dataTransfer;
        e.preventDefault();
        if ((_e_dataTransfer = e.dataTransfer) === null || _e_dataTransfer === void 0 ? void 0 : _e_dataTransfer.files) handleFilesChange(Array.from(e.dataTransfer.files));
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!formValues || !voyage || !isModified) return;
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const uploaded = await Promise.all(newAttachments.map(uploadToS3));
            const allAttachments = [
                ...voyage.pieces_jointes || [],
                ...uploaded
            ];
            const body = {
                ...voyage,
                ...formValues,
                pieces_jointes: allAttachments
            };
            const res = await fetch("/api/travels/update?voyageId=".concat(voyageId), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error("Erreur lors de la mise à jour");
            setVoyage(body);
            setInitialAttachments(allAttachments);
            setNewAttachments([]);
            setSuccess("Voyage mis à jour ✅");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            setError(err.message);
        } finally{
            setSaving(false);
        }
    };
    const updateStatus = async (newStatus)=>{
        try {
            const res = await fetch("/api/travels/updateStatus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    voyageId,
                    newStatus
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur de transition");
            setVoyage((prev)=>prev ? {
                    ...prev,
                    status: newStatus
                } : prev);
            setSuccess("Statut mis à jour : ".concat(statusLabels[newStatus]));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            setError(err.message);
        }
    };
    function getNextStatus(current) {
        const flow = [
            "draft",
            "direction_validation",
            "requests_stage",
            "compta_validation",
            "final_validation",
            "validated"
        ];
        const i = flow.indexOf(current);
        return i < flow.length - 1 ? flow[i + 1] : current;
    }
    function getPreviousStatus(current) {
        const flow = [
            "draft",
            "direction_validation",
            "requests_stage",
            "compta_validation",
            "final_validation",
            "validated"
        ];
        const i = flow.indexOf(current);
        return i > 0 ? flow[i - 1] : current;
    }
    if (!isLoaded) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Chargement utilisateur…"
    }, void 0, false, {
        fileName: "[project]/app/travels/[id]/edit/form.tsx",
        lineNumber: 190,
        columnNumber: 25
    }, this);
    if (!user) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Veuillez vous connecter."
    }, void 0, false, {
        fileName: "[project]/app/travels/[id]/edit/form.tsx",
        lineNumber: 191,
        columnNumber: 21
    }, this);
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Chargement du voyage…"
    }, void 0, false, {
        fileName: "[project]/app/travels/[id]/edit/form.tsx",
        lineNumber: 192,
        columnNumber: 23
    }, this);
    if (!voyage || !formValues) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Voyage introuvable."
    }, void 0, false, {
        fileName: "[project]/app/travels/[id]/edit/form.tsx",
        lineNumber: 193,
        columnNumber: 38
    }, this);
    function normalizeRoles(role) {
        if (Array.isArray(role)) return role;
        if (typeof role === "string") return [
            role
        ];
        return [];
    }
    const userRoles = normalizeRoles(user === null || user === void 0 ? void 0 : (_user_publicMetadata = user.publicMetadata) === null || _user_publicMetadata === void 0 ? void 0 : _user_publicMetadata.role);
    const isCreator = voyage.email === ((_user_primaryEmailAddress = user.primaryEmailAddress) === null || _user_primaryEmailAddress === void 0 ? void 0 : _user_primaryEmailAddress.emailAddress);
    const isDirectionCible = !!voyage.direction_cible && userRoles.includes(voyage.direction_cible);
    const disabled = voyage.status !== "draft" && voyage.status !== "direction_validation" && !isCreator;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: handleSubmit,
        className: "pt-[15vh] flex flex-col gap-4 max-w-xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-xl font-bold mb-2",
                children: "Modifier le voyage"
            }, void 0, false, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 206,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-sm bg-gray-100 px-3 py-2 rounded border",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Statut :"
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this),
                    " ",
                    statusLabels[voyage.status]
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 208,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-red-600",
                children: error
            }, void 0, false, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 211,
                columnNumber: 17
            }, this),
            success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-green-600",
                children: success
            }, void 0, false, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 212,
                columnNumber: 19
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Lieu :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "lieu",
                        value: formValues.lieu,
                        onChange: handleChange,
                        required: true,
                        disabled: disabled
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 216,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 214,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Activité :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "activite",
                        value: formValues.activite,
                        onChange: handleChange,
                        required: true,
                        disabled: disabled
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 220,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 218,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Date de départ :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        name: "date_depart",
                        value: formValues.date_depart,
                        onChange: handleChange,
                        required: true,
                        disabled: disabled
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 224,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 222,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Date de retour :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        name: "date_retour",
                        value: formValues.date_retour,
                        onChange: handleChange,
                        required: true,
                        disabled: disabled
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 228,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 226,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Classes :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        name: "classes",
                        value: formValues.classes,
                        onChange: handleChange,
                        required: true,
                        disabled: disabled
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 232,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 230,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Nombre d’élèves :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "number",
                        name: "effectif_eleves",
                        min: 1,
                        value: formValues.effectif_eleves,
                        onChange: handleChange,
                        required: true,
                        disabled: disabled
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 236,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 234,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Nombre d’accompagnateurs :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "number",
                        name: "effectif_accompagnateurs",
                        min: 1,
                        value: formValues.effectif_accompagnateurs,
                        onChange: handleChange,
                        required: true,
                        disabled: disabled
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 240,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 238,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Pièces jointes :"
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 244,
                        columnNumber: 9
                    }, this),
                    ((_voyage_pieces_jointes = voyage.pieces_jointes) === null || _voyage_pieces_jointes === void 0 ? void 0 : _voyage_pieces_jointes.length) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        children: voyage.pieces_jointes.map((f, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: f.url,
                                        target: "_blank",
                                        children: f.filename
                                    }, void 0, false, {
                                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                                        lineNumber: 249,
                                        columnNumber: 17
                                    }, this),
                                    !disabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>removeAttachment(i),
                                        className: "ml-2 text-red-600",
                                        children: "Supprimer"
                                    }, void 0, false, {
                                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                                        lineNumber: 251,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                                lineNumber: 248,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 246,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Aucune pièce jointe"
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 257,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 243,
                columnNumber: 7
            }, this),
            !disabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onDragOver: handleDragOver,
                onDrop: handleDrop,
                onClick: ()=>{
                    var _fileInputRef_current;
                    return (_fileInputRef_current = fileInputRef.current) === null || _fileInputRef_current === void 0 ? void 0 : _fileInputRef_current.click();
                },
                className: "border-2 border-dashed border-gray-400 rounded p-4 text-center text-gray-500 cursor-pointer hover:bg-gray-50",
                children: [
                    newAttachments.length ? "".concat(newAttachments.length, " fichier(s) ajouté(s)") : "Glissez vos fichiers ici ou cliquez pour sélectionner",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: fileInputRef,
                        type: "file",
                        multiple: true,
                        accept: ".pdf,.doc,.docx,image/*",
                        className: "hidden",
                        onChange: (e)=>e.target.files && handleFilesChange(Array.from(e.target.files))
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 271,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 262,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Commentaire :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        name: "commentaire",
                        value: formValues.commentaire,
                        onChange: handleChange,
                        disabled: disabled
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 284,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 282,
                columnNumber: 7
            }, this),
            !disabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "submit",
                disabled: !isModified || saving,
                className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400",
                children: saving ? "Enregistrement…" : "Mettre à jour"
            }, void 0, false, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 288,
                columnNumber: 9
            }, this),
            isCreator && voyage.status === "requests_stage" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 border-t pt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-bold mb-2",
                        children: "Demande de devis"
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 294,
                        columnNumber: 5
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DevisRequestForm, {
                        voyage: voyage,
                        setVoyage: setVoyage
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 295,
                        columnNumber: 5
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 293,
                columnNumber: 3
            }, this),
            isDirectionCible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 border-t pt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-bold mb-2",
                        children: "Contrôle de validation (Direction)"
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 300,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>updateStatus(getPreviousStatus(voyage.status)),
                                className: "px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700",
                                children: " ← Étape précédente"
                            }, void 0, false, {
                                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                                lineNumber: 302,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>updateStatus(getNextStatus(voyage.status)),
                                className: "px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700",
                                children: "Étape suivante →"
                            }, void 0, false, {
                                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                                lineNumber: 303,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 301,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 299,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/travels/[id]/edit/form.tsx",
        lineNumber: 205,
        columnNumber: 5
    }, this);
}
_s(VoyageEditForm, "StEKR7MZSIt2/TyaY2kvHAOAd1Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$react$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUser"]
    ];
});
_c = VoyageEditForm;
function DevisRequestForm(param) {
    let { voyage, setVoyage } = param;
    _s1();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [msg, setMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [heureDepart, setHeureDepart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [carSurPlace, setCarSurPlace] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [commentaire, setCommentaire] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setLoading(true);
        setMsg("");
        try {
            const infos = {
                heureDepart,
                carSurPlace,
                commentaire
            };
            const res = await fetch("/api/travels/devis/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    voyageId: voyage.id,
                    infos
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de la demande de devis");
            setVoyage((prev)=>prev ? {
                    ...prev,
                    devis_requests: [
                        ...prev.devis_requests || [],
                        {
                            infos,
                            date: new Date().toISOString(),
                            status: "pending"
                        }
                    ]
                } : prev);
            setMsg("Demande de devis envoyée à tous les transporteurs ✅");
            setHeureDepart("");
            setCarSurPlace(false);
            setCommentaire("");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            setMsg(err.message);
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Heure de départ :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "time",
                        value: heureDepart,
                        onChange: (e)=>setHeureDepart(e.target.value),
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 363,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 361,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Besoin d’un car sur place :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "checkbox",
                        checked: carSurPlace,
                        onChange: (e)=>setCarSurPlace(e.target.checked)
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 367,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 365,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Commentaire (optionnel) :",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        value: commentaire,
                        onChange: (e)=>setCommentaire(e.target.value)
                    }, void 0, false, {
                        fileName: "[project]/app/travels/[id]/edit/form.tsx",
                        lineNumber: 371,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 369,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: handleSubmit,
                disabled: loading,
                className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
                children: loading ? "Envoi…" : "Envoyer la demande de devis"
            }, void 0, false, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 373,
                columnNumber: 7
            }, this),
            msg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 ".concat(msg.includes("✅") ? "text-green-600" : "text-red-600"),
                children: msg
            }, void 0, false, {
                fileName: "[project]/app/travels/[id]/edit/form.tsx",
                lineNumber: 376,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/travels/[id]/edit/form.tsx",
        lineNumber: 360,
        columnNumber: 5
    }, this);
}
_s1(DevisRequestForm, "CK2XBKycd9v7DjVk6n70pdGTkO0=");
_c1 = DevisRequestForm;
var _c, _c1;
__turbopack_context__.k.register(_c, "VoyageEditForm");
__turbopack_context__.k.register(_c1, "DevisRequestForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_travels_%5Bid%5D_edit_form_tsx_72e67911._.js.map