import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import RecentOrders from "../../components/ecommerce/RecentOrders";

export default function Blank() {
  return (
    <div>
      <PageMeta
        title="Manage Leads | DreamCRM, You can manage enquiries here"
        description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Manage Your Leads Here" />
      <RecentOrders />
    </div>
  );
}
