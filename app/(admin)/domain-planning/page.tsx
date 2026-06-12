"use client";
import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAppContext } from "@/app/hooks/useAppContext";
import { useIsOrgAdmin } from "@/app/hooks/useIsOrgAdmin";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { canAccessDomainPlanningSettingsFromRoles } from "@/app/lib/intranet-role-utils";
import DomainAssigneePicker, { type ClerkAssigneeOption } from "@/app/components/domain-planning/DomainAssigneePicker";
import DomainPlanningSettingsTab from "@/app/components/domain-planning/DomainPlanningSettingsTab";
import {
  DEFAULT_DOMAIN_PLANNING_ACTIVITY_COLORS,
  DEFAULT_DOMAIN_PLANNING_DOMAINS,
  sanitizeDomainPlanningClassesByPole,
} from "@/app/lib/domain-planning-defaults";
import { calendarDateKeyParis } from "@/app/lib/domain-planning-dates";
import { getSubjectColorPresentation, subjectColorToHex } from "@/app/lib/prof-room-subject-colors";

const FALLBACK_CLASSES: Record<string, string[]> = {
  "ÉCOLE": ["CP", "CE1", "CE2", "CM1", "CM2"],
  "COLLÈGE": ["6A","6B","6C","6D","6E","6F","5A","5B","5C","5D","5E","5F","4A","4B","4C","4D","4E","4F","3A","3B","3C","3D","3E","3F"],
  "LYCÉE": ["2A","2B","2C","2D","2E","1A","1B","1C","1D","1E","1F","TA","TB","TC","TD","TE","TF"],
};

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

function DomainPlanningPageContent() {
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const { data: appCtx } = useAppContext();
  const isOrgAdmin = useIsOrgAdmin();
  const intranetRoles = intranetRolesFromMetadata(user?.publicMetadata);
  const CLASSES_DATA = useMemo(() => {
    const raw = appCtx?.domainPlanning?.classesByPole || FALLBACK_CLASSES;
    return sanitizeDomainPlanningClassesByPole(raw);
  }, [appCtx?.domainPlanning?.classesByPole]);
  const ACTIVITY_COLORS = {
    ...DEFAULT_DOMAIN_PLANNING_ACTIVITY_COLORS,
    ...(appCtx?.domainPlanning?.activityColors || {}),
  };
  const hoursStart = appCtx?.domainPlanning?.hoursStart ?? 8;
  const hoursEnd = appCtx?.domainPlanning?.hoursEnd ?? 17;
  const HOURS = Array.from({ length: hoursEnd - hoursStart + 1 }, (_, i) => hoursStart + i);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [domains, setDomains] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bookings, setBookings] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [activityLabel, setActivityLabel] = useState("");
  const [level, setLevel] = useState("");
  const [className, setClassName] = useState("");
  const [comment, setComment] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [untilDate, setUntilDate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clipboard, setClipboard] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, res?: any, dateStr?: string, hour?: number } | null>(null);
  const [updateAllSeries, setUpdateAllSeries] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetFirstName, setTargetFirstName] = useState("");
  const [targetLastName, setTargetLastName] = useState("");
  const [clerkUsers, setClerkUsers] = useState<ClerkAssigneeOption[]>([]);
  const [clerkUsersLoading, setClerkUsersLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"reservation" | "settings">("reservation");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingRes, setEditingRes] = useState<any>(null);
  const lastName = (user?.lastName || "").toUpperCase();
  const selectedDomainMeta = domains.find((d) => d.id === selectedDomain);
  const selectedDomainColorValue =
    selectedDomainMeta?.color ||
    DEFAULT_DOMAIN_PLANNING_DOMAINS.find((d) => d.id === selectedDomain)?.color ||
    "bg-violet-600 text-white";
  const isCoordinatorForDomain =
    isOrgAdmin ||
    Boolean(
      user?.id && selectedDomainMeta?.coordinatorClerkUserIds?.includes(user.id),
    );
  const canAccessSettings =
    isOrgAdmin ||
    canAccessDomainPlanningSettingsFromRoles(intranetRoles) ||
    Boolean(user?.id && domains.some((d) => d.coordinatorClerkUserIds?.includes(user.id)));
  const todayStr = calendarDateKeyParis();
  const maxDateLimit = new Date();
  maxDateLimit.setDate(maxDateLimit.getDate() + (appCtx?.domainPlanning?.bookingHorizonDays ?? 56));
  const maxDateStr = isCoordinatorForDomain ? "" : calendarDateKeyParis(maxDateLimit);
  const myUpcomingBookings = useMemo(() => {
    return bookings
      .filter(
        (r) =>
          r.userId === user?.id &&
          r.status !== "CANCELLED" &&
          r.startsAt >= new Date().toISOString(),
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, 5);
  }, [bookings, user?.id]);
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }, [currentDate]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startOfWeek]);
  useEffect(() => {
    async function load() {
      try {
        const [domainsRes, bookingsRes] = await Promise.all([
          fetch("/api/domain-planning/domains"),
          fetch("/api/domain-planning/bookings"),
        ]);
        if (domainsRes.ok) {
          const data = await domainsRes.json();
          setDomains(data.domains || []);
          if (data.domains?.length > 0) setSelectedDomain(data.domains[0].id);
        }
        if (bookingsRes.ok) setBookings((await bookingsRes.json()).bookings || []);
      } catch (error) { console.error(error); }
    }
    load();
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    if (!isCoordinatorForDomain) return;
    let cancelled = false;
    setClerkUsersLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/domain-planning/clerk-users");
        const j = await res.json();
        if (!cancelled && res.ok) setClerkUsers((j.users || []) as ClerkAssigneeOption[]);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setClerkUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCoordinatorForDomain]);

  const applyAssignee = (u: ClerkAssigneeOption | null) => {
    if (!u) {
      setTargetUserId("");
      setTargetEmail("");
      setTargetFirstName("");
      setTargetLastName("");
      return;
    }
    setTargetUserId(u.clerkUserId);
    setTargetEmail(u.email);
    setTargetFirstName(u.firstName || "");
    setTargetLastName((u.lastName || "").toUpperCase());
  };

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setIsEditing(false);
    setEditingRes(null);
    setSelectedDate(todayStr);
    setSelectedHours([]);
    setActivityLabel("");
    setLevel("");
    setClassName("");
    setComment("");
    requestAnimationFrame(() => {
      document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchParams, todayStr]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCellClick = (dateStr: string, hour: number, resExist?: any) => {
    setUpdateAllSeries(false);
    if (resExist) {
      if (isCoordinatorForDomain || resExist.userId === user?.id) {
        setIsEditing(true);
        setEditingRes(resExist);
        setSelectedDate(resExist.startsAt.split("T")[0]);
        const hourFromRes = parseInt(resExist.startsAt.split("T")[1].split(":")[0]);
        setSelectedHours([hourFromRes]);
        setActivityLabel(resExist.activityLabel || "");
        setClassName(resExist.className);        
        const foundLevel = Object.keys(CLASSES_DATA).find(l => CLASSES_DATA[l].includes(resExist.className));
        if (foundLevel) setLevel(foundLevel);
        setComment(resExist.comment || "");
        const uid = resExist.userId?.startsWith("assigned-") ? "" : String(resExist.userId || "");
        setTargetUserId(uid);
        setTargetEmail(resExist.email || "");
        setTargetFirstName(resExist.firstName);
        setTargetLastName(resExist.lastName);
        document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      setIsEditing(false);
      setEditingRes(null);
      setSelectedDate(dateStr);
      setSelectedHours([hour]);
      if (isCoordinatorForDomain) {
        applyAssignee(null);
      } else {
        setTargetUserId(user?.id || "");
        setTargetEmail(user?.primaryEmailAddress?.emailAddress || "");
        setTargetFirstName(user?.firstName || "");
        setTargetLastName(lastName);
      }
      document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleContextMenu = (e: React.MouseEvent, dateStr: string, hour: number, resExist?: any) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, res: resExist, dateStr, hour });
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copyReservation = (res: any) => {
    setClipboard({ activityLabel: res.activityLabel, className: res.className, comment: res.comment });
    setContextMenu(null);
  };
  const pasteReservation = (dateStr: string, hour: number) => {
    if (!clipboard) return;
    setIsEditing(false);
    setEditingRes(null);
    setSelectedDate(dateStr);
    setSelectedHours([hour]);
    setActivityLabel(clipboard.activityLabel || "");
    setClassName(clipboard.className);
    setComment(clipboard.comment || "");
    if (isCoordinatorForDomain) {
      applyAssignee(null);
    } else {
      setTargetUserId(user?.id || "");
      setTargetEmail(user?.primaryEmailAddress?.emailAddress || "");
      setTargetFirstName(user?.firstName || "");
      setTargetLastName(lastName);
    }
    setContextMenu(null);
    document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
  };
  async function handleConfirm() {
    if (!selectedDomain || !selectedDate || selectedHours.length === 0 || !className) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (isCoordinatorForDomain && !targetUserId) {
      alert("Veuillez sélectionner un professeur dans la liste des utilisateurs Clerk.");
      return;
    }
    const endpoint = isEditing
      ? "/api/domain-planning/bookings/update"
      : "/api/domain-planning/bookings/create";
    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const body = {
      id: editingRes?.id,
      domainId: selectedDomain,
      selectedHours,
      newHour: selectedHours[0],
      date: selectedDate,
      activityLabel,
      className,
      comment,
      recurrence,
      untilDate,
      updateAllSeries,
      firstName: isCoordinatorForDomain ? targetFirstName : user?.firstName,
      lastName: isCoordinatorForDomain ? targetLastName.toUpperCase() : lastName,
      email: isCoordinatorForDomain ? targetEmail || userEmail : userEmail,
      targetUserId: isCoordinatorForDomain ? targetUserId : undefined,
    };
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { 
      alert("✅ Enregistré !"); 
      setIsEditing(false);
      setEditingRes(null);
      window.location.reload(); 
    } else { 
      alert("❌ Erreur lors de l'enregistrement."); 
    }
  }
  async function handleDelete() {
    if (!editingRes) return;
    const reason = prompt("Motif de suppression :", "Annulation");
    if (reason === null) return;
    let deleteAllSeries = false;
    if (editingRes.groupId) { deleteAllSeries = confirm("Supprimer TOUTE la série ?");}
    const res = await fetch("/api/domain-planning/bookings/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingRes.id,
        groupId: editingRes.groupId,
        deleteAllSeries,
        reason,
      }),
    });
    if (res.ok) { 
      alert("🗑️ Supprimé !"); 
      setIsEditing(false);
      setEditingRes(null);
      window.location.reload(); 
    } else {
      alert("❌ Erreur lors de la suppression.");
    }
  }
  if (!isLoaded || !user) return <div className="p-20 text-center font-bold">Initialisation...</div>;
  return (
    <div className="px-0 py-4 md:px-4 pb-0 sm:pb-4 max-w-6xl mx-auto">
      {contextMenu && (
        <div className="fixed z-[100] bg-white shadow-2xl border rounded-xl p-1 min-w-[180px] text-xs font-bold overflow-hidden" style={{ top: contextMenu.y, left: contextMenu.x }}>
          {contextMenu.res ? (
            <button onClick={() => copyReservation(contextMenu.res)} className="w-full text-left p-3 hover:bg-blue-50 flex items-center gap-2 rounded-lg transition-colors">
              <span>📋</span> Copier ce créneau
            </button>
          ) : clipboard ? (
            <button onClick={() => pasteReservation(contextMenu.dateStr!, contextMenu.hour!)} className="w-full text-left p-3 hover:bg-green-50 flex items-center gap-2 rounded-lg transition-colors">
              <span>📥</span> Coller : {clipboard.activityLabel || "Créneau"} ({clipboard.className})
            </button>
          ) : (
            <div className="p-3 text-gray-400 italic">Rien à coller...</div>
          )}
        </div>
      )}
      <h1 className="text-4xl font-black text-slate-900 tracking-tight p-4">Planning des enseignements transversaux</h1>
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("reservation")}
          className={`px-6 py-3 rounded-xl text-sm font-black ${activeTab === "reservation" ? "bg-violet-600 text-white shadow-lg" : "bg-slate-100 text-slate-700"}`}
        >
          Planning
        </button>
        {canAccessSettings && (
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 rounded-xl text-sm font-black ${activeTab === "settings" ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-700"}`}
          >
            Paramétrage
          </button>
        )}
      </div>
      {activeTab === "settings" && canAccessSettings ? (
        <DomainPlanningSettingsTab />
      ) : (
      <>
      {canAccessSettings && domains.some((d) => !d.coordinatorClerkUserIds?.length) && (
        <div className="px-4 mb-4 rounded-2xl bg-amber-50 border border-amber-200 py-3 text-sm text-amber-900">
          <span className="font-black">Première configuration :</span> ouvrez l&apos;onglet{" "}
          <button
            type="button"
            className="font-black underline"
            onClick={() => setActiveTab("settings")}
          >
            Paramétrage
          </button>{" "}
          pour désigner les responsables EVARS, UNSS, etc.
        </div>
      )}
      <div className="px-4 pb-3">
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="w-full text-center text-white font-black text-xl md:text-2xl px-4 py-4 rounded-2xl outline-none cursor-pointer"
          style={{
            backgroundColor: subjectColorToHex(selectedDomainColorValue),
            color: "#ffffff",
          }}
        >
          {domains.map((d) => (
            <option key={d.id} value={d.id} className="text-slate-900 bg-white font-bold text-base">
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-2xl p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3 w-full">
        <div className="flex items-center bg-gray-100 rounded-xl w-full md:w-1/2 justify-between">
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-2 py-3 hover:bg-white rounded-lg">◀</button>
            <div className="px-4 text-[12px] font-black uppercase text-center">
              Semaine du <br/><span className="text-blue-600">{startOfWeek.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}</span>
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-2 hover:bg-white rounded-lg">▶</button>
        </div>
        <div className="flex items-center justify-between md:justify-end w-full md:w-1/2 gap-3">
          <label className="flex items-center gap-2 flex-1 min-w-0 bg-white border-2 border-blue-100 rounded-full px-3 py-1 cursor-pointer">
            <span className="text-blue-400 text-sm flex-shrink-0">📅</span>
            <input type="date" onChange={(e) => setCurrentDate(new Date(e.target.value))} className="flex-1 min-w-0 w-full text-[15px] bg-transparent outline-none text-slate-600 font-semibold"/>
          </label>
          {isCoordinatorForDomain && (
            <span className="bg-purple-600 text-white text-[15px] font-black px-3 py-1 rounded-full tracking-tighter whitespace-nowrap">
              RESPONSABLE
            </span>
          )}
        </div>
      </div>
      <div className="bg-white rounded-3xl overflow-hidden">
        <div className="grid grid-cols-6 bg-gray-50 border-b">
          <div className="p-4 text-[13px] font-black text-gray-400 uppercase text-center">Heure</div>
          {weekDays.map((d, i) => (
            <div key={i} className={`p-4 text-center border-l ${d.toDateString() === new Date().toDateString() ? "bg-blue-50" : ""}`}>
              <p className="text-[10px] uppercase font-bold text-gray-400">{DAYS[i]}</p>
              <p className="text-xl font-black">{d.getDate()}</p>
            </div>
          ))}
        </div>
        <div className="divide-y">
          {HOURS.map(h => (
            <div key={h} className="grid grid-cols-6 min-h-[95px]">
              <div className="text-[13px] font-black text-gray-400 flex items-center justify-center bg-gray-50/50 italic">{h}h30</div>
              {weekDays.map((date, i) => {
                const dateStr = calendarDateKeyParis(date);
                const hourPrefix = `${dateStr}T${h.toString().padStart(2, "0")}`;
                const res = bookings.find(
                  (r) =>
                    r.domainId === selectedDomain &&
                    r.startsAt.startsWith(hourPrefix) &&
                    r.status !== "CANCELLED",
                );
                const isOwn = res?.userId === user.id;
                const canModify = isCoordinatorForDomain || isOwn;
                const colorKey = res?.activityLabel || "";
                const colorValue = res
                  ? ACTIVITY_COLORS[colorKey] || selectedDomainColorValue
                  : "";
                const colorPresentation = res ? getSubjectColorPresentation(colorValue) : null;
                return (
                  <div key={i} onClick={() => handleCellClick(dateStr, h, res)} onContextMenu={(e) => handleContextMenu(e, dateStr, h, res)} className={`border-l relative p-1 transition-all sm:h-[120px] group ${!res ? 'hover:bg-green-50' : 'cursor-pointer'}`}>
                    {res ? (
                      <>
                        <div
                          className={`h-full w-full rounded-xl p-2 text-[11px] flex flex-col justify-between ${colorPresentation?.className || ""} ${isOwn ? "ring-2 ring-blue-400 ring-inset" : ""}`}
                          style={colorPresentation?.style}
                        >
                          <div>
                            <div className="flex justify-between items-start sm:flex-col">
                              <p className="font-black uppercase leading-none truncate">
                                {res.activityLabel || selectedDomainMeta?.name}
                              </p>
                              <span className="bg-white/20 px-1 rounded text-[11px] font-bold">{res.className}</span>
                            </div>
                            {res.comment && (
                              <p className="mt-1 italic opacity-90 leading-tight border-t border-white/10 pt-1 whitespace-normal break-words sm:line-clamp-3">
                                &apos;{res.comment}&apos;
                              </p>
                            )}
                          </div>
                          <div className="flex justify-between items-end mt-1">
                            <span className="font-bold opacity-80 uppercase ">{res.lastName}</span>
                            {canModify && <span className="text-[10px] sm:hidden">✎</span>}
                          </div>
                        </div>
                        <div className={`absolute left-1/2 -translate-x-1/2 w-72 bg-slate-900 text-white p-4 rounded-xl shadow-2xl  opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[100] ${h <= 10 ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
                          <p className="text-[16px] font-black text-violet-400 uppercase mb-1 break-words leading-tight">
                            {(res.activityLabel || selectedDomainMeta?.name) + " - " + res.className}
                          </p>
                          <p className="text-[15px] font-bold mb-3 opacity-90">Par : {res.firstName} {res.lastName}</p>
                          {res.comment && (
                            <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                              <p className="text-[14px] leading-relaxed italic text-slate-200 whitespace-normal break-words">&apos;{res.comment}&apos;</p>
                            </div>
                          )}
                          <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 ${h <= 10 ? '-top-1.5' : '-bottom-1.5'}`}></div>
                        </div> 
                      </>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-black text-green-600">+ LIBRE</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {myUpcomingBookings.length > 0 && (
        <div className="bg-white border-2 border-violet-100 rounded-3xl p-6 shadow-lg">
          <h3 className="text-sm font-black text-violet-600 uppercase mb-4 flex items-center gap-2">📅 Mes 5 prochains créneaux</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {myUpcomingBookings.map((res) => (
              <div 
                key={res.id} 
                onClick={() => {
                    const dStr = res.startsAt.split("T")[0];
                    const hNum = parseInt(res.startsAt.split("T")[1].split(":")[0]);
                    handleCellClick(dStr, hNum, res);
                }}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-2xl p-3 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-black text-gray-400 uppercase">
                  {new Date(res.startsAt).toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs font-black text-blue-700">{res.startsAt.split("T")[1].substring(0, 5).replace(":", "h")}</p>
                <div className="mt-2 text-[10px] font-bold">
                  <span className="block truncate">
                    📍 {domains.find((d) => d.id === res.domainId)?.name || "Domaine"}
                  </span>
                  <span className="block text-gray-500">
                    📚 {(res.activityLabel || "Créneau") + " (" + res.className + ")"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div id="form-section" className="bg-slate-900 rounded-b-none sm:rounded-b-[40px] rounded-[40px] p-4 md:p-8 text-white shadow-2xl mt-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 md:p-3 rounded-2xl flex-shrink-0 ${isEditing ? 'bg-orange-500' : 'bg-green-500'}`}>
              <span className="text-base md:text-xl font-bold">{isEditing ? "MODIFIER" : "RÉSERVER"}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-tight">
              {isEditing ? "Détails du créneau" : "Nouveau créneau"}
            </h2>
          </div>
          {isEditing && (
            <button onClick={handleDelete} className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white text-xs font-black px-6 py-3 rounded-2xl shadow-lg transition-transform active:scale-90">🗑️ SUPPRIMER CE CRÉNEAU</button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Professeur & classe</label>
            {isCoordinatorForDomain ? (
              <DomainAssigneePicker
                users={clerkUsers}
                value={targetUserId}
                onChange={applyAssignee}
                loading={clerkUsersLoading}
              />
            ) : (
              <div className="bg-slate-800 p-4 rounded-xl text-sm font-bold border border-slate-700">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Identité Clerk :</p>
                <span className="text-blue-400">{user.firstName} {lastName}</span>
              </div>
            )}
            <select
              value={activityLabel}
              onChange={(e) => setActivityLabel(e.target.value)}
              className="w-full bg-slate-800 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 ring-violet-500"
            >
              <option value="">-- LIBELLÉ D&apos;ACTIVITÉ (optionnel) --</option>
              {Object.keys(ACTIVITY_COLORS).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="flex-1 bg-slate-800 border-none rounded-xl p-4 text-xs font-bold">
                <option value="">NIVEAU</option>
                {Object.keys(CLASSES_DATA).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={className} onChange={(e) => setClassName(e.target.value)} className="flex-1 bg-slate-800 border-none rounded-xl p-4 text-xs font-bold">
                <option value="">CLASSE</option>
                {level && CLASSES_DATA[level].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 w-full uppercase tracking-widest">Calendrier</label>
            <div className="w-full overflow-hidden">
              <input type="date" value={selectedDate} min={todayStr} max={maxDateStr} onChange={(e) => setSelectedDate(e.target.value)} className="w-full block bg-slate-800 border-none rounded-xl px-4 py-3 text-[16px] font-bold text-white" style={{ colorScheme: "dark" }} />
            </div>
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
              <p className="text-[10px] font-bold text-slate-500 mb-2">Choisir l&apos;heure :</p>
              <div className="flex flex-wrap gap-2">
                {HOURS.map(h => {
                  const hourPrefix = `${selectedDate}T${h.toString().padStart(2, "0")}`;
                  const isTaken = bookings.some(
                    (r) =>
                      r.domainId === selectedDomain &&
                      r.startsAt.startsWith(hourPrefix) &&
                      r.status !== "CANCELLED" &&
                      r.id !== editingRes?.id,
                  );
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={isTaken}
                      onClick={() => setSelectedHours([h])}
                      className={`relative px-3 py-1 rounded-lg font-black text-xs transition-all ${
                        selectedHours.includes(h) 
                        ? "bg-blue-600 text-white shadow-lg scale-110 z-10" 
                        : isTaken 
                          ? "bg-red-900/50 text-red-200 cursor-not-allowed border border-red-700/70" 
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {h}h30
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes & Répétition</label>
            <textarea placeholder="Commentaire (ex: Valise PC)" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-4 text-sm font-bold h-20 resize-none focus:ring-2 ring-blue-500" />
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-4 text-xs font-bold">
              <option value="none">Une seule fois</option>
              <option value="weekly">Toutes les semaines</option>
              <option value="biweekly">Toutes les 2 semaines</option>
            </select>
            {recurrence !== "none" && (
              <input type="date" value={untilDate} min={selectedDate} max={maxDateStr} onChange={(e) => setUntilDate(e.target.value)} className="w-full bg-orange-900/30 border border-orange-500/50 rounded-xl p-3 text-xs font-bold text-orange-400" />
            )}
          </div>
        </div>
        {isEditing && editingRes?.groupId && (
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-2xl flex items-center gap-3">
            <input 
              type="checkbox" 
              id="updateSeries" 
              checked={updateAllSeries} 
              onChange={(e) => setUpdateAllSeries(e.target.checked)}
              className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="updateSeries" className="text-sm font-bold text-blue-400 cursor-pointer">🔄 Appliquer les modifications à TOUTE la série de réservations</label>
          </div>
        )}
        <div className="mt-10 flex gap-4 sm:max-md:flex-col">
          <button onClick={handleConfirm} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 text-lg">
            {isEditing ? "ENREGISTRER LES MODIFICATIONS" : "CONFIRMER LE CRÉNEAU"}
          </button>
          <button onClick={() => { setIsEditing(false); setEditingRes(null); setActivityLabel(""); setClassName(""); setComment(""); setLevel(""); }} className="bg-slate-700 px-8 rounded-2xl font-bold hover:bg-slate-600 transition-colors sm:py-4">ANNULER</button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

export default function DomainPlanningPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Chargement du planning…</div>}>
      <DomainPlanningPageContent />
    </Suspense>
  );
}