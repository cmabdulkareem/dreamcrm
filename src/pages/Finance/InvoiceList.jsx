import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API from "../../config/api";
import { AuthContext } from "../../context/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/ui/badge/Badge";
import { EyeIcon, PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";

const InvoiceList = () => {
    const { selectedBrand } = useContext(AuthContext);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, [selectedBrand]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const url = selectedBrand ? `${API}/invoices?brand=${selectedBrand}` : `${API}/invoices`;
            const response = await axios.get(url, { withCredentials: true });
            setInvoices(response.data);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'success';
            case 'Draft': return 'light';
            case 'Sent': return 'primary';
            case 'Partial': return 'warning';
            case 'Overdue': return 'error';
            case 'Void': return 'error';
            default: return 'light';
        }
    };

    return (
        <div>
            <PageMeta title="Manage Invoices" description="View and manage all invoices" />
            <div className="flex justify-between items-center mb-6">
                <PageBreadcrumb pageTitle="Manage Invoices" />
                <Link to="/finance/generate-invoice">
                    <Button variant="primary" size="sm">
                        <PlusIcon className="size-4 mr-2" />
                        New Invoice
                    </Button>
                </Link>
            </div>

            <ComponentCard title="All Invoices">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <LoadingSpinner />
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No invoices found for this brand.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 leading-[1.3]">Invoice #</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 leading-[1.3]">Customer</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 leading-[1.3]">Date</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 leading-[1.3]">Due Date</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 leading-[1.3]">Amount</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 leading-[1.3]">Status</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 leading-[1.3]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {invoices.map((invoice) => (
                                    <tr key={invoice._id}>
                                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300 font-medium">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                                            {invoice.customer?.fullName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-300">
                                            {invoice.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Badge variant={getStatusColor(invoice.status)}>
                                                {invoice.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Link
                                                to={`/finance/invoices/${invoice._id}`}
                                                className="text-gray-500 hover:text-brand-500 transition"
                                            >
                                                <EyeIcon className="size-5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ComponentCard>
        </div>
    );
};

export default InvoiceList;
