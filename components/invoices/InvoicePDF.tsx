import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Register fonts if needed
// Font.register({
//   family: 'Inter',
//   src: '/fonts/Inter-Regular.ttf'
// });

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    width: 120,
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#02011F',
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    flexDirection: 'column',
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    color: '#010009',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tableCol: {
    flex: 1,
    fontSize: 10,
  },
  tableColHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
  },
  tableCellDescription: {
    flex: 3,
  },
  tableCellQty: {
    flex: 1,
    textAlign: 'center',
  },
  tableCellPrice: {
    flex: 1,
    textAlign: 'right',
  },
  tableCellTotal: {
    flex: 1,
    textAlign: 'right',
  },
  totals: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 11,
    marginRight: 20,
    width: 100,
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 11,
    width: 80,
    textAlign: 'right',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#02011F',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 20,
    width: 100,
    textAlign: 'right',
    color: '#02011F',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
    color: '#02011F',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#02011F',
  },
  notesText: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.5,
  },
  paymentStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: '4 8',
    borderRadius: 4,
    textAlign: 'center',
    marginBottom: 10,
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  statusOverdue: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  tenant: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    kvk_number?: string;
    btw_number?: string;
    iban?: string;
    logo_url?: string;
  };
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, tenant }) => {
  const getStatusStyle = () => {
    switch (invoice.status) {
      case 'paid':
        return styles.statusPaid;
      case 'overdue':
        return styles.statusOverdue;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = () => {
    switch (invoice.status) {
      case 'draft': return 'Concept';
      case 'sent': return 'Verzonden';
      case 'viewed': return 'Bekeken';
      case 'partially_paid': return 'Gedeeltelijk betaald';
      case 'paid': return 'Betaald';
      case 'overdue': return 'Vervallen';
      case 'cancelled': return 'Geannuleerd';
      default: return invoice.status;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {tenant.logo_url && (
            <Image style={styles.logo} src={tenant.logo_url} />
          )}
          <Text style={styles.invoiceTitle}>Factuur</Text>
        </View>

        {/* Invoice Details & Status */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Factuurnummer</Text>
            <Text style={styles.value}>{invoice.invoice_number}</Text>
            
            <Text style={[styles.label, { marginTop: 10 }]}>Factuurdatum</Text>
            <Text style={styles.value}>
              {format(new Date(invoice.issue_date), 'd MMMM yyyy', { locale: nl })}
            </Text>
            
            <Text style={[styles.label, { marginTop: 10 }]}>Vervaldatum</Text>
            <Text style={styles.value}>
              {format(new Date(invoice.due_date), 'd MMMM yyyy', { locale: nl })}
            </Text>
          </View>
          
          <View style={styles.column}>
            <View style={[styles.paymentStatus, getStatusStyle()]}>
              <Text>{getStatusText()}</Text>
            </View>
          </View>
        </View>

        {/* Company & Client Info */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={[styles.value, { fontWeight: 'bold', marginBottom: 8 }]}>{tenant.name}</Text>
            <Text style={styles.companyInfo}>{tenant.address}</Text>
            {tenant.phone && <Text style={styles.companyInfo}>Tel: {tenant.phone}</Text>}
            {tenant.email && <Text style={styles.companyInfo}>Email: {tenant.email}</Text>}
            {tenant.kvk_number && <Text style={styles.companyInfo}>KvK: {tenant.kvk_number}</Text>}
            {tenant.btw_number && <Text style={styles.companyInfo}>BTW: {tenant.btw_number}</Text>}
          </View>
          
          <View style={styles.column}>
            <Text style={styles.label}>Factureren aan</Text>
            <Text style={[styles.value, { fontWeight: 'bold', marginBottom: 8 }]}>
              {invoice.client?.first_name} {invoice.client?.last_name}
            </Text>
            <Text style={styles.companyInfo}>{invoice.client?.email}</Text>
            <Text style={styles.companyInfo}>{invoice.client?.phone}</Text>
            {invoice.client?.address && (
              <Text style={styles.companyInfo}>{invoice.client.address}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, styles.tableCellDescription]}>Omschrijving</Text>
            <Text style={[styles.tableColHeader, styles.tableCellQty]}>Aantal</Text>
            <Text style={[styles.tableColHeader, styles.tableCellPrice]}>Prijs</Text>
            <Text style={[styles.tableColHeader, styles.tableCellTotal]}>Totaal</Text>
          </View>
          
          {invoice.items?.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.tableCellDescription]}>{item.description}</Text>
              <Text style={[styles.tableCol, styles.tableCellQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCol, styles.tableCellPrice]}>€ {item.unit_price.toFixed(2)}</Text>
              <Text style={[styles.tableCol, styles.tableCellTotal]}>€ {item.total_price.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal</Text>
            <Text style={styles.totalValue}>€ {invoice.subtotal.toFixed(2)}</Text>
          </View>
          
          {invoice.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Korting</Text>
              <Text style={styles.totalValue}>- € {invoice.discount_amount.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW ({invoice.tax_rate}%)</Text>
            <Text style={styles.totalValue}>€ {invoice.tax_amount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Totaal</Text>
            <Text style={styles.grandTotalValue}>€ {invoice.total_amount.toFixed(2)}</Text>
          </View>
          
          {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Reeds betaald</Text>
                <Text style={styles.totalValue}>€ {invoice.paid_amount.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Openstaand</Text>
                <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>
                  € {(invoice.total_amount - invoice.paid_amount).toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Opmerkingen</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment Information */}
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <View style={[styles.notes, { marginTop: 20 }]}>
            <Text style={styles.notesTitle}>Betalingsinformatie</Text>
            <Text style={styles.notesText}>
              Gelieve het totaalbedrag over te maken naar:
            </Text>
            {tenant.iban && (
              <Text style={[styles.notesText, { marginTop: 8 }]}>
                IBAN: {tenant.iban}
              </Text>
            )}
            <Text style={[styles.notesText, { marginTop: 4 }]}>
              O.v.v. factuurnummer {invoice.invoice_number}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {tenant.name} • {tenant.address} • {tenant.phone} • {tenant.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
};