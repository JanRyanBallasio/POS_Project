import { useState } from "react";
import { DataTable } from "../../table/dataTable";
import { columns, Products } from "../../table/columns";
import Pagination from "./Pagination";
import { useProducts } from "@/hooks/global/fetching/useProducts";

const PAGE_SIZE = 6;

function mapProductToPayment(product: any): Products {
    let status: "in stock" | "low stock" | "out of stock";
    if (product.quantity === 0) status = "out of stock";
    else if (product.quantity < 5) status = "low stock";
    else status = "in stock";
    return {
        id: product.id,
        productName: product.name,
        barcode: product.barcode,
        category: `Category ${product.category_id}`,
        currentStock: product.quantity,
        productPrice: product.price,
        status,
    };
}

export default function ProductTable() {
    const { products, loading, error } = useProducts();
    const [page, setPage] = useState(0);
    const [filteredCount, setFilteredCount] = useState(0);
    const [pageSize, setPageSize] = useState(6);

    const mappedProducts: Products[] = (products ?? []).map(mapProductToPayment);

    const pageCount = Math.ceil(filteredCount / pageSize);

    if (loading) {
        return <div className="w-full text-center py-8">Loading...</div>;
    }

    if (error) {
        return <div className="w-full text-center py-8 text-red-500">{error}</div>;
    }

    return (
        <div className="w-full mt-4 relative">
            <DataTable
                columns={columns}
                data={mappedProducts}
                page={page}
                pageSize={pageSize}
                onFilteredCountChange={setFilteredCount}
            />
            <div className="mt-7">
                <Pagination
                    page={page}
                    pageCount={pageCount}
                    setPage={setPage}
                    pageSize={pageSize}
                    onPageSizeChange={size => {
                        setPageSize(size);
                        setPage(0);
                    }}
                />
            </div>

        </div>
    );
}