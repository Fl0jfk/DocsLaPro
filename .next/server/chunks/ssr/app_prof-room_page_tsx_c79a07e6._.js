module.exports = [
"[project]/app/prof-room/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProfRoomPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$react$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/shared/dist/react/index.mjs [app-ssr] (ecmascript)");
"use client";
;
;
;
const FRENCH_HOLIDAYS_2025 = [
    "2025-01-01",
    "2025-04-21",
    "2025-05-01",
    "2025-05-08",
    "2025-05-29",
    "2025-06-09",
    "2025-07-14",
    "2025-08-15",
    "2025-11-01",
    "2025-11-11",
    "2025-12-25"
];
function isWeekend(date) {
    const d = date.getDay();
    return d === 0 || d === 6;
}
const HOURS = Array.from({
    length: 11
}, (_, i)=>8 + i);
function ProfRoomPage() {
    const { user, isLoaded } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$react$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUser"])();
    const [rooms, setRooms] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [reservations, setReservations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedRoom, setSelectedRoom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedDate, setSelectedDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedHour, setSelectedHour] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const lastName = (user?.lastName ?? "").toUpperCase();
    const ADMIN_LASTNAMES = [
        "HACQUEVILLE-MATHI",
        "FORTINEAU",
        "MARTIN"
    ];
    const firstName = user?.firstName ?? "";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function load() {
            try {
                const roomsRes = await fetch("/api/reservation-rooms/rooms");
                if (roomsRes.ok) {
                    const roomsData = await roomsRes.json();
                    setRooms(roomsData.rooms || []);
                }
                const resRes = await fetch("/api/reservation-rooms/reservations");
                if (resRes.ok) {
                    const resData = await resRes.json();
                    setReservations(resData.reservations || resData || []);
                }
            } catch (error) {
                console.error("Erreur au chargement des données :", error);
            }
        }
        load();
    }, []);
    if (!isLoaded) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "p-8 text-center",
        children: "Chargement du profil..."
    }, void 0, false, {
        fileName: "[project]/app/prof-room/page.tsx",
        lineNumber: 43,
        columnNumber: 25
    }, this);
    if (!user) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "p-8 text-center",
        children: "Veuillez vous connecter"
    }, void 0, false, {
        fileName: "[project]/app/prof-room/page.tsx",
        lineNumber: 44,
        columnNumber: 21
    }, this);
    function getReservation(hour) {
        return reservations.find((r)=>r.roomId === selectedRoom && r.startsAt.startsWith(selectedDate) && r.status !== "CANCELLED" && new Date(r.startsAt).getHours() === hour);
    }
    async function handleConfirm() {
        if (selectedHour === null || !selectedRoom || !selectedDate) return;
        const start = new Date(`${selectedDate}T${selectedHour.toString().padStart(2, "0")}:00`);
        if (isWeekend(start) || FRENCH_HOLIDAYS_2025.includes(selectedDate)) {
            alert("⛔️ Impossible de réserver un week-end ou jour férié.");
            return;
        }
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const res = await fetch("/api/reservation-rooms/reservations/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                roomId: selectedRoom,
                startsAt: start.toISOString(),
                endsAt: end.toISOString(),
                firstName: firstName,
                lastName: lastName,
                email: user?.primaryEmailAddress?.emailAddress
            })
        });
        if (res.ok) {
            alert("✅ Réservation confirmée !");
            const newRes = await res.json();
            setReservations([
                ...reservations,
                newRes.reservation
            ]);
            setSelectedHour(null);
        } else {
            const err = await res.json();
            alert("Erreur : " + (err.error || "inconnue"));
        }
    }
    async function handleDeleteReservation(reservation) {
        const reason = prompt(`Motif de l'annulation pour ${reservation.firstName} ${reservation.lastName} :`, "Indisponibilité exceptionnelle de la salle");
        if (reason === null) return;
        if (!confirm("Confirmer la suppression et l'envoi du mail d'alerte ?")) return;
        const res = await fetch("/api/reservation-rooms/reservations/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                startsAt: reservation.startsAt,
                reason: reason,
                userEmail: reservation.email
            })
        });
        if (res.ok) {
            alert("🗑️ Réservation annulée et mail envoyé.");
            setReservations(reservations.filter((r)=>r.startsAt !== reservation.startsAt));
        } else {
            const err = await res.json();
            alert("Erreur : " + (err.error || "inconnue"));
        }
    }
    async function downloadJSON() {
        const res = await fetch("/api/reservation-rooms/reservations");
        const data = await res.json();
        const blob = new Blob([
            JSON.stringify(data, null, 2)
        ], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "reservations.json";
        a.click();
        URL.revokeObjectURL(url);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 max-w-xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold mb-6 text-gray-800",
                children: "Réserver une salle"
            }, void 0, false, {
                fileName: "[project]/app/prof-room/page.tsx",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            ADMIN_LASTNAMES.includes(lastName) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: downloadJSON,
                className: "mb-6 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full font-medium transition shadow",
                children: "⬇️ Télécharger la base de données (JSON)"
            }, void 0, false, {
                fileName: "[project]/app/prof-room/page.tsx",
                lineNumber: 123,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4 bg-gray-50 p-4 rounded-lg border mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block mb-1 font-semibold text-gray-700",
                                children: "Salle"
                            }, void 0, false, {
                                fileName: "[project]/app/prof-room/page.tsx",
                                lineNumber: 130,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: selectedRoom,
                                onChange: (e)=>setSelectedRoom(e.target.value),
                                className: "border rounded w-full p-2 text-black bg-white",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "-- Choisir une salle --"
                                    }, void 0, false, {
                                        fileName: "[project]/app/prof-room/page.tsx",
                                        lineNumber: 132,
                                        columnNumber: 13
                                    }, this),
                                    rooms.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: r.id,
                                            children: r.name
                                        }, r.id, false, {
                                            fileName: "[project]/app/prof-room/page.tsx",
                                            lineNumber: 134,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/prof-room/page.tsx",
                                lineNumber: 131,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block mb-1 font-semibold text-gray-700",
                                children: "Date"
                            }, void 0, false, {
                                fileName: "[project]/app/prof-room/page.tsx",
                                lineNumber: 140,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: selectedDate,
                                min: new Date().toISOString().split("T")[0],
                                onChange: (e)=>setSelectedDate(e.target.value),
                                className: "border rounded w-full p-2 text-black bg-white"
                            }, void 0, false, {
                                fileName: "[project]/app/prof-room/page.tsx",
                                lineNumber: 141,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/prof-room/page.tsx",
                lineNumber: 128,
                columnNumber: 7
            }, this),
            selectedRoom && selectedDate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-in fade-in duration-300",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "font-bold mb-3 text-gray-700",
                        children: "Créneaux disponibles"
                    }, void 0, false, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 153,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-3 mb-6",
                        children: HOURS.map((hour)=>{
                            const res = getReservation(hour);
                            const isBooked = !!res;
                            const isSelected = selectedHour === hour;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col border rounded-lg p-2 bg-white shadow-sm border-gray-200",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        disabled: isBooked,
                                        onClick: ()=>setSelectedHour(hour),
                                        className: `p-2 rounded text-sm font-bold text-white transition-all ${isBooked ? "bg-gray-300 cursor-not-allowed" : isSelected ? "bg-green-600 scale-105" : "bg-blue-600 hover:bg-blue-700"}`,
                                        children: [
                                            hour,
                                            ":30 - ",
                                            hour + 1,
                                            ":30"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/prof-room/page.tsx",
                                        lineNumber: 162,
                                        columnNumber: 19
                                    }, this),
                                    isBooked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] text-gray-500 font-medium truncate italic",
                                                children: [
                                                    "Occupé : ",
                                                    res.firstName,
                                                    " ",
                                                    res.lastName
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/prof-room/page.tsx",
                                                lineNumber: 172,
                                                columnNumber: 23
                                            }, this),
                                            ADMIN_LASTNAMES.includes(lastName) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handleDeleteReservation(res),
                                                className: "mt-1 w-full text-[9px] uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 py-1 rounded-md hover:bg-red-600 hover:text-white transition",
                                                children: "Annuler & Prévenir"
                                            }, void 0, false, {
                                                fileName: "[project]/app/prof-room/page.tsx",
                                                lineNumber: 174,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/prof-room/page.tsx",
                                        lineNumber: 171,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, hour, true, {
                                fileName: "[project]/app/prof-room/page.tsx",
                                lineNumber: 161,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 154,
                        columnNumber: 11
                    }, this),
                    selectedHour !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleConfirm,
                        className: "w-full px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg transform active:scale-95",
                        children: [
                            "Confirmer la réservation pour ",
                            selectedHour,
                            ":30"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 189,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/prof-room/page.tsx",
                lineNumber: 152,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/prof-room/page.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=app_prof-room_page_tsx_c79a07e6._.js.map