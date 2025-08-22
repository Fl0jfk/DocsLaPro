"use client";

import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QRCreator() {
  const [url, setUrl] = useState("https://laprovidence-nicolasbarre.fr/");
  const [logo, setLogo] = useState<string | null>(null);
  const [fillColor, setFillColor] = useState("#000000");
  const [backColor, setBackColor] = useState("#ffffff"); 
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const generateQRCodeWithLogo = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        QRCode.toCanvas(
          canvas, 
          url, 
          { width: 256, errorCorrectionLevel: 'H', color: { dark: fillColor, light: backColor }, margin: 4 },
          (error) => {
            if (error) console.error(error);
            if (logo) {
              const logoImg = new Image();
              logoImg.src = logo;
              logoImg.onload = () => {
                const qrSize = canvas.width;
                const logoSize = qrSize / 4;
                const x = (qrSize - logoSize) / 2;
                const y = (qrSize - logoSize) / 2;
                ctx.drawImage(logoImg, x, y, logoSize, logoSize);
              };
            }
          }
        );
      }
    }
  };
  useEffect(() => {
    generateQRCodeWithLogo();
  }, [url, logo, fillColor, backColor]);
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file); 
    }
  };
  const handleDownloadQRCode = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/png"); 
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "qr_code_avec_logo.png";
      link.click();
    }
  };
  return (
    <main className='sm:pt-[13vh] md:pt-[13vh] p-4 flex flex-col gap-4 max-w-[1000px] mx-auto'>
      <h1 className='text-4xl'>Création de QR Code</h1>
      <div className="mt-4">
        <label htmlFor="url" className="block text-lg">Adresse URL :</label>
        <input type="text" id="url"  value={url}  onChange={handleUrlChange} className="mt-2 p-2 border border-gray-300 rounded-xl w-full" placeholder="Entrez l'adresse URL"/>
      </div>
      <div className="mb-4">
        <label htmlFor="logo" className="block text-lg">Télécharger un logo :</label>
        <input type="file" id="logo" onChange={handleLogoUpload} className="mt-2 p-2 border border-gray-300 rounded-xl w-full" accept="image/*"/>
      </div>
      <div className="flex items-center gap-4">
        <label htmlFor="fillColor" className="block text-lg">Couleur du QR Code :</label>
        <input type="color" id="fillColor" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="p-2 border border-gray-300 rounded-xl" style={{ backgroundColor: fillColor }}/>
      </div>
      <div className="flex items-center gap-4">
        <label htmlFor="backColor" className="block text-lg">Couleur de fond :</label>
        <input type="color" id="backColor" value={backColor} onChange={(e) => setBackColor(e.target.value)} style={{ backgroundColor: backColor }} className="p-2 border border-gray-300 rounded-xl"/>
      </div>
      <canvas ref={canvasRef} width={256} height={256} className='self-center'/>
      <button onClick={handleDownloadQRCode} className="mt-4 bg-green-500 text-white p-2 rounded-xl">Télécharger le QR code</button>
    </main>
  );
}