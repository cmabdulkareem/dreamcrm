import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import LeadOverview from "../../components/ecommerce/LeadOverview";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import LeadStatusBreakdown from "../../components/ecommerce/LeadStatusBreakdown";
import FollowUpsDue from "../../components/ecommerce/FollowUpsDue";
import LeaderboardCard from "../../components/ecommerce/LeaderboardCard";
import ActivityTimeline from "../../components/ecommerce/ActivityTimeline";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Leads Dashboard | CRM Dashboard Overview"
        description="Comprehensive dashboard for leads, admissions, revenue, and student management"
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Leads Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overview of your leads, admissions, revenue, and key metrics
          </p>
        </div>

        {/* Unified Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6 items-start">

          {/* TOP SECTION: Metrics & Chart (Left) + Timeline (Right) - MASTER ALIGNMENT */}
          <div className="col-span-12 grid grid-cols-12 gap-6 items-stretch">
            {/* Left Block: Metrics + Monthly Sales Chart (Defines Row Height) */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
              <EcommerceMetrics />
              <MonthlySalesChart />
            </div>

            {/* Right Block: Activity Timeline (Follows Height, Clips Content) */}
            <div className="col-span-12 xl:col-span-4 relative">
              <div className="absolute inset-0">
                <ActivityTimeline />
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: Stats Chart (Left) + Achievement (Right) - HEIGHT SYNCED */}
          <div className="col-span-12 grid grid-cols-12 gap-6 items-stretch">
            <div className="col-span-12 xl:col-span-8">
              <StatisticsChart />
            </div>

            <div className="col-span-12 xl:col-span-4">
              <MonthlyTarget />
            </div>
          </div>

          {/* FOLLOW UPS: Left Column */}
          <div className="col-span-12 xl:col-span-8">
            <FollowUpsDue />
          </div>

          {/* SMALL STAT CARDS: Tertiary Area */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <LeaderboardCard />
            <LeadStatusBreakdown />
            <DemographicCard />
          </div>

          {/* RECENT LEADS: Full Width Bottom */}
          <div className="col-span-12">
            <LeadOverview />
          </div>
        </div>
      </div>
    </>
  );
}
