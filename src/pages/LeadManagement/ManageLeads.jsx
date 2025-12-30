import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import RecentOrders from "../../components/ecommerce/RecentOrders";

export default function Blank() {
  return (
    <div>
      <PageMeta
        title="Manage Leads | DreamCRM, You can manage enquiries here"
        description="This is where we manage enquiries"
      />
      <PageBreadcrumb pageTitle="Manage Your Leads Here" />
      <RecentOrders />
    </div>
  );
}
