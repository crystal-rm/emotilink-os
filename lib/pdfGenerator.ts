import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFOptions {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

export async function generatePDFFromContent(
  content: string,
  options: PDFOptions
): Promise<Blob> {
  // Create a temporary container for the content
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '210mm'; // A4 width
  tempContainer.style.padding = '20mm';
  tempContainer.style.fontFamily = 'Arial, sans-serif';
  tempContainer.style.fontSize = '12px';
  tempContainer.style.lineHeight = '1.6';
  tempContainer.style.color = '#000';
  tempContainer.style.backgroundColor = '#fff';
  
  // Convert markdown to HTML (basic conversion)
  const htmlContent = convertMarkdownToHTML(content);
  tempContainer.innerHTML = htmlContent;
  
  document.body.appendChild(tempContainer);
  
  try {
    // Generate canvas from the content
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.offsetWidth,
      height: tempContainer.offsetHeight,
    });
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    // Add first page
    pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Set document properties
    pdf.setProperties({
      title: options.title,
      author: options.author || 'EmotiLink OS',
      subject: options.subject || 'Documentation',
      keywords: options.keywords || 'documentation, emotilink',
    });
    
    // Generate blob
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } finally {
    // Clean up
    document.body.removeChild(tempContainer);
  }
}

function convertMarkdownToHTML(markdown: string): string {
  // Basic markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // Wrap in paragraphs
  html = '<p>' + html + '</p>';
  
  // Wrap lists
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  
  // Add basic styling
  html = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      h1 { font-size: 24px; font-weight: bold; margin: 20px 0 10px 0; color: #000; }
      h2 { font-size: 20px; font-weight: bold; margin: 18px 0 8px 0; color: #000; }
      h3 { font-size: 16px; font-weight: bold; margin: 16px 0 6px 0; color: #000; }
      p { margin: 8px 0; }
      ul { margin: 8px 0; padding-left: 20px; }
      li { margin: 4px 0; }
      code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
      pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
      pre code { background: none; padding: 0; }
      a { color: #0066cc; text-decoration: underline; }
      strong { font-weight: bold; }
      em { font-style: italic; }
    </style>
    ${html}
  `;
  
  return html;
}

export async function downloadPDF(content: string, filename: string, options: PDFOptions): Promise<void> {
  try {
    const pdfBlob = await generatePDFFromContent(content, options);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}
