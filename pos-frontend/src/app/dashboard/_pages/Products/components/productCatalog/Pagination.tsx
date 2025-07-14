import {
    Pagination as PaginationRoot,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
    PaginationLink
} from "@/components/ui/pagination";
import React from "react";

type PaginationProps = {
    page: number;
    pageCount: number;
    setPage: (page: number) => void;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
};

export default function Pagination({ page, pageCount, setPage, pageSize, onPageSizeChange }: PaginationProps) {
    const renderPageNumbers = () => {
        return Array.from({ length: pageCount }, (_, i) => (
            <PaginationItem key={i}>
                <PaginationLink
                    href="#"
                    isActive={i === page}
                    onClick={e => {
                        e.preventDefault();
                        setPage(i);
                    }}
                >
                    {i + 1}
                </PaginationLink>
            </PaginationItem>
        ));
    };

    return (
        <PaginationRoot className="mt-2 flex items-center gap-4">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={e => {
                            e.preventDefault();
                            setPage(Math.max(page - 1, 0));
                        }}
                        aria-disabled={page === 0}
                    />
                </PaginationItem>
                {renderPageNumbers()}
                {pageCount > 5 && (
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                )}
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={e => {
                            e.preventDefault();
                            setPage(Math.min(page + 1, pageCount - 1));
                        }}
                        aria-disabled={page === pageCount - 1}
                    />
                </PaginationItem>
            </PaginationContent>
            {/* Page size selector */}
            <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="text-sm">Rows per page:</label>
                <input
                    id="page-size"
                    type="number"
                    min={1}
                    max={100}
                    value={pageSize}
                    onChange={e => onPageSizeChange(Number(e.target.value))}
                    className="border rounded px-2 py-1 w-16 text-sm"
                />
            </div>
        </PaginationRoot>
    );
}