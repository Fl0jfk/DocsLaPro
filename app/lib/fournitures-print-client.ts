/** Ouvre la boîte d'impression du navigateur pour un PDF (blob). */
export function printPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none";

  const cleanup = () => {
    URL.revokeObjectURL(url);
    iframe.remove();
  };

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      return;
    }

    const onAfterPrint = () => {
      win.removeEventListener("afterprint", onAfterPrint);
      cleanup();
    };
    win.addEventListener("afterprint", onAfterPrint);

    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        cleanup();
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }, 150);

    // Repli si afterprint n'est pas déclenché (certains navigateurs)
    window.setTimeout(() => {
      if (document.body.contains(iframe)) cleanup();
    }, 120_000);
  };

  iframe.src = url;
  document.body.appendChild(iframe);
}
