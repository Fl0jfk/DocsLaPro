"use client"

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function InventoryPage() {
  type InventoryItem = { code: string; fournisseurs: string; type: string; date_achat: string; prix_unitaire: number; quantité: number;};
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});
  const [temporaryInventory, setTemporaryInventory] = useState<Record<string, InventoryItem>>({});
  const [scannedCodeAdd, setScannedCodeAdd] = useState<string>(""); 
  const [scannedCodeRemove, setScannedCodeRemove] = useState<string>("");
  const [newItem, setNewItem] = useState({ code: "",fournisseurs:"" ,type: "", date_achat: "", prix_unitaire: 0, quantité: 0});
  const [localChanges, setLocalChanges] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [password, setPassword] = useState<string>(""); 
  const [isPasswordCorrect, setIsPasswordCorrect] = useState<boolean>(false); 
  const [modificationsInProgress, setModificationsInProgress] = useState<InventoryItem[]>([]);
  const [userName, setUserName] = useState("");
  const startScanner = (setCodeFunction: (code: string) => void) => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
    scanner.render(
      (decodedText) => {
        setCodeFunction(decodedText);
        scanner.clear();
        document.getElementById("reader")!.innerHTML = "";
      },
      (errorMessage) => {
        console.warn(errorMessage);
      }
    );
  };
  const generateBarcode = (code: string) => {
    const codesPerPage = 27;
    const codes = Array(codesPerPage).fill(code);
    const newWindow = window.open("", "_blank");
    if (!newWindow) return;
    newWindow.document.write(`
      <html>
        <head>
          <title>Impression Codes-Barres</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 0; }
            .container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; width: 100%; margin: 10mm auto; }
            .barcode-item { display: flex; justify-content: center; align-items: center; height: 33mm; }
            canvas { width: 50mm; height: 15mm; }
            @media print {
              @page { size: A4; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${codes.map(() => `<div class="barcode-item"><canvas class="barcode"></canvas></div>`).join("")}
          </div>
          <script>
            window.onload = function() {
              document.querySelectorAll(".barcode").forEach(canvas => {
                JsBarcode(canvas, "${code}", { format: "CODE128", displayValue: false });
              });
              setTimeout(() => { window.print(); }, 500); // Attente pour l'affichage avant impression
            };
          </script>
        </body>
      </html>
    `);
    newWindow.document.close();
  };
  console.log(inventory)
  console.log(isPasswordCorrect)
  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data: Record<string, InventoryItem>) => {
        setInventory(data);
        setTemporaryInventory(data);
      })
      .catch((err) => {
        console.error("Erreur de chargement du JSON", err);
      });
  }, []);  
  const handleScanAdd = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const code = scannedCodeAdd.trim();
    if (!code) return;
    const updatedInventory = { ...temporaryInventory };
    if (updatedInventory[code]) {
      updatedInventory[code].quantité += 1;
      setErrorMessage("");
      setTemporaryInventory(updatedInventory);
    } else {
      setErrorMessage("L'objet n'existe pas dans l'inventaire");
      return;
    }
    setModificationsInProgress((prev) => {
      const existingIndex = prev.findIndex((mod) => mod.code === code);
      if (existingIndex !== -1) {
        return prev.map((mod, index) =>
          index === existingIndex ? { ...mod, quantité: mod.quantité + 1 } : mod
        );
      } else {
        return [...prev, { code,fournisseurs : updatedInventory[code].fournisseurs, type: updatedInventory[code].type, date_achat: updatedInventory[code].date_achat, prix_unitaire: updatedInventory[code].prix_unitaire, quantité: 1 }];
      }
    });    
    setScannedCodeAdd(""); 
    setLocalChanges(true);
  };
  const handleScanRemove = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const code = scannedCodeRemove.trim();
    if (!code) return;
    const updatedInventory = { ...temporaryInventory };
    if (updatedInventory[code]) {
      if (updatedInventory[code].quantité > 0) {
        updatedInventory[code].quantité -= 1;
        setErrorMessage("");
        setTemporaryInventory(updatedInventory);
        setModificationsInProgress((prev: InventoryItem[]) => {
          const existingIndex = prev.findIndex((mod) => mod.code === code);
          if (existingIndex !== -1) {
            return prev.map((mod, index) =>
              index === existingIndex ? { ...mod, quantité: mod.quantité - 1 } : mod
            );
          } else {
            const itemFournisseurs = updatedInventory[code]?.fournisseurs || "Fournisseurs inconnu";
            const itemType = updatedInventory[code]?.type || "Type inconnu";
            const dateAchat = updatedInventory[code]?.date_achat || "Inconnue";
            const prixUnitaire = updatedInventory[code]?.prix_unitaire || 0;
            return [...prev, { code,fournisseurs:itemFournisseurs, type: itemType, date_achat: dateAchat, prix_unitaire: prixUnitaire, quantité: -1 }];
          }
        });
      } else {
        setErrorMessage("Quantité de l'objet déjà à zéro, ne peut pas être retiré");
      }
    } else {
      setErrorMessage("L'objet n'existe pas dans l'inventaire");
    }
    setScannedCodeRemove("");
    setLocalChanges(true);
  };
  const handleNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.code && newItem.type && newItem.date_achat && newItem.prix_unitaire) {
      const updatedInventory = { ...temporaryInventory, [newItem.code]: newItem };
      setTemporaryInventory(updatedInventory);
      setNewItem({ code: "",fournisseurs:"", type: "", date_achat: "", prix_unitaire: 0, quantité: 0 });
      setLocalChanges(true);
    } else {
      console.error("Veuillez remplir tous les champs");
    }
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  const handleConfirmChanges = async () => {
    if (password === "LaProNB76240" && userName.trim() !== "") {
      setIsPasswordCorrect(true);
      try {
        const res = await fetch("/api/inventory", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inventory: temporaryInventory,  userName,  password, modificationsInProgress}),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erreur inconnue");
        }
        setInventory(temporaryInventory);
        setTemporaryInventory(temporaryInventory);
        alert("Inventaire mis à jour avec succès !");
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Erreur lors de la mise à jour de l'inventaire:", error.message);
          alert(`Erreur lors de la mise à jour : ${error.message}`);
        } else {
          console.error("Erreur inconnue", error);
          alert("Erreur inconnue lors de la mise à jour de l'inventaire.");
        }
      }
    } else {
      alert("Veuillez entrer le mot de passe et le nom de l'utilisateur.");
    }
  };
  const exportInventory = () => {
    fetch("https://docslapro.s3.eu-west-3.amazonaws.com/Stocks/inventory.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors du téléchargement du fichier");
        }
        return response.json();
      })
      .then((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "inventory.json";
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Erreur de téléchargement :", err);
      });
  };
  return (
    <main className="p-4 max-w-2xl mx-auto sm:pt-[13vh] md:pt-[13vh]">
      <h1 className="text-xl font-bold mb-4">Gestion de l&apos;Inventaire</h1>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <div className="relative">
  <input type="text" value={scannedCodeAdd} onChange={(e) => setScannedCodeAdd(e.target.value)} onKeyUp={handleScanAdd} placeholder="Scannez un code-barres pour ajouter" className="border p-2 w-full mb-2"/>
  <button type="button" onClick={() => startScanner(setScannedCodeAdd)} className="bg-gray-500 text-white p-2 rounded w-full mt-2">Scanner avec l&apos;appareil photo</button>
  <div id="reader" className="mt-2"></div> {/* Scanner UI */}
</div>
<div className="relative">
  <input type="text" value={scannedCodeRemove} onChange={(e) => setScannedCodeRemove(e.target.value)} onKeyUp={handleScanRemove} placeholder="Scannez un code-barres pour retirer" className="border p-2 w-full mb-2"/>
  <button type="button" onClick={() => startScanner(setScannedCodeRemove)} className="bg-gray-500 text-white p-2 rounded w-full mt-2">Scanner avec l&apos;appareil photo</button>
  <div id="reader" className="mt-2"></div> {/* Scanner UI */}
</div>
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse border border-gray-300 mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Code-barres</th>
              <th className="border p-2">Fournisseurs</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Date d&apos;achat</th>
              <th className="border p-2">Prix (€)</th>
              <th className="border p-2">Quantité</th>
              <th className="border p-2">Imprimer Code-Barres</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(temporaryInventory).map(([code, data]) => {
              return (
                <tr key={code} className="text-center">
                  <td className="border p-2">{code}</td>
                  <td className="border p-2">{data.fournisseurs}</td>
                  <td className="border p-2">{data.type}</td>
                  <td className="border p-2">{data.date_achat}</td>
                  <td className="border p-2">{data.prix_unitaire}</td>
                  <td className="border p-2">{data.quantité}</td>
                  <td className="border p-2"><button onClick={() => generateBarcode(code)} className="bg-blue-500 text-white px-2 py-1 rounded">Imprimer</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modificationsInProgress.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Modifications en cours</h2>
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse border border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Code-barres</th>
                  <th className="border p-2">Fournisseurs</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Date d&apos;achat</th>
                  <th className="border p-2">Prix (€)</th>
                  <th className="border p-2">Quantité</th>
                </tr>
              </thead>
              <tbody>
                {modificationsInProgress.map((mod, index) => (
                  <tr key={index} className="text-center">
                    <td className="border p-2">{mod.code}</td>
                    <td className="border p-2">{mod.fournisseurs}</td>
                    <td className="border p-2">{mod.type}</td>
                    <td className="border p-2">{mod.date_achat}</td>
                    <td className="border p-2">{mod.prix_unitaire}</td>
                    <td className="border p-2">{mod.quantité}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <form onSubmit={handleNewItemSubmit} className="mb-4">
  <h2 className="text-lg font-semibold mb-2">Ajouter un nouveau mobilier</h2>
  <div className="space-y-2">
    <div>
      <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code-barres</label>
      <input id="code" type="text" placeholder="Code-barres" value={newItem.code} onChange={(e) => setNewItem({ ...newItem, code: e.target.value })} className="border p-2 w-full"/>
    </div>
    <div>
      <label htmlFor="fournisseurs" className="block text-sm font-medium text-gray-700">Fournisseurs</label>
      <input id="fournisseurs" type="text" placeholder="Fournisseurs" value={newItem.type} onChange={(e) => setNewItem({ ...newItem, fournisseurs: e.target.value })} className="border p-2 w-full"/>
    </div>
    <div>
      <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
      <input id="type" type="text" placeholder="Type" value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}className="border p-2 w-full"/>
    </div>
    <div>
      <label htmlFor="date_achat" className="block text-sm font-medium text-gray-700">Date d&apos;achat</label>
      <input id="date_achat" type="date" placeholder="Date d'achat" value={newItem.date_achat} onChange={(e) => setNewItem({ ...newItem, date_achat: e.target.value })} className="border p-2 w-full"/>
    </div>
    <div>
      <label htmlFor="prix_unitaire" className="block text-sm font-medium text-gray-700">Prix (€)</label>
      <input id="prix_unitaire" type="number" placeholder="Prix (€)" value={newItem.prix_unitaire}  onChange={(e) => setNewItem({ ...newItem, prix_unitaire: +e.target.value })} className="border p-2 w-full"/>
    </div>
  </div>
  <button type="submit" className="mt-4 p-2 bg-green-500 text-white rounded-xl">Ajouter le mobilier</button>
</form>
      {localChanges && (
        <div className="mb-4">
          <input  type="text"  placeholder="Entrez votre nom"  value={userName}  onChange={(e) => setUserName(e.target.value)}  className="border p-2 w-full" />
          <input type="password" placeholder="Entrez le mot de passe pour valider" value={password} onChange={handlePasswordChange} className="border p-2 w-full"/>
          <button onClick={handleConfirmChanges} className="mt-4 p-2 bg-blue-500 text-white rounded-xl">Valider les changements</button>
        </div>
      )}
      <button onClick={exportInventory} className="mt-4 p-2 bg-yellow-500 text-white rounded-xl">Télécharger les stocks sur le serveur</button>
    </main>
  );
}