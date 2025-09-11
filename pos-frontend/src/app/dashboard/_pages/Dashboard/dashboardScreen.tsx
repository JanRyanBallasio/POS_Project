import Stats from './components/stats';
import ProductStats from './components/productStats';
import SalesStats from './components/salesStats';

export default function DashboardScreen() {
    return (
        <div className="flex flex-col p-6 h-full gap-3">
            <div className="flex-[7%]">
                <h1 className="font-extrabold text-4xl">Dashboard</h1>
                <p>Welcome Back! Here's your business overview!</p>
            </div>
            <div className="flex-[20%]"><Stats /></div>
            <div className="flex-[78%] flex gap-3 flex-col">
                <div className="flex-[50%] mb-4"><SalesStats /></div>
                <div className="flex-[50%] mb-2"><ProductStats /></div>
            </div>
        </div>
    );
}
