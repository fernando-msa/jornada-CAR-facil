/**
 * PDF Generator Service for CAR Easy Journey (Jornada CAR Fácil)
 * Generates a clean, simple, and high-readability receipt for "Seu Raimundo"
 * Uses 'jspdf' and optionally 'jspdf-autotable' for beautiful tables.
 */

// Note: Requires installation of jspdf:
// npm install jspdf jspdf-autotable

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a beautiful proof-of-declaration PDF for the rural producer
 * 
 * @param {Object} data - Structured data about the producer and property
 * @param {Object} data.producer - { name, cpf, email, level }
 * @param {Object} data.property - { name, registryCode, areaHa, municipality, uf }
 * @param {Object} data.diagnosis - Output from validation engine (APP, RL status, etc.)
 */
export async function generateCarReportPDF(data) {
  const { producer, property, diagnosis } = data;
  
  // 1. Initialize Document (A4 size, portrait, mm units)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 2. Color Palette matching gov.br & CAR Fácil design
  const PRIMARY_COLOR = [19, 128, 19];   // Forest Green (#138013)
  const SECONDARY_COLOR = [0, 51, 198];  // gov.br Blue (#0033c6)
  const DARK_TEXT = [33, 37, 41];        // Charcoal (#212529)
  const LIGHT_BG = [248, 249, 250];      // Light Gray (#f8f9fa)
  const WHITE = [255, 255, 255];

  // Page dimensions helper
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // 3. Header Styling
  // Draw primary color top stripe
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 15, 'F');

  // Draw secondary stripe
  doc.setFillColor(...SECONDARY_COLOR);
  doc.rect(0, 15, pageWidth, 2, 'F');

  // Header Title
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PROGRAMA NACIONAL DE REGULARIZAÇÃO AMBIENTAL', 15, 10);
  
  // App Title
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(20);
  doc.text('Jornada CAR Fácil', 15, 28);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Comprovante de Diagnóstico Prévio do Imóvel Rural', 15, 34);

  // Date and Protocol right-aligned
  const today = new Date().toLocaleDateString('pt-BR');
  const protocol = `CAR-${Math.floor(100000 + Math.random() * 900000)}-2026`;
  doc.setFontSize(9);
  doc.text(`Data: ${today}`, pageWidth - 15, 28, { align: 'right' });
  doc.text(`Protocolo Prévio: ${protocol}`, pageWidth - 15, 34, { align: 'right' });

  // Draw separator line
  doc.setDrawColor(220, 224, 230);
  doc.line(15, 38, pageWidth - 15, 38);

  // 4. Section: Producer Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SECONDARY_COLOR);
  doc.text('1. Dados do Produtor (Seu Raimundo)', 15, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_TEXT);
  
  // Create table for Producer info
  doc.autoTable({
    startY: 49,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', width: 40 } },
    body: [
      ['Nome Completo:', producer.name],
      ['CPF:', producer.cpf],
      ['Nível Login gov.br:', `${producer.level} (Acesso Seguro)`]
    ]
  });

  let currentY = doc.lastAutoTable.finalY + 8;

  // 5. Section: Property Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SECONDARY_COLOR);
  doc.text('2. Informações do Imóvel Rural', 15, currentY);

  doc.autoTable({
    startY: currentY + 3,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: PRIMARY_COLOR, textColor: WHITE },
    columns: [
      { header: 'Item', dataKey: 'item' },
      { header: 'Informação Cadastrada', dataKey: 'value' }
    ],
    body: [
      { item: 'Nome do Sítio/Fazenda', value: property.name },
      { item: 'Código CAR de Referência', value: property.registryCode || 'Em Cadastramento' },
      { item: 'Município / UF', value: `${property.municipality} - ${property.uf}` },
      { item: 'Área Total Declarada', value: `${property.areaHa.toFixed(2)} Hectares` },
      { item: 'Módulos Fiscais', value: `${diagnosis.fiscalModules} MF` }
    ]
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 6. Section: Environmental Diagnostics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SECONDARY_COLOR);
  doc.text('3. Diagnóstico e Conformidade Ambiental', 15, currentY);

  doc.autoTable({
    startY: currentY + 3,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [100, 110, 120], textColor: WHITE },
    columns: [
      { header: 'Categoria Ambiental', dataKey: 'category' },
      { header: 'Área Mapeada (ha)', dataKey: 'area' },
      { header: 'Regra Aplicada', dataKey: 'rule' },
      { header: 'Situação', dataKey: 'status' }
    ],
    body: [
      { 
        category: 'Área de Preservação Permanente (APP)', 
        area: `${diagnosis.app.totalHa.toFixed(2)} ha`, 
        rule: `Faixa de ${diagnosis.app.requiredBufferMeters}m de rio`, 
        status: diagnosis.app.degradedHa > 0 ? 'Ajustes Necessários' : 'Regular'
      },
      { 
        category: 'Reserva Legal (RL)', 
        area: `${diagnosis.legalReserve.existingHa.toFixed(2)} ha`, 
        rule: diagnosis.isSmallProperty ? 'Isenção Pequeno Produtor' : 'Mínimo 20% exigido', 
        status: diagnosis.legalReserve.status === 'COMPLIANT' ? 'Regular' : 'Atenção'
      }
    ]
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 7. Acknowledgment Box
  doc.setFillColor(...LIGHT_BG);
  doc.rect(15, currentY, pageWidth - 30, 25, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(33, 108, 33);
  doc.text('MENSAGEM DE ACOLHIMENTO PARA SEU RAIMUNDO:', 18, currentY + 6);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK_TEXT);
  const textMsg = 'Parabéns, Seu Raimundo! O senhor completou o diagnóstico prévio de sua terra. Como sua propriedade é considerada de pequeno porte, você tem regras simplificadas de plantio. Esse documento prova seu interesse em proteger as águas e matas do seu sítio e pode ser usado para solicitar crédito rural no banco!';
  const splitText = doc.splitTextToSize(textMsg, pageWidth - 36);
  doc.text(splitText, 18, currentY + 11);

  // 8. Footer
  const footerText = 'Jornada CAR Fácil - Desenvolvido no haCARthon 2026. Código Aberto.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // 9. Save file & trigger browser download or base64 return for WhatsApp
  // To get base64 (e.g. for sharing via API): doc.output('datauristring');
  return doc;
}
