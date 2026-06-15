import { jsPDF } from "jspdf";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  conversation_id?: string;
}

interface ExportOptions {
  conversationId?: string | null;
  conversationTitle?: string;
  userName?: string;
}

// PDF styling constants
const COLORS = {
  primary: { r: 59, g: 130, b: 246 },
  secondary: { r: 75, g: 85, b: 99 },
  text: { r: 31, g: 41, b: 55 },
  muted: { r: 107, g: 114, b: 128 },
  border: { r: 229, g: 231, b: 235 },
  codeBg: { r: 243, g: 244, b: 246 },
  headerBg: { r: 249, g: 250, b: 251 },
};

const FONTS = {
  title: 18,
  subtitle: 12,
  heading: 11,
  body: 10,
  small: 8,
  code: 9,
};

const MARGINS = {
  left: 20,
  right: 20,
  top: 25,
  bottom: 25,
};

// Helper to set colors
function setTextColor(pdf: jsPDF, color: { r: number; g: number; b: number }) {
  pdf.setTextColor(color.r, color.g, color.b);
}

function setFillColor(pdf: jsPDF, color: { r: number; g: number; b: number }) {
  pdf.setFillColor(color.r, color.g, color.b);
}

function setDrawColor(pdf: jsPDF, color: { r: number; g: number; b: number }) {
  pdf.setDrawColor(color.r, color.g, color.b);
}

// Parse markdown and return structured content
interface ContentBlock {
  type: 'paragraph' | 'heading' | 'code' | 'list' | 'table' | 'blockquote' | 'hr';
  level?: number;
  language?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  text?: string;
}

function parseMarkdownContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = content.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Code blocks
    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', language, text: codeLines.join('\n') });
      i++;
      continue;
    }
    
    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }
    
    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }
    
    // Blockquotes
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }
    
    // Lists (unordered and ordered)
    if (/^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && (/^[\s]*[-*+]\s/.test(lines[i]) || /^[\s]*\d+\.\s/.test(lines[i]))) {
        items.push(lines[i].replace(/^[\s]*[-*+]\s|^[\s]*\d+\.\s/, '').trim());
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    
    // Tables
    if (line.includes('|') && i + 1 < lines.length && /^\|?[-:\s|]+\|?$/.test(lines[i + 1])) {
      const headers = line.split('|').map(cell => cell.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(cell => cell.trim()).filter(Boolean));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }
    
    // Empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }
    
    // Regular paragraph
    const paragraphLines: string[] = [];
    while (i < lines.length && 
           lines[i].trim() !== '' && 
           !lines[i].startsWith('```') &&
           !lines[i].startsWith('#') &&
           !lines[i].startsWith('>') &&
           !/^[\s]*[-*+]\s/.test(lines[i]) &&
           !/^[\s]*\d+\.\s/.test(lines[i]) &&
           !lines[i].includes('|') &&
           !/^[-*_]{3,}$/.test(lines[i].trim())) {
      paragraphLines.push(lines[i]);
      i++;
    }
    
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
    }
  }
  
  return blocks;
}

// Format inline markdown
function formatInlineText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');
}

// Add page number footer
function addPageNumber(pdf: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFontSize(FONTS.small);
  pdf.setFont("helvetica", "normal");
  setTextColor(pdf, COLORS.muted);
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

// Draw header on first page
function drawHeader(pdf: jsPDF, options: ExportOptions, messages: Message[]) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header background
  setFillColor(pdf, COLORS.headerBg);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // Border line
  setDrawColor(pdf, COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(0, 45, pageWidth, 45);
  
  // Title
  pdf.setFontSize(FONTS.title);
  pdf.setFont("helvetica", "bold");
  setTextColor(pdf, COLORS.text);
  pdf.text("Conversation Export", MARGINS.left, 18);
  
  // Date range
  if (messages.length > 0) {
    const firstDate = new Date(messages[0].created_at);
    const lastDate = new Date(messages[messages.length - 1].created_at);
    const dateRange = firstDate.toLocaleDateString() === lastDate.toLocaleDateString()
      ? firstDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    pdf.setFontSize(FONTS.small);
    pdf.setFont("helvetica", "normal");
    setTextColor(pdf, COLORS.muted);
    pdf.text(dateRange, pageWidth - MARGINS.right, 18, { align: 'right' });
  }
  
  // Subtitle with conversation title
  if (options.conversationTitle) {
    pdf.setFontSize(FONTS.subtitle);
    pdf.setFont("helvetica", "normal");
    setTextColor(pdf, COLORS.secondary);
    const titleText = options.conversationTitle.length > 60 
      ? options.conversationTitle.substring(0, 60) + '...' 
      : options.conversationTitle;
    pdf.text(titleText, MARGINS.left, 30);
  }
  
  // Metadata line
  pdf.setFontSize(FONTS.small);
  setTextColor(pdf, COLORS.muted);
  const userCount = new Set(messages.map(m => m.role)).size;
  const metadata = [
    `Exported: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    `${messages.length} messages`,
    options.userName ? `User: ${options.userName}` : null,
  ].filter(Boolean).join('  |  ');
  pdf.text(metadata, MARGINS.left, 40);
  
  return 55;
}

// Render a message block
function renderMessage(
  pdf: jsPDF, 
  message: Message, 
  yPos: number, 
  contentWidth: number,
  userName?: string
): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const isUser = message.role === 'user';
  const roleName = isUser ? (userName || 'User') : 'Assistant';
  const roleIcon = isUser ? '[User]' : '[AI]';
  const roleColor = isUser ? COLORS.primary : COLORS.secondary;
  
  // Check if we need a new page
  if (yPos > pageHeight - MARGINS.bottom - 30) {
    pdf.addPage();
    yPos = MARGINS.top;
  }
  
  // Message header
  pdf.setFontSize(FONTS.heading);
  pdf.setFont("helvetica", "bold");
  setTextColor(pdf, roleColor);
  pdf.text(`${roleIcon} ${roleName}`, MARGINS.left, yPos);
  
  // Timestamp
  const timestamp = new Date(message.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  pdf.setFontSize(FONTS.small);
  pdf.setFont("helvetica", "normal");
  setTextColor(pdf, COLORS.muted);
  const roleWidth = pdf.getTextWidth(`${roleIcon} ${roleName}`);
  pdf.text(timestamp, MARGINS.left + roleWidth + 10, yPos);
  
  yPos += 8;
  
  // Parse and render markdown
  const blocks = parseMarkdownContent(message.content);
  
  for (const block of blocks) {
    if (yPos > pageHeight - MARGINS.bottom - 15) {
      pdf.addPage();
      yPos = MARGINS.top;
    }
    
    switch (block.type) {
      case 'heading':
        pdf.setFontSize(FONTS.heading + (4 - (block.level || 1)));
        pdf.setFont("helvetica", "bold");
        setTextColor(pdf, COLORS.text);
        const headingLines = pdf.splitTextToSize(formatInlineText(block.text || ''), contentWidth);
        headingLines.forEach((line: string) => {
          if (yPos > pageHeight - MARGINS.bottom) {
            pdf.addPage();
            yPos = MARGINS.top;
          }
          pdf.text(line, MARGINS.left, yPos);
          yPos += 6;
        });
        yPos += 3;
        break;
        
      case 'paragraph':
        pdf.setFontSize(FONTS.body);
        pdf.setFont("helvetica", "normal");
        setTextColor(pdf, COLORS.text);
        const paragraphLines = pdf.splitTextToSize(formatInlineText(block.text || ''), contentWidth);
        paragraphLines.forEach((line: string) => {
          if (yPos > pageHeight - MARGINS.bottom) {
            pdf.addPage();
            yPos = MARGINS.top;
          }
          pdf.text(line, MARGINS.left, yPos);
          yPos += 5;
        });
        yPos += 3;
        break;
        
      case 'code':
        pdf.setFontSize(FONTS.code);
        pdf.setFont("courier", "normal");
        const codeLines = (block.text || '').split('\n');
        const codeHeight = Math.min(codeLines.length * 4.5 + 8, 80);
        
        if (yPos + codeHeight > pageHeight - MARGINS.bottom) {
          pdf.addPage();
          yPos = MARGINS.top;
        }
        
        // Code background
        setFillColor(pdf, COLORS.codeBg);
        pdf.roundedRect(MARGINS.left, yPos - 3, contentWidth, codeHeight, 2, 2, 'F');
        
        // Language label
        if (block.language && block.language !== 'text') {
          pdf.setFontSize(FONTS.small);
          setTextColor(pdf, COLORS.muted);
          pdf.text(block.language, MARGINS.left + 4, yPos + 2);
          yPos += 6;
        }
        
        // Code content
        pdf.setFontSize(FONTS.code);
        setTextColor(pdf, COLORS.text);
        codeLines.slice(0, 15).forEach((line) => {
          if (yPos > pageHeight - MARGINS.bottom) {
            pdf.addPage();
            yPos = MARGINS.top;
          }
          const truncatedLine = line.length > 80 ? line.substring(0, 77) + '...' : line;
          pdf.text(truncatedLine, MARGINS.left + 4, yPos + 3);
          yPos += 4.5;
        });
        if (codeLines.length > 15) {
          setTextColor(pdf, COLORS.muted);
          pdf.text(`... ${codeLines.length - 15} more lines`, MARGINS.left + 4, yPos + 3);
          yPos += 4.5;
        }
        yPos += 5;
        break;
        
      case 'list':
        pdf.setFontSize(FONTS.body);
        pdf.setFont("helvetica", "normal");
        setTextColor(pdf, COLORS.text);
        (block.items || []).forEach((item) => {
          if (yPos > pageHeight - MARGINS.bottom) {
            pdf.addPage();
            yPos = MARGINS.top;
          }
          const bullet = '  •  ';
          const itemLines = pdf.splitTextToSize(formatInlineText(item), contentWidth - 10);
          itemLines.forEach((line: string, lineIdx: number) => {
            pdf.text(lineIdx === 0 ? bullet + line : '      ' + line, MARGINS.left, yPos);
            yPos += 5;
          });
        });
        yPos += 3;
        break;
        
      case 'blockquote':
        pdf.setFontSize(FONTS.body);
        pdf.setFont("helvetica", "italic");
        setTextColor(pdf, COLORS.muted);
        
        // Quote bar
        setDrawColor(pdf, COLORS.primary);
        pdf.setLineWidth(2);
        
        const quoteLines = pdf.splitTextToSize(formatInlineText(block.text || ''), contentWidth - 15);
        const quoteStartY = yPos;
        quoteLines.forEach((line: string) => {
          if (yPos > pageHeight - MARGINS.bottom) {
            pdf.addPage();
            yPos = MARGINS.top;
          }
          pdf.text(line, MARGINS.left + 10, yPos);
          yPos += 5;
        });
        pdf.line(MARGINS.left + 3, quoteStartY - 3, MARGINS.left + 3, yPos - 2);
        yPos += 4;
        break;
        
      case 'table':
        if (block.headers && block.rows) {
          pdf.setFontSize(FONTS.small);
          const cellWidth = contentWidth / block.headers.length;
          const cellPadding = 3;
          
          // Table header
          pdf.setFont("helvetica", "bold");
          setFillColor(pdf, COLORS.codeBg);
          pdf.rect(MARGINS.left, yPos - 4, contentWidth, 8, 'F');
          setTextColor(pdf, COLORS.text);
          block.headers.forEach((header, idx) => {
            const truncatedHeader = header.length > 15 ? header.substring(0, 12) + '...' : header;
            pdf.text(truncatedHeader, MARGINS.left + idx * cellWidth + cellPadding, yPos);
          });
          yPos += 8;
          
          // Table rows
          pdf.setFont("helvetica", "normal");
          block.rows.slice(0, 10).forEach((row) => {
            if (yPos > pageHeight - MARGINS.bottom) {
              pdf.addPage();
              yPos = MARGINS.top;
            }
            row.forEach((cell, idx) => {
              const truncatedCell = cell.length > 15 ? cell.substring(0, 12) + '...' : cell;
              pdf.text(truncatedCell, MARGINS.left + idx * cellWidth + cellPadding, yPos);
            });
            yPos += 5;
          });
          if (block.rows.length > 10) {
            setTextColor(pdf, COLORS.muted);
            pdf.text(`... ${block.rows.length - 10} more rows`, MARGINS.left, yPos);
            yPos += 5;
          }
        }
        yPos += 4;
        break;
        
      case 'hr':
        setDrawColor(pdf, COLORS.border);
        pdf.setLineWidth(0.5);
        pdf.line(MARGINS.left, yPos, MARGINS.left + contentWidth, yPos);
        yPos += 6;
        break;
    }
  }
  
  // Message separator
  yPos += 5;
  setDrawColor(pdf, COLORS.border);
  pdf.setLineWidth(0.3);
  pdf.line(MARGINS.left, yPos, MARGINS.left + contentWidth / 3, yPos);
  yPos += 10;
  
  return yPos;
}

export function exportChatAsPDF(messages: Message[], options: ExportOptions = {}) {
  if (messages.length === 0) {
    return;
  }
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;
  
  // Draw header
  let yPos = drawHeader(pdf, options, messages);
  
  // Render each message
  messages.forEach((message) => {
    yPos = renderMessage(pdf, message, yPos, contentWidth, options.userName);
  });
  
  // Add page numbers
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addPageNumber(pdf, i, totalPages);
  }
  
  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = options.conversationTitle 
    ? `conversation-${options.conversationTitle.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}-${dateStr}.pdf`
    : `chat-export-${dateStr}.pdf`;
  
  pdf.save(filename);
}
