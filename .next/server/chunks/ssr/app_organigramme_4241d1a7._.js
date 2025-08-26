module.exports = {

"[project]/app/organigramme/organigramme.json (json)": ((__turbopack_context__) => {

__turbopack_context__.v(JSON.parse("{\"direction\":[{\"name\":\"Mme Plantec\",\"role\":\"Directrice Ecole\",\"email\":\"dupont@ecole.fr\",\"image\":\"https://docslaproimage.s3.eu-west-3.amazonaws.com/photospers/plantec.jpg\",\"color\":\"#3b82f6\"},{\"name\":\"Mme Dumouchel\",\"role\":\"Directrice collège\",\"email\":\"leroy@ecole.fr\",\"image\":\"https://docslaproimage.s3.eu-west-3.amazonaws.com/photospers/DUMOUCHEL+Anne-Sophie+001.jpg\",\"color\":\"#3b82f6\"},{\"name\":\"Mme Dona\",\"role\":\"Directrice du lycée et coordinatrice\",\"email\":\"moreau@ecole.fr\",\"image\":\"https://docslaproimage.s3.eu-west-3.amazonaws.com/photospers/DONA+Anne+marie.PNG\",\"color\":\"#3b82f6\"}],\"administratif\":[{\"name\":\"Mme Leblond\",\"role\":\"Secrétaire du primaire\",\"email\":\"martin@ecole.fr\",\"image\":\"https://docslaproimage.s3.eu-west-3.amazonaws.com/photospers/pauline_page-0001.jpg\",\"color\":\"#3b82f6\"},{\"name\":\"Mme Villier\",\"role\":\"Secrétaire du collège\",\"email\":\"martin@ecole.fr\",\"image\":\"https://docslaproimage.s3.eu-west-3.amazonaws.com/photospers/BUNO+SARAH.jpg\",\"color\":\"#3b82f6\"},{\"name\":\"Mr Hacqueville-Mathi\",\"role\":\"Secrétaire du lycée\",\"email\":\"martin@ecole.fr\",\"image\":\"https://docslaproimage.s3.eu-west-3.amazonaws.com/photospers/HACQUEVILLE-MATHI+Florian.png\",\"color\":\"#3b82f6\"}],\"vie_scolaire\":[{\"name\":\"Mme Coriou\",\"role\":\"CPE 6ème-5ème\",\"email\":\"petit@ecole.fr\",\"image\":\"/images/petit.jpg\",\"color\":\"#3b82f6\"},{\"name\":\"Mr Laquièvre\",\"role\":\"CPE 4ème-3ème\",\"email\":\"petit@ecole.fr\",\"image\":\"/images/petit.jpg\",\"color\":\"#3b82f6\"},{\"name\":\"Mme Constant\",\"role\":\"CPE Lycée\",\"email\":\"petit@ecole.fr\",\"image\":\"/images/petit.jpg\",\"color\":\"#3b82f6\"}],\"maintenance\":[{\"name\":\"Mr Lainé\",\"role\":\"Responsable maintence informatique\",\"email\":\"petit@ecole.fr\",\"image\":\"/images/petit.jpg\",\"color\":\"#3b82f6\"},{\"name\":\"Mr Brumachon\",\"role\":\"Maintenance\",\"email\":\"petit@ecole.fr\",\"image\":\"/images/petit.jpg\",\"color\":\"#3b82f6\"}]}"));}),
"[project]/app/organigramme/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>Organigramme
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$organigramme$2f$organigramme$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/app/organigramme/organigramme.json (json)");
"use client";
;
;
;
;
function StaffBubble({ person, isFlipped, onClick }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
        className: "w-[230px] h-[230px] rounded-full shadow-xl cursor-pointer relative preserve-3d",
        onClick: onClick,
        whileHover: {
            scale: 1.15
        },
        style: {
            perspective: 1000
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
            className: "absolute inset-0 rounded-full",
            initial: false,
            animate: {
                rotateY: isFlipped ? 180 : 0
            },
            transition: {
                duration: 0.6
            },
            style: {
                transformStyle: "preserve-3d"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 flex flex-col items-center rounded-full overflow-hidden backface-hidden",
                    style: {
                        backgroundColor: person.color,
                        WebkitBackfaceVisibility: "hidden",
                        backfaceVisibility: "hidden"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: person.image,
                            className: "w-[150px] h-[150px] object-cover rounded-full mt-2"
                        }, void 0, false, {
                            fileName: "[project]/app/organigramme/page.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-lg text-center break-words whitespace-normal",
                            children: person.name
                        }, void 0, false, {
                            fileName: "[project]/app/organigramme/page.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-center break-words whitespace-normal w-[60%]",
                            children: person.role
                        }, void 0, false, {
                            fileName: "[project]/app/organigramme/page.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/organigramme/page.tsx",
                    lineNumber: 23,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 flex flex-col items-center justify-center text-white rounded-full p-2 text-center",
                    style: {
                        backgroundColor: person.color,
                        transform: "rotateY(180deg)",
                        WebkitBackfaceVisibility: "hidden",
                        backfaceVisibility: "hidden"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "font-bold text-center break-words whitespace-normal",
                            children: person.name
                        }, void 0, false, {
                            fileName: "[project]/app/organigramme/page.tsx",
                            lineNumber: 53,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-center break-words whitespace-normal",
                            children: person.role
                        }, void 0, false, {
                            fileName: "[project]/app/organigramme/page.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: `mailto:${person.email}`,
                            className: "text-xs underline hover:text-gray-200",
                            children: person.email
                        }, void 0, false, {
                            fileName: "[project]/app/organigramme/page.tsx",
                            lineNumber: 59,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/organigramme/page.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/organigramme/page.tsx",
            lineNumber: 15,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/organigramme/page.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
function Organigramme() {
    const [openIndex, setOpenIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "flex justify-center items-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6 space-y-10",
            children: Object.entries(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$organigramme$2f$organigramme$2e$json__$28$json$29$__["default"]).map(([section, people], sectionIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center flex flex-col",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-xl font-bold mb-4 capitalize",
                                children: section.replace("_", " ")
                            }, void 0, false, {
                                fileName: "[project]/app/organigramme/page.tsx",
                                lineNumber: 80,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/organigramme/page.tsx",
                            lineNumber: 79,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-6 flex-wrap justify-center",
                            children: people.map((p, i)=>{
                                const globalIndex = `${sectionIndex}-${i}`;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StaffBubble, {
                                    person: p,
                                    isFlipped: openIndex === globalIndex,
                                    onClick: ()=>setOpenIndex(openIndex === globalIndex ? null : globalIndex)
                                }, globalIndex, false, {
                                    fileName: "[project]/app/organigramme/page.tsx",
                                    lineNumber: 88,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/app/organigramme/page.tsx",
                            lineNumber: 84,
                            columnNumber: 13
                        }, this)
                    ]
                }, section, true, {
                    fileName: "[project]/app/organigramme/page.tsx",
                    lineNumber: 78,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/app/organigramme/page.tsx",
            lineNumber: 76,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/organigramme/page.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
}),

};

//# sourceMappingURL=app_organigramme_4241d1a7._.js.map