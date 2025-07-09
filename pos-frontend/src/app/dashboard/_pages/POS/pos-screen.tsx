import POSHeader from "./components/pos-header";
import POSLeftCol from "./components/pos-leftcol";
import POSRightColUpper from "./components/pos-rightcol-upper";
import POSRightColLower from "./components/pos-rightcol-lower";
export default function MainDashboard() {
  return (
    <div className="flex flex-col w-full h-[880px] bg-neutral-100 py-4 px-4">
      <div className="flex gap-2 h-full">
        <div className="flex-[70%]">
          <POSLeftCol />
        </div>  
        <div className="flex flex-col flex-[30%] gap-2">
          <div className="flex-[50%]">
            <POSRightColUpper />
          </div>
          <div className="flex-[50%]">
            <POSRightColLower />
          </div>
        </div>
      </div>
    </div>
  );
}
