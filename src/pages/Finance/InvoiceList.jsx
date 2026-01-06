import { useState, useEffect, useContext } from "react";
import axios from "axios";
import API from "../../config/api";
import { AuthContext } from "../../context/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/ui/badge/Badge";
import { PlusIcon, EyeIcon, PencilIcon, RupeeIcon, PaperAirplaneIcon } from "../../icons";
import { toast } from "react-toastify";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import InvoiceViewer from "../../components/finance/InvoiceViewer";
import RecordPaymentModal from "../../components/finance/RecordPaymentModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InvoiceList = () => {
    const { selectedBrand } = useContext(AuthContext);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState(null);

    useEffect(() => {
        fetchInvoices();
    }, [selectedBrand]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const brandId = selectedBrand?._id || selectedBrand?.id;
            const url = brandId ? `${API}/invoices?brand=${brandId}` : `${API}/invoices`;
            const response = await axios.get(url, { withCredentials: true });
            setInvoices(response.data);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleEditInvoice = (id) => {
        window.location.href = `/finance/generate-invoice?edit=${id}`;
    };

    const handleRecordPayment = (invoice) => {
        setPaymentInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentRecorded = () => {
        fetchInvoices();
        // optionally close modal or refresh viewer if open
        if (selectedInvoice && paymentInvoice && selectedInvoice._id === paymentInvoice._id) {
            // In a perfect world we re-fetch the single invoice, but refreshing list is ok.
            // Manually updating selectedInvoice to reflect new status would be nice if we had the data.
            // We can close the viewer modal to force refresh on next open
            setIsModalOpen(false);
        }
    };

    const handleMarkAsSent = async (invoice) => {
        try {
            await axios.patch(`${API}/invoices/${invoice._id}`, { status: 'Sent' }, { withCredentials: true });
            toast.success("Invoice marked as sent");
            fetchInvoices();
        } catch (error) {
            console.error("Error updating invoice status:", error);
            toast.error("Failed to update status");
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
                <Button variant="primary" size="sm" onClick={() => window.location.href = '/finance/generate-invoice'}>
                    <PlusIcon className="size-4 mr-2" />
                    New Invoice
                </Button>
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
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 leading-[1.3] text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
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
                                            {invoice.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Badge variant={getStatusColor(invoice.status)}>
                                                {invoice.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewInvoice(invoice)}
                                                    className="border-gray-300 hover:border-brand-500 text-gray-700 hover:text-brand-600 dark:border-gray-600 dark:text-gray-300"
                                                    title="View"
                                                >
                                                    <EyeIcon className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditInvoice(invoice._id)}
                                                    className="border-gray-300 hover:border-brand-500 text-gray-700 hover:text-brand-600 dark:border-gray-600 dark:text-gray-300"
                                                    disabled={invoice.status === 'Paid'}
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="size-4" />
                                                </Button>
                                                {invoice.status === 'Draft' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleMarkAsSent(invoice)}
                                                        className="border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300"
                                                        title="Mark as Sent"
                                                    >
                                                        <PaperAirplaneIcon className="size-4" />
                                                    </Button>
                                                )}
                                                {invoice.status !== 'Paid' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRecordPayment(invoice)}
                                                        className="border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-600 dark:border-gray-600 dark:text-gray-300"
                                                        title="Record Payment"
                                                    >
                                                        <RupeeIcon className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ComponentCard>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto my-8 custom-scrollbar">
                <div className="py-2">
                    {selectedInvoice && (
                        <InvoiceViewer
                            invoice={selectedInvoice}
                            onEdit={() => handleEditInvoice(selectedInvoice._id)}
                            onMarkAsSent={() => { handleMarkAsSent(selectedInvoice); setIsModalOpen(false); }}
                        />
                    )}
                </div>
            </Modal>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                invoice={paymentInvoice}
                onPaymentRecorded={handlePaymentRecorded}
            />
            <ToastContainer position="top-right" autoClose={3000} className="!z-[999999]" style={{ zIndex: 999999 }} />
        </div>
    );
};

export default InvoiceList;
