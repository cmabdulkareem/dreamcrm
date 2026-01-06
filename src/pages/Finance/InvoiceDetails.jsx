import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import API from "../../config/api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import InvoiceViewer from "../../components/finance/InvoiceViewer";

const InvoiceDetails = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const response = await axios.get(`${API}/invoices/${id}`, { withCredentials: true });
            setInvoice(response.data);
        } catch (error) {
            console.error("Error fetching invoice:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;
    if (!invoice) return <div className="text-center p-10">Invoice not found.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <PageMeta title={`Invoice ${invoice.invoiceNumber}`} description="View invoice details" />

            <div className="flex justify-between items-center mb-6 print:hidden">
                <PageBreadcrumb pageTitle="Invoice Details" />
            </div>

            <InvoiceViewer invoice={invoice} />
        </div>
    );
};

export default InvoiceDetails;
