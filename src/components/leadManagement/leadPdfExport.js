import { toast } from "react-toastify";
import { getLeadStatusLabel, formatDate } from "./leadHelpers";

// Download selected leads as PDF
export const downloadLeadsAsPDF = async (selectedLeads, data, toast) => {
  if (selectedLeads.length === 0) {
    toast.warning("Please select at least one lead to download.");
    return;
  }

  try {
    // Dynamic import of jsPDF and autotable plugin
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF('landscape'); // Set landscape orientation
    
    // Add title
    doc.setFontSize(18);
    doc.text('Lead Report', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
    
    // Get selected leads data
    const selectedLeadsData = data.filter(lead => selectedLeads.includes(lead._id));
    
    // Prepare table data
    const tableData = selectedLeadsData.map(lead => {
      const latestRemark = lead.remarks && lead.remarks.length > 0 
        ? lead.remarks[lead.remarks.length - 1].remark 
        : "No remarks";
      
      return [
        lead.fullName,
        formatDate(lead.createdAt),
        lead.phone1,
        lead.contactPoint || "N/A",
        lead.campaign || "N/A",
        getLeadStatusLabel(lead.leadStatus),
        latestRemark.substring(0, 30) + (latestRemark.length > 30 ? '...' : ''),
        formatDate(lead.followUpDate)
      ];
    });
    
    // Add table using autoTable
    autoTable(doc, {
      head: [['Name', 'Date Added', 'Mobile', 'Contact Point', 'Campaign', 'Lead Status', 'Latest Remark', 'Follow-up']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [70, 95, 255], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 35 },
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`leads-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.success(`PDF downloaded with ${selectedLeads.length} lead(s)!`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF. Please try again.');
  }
};