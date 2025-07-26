import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoices/InvoicePDF';
import { Invoice } from '@/types/invoice';

export class PDFService {
  // Generate invoice PDF blob
  static async generateInvoicePDF(invoice: Invoice, tenant: any): Promise<Blob> {
    const doc = React.createElement(InvoicePDF, { invoice, tenant });
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    return blob;
  }

  // Download invoice PDF
  static async downloadInvoicePDF(invoice: Invoice, tenant: any): Promise<void> {
    try {
      const blob = await this.generateInvoicePDF(invoice, tenant);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factuur-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  }

  // Get invoice PDF as base64
  static async getInvoicePDFBase64(invoice: Invoice, tenant: any): Promise<string> {
    const blob = await this.generateInvoicePDF(invoice, tenant);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Preview invoice PDF in new tab
  static async previewInvoicePDF(invoice: Invoice, tenant: any): Promise<void> {
    try {
      const blob = await this.generateInvoicePDF(invoice, tenant);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Error previewing invoice PDF:', error);
      throw error;
    }
  }
}