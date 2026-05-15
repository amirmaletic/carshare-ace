import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Rendert een DOM-element naar een PDF (A4) en geeft base64 (zonder data: prefix) terug.
 */
export async function elementToPdfBase64(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = canvas.width / pageWidth;
  const imgHeight = canvas.height / ratio;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // dataurlstring → strip 'data:application/pdf;base64,'
  const dataUri = pdf.output("datauristring");
  return dataUri.split(",")[1];
}