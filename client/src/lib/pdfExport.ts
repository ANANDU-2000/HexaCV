import { Resume } from '@shared/types';

/**
 * Export resume to PDF
 * Note: In production, you would use jsPDF + html2canvas
 * For now, this is a placeholder that uses browser print functionality
 */
export async function exportResumeToPDF(resumeElement: HTMLElement, fileName: string = 'resume.pdf') {
  const originalZoom = resumeElement.style.zoom;
  let captureHost: HTMLDivElement | null = null;
  try {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Capture a temporary clone at normal coordinates; very large offscreen positions can stall html2canvas.
    captureHost = document.createElement('div');
    captureHost.style.position = 'fixed';
    captureHost.style.left = '0';
    captureHost.style.top = '0';
    captureHost.style.width = '210mm';
    captureHost.style.minHeight = '297mm';
    captureHost.style.pointerEvents = 'none';
    captureHost.style.zIndex = '-1';
    captureHost.style.background = '#ffffff';

    const captureElement = resumeElement.cloneNode(true) as HTMLElement;
    captureElement.removeAttribute('id');
    captureElement.style.zoom = '1';
    captureElement.style.transform = 'none';
    captureHost.appendChild(captureElement);
    document.body.appendChild(captureHost);

    // Wait a brief tick for browser layout rendering before measuring
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Dynamic Pagination Algorithm
    let elementWidth = captureElement.getBoundingClientRect().width;
    if (!elementWidth || elementWidth === 0) {
      elementWidth = 794; // Fallback to standard A4 pixel width at 96 DPI
    }
    const pxPageHeight = (elementWidth * 297) / 210;
    
    let shifted = true;
    let attempts = 0;
    
    while (shifted && attempts < 50) {
      shifted = false;
      attempts++;
      
      const elementsToAvoid = Array.from(captureElement.querySelectorAll('.pdf-avoid-break')) as HTMLElement[];
      const baseTop = captureElement.getBoundingClientRect().top;
      
      for (const el of elementsToAvoid) {
        if (el.dataset.pdfSpacer === 'true') continue;
        
        const rect = el.getBoundingClientRect();
        const relativeTop = rect.top - baseTop;
        const relativeBottom = rect.bottom - baseTop + 10; // 10px safety padding buffer
        
        const pageIndex = Math.floor(relativeTop / pxPageHeight);
        const nextPageBoundary = (pageIndex + 1) * pxPageHeight;
        
        // If element crosses the page boundary
        if (relativeBottom > nextPageBoundary) {
          // Skip if element is taller than a full page
          if (rect.height >= pxPageHeight) continue;
          
          const spacerHeight = nextPageBoundary - relativeTop;
          if (spacerHeight > 0 && spacerHeight < pxPageHeight) {
            const spacer = document.createElement('div');
            spacer.style.height = `${spacerHeight}px`;
            spacer.style.minHeight = `${spacerHeight}px`;
            spacer.style.flexShrink = '0';
            spacer.style.display = 'block';
            spacer.style.width = '100%';
            spacer.className = 'pdf-spacer';
            spacer.dataset.pdfSpacer = 'true';
            
            el.parentNode?.insertBefore(spacer, el);
            shifted = true;
            break; // Restart loop to re-measure positions
          }
        }
      }
    }

    // Render HTML to canvas
    const canvas = await html2canvas(captureElement, {
      scale: 2, // High resolution scaling
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Scale image to fill exactly the width of the page (A4)
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add subsequent pages if there's significant overflow (with 15mm tolerance to avoid trailing blank page)
    while (heightLeft > 15) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    downloadBlob(pdf.output('blob') as Blob, fileName);
  } catch (error) {
    console.error('Failed to export PDF:', error);
    // Fallback to print window if canvas rendering fails
    window.print();
  } finally {
    resumeElement.style.zoom = originalZoom;
    captureHost?.remove();
  }
}

/**
 * Generate a downloadable PDF using canvas rendering
 * This is an alternative approach that doesn't require user interaction
 */
export async function generatePDFFromHTML(
  htmlElement: HTMLElement,
  fileName: string = 'resume.pdf'
): Promise<void> {
  try {
    // Check if jsPDF is available
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Render HTML to canvas
    const canvas = await html2canvas(htmlElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions
    const imgWidth = pageWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    // Add image to PDF, handling multiple pages if needed
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 15) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    // Download the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Fallback to print dialog
    window.print();
  }
}

/**
 * Create a blob URL for the PDF
 */
export async function createPDFBlob(htmlElement: HTMLElement): Promise<Blob> {
  try {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Render HTML to canvas
    const canvas = await html2canvas(htmlElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 15) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    // Convert to blob
    return pdf.output('blob') as Blob;
  } catch (error) {
    console.error('Failed to create PDF blob:', error);
    throw error;
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export resume to DOCX (Microsoft Word format via styled HTML-mime-type envelope)
 */
export async function exportResumeToDOCX(element: HTMLElement, fileName: string = 'resume.docx') {
  try {
    const contentHtml = element.innerHTML;
    
    // CSS that Word will parse and apply to match our emerald ATS single-column design
    const css = `
      @page {
        size: 8.5in 11in;
        margin: 0.5in;
      }
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.3;
        color: #1f2937;
      }
      h1 {
        font-size: 22pt;
        font-weight: bold;
        color: #065f46;
        text-align: center;
        margin-bottom: 2pt;
        margin-top: 0px;
      }
      p {
        font-size: 10pt;
        margin-top: 2pt;
        margin-bottom: 2pt;
        color: #1f2937;
      }
      a {
        color: #047857;
        text-decoration: none;
      }
      hr {
        border: none;
        border-top: 2px solid #047857;
        margin-top: 6pt;
        margin-bottom: 8pt;
      }
      h2 {
        font-size: 10pt;
        font-weight: bold;
        color: #047857;
        text-transform: uppercase;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 1pt;
        margin-top: 12pt;
        margin-bottom: 6pt;
      }
      h3 {
        font-size: 10pt;
        font-weight: bold;
        color: #111827;
        margin: 0;
      }
      ul {
        margin-top: 2pt;
        margin-bottom: 4pt;
        padding-left: 15pt;
      }
      li {
        font-size: 9.5pt;
        margin-bottom: 2pt;
        color: #374151;
      }
      .text-emerald-800 {
        color: #065f46 !important;
      }
      .text-emerald-700 {
        color: #047857 !important;
      }
      .text-emerald-600 {
        color: #059669 !important;
      }
      .text-gray-900 {
        color: #111827 !important;
      }
      .text-gray-800 {
        color: #1f2937 !important;
      }
      .text-gray-700 {
        color: #374151 !important;
      }
      .text-gray-600 {
        color: #4b5563 !important;
      }
      .text-gray-500 {
        color: #6b7280 !important;
      }
      .italic {
        font-style: italic;
      }
      .font-bold {
        font-weight: bold;
      }
      .uppercase {
        text-transform: uppercase;
      }
    `;

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>${fileName}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            ${css}
          </style>
        </head>
        <body>
          <div class="WordSection1">
            ${contentHtml}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlString], {
      type: 'application/msword;charset=utf-8'
    });

    const finalFileName = fileName.endsWith('.doc') || fileName.endsWith('.docx') ? fileName : `${fileName}.doc`;
    downloadBlob(blob, finalFileName);
  } catch (error) {
    console.error('Failed to export DOCX:', error);
    throw error;
  }
}
