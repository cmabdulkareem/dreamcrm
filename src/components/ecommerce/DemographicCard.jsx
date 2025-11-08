import { useState, useEffect } from "react";
import axios from "axios";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import CountryMap from "./CountryMap";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [demographics, setDemographics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    fetchDemographics();
  }, []);

  const fetchDemographics = async () => {
    try {
      const response = await axios.get(
        `${API}/customers/all`,
        { withCredentials: true }
      );
      
      const customers = response.data.customers;
      
      // Filter for current year
      const currentYear = new Date().getFullYear();
      const thisYearCustomers = customers.filter(customer => {
        const createdYear = new Date(customer.createdAt).getFullYear();
        return createdYear === currentYear;
      });
      
      // Group by place
      const placeCount = {};
      thisYearCustomers.forEach(customer => {
        const place = customer.place || customer.otherPlace || "Not Specified";
        placeCount[place] = (placeCount[place] || 0) + 1;
      });
      
      // Convert to array and sort by count
      const demographicData = Object.entries(placeCount)
        .map(([place, count]) => ({
          place,
          count,
          percentage: ((count / thisYearCustomers.length) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7); // Top 7 locations
      
      setDemographics(demographicData);
      setTotalCustomers(thisYearCustomers.length);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching demographics:", error);
      setLoading(false);
    }
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic (This year)
          </h3>
          <p className="mt-1 mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
            Let us see from where our customers are from
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      {/* <div className="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl dark:border-gray-800 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          <CountryMap />
        </div>
      </div> */}

      <div className="space-y-5">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading demographics...</p>
          </div>
        ) : demographics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No customer data available for this year.</p>
          </div>
        ) : (
          demographics.map((demo, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    {demo.place}
                  </p>
                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {demo.count} {demo.count === 1 ? 'Customer' : 'Customers'}
                  </span>
                </div>
              </div>

              <div className="flex w-full max-w-[140px] items-center gap-3">
                <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                  <div 
                    className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                    style={{ width: `${demo.percentage}%` }}
                  ></div>
                </div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {demo.percentage}%
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
