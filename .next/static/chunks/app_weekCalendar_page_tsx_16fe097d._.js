(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/app/weekCalendar/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>AgendaHebdo
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const daysOfWeek = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi"
];
// Couleurs par personne
const personColors = {
    Audrey: "bg-pink-400",
    Emmanuelle: "bg-blue-400",
    Sandrine: "bg-green-400",
    Christelle: "bg-purple-400",
    Karim: "bg-orange-400",
    Athéna: "bg-yellow-400"
};
function timeToMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}
function getBlockStyle(timeRange) {
    const [start, end] = timeRange.split("-");
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    const dayStart = 7 * 60; // commence à 07:00
    const pixelsPerMinute = 1.1; // 1 minute = 1px
    return {
        top: "".concat((startMin - dayStart) * pixelsPerMinute, "px"),
        height: "".concat((endMin - startMin) * pixelsPerMinute, "px")
    };
}
function AgendaHebdo() {
    _s();
    const [schedule, setSchedule] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AgendaHebdo.useEffect": ()=>{
            fetch("/semaine-lycée-GSON.json").then({
                "AgendaHebdo.useEffect": (res)=>res.json()
            }["AgendaHebdo.useEffect"]).then({
                "AgendaHebdo.useEffect": (data)=>{
                    setSchedule(data);
                    setLoading(false);
                }
            }["AgendaHebdo.useEffect"]).catch({
                "AgendaHebdo.useEffect": (error)=>{
                    console.error("Erreur de chargement JSON :", error);
                    setLoading(false);
                }
            }["AgendaHebdo.useEffect"]);
        }
    }["AgendaHebdo.useEffect"], []);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6 text-gray-500",
            children: "Chargement de l'agenda..."
        }, void 0, false, {
            fileName: "[project]/app/weekCalendar/page.tsx",
            lineNumber: 58,
            columnNumber: 12
        }, this);
    }
    // Regrouper les événements par jour et par personne
    const eventsByDay = {};
    for (const [person, days] of Object.entries(schedule)){
        for (const [day, events] of Object.entries(days)){
            if (!eventsByDay[day]) eventsByDay[day] = [];
            for (const ev of events){
                const [timeRange, task] = Object.entries(ev)[0];
                eventsByDay[day].push({
                    person,
                    timeRange,
                    task
                });
            }
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6 overflow-x-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-5 gap-2 relative border-t border-l min-h-[800px]",
            children: daysOfWeek.map((day)=>{
                const dayEvents = eventsByDay[day] || [];
                // Extraire les personnes présentes ce jour
                const personsForDay = Array.from(new Set(dayEvents.map((e)=>e.person)));
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative border-r border-gray-300 min-h-[800px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-center font-semibold bg-gray-100 p-2 sticky top-0 z-10",
                            children: day
                        }, void 0, false, {
                            fileName: "[project]/app/weekCalendar/page.tsx",
                            lineNumber: 86,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative flex w-full min-h-[800px]",
                            children: personsForDay.map((person)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative flex-1 border-l border-gray-200",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-xs text-center font-medium bg-gray-50 sticky top-[32px] z-10",
                                            children: person
                                        }, void 0, false, {
                                            fileName: "[project]/app/weekCalendar/page.tsx",
                                            lineNumber: 91,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: dayEvents.filter((e)=>e.person === person).map((event, idx)=>{
                                                const style = getBlockStyle(event.timeRange);
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "absolute w-[95%] mx-auto text-white text-xs rounded-md shadow ".concat(personColors[person] || "bg-gray-400"),
                                                    style: style,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-xs",
                                                            children: event.timeRange
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/weekCalendar/page.tsx",
                                                            lineNumber: 105,
                                                            columnNumber: 31
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: event.task
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/weekCalendar/page.tsx",
                                                            lineNumber: 106,
                                                            columnNumber: 31
                                                        }, this)
                                                    ]
                                                }, idx, true, {
                                                    fileName: "[project]/app/weekCalendar/page.tsx",
                                                    lineNumber: 100,
                                                    columnNumber: 29
                                                }, this);
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/app/weekCalendar/page.tsx",
                                            lineNumber: 94,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, person, true, {
                                    fileName: "[project]/app/weekCalendar/page.tsx",
                                    lineNumber: 90,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/app/weekCalendar/page.tsx",
                            lineNumber: 88,
                            columnNumber: 15
                        }, this)
                    ]
                }, day, true, {
                    fileName: "[project]/app/weekCalendar/page.tsx",
                    lineNumber: 85,
                    columnNumber: 13
                }, this);
            })
        }, void 0, false, {
            fileName: "[project]/app/weekCalendar/page.tsx",
            lineNumber: 78,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/weekCalendar/page.tsx",
        lineNumber: 77,
        columnNumber: 5
    }, this);
}
_s(AgendaHebdo, "b23s22DK3FdIMYTvANEkyxHTSXs=");
_c = AgendaHebdo;
var _c;
__turbopack_context__.k.register(_c, "AgendaHebdo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=app_weekCalendar_page_tsx_16fe097d._.js.map