import Table from "./components/transactionTable";

export default function TransactionScreen() {
    return (
        <div className="flex gap-[2%] flex-wrap content-start flex-row-reverse p-4 h-full">
            <div className="w-full h-[6%] text-3xl font-bold">Transactions</div>
            <div className="grow h-[94%] w-0"><Table/></div>
        </div>
    );
}