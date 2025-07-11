import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    color: "#262626",
    fontFamily: "Roboto",
    fontSize: 12,
    padding: 12,
  },
  header: {
    textAlign: "center",
    marginBottom: 4,
  },
  pharmacy: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  address: {
    fontSize: 10,
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1.5, // slightly thicker
    borderBottomColor: "#000",
    borderStyle: "dashed",
    marginVertical: 8, // more space above/below
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  bold: {
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5, // slightly thicker
    borderBottomColor: "#000",
    borderStyle: "dashed",
    marginBottom: 2,
    fontWeight: "bold",
    paddingTop: 4, // Add this line
    paddingBottom: 4, // Add this line
  },
  colDesc: {
    width: "45%",
  },
  colQty: {
    width: "20%",
    textAlign: "center",
  },
  colAmount: {
    width: "35%",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    fontWeight: "bold",
    fontSize: 13,
  },
  footer: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 10,
  },
  solution: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 10,
    fontWeight: "bold",
  },
});
