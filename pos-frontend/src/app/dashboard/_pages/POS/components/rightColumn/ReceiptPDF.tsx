import React from "react";
import { Page, Text, View, Document, Font } from "@react-pdf/renderer";
import { styles } from "./ReceiptStyle";

Font.register({
  family: "Roboto",
  src: "/fonts/Roboto/Roboto-VariableFont_wdth,wght.ttf",
});

const RECEIPT_WIDTH = 227;
const today = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "2-digit",
});
interface Item {
  desc: string;
  qty: number;
  amount: number;
}

interface ReceiptPDFProps {
  cartTotal: number;
  amount: string;
  change: number;
  customer?: { name: string } | null;
  items: Item[]; // <-- add this
}

export default function ReceiptPDF({
  cartTotal,
  amount,
  change,
  customer,
  items,
}: ReceiptPDFProps) {
  const BASE_HEIGHT = 280; // adjust as needed for your layout
  const ITEM_HEIGHT = 20; // adjust if your rows are taller/shorter
  const receiptHeight = BASE_HEIGHT + items.length * ITEM_HEIGHT;

  return (
    <Document>
      <Page size={[RECEIPT_WIDTH, receiptHeight]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pharmacy}>STORE DA</Text>
          <Text style={styles.address}>Itoy Igid</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.bold}>Customer:</Text>
          <Text>{customer?.name || "N/A"}</Text>
        </View>
        <View style={styles.row}>
          <Text>
            <Text style={styles.bold}>Date:</Text> {today}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colAmount}>Amount</Text>
        </View>
        {items.map((item, idx) => (
          <View style={styles.row} key={idx}>
            <Text style={styles.colDesc}>{item.desc}</Text>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colAmount}>{item.amount.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text>Total: </Text>
          <Text style={{ fontWeight: "bold", marginLeft: 8 }}>
            ₱{cartTotal.toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>Amount:</Text>
          <Text>₱{parseFloat(amount || "0").toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Change:</Text>
          <Text>₱{change.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.solution}>GATANG KA MANNEN!</Text>
      </Page>
    </Document>
  );
}
