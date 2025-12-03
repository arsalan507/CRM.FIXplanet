import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Invoice } from "@/lib/types";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 14,
    color: "#333",
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  column: {
    width: "48%",
  },
  label: {
    fontSize: 9,
    color: "#666",
    marginBottom: 3,
  },
  value: {
    fontSize: 11,
    color: "#000",
  },
  table: {
    width: "100%",
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000",
    padding: 8,
    fontWeight: "bold",
  },
  tableHeaderText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 10,
  },
  colDescription: {
    width: "45%",
  },
  colQty: {
    width: "15%",
    textAlign: "center",
  },
  colRate: {
    width: "20%",
    textAlign: "right",
  },
  colAmount: {
    width: "20%",
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#000",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  totalLabel: {
    width: "70%",
    textAlign: "right",
    fontSize: 11,
    paddingRight: 10,
  },
  totalValue: {
    width: "30%",
    textAlign: "right",
    fontSize: 11,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  grandTotalLabel: {
    width: "70%",
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
    paddingRight: 10,
  },
  grandTotalValue: {
    width: "30%",
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  statusBadge: {
    position: "absolute",
    top: 40,
    right: 40,
    padding: "6 12",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: "bold",
  },
  statusPaid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPartial: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  statusPending: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
});

// Format currency
const formatCurrency = (amount: number | null | undefined) => {
  return `₹${(amount || 0).toFixed(2)}`;
};

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface InvoicePDFTemplateProps {
  invoice: Invoice;
}

export function InvoicePDFTemplate({ invoice }: InvoicePDFTemplateProps) {
  const getStatusStyle = () => {
    switch (invoice.payment_status) {
      case "paid":
        return styles.statusPaid;
      case "partial":
        return styles.statusPartial;
      default:
        return styles.statusPending;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, getStatusStyle()]}>
          <Text style={{ textTransform: "uppercase" }}>
            {invoice.payment_status}
          </Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>FIXPLANET</Text>
          <Text style={styles.companyInfo}>Apple Device Repair Specialists</Text>
          <Text style={styles.companyInfo}>Phone: +91 9876543210</Text>
          <Text style={styles.companyInfo}>Email: support@fixplanet.com</Text>
        </View>

        {/* Invoice Title & Number */}
        <View style={styles.section}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <Text style={styles.value}>Date: {formatDate(invoice.invoice_date)}</Text>
          {invoice.due_date && (
            <Text style={styles.value}>Due Date: {formatDate(invoice.due_date)}</Text>
          )}
        </View>

        {/* Customer & Invoice Details */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.value}>{invoice.customer_name}</Text>
            <Text style={styles.value}>{invoice.customer_phone}</Text>
            {invoice.customer_email && (
              <Text style={styles.value}>{invoice.customer_email}</Text>
            )}
            {invoice.customer_address && (
              <Text style={styles.value}>{invoice.customer_address}</Text>
            )}
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Payment Summary:</Text>
            <View style={{ marginBottom: 5 }}>
              <Text style={styles.label}>Total Amount</Text>
              <Text style={styles.value}>
                {formatCurrency(invoice.total_amount)}
              </Text>
            </View>
            <View style={{ marginBottom: 5 }}>
              <Text style={styles.label}>Amount Paid</Text>
              <Text style={{ ...styles.value, color: "#16a34a" }}>
                {formatCurrency(invoice.amount_paid)}
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Amount Due</Text>
              <Text style={{ ...styles.value, color: "#dc2626" }}>
                {formatCurrency(invoice.amount_due || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colRate]}>
                {formatCurrency(item.rate)}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%):</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.tax_amount)}
            </Text>
          </View>

          {invoice.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ ...styles.totalLabel, color: "#16a34a" }}>
                Discount:
              </Text>
              <Text style={{ ...styles.totalValue, color: "#16a34a" }}>
                -{formatCurrency(invoice.discount_amount)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total_amount)}
            </Text>
          </View>
        </View>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms_conditions) && (
          <View style={styles.notes}>
            {invoice.notes && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.notesTitle}>Notes:</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms_conditions && (
              <View>
                <Text style={styles.notesTitle}>Terms & Conditions:</Text>
                <Text style={styles.notesText}>{invoice.terms_conditions}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>For any queries, please contact support@fixplanet.com</Text>
        </View>
      </Page>
    </Document>
  );
}
