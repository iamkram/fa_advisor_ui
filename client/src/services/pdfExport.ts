import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  title: string;
  clientName?: string;
  advisorName?: string;
  date: string;
  components: Array<{
    type: "holdings" | "goals" | "insights" | "risks";
    title: string;
    data: any;
  }>;
}

interface HoldingData {
  ticker: string;
  name: string;
  value: number;
  allocation: number;
  change: number;
}

export class PDFExportService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private yPosition: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.yPosition = this.margin;
  }

  /**
   * Generate PDF report from report data
   */
  generateReport(data: ReportData): jsPDF {
    // Reset document
    this.doc = new jsPDF();
    this.yPosition = this.margin;

    // Add header
    this.addHeader(data);

    // Add components
    data.components.forEach((component) => {
      this.checkPageBreak(40);
      this.addComponent(component);
    });

    // Add footer to all pages
    this.addFooters(data.advisorName);

    return this.doc;
  }

  /**
   * Export report as PDF file
   */
  exportReport(data: ReportData, filename?: string): void {
    const doc = this.generateReport(data);
    const name = filename || `${data.clientName || "Client"}_Report_${data.date}.pdf`;
    doc.save(name);
  }

  /**
   * Get PDF as blob for email attachment
   */
  getBlob(data: ReportData): Blob {
    const doc = this.generateReport(data);
    return doc.output("blob");
  }

  private addHeader(data: ReportData): void {
    // Logo/Title
    this.doc.setFontSize(24);
    this.doc.setTextColor(70, 130, 180); // Steel blue
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Advisor AI", this.margin, this.yPosition);

    // Report title
    this.yPosition += 15;
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.title, this.margin, this.yPosition);

    // Client and date info
    this.yPosition += 10;
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    
    if (data.clientName) {
      this.doc.text(`Client: ${data.clientName}`, this.margin, this.yPosition);
      this.yPosition += 5;
    }
    
    this.doc.text(`Generated: ${data.date}`, this.margin, this.yPosition);
    
    if (data.advisorName) {
      this.yPosition += 5;
      this.doc.text(`Advisor: ${data.advisorName}`, this.margin, this.yPosition);
    }

    // Separator line
    this.yPosition += 10;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 10;
  }

  private addComponent(component: { type: string; title: string; data: any }): void {
    // Component title
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(70, 130, 180); // Steel blue
    this.doc.text(component.title, this.margin, this.yPosition);
    this.yPosition += 8;

    // Component content based on type
    switch (component.type) {
      case "holdings":
        this.addHoldingsTable(component.data);
        break;
      case "goals":
        this.addGoalsList(component.data);
        break;
      case "insights":
        this.addInsightsList(component.data);
        break;
      case "risks":
        this.addRisksList(component.data);
        break;
    }

    this.yPosition += 10;
  }

  private addHoldingsTable(holdings: HoldingData[]): void {
    const tableData = holdings.map((h) => [
      h.ticker,
      h.name,
      this.formatCurrency(h.value),
      `${h.allocation}%`,
      `${h.change >= 0 ? "+" : ""}${h.change}%`,
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [["Ticker", "Company", "Value", "Allocation", "Change"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [70, 130, 180], // Steel blue
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 5;
  }

  private addGoalsList(goals: string[]): void {
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);

    goals.forEach((goal) => {
      this.checkPageBreak(10);
      this.doc.text(`• ${goal}`, this.margin + 5, this.yPosition);
      this.yPosition += 6;
    });
  }

  private addInsightsList(insights: string[]): void {
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);

    insights.forEach((insight) => {
      this.checkPageBreak(10);
      this.doc.text(`• ${insight}`, this.margin + 5, this.yPosition);
      this.yPosition += 6;
    });
  }

  private addRisksList(risks: Array<{ severity: string; message: string }>): void {
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");

    risks.forEach((risk) => {
      this.checkPageBreak(10);
      
      // Color code by severity
      if (risk.severity === "high") {
        this.doc.setTextColor(220, 38, 38); // Red
      } else if (risk.severity === "medium") {
        this.doc.setTextColor(234, 88, 12); // Orange
      } else {
        this.doc.setTextColor(100, 100, 100); // Gray
      }

      this.doc.text(`⚠ ${risk.message}`, this.margin + 5, this.yPosition);
      this.yPosition += 6;
    });

    this.doc.setTextColor(0, 0, 0); // Reset color
  }

  private addFooters(advisorName?: string): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.setFont("helvetica", "normal");
      
      // Page number
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: "center" }
      );
      
      // Copyright
      this.doc.text(
        `© 2025 Advisor AI${advisorName ? " - " + advisorName : ""}`,
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.yPosition + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  }
}

// Singleton instance
export const pdfExportService = new PDFExportService();
