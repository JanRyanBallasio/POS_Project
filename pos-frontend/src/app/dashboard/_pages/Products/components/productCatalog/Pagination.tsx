import {
    Pagination as PaginationRoot,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
    PaginationLink
} from "@/components/ui/pagination";

type PaginationProps = {
    page: number;
    pageCount: number;
    setPage: (page: number) => void;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
};

export default function Pagination({ page, pageCount, setPage, pageSize, onPageSizeChange }: PaginationProps) {
    if (pageCount <= 1) {
        // nothing to paginate
        return null;
    }

    const go = (p: number) => (e?: React.MouseEvent) => {
        e?.preventDefault();
        if (p < 0) p = 0;
        if (p > pageCount - 1) p = pageCount - 1;
        if (p !== page) setPage(p);
    };

    // build a compact page list: always show first and last, and a window around current page
    const buildPages = () => {
        const pages: (number | "ellipsis")[] = [];
        const left = Math.max(1, page - 1);
        const right = Math.min(pageCount - 2, page + 1);

        pages.push(0); // first page

        if (left > 1) pages.push("ellipsis");

        for (let i = left; i <= right; i++) {
            pages.push(i);
        }

        if (right < pageCount - 2) pages.push("ellipsis");

        if (pageCount > 1) pages.push(pageCount - 1); // last page

        return pages;
    };

    const pages = buildPages();

    return (
        <PaginationRoot className="mt-2 flex items-center gap-4">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={go(Math.max(page - 1, 0))}
                        aria-disabled={page === 0}
                    />
                </PaginationItem>

                {pages.map((p, idx) =>
                    p === "ellipsis" ? (
                        <PaginationItem key={`e-${idx}`}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={p}>
                            <PaginationLink
                                href="#"
                                isActive={p === page}
                                onClick={go(p)}
                            >
                                {p + 1}
                            </PaginationLink>
                        </PaginationItem>
                    )
                )}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={go(Math.min(page + 1, pageCount - 1))}
                        aria-disabled={page === pageCount - 1}
                    />
                </PaginationItem>
            </PaginationContent>

            <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="text-sm">Rows per page:</label>
                <input
                    id="page-size"
                    type="number"
                    min={1}
                    max={100}
                    value={pageSize}
                    onChange={e => onPageSizeChange(Number(e.target.value) || 1)}
                    className="border rounded px-2 py-1 w-16 text-sm"
                />
            </div>
        </PaginationRoot>
    );
}