"use client";

import { useMemo, useState } from "react";
import Header from "../../components/Header/Header";
import { SCHOOL } from "../../lib/school";

type Stage = "ecole" | "college" | "lycee";
type EcoleNiveau = "JE1MMEBAYEL" | "JE2MMECARTIER" | "JE3MMEDOUGHTY" | "JE4" | "CP" | "CE1" | "CE2" | "CM1" | "CM2";
type CollegeNiveau = "6e" | "5e" | "4e" | "3e";
type LyceeNiveau = "2nde" | "1re" | "Terminale";
type LyceeTrack = "General" | "ST2S";
type LangueSeconde = "Espagnol" | "Allemand";
type LyceeSpecialite = "Maths" | "Physique-Chimie" | "SVT" | "SES" | "HG-GEO-GEOPOL";
type SupplySection = { title: string; items: string[] };
type Child =
  | {
      id: string;
      stage: "ecole";
      niveau: EcoleNiveau;
    }
  | {
      id: string;
      stage: "college";
      niveau: CollegeNiveau;
      ebp: boolean;
      langue: LangueSeconde; 
      optionBilingueAllemand: boolean;
      optionLatin: boolean;
      optionOse: boolean;
    }
  | {
      id: string;
      stage: "lycee";
      niveau: LyceeNiveau;
      track: LyceeTrack;
      langue: LangueSeconde;
      anglaisEuro?: boolean;
      specialites: LyceeSpecialite[];
      latin: boolean;
    };
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
function dedupeStrings(items: string[]) {
  const set = new Set(items.map((s) => s.trim()).filter(Boolean));
  return Array.from(set);
}
function formatChildLabel(child: Child) {
  if (child.stage === "ecole") {
    const ecoleLabels: Record<EcoleNiveau, string> = {
      JE1MMEBAYEL: "J.E.1 (Mme BAYEL Christine)",
      JE2MMECARTIER: "J.E.2 (Mme CARTIER Céline)",
      JE3MMEDOUGHTY: "J.E.3 (Mme DOUGHTY Sylvie)",
      JE4: "J.E.4",
      CP: "CP",
      CE1: "CE1",
      CE2: "CE2",
      CM1: "CM1",
      CM2: "CM2",
    };
    return `École — ${ecoleLabels[child.niveau] ?? child.niveau}`;
  }
  if (child.stage === "college") {
    if (child.niveau === "6e") return `Collège — 6e (bilingue allemand: ${child.optionBilingueAllemand ? "oui" : "non"})`;
    return `Collège — ${child.niveau} (${child.langue}${child.ebp ? " • E.B.P" : ""}${child.optionLatin ? " • Latin" : ""}${child.optionOse ? " • OSE" : ""})`;
  }
  return `Lycée — ${child.niveau} (${child.track === "ST2S" ? "ST2S" : "Général"} • ${child.langue})`;
}
function getEcoleSupplies(niveau: EcoleNiveau): SupplySection[] {
  const je1 = [
    "1 change complet marqué dans un petit sac (à renouveler quand nécessaire).",
    "2 photos d’identité pour le jour de la rentrée.",
    "2 boîtes de mouchoirs en papier (à renouveler de temps en temps).",
    "1 tablier de peinture ou la chemise de papa avec manches longues.",
    "1 duvet léger et un petit oreiller (marqués) au nom de l’enfant.",
    "Pour les enfants qui ont une tétine pour dormir : la tétine doit être mise dans une boîte uniquement prévue à cet effet pour éviter la propagation des microbes.",
    "1 gros classeur à levier dans lequel vous mettrez 100 pochettes plastique.",
    "1 cahier 96 pages 24x32.",
    "1 pochette Canson de couleurs vives.",
    "1 paire de chaussons.",
  ];
  const je2 = [
    "1 classeur souple.",
    "2 photos d’identité pour le jour de la rentrée.",
    "2 boîtes de mouchoirs en papier.",
    "1 duvet et un petit oreiller (dans un sac en tissu) pour le temps de repos.",
    "1 change complet dans un sac.",
    "1 paire de chaussons.",
    "1 pochette de 12 feutres pointe large.",
    "1 pochette de 12 feutres pointe fine.",
    "2 feutres Velleda noirs.",
    "1 gros classeur à levier dans lequel vous mettrez 100 pochettes plastique + 5 intercalaires (grand format).",
    "1 lutin de 30 vues.",
    "1 pochette de feuilles Canson blanc.",
    "1 pochette Canson de couleurs vives.",
    "Chaque objet (même les sacs) devra être marqué au nom de l’enfant.",
    "Pour les enfants qui ont une tétine pour dormir : elle doit être mise dans une boîte uniquement prévue à cet effet pour éviter la propagation des microbes.",
  ];
  const je3 = [
    "2 photos d’identité (pour le jour de la rentrée).",
    "2 boîtes de mouchoirs en papier.",
    "1 gros classeur à levier gris + 100 pochettes plastique épaisses.",
    "6 intercalaires format 24x32.",
    "1 lutin de 30 vues.",
    "3 pochettes de 12 feutres pointes moyennes.",
    "1 ardoise Velleda + effaceur.",
    "MS : prévoir oreiller + duvet pour les enfants qui font la sieste.",
  ];
  const je4 = [
    "2 photos d’identité.",
    "2 boîtes de mouchoirs en papier.",
    "1 gros classeur à levier avec 50 pochettes plastiques.",
    "12 intercalaires format 24x32.",
    "1 lutin de 30 vues.",
    "1 pochette de 12 feutres pointes fines.",
    "1 pochette de 12 feutres pointes larges.",
    "1 ardoise Velleda avec effaceur.",
    "4 feutres Velleda.",
    "5 bâtons de colle.",
    "1 pochette de feuilles Canson blanches.",
    "1 pochette de feuilles Canson de couleurs vives.",
  ];
  const cpCe1 = [
    "1 agenda une page par jour",
    "4 crayons à papier HB",
    "1 surligneur jaune",
    "1 gomme blanche",
    "1 taille-crayons avec réserve",
    "1 boîte de 18 feutres (dans une trousse)",
    "1 boîte de 18 crayons de couleur (dans une trousse)",
    "1 paire de bons ciseaux",
    "5 sticks de colle étiquetés",
    "1 trousse pour ranger son matériel",
    "1 double décimètre non flexible et pas en fer",
    "1 ardoise Velleda + feutres bleus + effaceur",
    "1 lutin (21x29,7) de 100 vues",
    "2 pochettes à élastiques à rabats (1 bleue, 1 rouge)",
    "1 cahier grand format (24 x 32) à grands carreaux sans spirale",
    "1 pochette de réserve (type sac congélation) contenant crayons à papier, colle, feutre Velleda…",
    "2 boîtes de mouchoirs en papier",
    "1 paire de chaussures de sport",
    "Stylos (1 bleu, 1 vert, 1 rouge)",
    "1 équerre",
    "1 pochette rabats à élastiques rouge",
    "1 pochette papier Canson blanc",
    "1 pochette papier Canson couleurs",
    "1 pochette de réserve (type sac congélation) contenant crayons à papier, colle, feutre Velleda…",
  ];
  const ce2Cm1 = [
    "1 crayon à papier HB + 1 critérium + mines",
    "1 taille-crayons",
    "1 gomme blanche",
    "4 stylos à bille (rouge, vert, bleu, noir)",
    "4 surligneurs de 4 couleurs différentes",
    "1 stylo-plume + cartouches d’encre bleue effaçable + effaceur (ou stylos effaçables type Frixion)",
    "1 paire de ciseaux",
    "1 stick de colle",
    "1 ardoise Velleda + 2 feutres + 1 chiffon",
    "12 feutres et 12 crayons de couleur dans une trousse",
    "1 règle de 20 cm en plastique solide",
    "1 équerre plastique",
    "1 compas avec système de blocage + mines de rechange",
    "1 dictionnaire couvert (si achat Larousse junior)",
    "1 agenda scolaire",
    "1 lutin (40 vues)",
    "1 grand classeur",
    "1 pochette de feuilles Canson blanc 180 gr (24x32)",
    "1 pochette de feuilles Canson de couleurs vives 160 gr (24x32)",
    "1 bloc sténo",
    "1 trousse de réserve qui se ferme (2 crayons + 9 sticks de colle + 3 feutres Velleda)",
    "1 paire de rollers + protections + casque (après les vacances de Pâques)",
    "2 boîtes de mouchoirs",
    "1 stylo-plume ou stylo effaçable + cartouches + effaceur",
  ];
  const cm2 = [
    "1 stylo plume et des cartouches d’encre bleue effaçable",
    "1 effaceur",
    "4 stylos-bille (rouge, vert, bleu, noir)",
    "1 crayon à papier HB + 1 taille-crayons",
    "1 gomme blanche",
    "2 colles en bâtonnet",
    "2 surligneurs",
    "1 ardoise + feutres Velleda",
    "1 paire de ciseaux",
    "1 rouleau de scotch",
    "1 double décimètre plastique + 1 équerre plastique",
    "1 compas de bonne qualité",
    "feutres et crayons de couleur (12)",
    "1 agenda (1 page par jour)",
    "1 dictionnaire couvert (Larousse illustré conseillé)",
    "1 chiffon pour la peinture",
    "1 pochette de feuilles Canson blanc 180 gr (24x32)",
    "1 pochette de Canson de couleurs vives 160 gr (24x32)",
    "des étiquettes",
    "1 grand classeur",
    "1 petit classeur 17x22 avec intercalaires",
    "1 bloc note à petits carreaux",
    "2 boîtes de mouchoirs en papier",
    "1 paire de rollers avec protections et casque",
  ];
  if (niveau === "CM2") { return [{ title: "À acheter (CM2)", items: cm2 }];}
  if (niveau === "CE2" || niveau === "CM1") { return [{ title: "À acheter (CE2/CM1)", items: ce2Cm1 }];}
  if (niveau === "JE1MMEBAYEL") { return [{ title: "À acheter (J.E.1 — Mme BAYEL Christine)", items: je1 }];}
  if (niveau === "JE2MMECARTIER") { return [{ title: "À acheter (J.E.2 — Mme CARTIER Céline)", items: je2 }];}
  if (niveau === "JE3MMEDOUGHTY") { return [{ title: "À acheter (J.E.3 — Mme DOUGHTY Sylvie)", items: je3 }];}
  if (niveau === "JE4") { return [{ title: "À acheter (J.E.4)", items: je4 }];}
  return [{ title: "À acheter (CP/CE1)", items: cpCe1 }];
}

function getCollegeSupplies(child: Extract<Child, { stage: "college" }>): SupplySection[] {
  const { niveau, ebp, langue, optionBilingueAllemand, optionLatin, optionOse } = child;
  const itemsUSB = ["1 clé USB 16 Go (durant tout le collège)"];
  const maths = [
    "Calculatrice Casio (collège)",
    "2 cahiers très grand format (24x32) grands carreaux 96 pages",
    "Critérium à mine fine (type Bic Matic)",
    "Crayon HB",
    "2 Feutres fins type Velleda bleu + chiffon",
    "4 Surligneurs (rose, jaune, vert, bleu)",
    "Équerre transparente",
    "Règle graduée",
    "Compas simple (avec mine supplémentaire)",
    "Rapporteur gradué en degrés (0 à 180 dans les 2 sens, marque MAPED conseillée, pas de graduation de 0à 200, transparent en demi cercle)",
    "1 pochette à rabats avec élastiques",
    "1 lutin",
    "Une deuxième pochette à rabats avec élastique contenant :",
    "a) Copies doubles blanches grand format (21x29,7)",
    "b) Copies simples blanches grand format (21x29,7)",
    "c) 2 ou 3 feuilles de papier calque",
    "d) Une vingtaine de feuilles blanches format A4 (ramette de papier)",
    "e) 4 pochettes transparents pour le classeur",
  ];
  const anglais = [
    "1 cahier 96 pages 24/32 grands carreaux, sans spirales",
    "1 cahier d’exercices fourni par le collège (facturé au 2e trimestre)",
    "1 lutin (40 vues) ou cahier-classeur avec pochettes transparentes",
  ];
  const espagnol = [
    "1 cahier 100 pages grand format (24/32), grands carreaux",
    "1 cahier de brouillon",
    "1 cahier d’exercices fourni par le collège (facturé au 2e trimestre)",
  ];
  const espagnol3e = [
    "1 cahier 100 pages grand format, grands carreaux",
    "1 cahier de brouillon",
  ];
  const allemand = [
    "1 cahier 96 pages 24x32 grands carreaux (sans spirales)",
    "1 carnet format A5 (ou petit cahier) de 100 pages maximum, pour le vocabulaire (à conserver pendant tout le collège)",
    "Avoir toujours quelques copies simples et doublespour les évaluations",
  ];
  const seconde = langue === "Espagnol" ? (niveau === "3e" ? espagnol3e : espagnol) : allemand;
  const secondeEnNiveau6e = optionBilingueAllemand ? allemand : [];
  const artsPlastiques = [
    "Matériel de dessin (carton à dessin A3 ou demi-raisin, papiers calques A4, feuilles Canson A3 + A4)",
    "Dans une boite rigide mettre le matériel : tubes de gouache ou peinture acrylique (couleurs rouge primaire(magenta) + bleu primaire (cyan) + jaune primaire + noir + blanc)",
    "Assortiment de pinceaux souples/brosses.",
    "Quelques feutres moyens et fins, quelques crayons de couleur, règle graduée de 30 cm, crayons noirs (3H – HB – 2B – 4B), gomme, ciseaux, chiffon",
    "1 petit bidon de colle vinylique, 1 scotch papier, feutre fin noir, scotch classique",
    "Matériel marqué au nom de l’élève et de sa classe",
    "(Nouveaux élèves :1 cahier  24x32 sans spirales alternant quadrillé et dessin). Les anciens élèves peuvent continuer sur le même cahier (ou ajouter un nouveau).",
  ];
  const Technologie = [
    "1 classeur grand format (21/29,7)",
    "50 protège-documents plastifiés",
    "10 feuilles blanches papier machine (A4)",
    "10 feuilles simples quadrillées (petits carreaux)",
    "4 surligneurs et des crayons de couleurs",
    "Les cours de 5e et 4e doivent être conservés pour les années suivantes",
  ];
  const vieTerre = [
    "1 cahier 24/32 de 96 pages grands carreaux",
    "Dans une pochette cartonnée à élastiques : feuilles ordinateur (21x29,7) + pochettes plastiques perforées + copies simples et doubles",
    "1 boîte/sachet de gants latex",
  ];
  const physique = (() => {
    switch (niveau) {
      case "6e":
        return ["1 classeur"];
      case "5e":
        return [
          "1 classeur grand format 21/29,7 (50 protège-documents plastifiées par années)",
          "10 feuilles blanches papier machine (A4) + 10 feuilles simples quadrillées (petits carreaux)",
          "Peut servir tout le collège",
        ];
      case "4e":
        return [
          "1 classeur grand format 21/29,7 (50 protège-documents plastifiées par années)",
          "10 feuilles blanches papier machine (A4) + 10 feuilles simples quadrillées (petits carreaux)",
          "Peut servir tout le collège",
        ];
      case "3e":
        return [
          "1 classeur grand format 21/29,7 (50 protège-documents plastifiées par années)",
          "10 feuilles blanches papier machine (A4) + 10 feuilles simples quadrillées (petits carreaux)",
          "Une blouse blanche en coton, prévoir la taille afin qu'elle soit réutilisée au lycée",
        ];
      default:
        return [
          ""
        ];
    }
  })();
  const histoireGeo = (() => {
    if (niveau === "4e") {
      return [
        "2 cahiers très grand format (24/32) de 96 pages grands carreaux",
        "12 crayons de couleur, surligneurs fluo jaune, colle, ciseaux",
      ];
    }
    if (niveau === "3e") {
      return [
        "AU CHOIX DE L'ÉLÈVE 2 cahiers grands carreaux 24x32 OU 1 classeur (Copies simples et doubles grands carreaux)",
        "Copies simples et doubles grands carreaux",
        "12 crayons de couleur, colle, ciseaux",
      ];
    }
    return [
      "2 cahiers très grand format (24/32) de 96 pages grands carreaux",
      "Crayons de couleur, surligneur fluo jaune, colle, ciseaux",
      "Livret fourni par le collège (facturé sur le 2e trimestre)",
    ];
  })();
  const catechese = (() => {
    if (niveau === "6e" || niveau === "5e") {
      return ["1 cahier 96 pages très grand format (24/32) grands carreaux"];
    }
    return ["Pas de cahier : lutin 100 vues minimum"];
  })();
  const eps = [
    "Chaussures extérieures + chaussures de salle (obligatoire)",
    "Tenue adaptée au sport (chaussettes, tee-shirt, short au minimum)",
    "Prévoir en fonction de la météo",
    "1 gourde (pas de bouteille d’eau)",
  ];
  const musique = [
    "Cahier de musique et chant (21/29,7) + protège-cahier",
    "Chemise à élastique (21/29,7) pour ranger le matériel de musique",
    "Documents divers + MémoArts (selon consignes du professeur).",
  ];
  const latin = ["1 cahier 96 pages grand format (grands carreaux)"];
  const ose = [
    "Utiliser le classeur de Technologie pour classer les documents OSE.",
    "30 pochettes transparentes.",
  ];
  const francais = (() => {
    if (!ebp) {
      return [
        "1 cahier grand format grands carreaux",
        "1 cahier de brouillon",
        "Copies simples et doubles grands carreaux pour les évaluations",
        "Bescherelle de conjugaison",
        "Dictionnaire (Larousse de préférence)",
      ];
    }
    if (niveau === "6e") {
      return [
        "6e E.B.P : 2 cahiers grands carreaux 24/32",
        "1 cahier de brouillon",
        "1 pochette cartonnée à élastiques",
        "Feuilles grands carreaux, grands formats",
        "Bescherelle de conjugaison",
        "Dictionnaire niveau collège",
      ];
    }
    if (niveau === "5e") {
      return [
        "5e E.B.P : 2 cahiers très grand format 24/32 grands carreaux (96 pages, plastifiés avec le nom de l'élève)",
        "Un dictionnaire (Petit Larousse / Petit Robert…)",
        "Un cahier classeur",
        "Pochettes transparentes",
        "Chemise cartonnée élastique",
        "Copies doubles",
        "Surligneur, colle, ciseaux, règle, crayons",
        "Un cahier de texte et non un agenda",
      ];
    }
    if (niveau === "4e") {
      return [
        "4e E.B.P : 1 cahier 24/32 grands carreaux (96 pages)",
        "1 pochette cartonnée à élastiques grand format",
        "Bescherelle de conjugaison",
      ];
    }
    return [];
  })();
  return [
    { title: "À préparer (commun)", items: itemsUSB },
    { title: "Mathématiques", items: maths },
    { title: "Français", items: francais.filter(Boolean) },
    { title: "Histoire / Géographie", items: histoireGeo },
    { title: "Anglais (LV1) — obligatoire", items: anglais },
    ...(niveau === "6e"
      ? optionBilingueAllemand
        ? [{ title: "Option bilingue : Allemand", items: secondeEnNiveau6e }]
        : []
      : [{ title: `Langue (LV2) : ${langue}`, items: seconde }]),
    { title: "Arts plastiques", items: artsPlastiques },
    ...(niveau === "6e" ? [] : [{ title: "Technologie", items: Technologie }]),
    { title: "Sciences (Vie & Terre)", items: vieTerre },
    { title: "Sciences (Physiques)", items: physique },
    { title: "EPS", items: eps },
    { title: "Musique", items: musique },
    { title: "Catéchèse", items: catechese },
    ...(niveau !== "6e" && optionLatin ? [{ title: "Latin (option)", items: latin }] : []),
    ...(niveau === "3e" && optionOse ? [{ title: "Option OSE", items: ose }] : []),
  ];
}

function getLyceeSupplies(child: Extract<Child, { stage: "lycee" }>): SupplySection[] {
  const { niveau, track, langue, anglaisEuro = false, specialites, latin } = child;
  const lvbAllemand = ["Allemand (LVB) : MitredEN / vocabulaire selon niveau (d'après votre PDF)"];
  const lvbEspagnol = ["Espagnol (LVB) : Via libre + La conjugaison espagnole (selon votre PDF)"];
  if (niveau === "2nde") {
    return [
      {
        title: "Matériel obligatoire (2nde)",
        items: [
          "HACHETTE Physique-Chimie 2019 (2°)",
          "HATIER SES 2022 (2°)",
          "HACHETTE Skywalks 2025 (2°)",
          "MAGNARD Maths 2019 (2°)",
          "HACHETTE SVT 2019 (2°)",
          "HATIER Histoire-Géographie 2019 (2°)",
          langue === "Allemand" ? "La Maison des Langues — Fantastich (Allemand)" : "Hispamundo (Espagnol) + conjugaison espagnole",
          anglaisEuro ? "Anglais Section Euro : Robert & vocabulaire de l'anglais (Nathan)" : "Anglais (non précisé ici) : selon votre niveau",
        ],
      },
    ];
  }
  if (niveau === "1re" && track === "General") {
    const common = [
      "Hachette Les fondamentaux du lycée — Histoire/Géo/EMC (si applicable selon choix)",
      "La Maison des Langues Blockbuster 2019 (LVB)",
      "Hatier Histoire-Géographie 2019",
      "Hachette Enseignement scientifique 2024 (selon votre PDF)",
    ];
    const bySpec: Record<LyceeSpecialite, string[]> = {
      Maths: ["HACHETTE DÉCLIC 2019 (1° spécialité)"],
      "Physique-Chimie": ["HATIER PHYSIQUE-CHIMIE 2019 (1° spécialité)"],
      SVT: ["BORDAS SVT 2019 (1° spécialité)"],
      SES: ["HATIER SCIENCES ÉCONOMIQUES ET SOCIALES 2023 (1° spécialité)"],
      "HG-GEO-GEOPOL": ["NATHAN HISTOIRE-GÉOGRAPHIE-GÉOPOLITIQUE-SCIENCES POLITIQUES 2019 (1° spécialité)"],
    };
    const specItems = (specialites || []).flatMap((s) => bySpec[s] || []);
    const latinItems = latin ? ["HACHETTE Dictionnaire Latin-Français (Gaffiot Poche Top)"] : [];
    return [{ title: "Matériel obligatoire (1re — Général)", items: [...common, ...specItems, ...latinItems] }];
  }
  if (niveau === "Terminale" && track === "General") {
    const common = [
      "Magnard Philosophie 2020 (Terminale)",
      "Hachette Enseignement scientifique 2020 (Terminale)",
      "Hatier Histoire 2020 (Terminale)",
      "Hatier Géographie 2020 (Terminale)",
      "La Maison des Langues Blockbuster 2020 (Terminale)",
    ];
    const bySpec: Record<LyceeSpecialite, string[]> = {
      Maths: ["NATHAN HYPERBOLE — Maths spécialité 2020 (Terminale)"],
      "Physique-Chimie": ["HACHETTE PHYSIQUE-CHIMIE 2020 (Terminale spécialité)"],
      SVT: ["BORDAS SVT 2020 (Terminale spécialité)"],
      SES: ["MAGNARD Sciences économiques et sociales 2020 (Terminale spécialité)"],
      "HG-GEO-GEOPOL": ["HATIER Histoire-Géographie-Géopolitique-Sciences politiques 2020 (Terminale)"],
    };
    const specItems = (specialites || []).flatMap((s) => bySpec[s] || []);
    const latinItems = latin ? ["HACHETTE Dictionnaire Latin-Français (Gaffiot Poche Top) — 2008 (Multiples)"] : [];
    const lvbItems = langue === "Allemand" ? lvbAllemand : lvbEspagnol;
    return [{ title: "Matériel obligatoire (Terminale — Général)", items: [...common, ...lvbItems, ...specItems, ...latinItems] }];
  }
  if (track === "ST2S") {
    const items: string[] = [];
    if (niveau === "1re") {
      items.push(
        "I-MANUEL Physique-Chimie pour la Santé (livre + licence) 2019 (1° ST2S)",
        "La Maison des Langues Blockbuster 2019 (LVB)",
        "Hachette Histoire-Géographie-EMC 2019 (1° Tech)",
        "Delagrave Biologie & Physiopathologie humaines 2019 (1° ST2S)",
      );
    }
    if (niveau === "Terminale") {
      items.push(
        "La Maison des Langues Blockbuster 2020 (Terminale)",
        "Magnard Philosophie 2020 (Terminale Tech)",
        "I-MANUEL Histoire-Géographie-EMC 2020 (Terminale Tech)",
      );
      items.push(
        "Delagrave Biologie & Physiopathologie humaines 2020 (Terminale ST2S)",
        "NATHAN I-MANUEL Chimie (livre + licence) 2020 (Terminale ST2S)",
      );
    }
    return [{ title: `Matériel ST2S — ${niveau}`, items: [...items, langue === "Allemand" ? "LVB Allemand (selon votre PDF)" : "LVB Espagnol (selon votre PDF)"] }];
  }
  return [{ title: "À compléter", items: ["Liste non disponible pour ce cas dans l'extraction actuelle."] }];
}
export default function SimulateurFournituresEcoleCollegeLycee() {
  const [children, setChildren] = useState<Child[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("college");
  const [ecoleNiveau, setEcoleNiveau] = useState<EcoleNiveau>("CP");
  const [collegeNiveau, setCollegeNiveau] = useState<CollegeNiveau>("6e");
  const [collegeEbp, setCollegeEbp] = useState(false);
  const [collegeLangue, setCollegeLangue] = useState<LangueSeconde>("Allemand");
  const [collegeBilingueAllemand, setCollegeBilingueAllemand] = useState(false);
  const [collegeLatin, setCollegeLatin] = useState(false);
  const [collegeOse, setCollegeOse] = useState(false);
  const [lyceeNiveau, setLyceeNiveau] = useState<LyceeNiveau>("2nde");
  const [lyceeTrack, setLyceeTrack] = useState<LyceeTrack>("General");
  const [lyceeLangue, setLyceeLangue] = useState<LangueSeconde>("Allemand");
  const [lyceeAnglaisEuro, setLyceeAnglaisEuro] = useState(false);
  const [lyceeLatin, setLyceeLatin] = useState(false);
  const [lyceeSpecs, setLyceeSpecs] = useState<LyceeSpecialite[]>(["Maths"]);
  const lyceeSpecOptions: LyceeSpecialite[] = ["Maths", "Physique-Chimie", "SVT", "SES", "HG-GEO-GEOPOL"];
  const computed = useMemo(() => {
    const withSupplies = children.map((c) => {
      const supplies = c.stage === "ecole" ? getEcoleSupplies(c.niveau) : c.stage === "college" ? getCollegeSupplies(c) : getLyceeSupplies(c);
      return { child: c, supplies };
    });
    const allItems = withSupplies.flatMap((x) => x.supplies.flatMap((s) => s.items));
    const allDedupe = dedupeStrings(allItems);
    const suppliesByChild = Object.fromEntries(withSupplies.map((x) => [x.child.id, x.supplies]));
    return { withSupplies, allItems, allDedupe, suppliesByChild };
  }, [children]);
  const resetAddForm = () => {
    setStage("college");
    setEcoleNiveau("CP");
    setCollegeNiveau("6e");
    setCollegeEbp(false);
    setCollegeLangue("Allemand");
    setCollegeBilingueAllemand(false);
    setCollegeLatin(false);
    setCollegeOse(false);
    setLyceeNiveau("2nde");
    setLyceeTrack("General");
    setLyceeLangue("Allemand");
    setLyceeAnglaisEuro(false);
    setLyceeLatin(false);
    setLyceeSpecs(["Maths"]);
  };
  const addChild = () => {
    if (stage === "ecole") {
      setChildren((prev) => [...prev, { id: uid(), stage: "ecole", niveau: ecoleNiveau }]);
      setShowAdd(false);
      return;
    }
    if (stage === "college") {
      const safeEbp = collegeNiveau === "3e" ? false : collegeEbp;
      const safeLangue: LangueSeconde = collegeNiveau === "6e" ? "Allemand" : collegeLangue;
      const safeLatin = collegeNiveau === "6e" ? false : collegeLatin;
      const safeOse = collegeNiveau === "3e" ? collegeOse : false;
      setChildren((prev) => [
        ...prev,
        {
          id: uid(),
          stage: "college",
          niveau: collegeNiveau,
          ebp: safeEbp,
          langue: safeLangue,
          optionBilingueAllemand: collegeBilingueAllemand,
          optionLatin: safeLatin,
          optionOse: safeOse,
        },
      ]);
      setShowAdd(false);
      return;
    }
    const maxSpecs = lyceeNiveau === "Terminale" ? 1 : lyceeNiveau === "1re" ? 2 : 0;
    const specs = maxSpecs === 0 ? [] : lyceeSpecs.slice(0, maxSpecs);
    setChildren((prev) => [
      ...prev,
      {
        id: uid(),
        stage: "lycee",
        niveau: lyceeNiveau,
        track: lyceeTrack,
        langue: lyceeLangue,
        anglaisEuro: lyceeAnglaisEuro,
        latin: lyceeLatin && lyceeTrack === "General",
        specialites: specs,
      },
    ]);
    setShowAdd(false);
  };
  const removeChild = (id: string) => { setChildren((prev) => prev.filter((c) => c.id !== id))};
  const sendByEmail = async () => {
    setEmailError(null);
    setEmailSuccess(null);
    const target = email.trim();
    if (children.length === 0) {
      setEmailError("Ajoutez au moins un enfant.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setEmailError("Adresse email invalide.");
      return;
    }
    try {
      setSendingEmail(true);
      const res = await fetch("/api/supplies/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: target,
          children,
          suppliesByChild: computed.suppliesByChild,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailError(data?.error || "Échec de l'envoi.");
        return;
      }
      setEmailSuccess("Email envoyé (PDF en pièce jointe).");
    } catch (e: any) {
      setEmailError(e?.message || "Échec de l'envoi.");
    } finally {
      setSendingEmail(false);
    }
  };
  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-6 md:p-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-[240px]">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900">Simulateur Fournitures — École · Collège · Lycée</h2>
              <p className="text-sm font-bold text-blue-600 mt-2">{SCHOOL.shortName} • Rentrée 2026/2027</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (children.length === 0) return alert("Ajoutez au moins un enfant.");
                  window.print();
                }}
                className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition print:hidden"
              >
                🖨️ Imprimer
              </button>
              <button
                onClick={() => {
                  setEmailError(null);
                  setEmailSuccess(null);
                  setShowEmail(true);
                }}
                className="bg-white text-indigo-700 border border-indigo-200 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition print:hidden"
              >
                ✉️ Envoyer par email
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vos enfants</p>
                <div className="mt-3 space-y-3">
                  {children.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Aucun enfant ajouté pour le moment.</p>
                  ) : (
                    children.map((c) => (
                      <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-800 text-sm">{formatChildLabel(c)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeChild(c.id)}
                            className="text-red-500 font-black px-2 py-1 rounded-lg hover:bg-red-50"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  className="mt-4 w-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-black px-4 py-3 rounded-2xl hover:bg-indigo-100 transition print:hidden"
                >
                  + Ajouter un enfant
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Détails par enfant</p>
                <div className="mt-4 space-y-6">
                  {computed.withSupplies.map(({ child, supplies }) => (
                    <div key={child.id} className="border border-slate-100 rounded-2xl p-4">
                      <h3 className="font-black text-slate-900 text-sm">{formatChildLabel(child)}</h3>
                      <div className="mt-3 space-y-4">
                        {supplies.map((sec, i) => (
                          <div key={`${sec.title}_${i}`}>
                            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700">{sec.title}</p>
                            <ul className="mt-2 space-y-1">
                              {sec.items.map((it, idx) => (
                                <li key={`${it}_${idx}`} className="text-sm text-slate-700 leading-relaxed">
                                  <span
                                    aria-hidden
                                    className="inline-block w-3 h-3 mr-2 align-middle border border-slate-400 rounded-[2px]"
                                  />
                                  {it}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {showEmail && (
            <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4 print:hidden">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Envoyer la liste par email</h3>
                    <p className="text-sm text-slate-500 mt-1">Vous recevrez un PDF en pièce jointe.</p>
                  </div>
                  <button
                    onClick={() => setShowEmail(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl font-black"
                    aria-label="Fermer"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adresse email</span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: parent@gmail.com"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </label>
                  {emailError && (
                    <div className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      {emailError}
                    </div>
                  )}
                  {emailSuccess && (
                    <div className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                      {emailSuccess}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowEmail(false)}
                      className="px-5 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 border border-slate-200"
                      disabled={sendingEmail}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={sendByEmail}
                      className="px-5 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showAdd && (
            <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Ajouter un enfant</h3>
                    <p className="text-sm text-slate-500 mt-1">Choisissez le niveau puis confirmez.</p>
                  </div>
                  <button onClick={() => { setShowAdd(false); resetAddForm(); }} className="text-slate-400 hover:text-slate-600 text-2xl font-black">
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(
                    [
                      ["ecole", "École"],
                      ["college", "Collège"],
                      ["lycee", "Lycée"],
                    ] as Array<[Stage, string]>
                  ).map(([s, label]) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStage(s)}
                      className={`px-4 py-3 rounded-2xl font-black border transition ${
                        stage === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-5 space-y-6">
                  {stage === "ecole" && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Niveau</p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            { value: "JE1MMEBAYEL", label: "JE1 Mme BAYEL" },
                            { value: "JE2MMECARTIER", label: "JE2 Mme CARTIER" },
                            { value: "JE3MMEDOUGHTY", label: "JE3 Mme DOUGHTY" },
                            { value: "JE4", label: "JE4" },
                            { value: "CP", label: "CP" },
                            { value: "CE1", label: "CE1" },
                            { value: "CE2", label: "CE2" },
                            { value: "CM1", label: "CM1" },
                            { value: "CM2", label: "CM2" },
                          ] as Array<{ value: EcoleNiveau; label: string }>
                        ).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setEcoleNiveau(value)}
                            className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                              ecoleNiveau === value ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {stage === "college" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Niveau</p>
                        <div className="flex flex-wrap gap-2">
                          {(["6e", "5e", "4e", "3e"] as CollegeNiveau[]).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setCollegeNiveau(n)}
                              className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                collegeNiveau === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      {collegeNiveau !== "3e" ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option E.B.P (si concerné)</p>
                          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-indigo-600"
                              checked={collegeEbp}
                              onChange={(e) => setCollegeEbp(e.target.checked)}
                            />
                            <span className="font-bold text-sm text-slate-800">{collegeEbp ? "E.B.P : OUI" : "E.B.P : NON"}</span>
                          </label>
                        </div>
                      ) : null}
                      {collegeNiveau === "6e" ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option bilingue allemand</p>
                          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-indigo-600"
                              checked={collegeBilingueAllemand}
                              onChange={(e) => setCollegeBilingueAllemand(e.target.checked)}
                            />
                            <span className="font-bold text-sm text-slate-800">
                              {collegeBilingueAllemand ? "Bilingue allemand : OUI" : "Bilingue allemand : NON"}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Langue (LV2)</p>
                          <div className="flex flex-wrap gap-2">
                            {(["Espagnol", "Allemand"] as LangueSeconde[]).map((l) => {
                              return (
                                <button
                                  key={l}
                                  type="button"
                                  onClick={() => setCollegeLangue(l)}
                                  className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                    collegeLangue === l ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                                  }`}
                                >
                                  {l}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {collegeNiveau !== "6e" && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option Latin</p>
                          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-indigo-600"
                              checked={collegeLatin}
                              onChange={(e) => setCollegeLatin(e.target.checked)}
                            />
                            <span className="font-bold text-sm text-slate-800">{collegeLatin ? "Latin : OUI" : "Latin : NON"}</span>
                          </label>
                        </div>
                      )}
                      {collegeNiveau === "3e" && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option OSE</p>
                          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-indigo-600"
                              checked={collegeOse}
                              onChange={(e) => setCollegeOse(e.target.checked)}
                            />
                            <span className="font-bold text-sm text-slate-800">{collegeOse ? "OSE : OUI" : "OSE : NON"}</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {stage === "lycee" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Niveau</p>
                        <div className="flex flex-wrap gap-2">
                          {(["2nde", "1re", "Terminale"] as LyceeNiveau[]).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setLyceeNiveau(n)}
                              className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                lyceeNiveau === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filière</p>
                        <div className="flex flex-wrap gap-2">
                          {(["General", "ST2S"] as LyceeTrack[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setLyceeTrack(t)}
                              className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                lyceeTrack === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                              }`}
                            >
                              {t === "General" ? "Général" : "ST2S"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">LVB</p>
                        <div className="flex flex-wrap gap-2">
                          {(["Allemand", "Espagnol"] as LangueSeconde[]).map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setLyceeLangue(l)}
                              className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                lyceeLangue === l ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      {lyceeNiveau === "2nde" && (
                        <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                          <input
                            type="checkbox"
                            className="w-5 h-5 accent-indigo-600"
                            checked={lyceeAnglaisEuro}
                            onChange={(e) => setLyceeAnglaisEuro(e.target.checked)}
                          />
                          <span className="font-bold text-sm text-slate-800">Anglais Section Euro (option)</span>
                        </label>
                      )}
                      {lyceeTrack === "General" && (lyceeNiveau === "1re" || lyceeNiveau === "Terminale") && (
                        <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                          <input
                            type="checkbox"
                            className="w-5 h-5 accent-indigo-600"
                            checked={lyceeLatin}
                            onChange={(e) => setLyceeLatin(e.target.checked)}
                          />
                          <span className="font-bold text-sm text-slate-800">Option Latin (si concerné)</span>
                        </label>
                      )}
                      {lyceeTrack === "General" && lyceeNiveau !== "2nde" && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {lyceeNiveau === "1re" ? "Choisissez jusqu’à 2 spécialités" : "Choisissez 1 spécialité"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {lyceeSpecOptions.map((s) => {
                              const max = lyceeNiveau === "Terminale" ? 1 : 2;
                              const selected = lyceeSpecs.includes(s);
                              const disabled = !selected && lyceeSpecs.length >= max;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => {
                                    setLyceeSpecs((prev) => {
                                      const has = prev.includes(s);
                                      if (has) return prev.filter((x) => x !== s);
                                      return [...prev, s];
                                    });
                                  }}
                                  className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                    selected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                                  } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button  onClick={() => { setShowAdd(false); resetAddForm();}}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition print:hidden"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={addChild}
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition print:hidden"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            /* Masque les widgets flottants externes (IA/assistant/chat) */
            [aria-label*="IA" i],
            [aria-label*="assistant" i],
            [title*="IA" i],
            [title*="assistant" i],
            iframe[title*="assistant" i],
            iframe[title*="chat" i] {
              display: none !important;
              visibility: hidden !important;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

