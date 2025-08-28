import StockMovementHead from "./components/stockHead";

import CardTable from "./components/cardTable";
export default function StockMovementScreen() {
    return (
        <div className="flex flex-col gap-4 p-8 w-full h-full">
            <div className="h-full flex-[10%]">
                <StockMovementHead />
            </div>
            <div className=" h-full flex-[90%]">
                <CardTable />
            </div>
        </div>
    );
}
