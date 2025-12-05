import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Invoice } from "@/lib/types";

// Define styles matching the FIXCARE invoice design
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
  },
  // Header section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  companySection: {
    width: "50%",
  },
  companyName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#6366f1", // Purple color for FIX
  },
  companyDetails: {
    fontSize: 9,
    color: "#333",
    lineHeight: 1.5,
  },
  invoiceSection: {
    width: "45%",
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "right",
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  metadataLabel: {
    fontSize: 10,
    color: "#666",
    marginRight: 10,
    width: 100,
    textAlign: "right",
  },
  metadataValue: {
    fontSize: 10,
    color: "#000",
    width: 120,
    textAlign: "right",
  },
  balanceDueLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    marginRight: 10,
    width: 100,
    textAlign: "right",
  },
  balanceDueValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    width: 120,
    textAlign: "right",
  },
  // Bill To section
  billToSection: {
    flexDirection: "row",
    marginBottom: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  billToColumn: {
    width: "50%",
  },
  billToLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 5,
  },
  billToValue: {
    fontSize: 11,
    color: "#000",
    fontWeight: "bold",
  },
  phoneLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 8,
    marginBottom: 5,
  },
  phoneValue: {
    fontSize: 11,
    color: "#000",
  },
  // Table styles
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#404040",
    padding: 10,
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
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 10,
    color: "#000",
  },
  colItem: {
    width: "50%",
  },
  colQty: {
    width: "15%",
    textAlign: "center",
  },
  colRate: {
    width: "17.5%",
    textAlign: "right",
  },
  colAmount: {
    width: "17.5%",
    textAlign: "right",
  },
  // Totals section
  totalsSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
    width: 250,
  },
  totalLabel: {
    fontSize: 10,
    color: "#666",
    width: 120,
    textAlign: "right",
    paddingRight: 20,
  },
  totalValue: {
    fontSize: 10,
    color: "#000",
    width: 100,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000",
    width: 250,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    width: 120,
    textAlign: "right",
    paddingRight: 20,
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    width: 100,
    textAlign: "right",
  },
  amountPaidRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    width: 250,
  },
  // Notes section
  notesSection: {
    marginTop: 40,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#333",
    lineHeight: 1.4,
  },
  // Terms page
  termsPage: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 15,
  },
  termItem: {
    marginBottom: 10,
    lineHeight: 1.5,
  },
});

// Format currency
const formatCurrency = (amount: number | null | undefined) => {
  return `₹${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface InvoicePDFTemplateProps {
  invoice: Invoice;
}

export function InvoicePDFTemplate({ invoice }: InvoicePDFTemplateProps) {
  // Calculate balance due
  const balanceDue = (invoice.total_amount || 0) - (invoice.amount_paid || 0);

  return (
    <Document>
      {/* Page 1: Invoice */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Company Info */}
          <View style={styles.companySection}>
            <Text style={styles.companyName}>FIXPLANET</Text>
            <Text style={styles.companyDetails}>
              GSTIN: 29ABEPQ7491G1Z4{"\n"}
              1st Floor, 368, 80 Feet Rd, above Global Access,{"\n"}
              next to KFC, KHB Colony, 7th Block, Koramangala,{"\n"}
              Bengaluru, Karnataka 560095
            </Text>
          </View>

          {/* Invoice Number & Metadata */}
          <View style={styles.invoiceSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>

            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Date:</Text>
              <Text style={styles.metadataValue}>{formatDate(invoice.invoice_date)}</Text>
            </View>

            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Payment Terms:</Text>
              <Text style={styles.metadataValue}>{invoice.payment_method || "Online"}</Text>
            </View>

            {invoice.due_date && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Due Date:</Text>
                <Text style={styles.metadataValue}>{formatDate(invoice.due_date)}</Text>
              </View>
            )}

            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>PO Number:</Text>
              <Text style={styles.metadataValue}>{invoice.invoice_number.split('-')[1] || "118"}</Text>
            </View>

            <View style={[styles.metadataRow, { marginTop: 10 }]}>
              <Text style={styles.balanceDueLabel}>Balance Due:</Text>
              <Text style={styles.balanceDueValue}>{formatCurrency(balanceDue)}</Text>
            </View>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <View style={styles.billToColumn}>
            <Text style={styles.billToLabel}>Bill To:</Text>
            <Text style={styles.billToValue}>{invoice.customer_name}</Text>
          </View>
          <View style={styles.billToColumn}>
            <Text style={styles.phoneLabel}>No:</Text>
            <Text style={styles.phoneValue}>{invoice.customer_phone}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Quantity</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colItem]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(item.rate)}</Text>
                <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(item.amount)}</Text>
              </View>
            ))
          ) : (
            <>
              {invoice.parts_cost && invoice.parts_cost > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colItem]}>
                    {invoice.device_type && invoice.device_model
                      ? `${invoice.device_type} ${invoice.device_model} ${invoice.issue || "Repair"}`
                      : invoice.issue || "Parts"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>1</Text>
                  <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(invoice.parts_cost)}</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(invoice.parts_cost)}</Text>
                </View>
              )}
              {invoice.labor_cost && invoice.labor_cost > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colItem]}>Labor</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>1</Text>
                  <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(invoice.labor_cost)}</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(invoice.labor_cost)}</Text>
                </View>
              )}
              {invoice.other_charges && invoice.other_charges > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colItem]}>Other Charges</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>1</Text>
                  <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(invoice.other_charges)}</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(invoice.other_charges)}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {(invoice.tax_amount > 0 || (invoice.gst_amount && invoice.gst_amount > 0)) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {invoice.gst_included ? "Tax (%):" : `Tax (${invoice.tax_rate || 0}%):`}
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.gst_amount || invoice.tax_amount)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total_amount)}</Text>
          </View>

          <View style={styles.amountPaidRow}>
            <Text style={styles.grandTotalLabel}>Amount Paid:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.amount_paid)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}
      </Page>

      {/* Page 2: Terms & Conditions */}
      <Page size="A4" style={styles.termsPage}>
        <Text style={styles.termsTitle}>Terms:</Text>

        <Text style={styles.termsTitle}>Terms and condition</Text>

        <Text style={styles.termItem}>
          1. Delivery dates may be delayed due to the unavailability of spare parts and software.
        </Text>

        <Text style={styles.termItem}>
          2. All estimated costs are approximate and subject to change upon completion of the job.
        </Text>

        <Text style={styles.termItem}>
          3. All items taken for repair are at the customer&apos;s risk.
        </Text>

        <Text style={styles.termItem}>
          4. The company will make every effort to complete the job on time, but will not be held responsible for any delays due to unavoidable circumstances.
        </Text>

        <Text style={styles.termItem}>
          5. The company is not liable for damage to semi-defective parts during servicing, as certain parts may become damaged due to their fragility.
        </Text>

        <Text style={styles.termItem}>
          6. The company is not responsible for goods not collected within 30 days from the date of the job card.
        </Text>

        <Text style={styles.termItem}>
          7. If the job is not completed or the estimate is not approved, a minimum service charge of Rs. 299/-* will be applicable.
        </Text>

        <Text style={styles.termItem}>
          8. Devices damaged by liquids cannot be returned in the same condition after being opened.
        </Text>

        <Text style={styles.termItem}>
          9. For any warranty claims after 3 days, customers are advised to visit our service center. Onsite service for warranty claims will incur a minimum fee of Rs. 299/-.
        </Text>

        <Text style={styles.termItem}>
          10. Warranty, if applicable, is valid for the period specified from the date of this invoice. The warranty will be considered void in the event of any physical, pressure or water damage to the device. Service charges are not covered under warranty.
        </Text>

        <Text style={styles.termItem}>
          11. This is a computer-generated invoice; no signature is required.
        </Text>
      </Page>
    </Document>
  );
}
