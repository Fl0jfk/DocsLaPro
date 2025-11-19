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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rooms, setRooms] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reservations, setReservations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedRoom, setSelectedRoom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedDate, setSelectedDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedHour, setSelectedHour] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const ADMIN_LASTNAMES = [
        "Hacqueville-Mathi",
        "Dupont",
        "Martin"
    ];
    const lastName = user?.lastName ?? "";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function load() {
            const roomsRes = await fetch("/api/reservation-rooms/rooms");
            const roomsData = await roomsRes.json();
            setRooms(roomsData.rooms || []);
            const resRes = await fetch("/api/reservation-rooms/reservations");
            const resData = await resRes.json();
            setReservations(resData.reservations || []);
        }
        load();
    }, []);
    if (!isLoaded) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        children: "Chargement..."
    }, void 0, false, {
        fileName: "[project]/app/prof-room/page.tsx",
        lineNumber: 36,
        columnNumber: 25
    }, this);
    if (!user) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        children: "Veuillez vous connecter"
    }, void 0, false, {
        fileName: "[project]/app/prof-room/page.tsx",
        lineNumber: 37,
        columnNumber: 21
    }, this);
    function getReservation(hour) {
        return reservations.find((r)=>r.roomId === selectedRoom && r.startsAt.startsWith(selectedDate) && new Date(r.startsAt).getHours() === hour);
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
                firstName: user.firstName || "",
                lastName: user.lastName || ""
            })
        });
        if (res.ok) {
            alert("✅ Réservation confirmée !");
            setReservations([
                ...reservations,
                {
                    roomId: selectedRoom,
                    startsAt: start.toISOString(),
                    firstName: user.firstName || "",
                    lastName: user.lastName || ""
                }
            ]);
            setSelectedHour(null);
        } else {
            const err = await res.json();
            alert("Erreur : " + (err.error || "inconnue"));
        }
    }
    async function handleDeleteReservation(startIso) {
        if (!confirm("Supprimer cette réservation ?")) return;
        const res = await fetch("/api/reservation-rooms/reservations/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                startsAt: startIso
            })
        });
        if (res.ok) {
            alert("🗑️ Réservation annulée");
            setReservations(reservations.filter((r)=>r.startsAt !== startIso));
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
                className: "text-2xl font-bold mb-6",
                children: "Réserver une salle"
            }, void 0, false, {
                fileName: "[project]/app/prof-room/page.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this),
            ADMIN_LASTNAMES.includes(lastName) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: downloadJSON,
                className: "mb-6 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700",
                children: "Télécharger la base de données des réservations (JSON)"
            }, void 0, false, {
                fileName: "[project]/app/prof-room/page.tsx",
                lineNumber: 112,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block mb-1 font-medium",
                        children: "Salle"
                    }, void 0, false, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: selectedRoom,
                        onChange: (e)=>setSelectedRoom(e.target.value),
                        className: "border rounded w-full p-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "-- Choisir une salle --"
                            }, void 0, false, {
                                fileName: "[project]/app/prof-room/page.tsx",
                                lineNumber: 117,
                                columnNumber: 11
                            }, this),
                            rooms.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: r.id,
                                    children: r.name
                                }, r.id, false, {
                                    fileName: "[project]/app/prof-room/page.tsx",
                                    lineNumber: 119,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 116,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/prof-room/page.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block mb-1 font-medium",
                        children: "Date"
                    }, void 0, false, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: selectedDate,
                        min: new Date().toISOString().split("T")[0],
                        onChange: (e)=>setSelectedDate(e.target.value),
                        className: "border rounded w-full p-2"
                    }, void 0, false, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 125,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/prof-room/page.tsx",
                lineNumber: 123,
                columnNumber: 7
            }, this),
            selectedRoom && selectedDate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-4 gap-2 mb-4",
                        children: HOURS.map((hour)=>{
                            const res = getReservation(hour);
                            const isBooked = !!res;
                            const isSelected = selectedHour === hour;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        disabled: isBooked,
                                        onClick: ()=>setSelectedHour(hour),
                                        className: `p-2 rounded text-white ${isBooked ? "bg-gray-400 cursor-not-allowed" : isSelected ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`,
                                        children: [
                                            hour,
                                            ":00 - ",
                                            hour + 1,
                                            ":00",
                                            isBooked ? ` (${res.firstName} ${res.lastName})` : ""
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/prof-room/page.tsx",
                                        lineNumber: 136,
                                        columnNumber: 19
                                    }, this),
                                    isBooked && ADMIN_LASTNAMES.includes(lastName) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>handleDeleteReservation(res.startsAt),
                                        className: "text-xs bg-red-600 text-white p-1 rounded hover:bg-red-700",
                                        children: "Annuler"
                                    }, void 0, false, {
                                        fileName: "[project]/app/prof-room/page.tsx",
                                        lineNumber: 141,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, hour, true, {
                                fileName: "[project]/app/prof-room/page.tsx",
                                lineNumber: 135,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 129,
                        columnNumber: 11
                    }, this),
                    selectedHour !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleConfirm,
                        className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700",
                        children: [
                            "Confirmer la réservation (",
                            selectedHour,
                            ":00 - ",
                            selectedHour + 1,
                            ":00)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/prof-room/page.tsx",
                        lineNumber: 148,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/app/prof-room/page.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=app_prof-room_page_tsx_c79a07e6._.js.map