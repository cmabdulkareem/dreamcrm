import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import CombinedRevenueLeadsChart from "../../components/ecommerce/CombinedRevenueLeadsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
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

          {/* TOP SECTION: Metrics & Combined Chart (Left) + Timeline (Right) */}
          <div className="col-span-12 grid grid-cols-12 gap-6 items-stretch">
            {/* Left Block: Metrics + Combined Chart */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
              <EcommerceMetrics />
              <CombinedRevenueLeadsChart />
            </div>

            {/* Right Block: Activity Timeline (Master Alignment) */}
            <div className="col-span-12 xl:col-span-4 relative">
              <div className="absolute inset-0">
                <ActivityTimeline />
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: Follow Ups (Left) + Achievement (Right) */}
          <div className="col-span-12 grid grid-cols-12 gap-6 items-stretch">
            {/* Left Middle: Follow Ups (2/3 width) */}
            <div className="col-span-12 xl:col-span-8">
              <FollowUpsDue />
            </div>

            {/* Right Middle: Achievement (1/3 width) */}
            <div className="col-span-12 xl:col-span-4">
              <MonthlyTarget />
            </div>
          </div>

          {/* BOTTOM SECTION: Leaderboard (1/3) + Lead Status (1/3) + Demographic (1/3) */}
          {/* This ensures perfect horizontal alignment across the entire row */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
            <LeaderboardCard />
            <LeadStatusBreakdown />
            <DemographicCard />
          </div>

        </div>
      </div>
    </>
  );
}
