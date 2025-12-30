import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import LeadOverview from "../../components/ecommerce/LeadOverview";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import LeadStatusBreakdown from "../../components/ecommerce/LeadStatusBreakdown";
import FollowUpsDue from "../../components/ecommerce/FollowUpsDue";
import LeaderboardCard from "../../components/ecommerce/LeaderboardCard";
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

        {/* Key Metrics - 4 columns */}
        <EcommerceMetrics />

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Left Column - Charts & detailed lists */}
          <div className="col-span-12 space-y-6 xl:col-span-8">
            {/* Monthly Revenue Chart */}
            <MonthlySalesChart />

            {/* Lead vs Conversion Chart */}
            <StatisticsChart />

            {/* Follow-ups Due - moved here to balance height */}
            <FollowUpsDue />
          </div>

          {/* Right Column - Targets, Leaderboard & Stats */}
          <div className="col-span-12 space-y-6 xl:col-span-4">
            {/* Monthly Target */}
            <MonthlyTarget />

            {/* Leaderboard */}
            <LeaderboardCard />

            {/* Lead Status Breakdown */}
            <LeadStatusBreakdown />

            {/* Demographics */}
            <DemographicCard />
          </div>

          {/* Recent Leads - Full Width */}
          <div className="col-span-12">
            <LeadOverview />
          </div>
        </div>
      </div>
    </>
  );
}
