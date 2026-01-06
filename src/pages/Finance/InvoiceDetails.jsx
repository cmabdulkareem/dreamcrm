import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import API from "../../config/api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/ui/button/Button";
import { FileIcon, DownloadIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";

const InvoiceDetails = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef();

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

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;
    if (!invoice) return <div className="text-center p-10">Invoice not found.</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <PageMeta title={`Invoice ${invoice.invoiceNumber}`} description="View invoice details" />

            <div className="flex justify-between items-center mb-6 print:hidden">
                <PageBreadcrumb pageTitle="Invoice Details" />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <FileIcon className="size-4 mr-2" />
                        Print
                    </Button>
                    {/* Add more actions if needed */}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden print:shadow-none print:border-0" id="print-area">
                {/* Header Section */}
                <div className="bg-gray-50 dark:bg-gray-800 p-8 flex justify-between items-start border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <div className="mb-4">
                            {invoice.brand?.logo ? (
                                <img src={invoice.brand.logo} alt="Brand Logo" className="h-12 w-auto mb-2" />
                            ) : (
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">
                                    {invoice.brand?.name}
                                </h2>
                            )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p>{invoice.brand?.address}</p>
                            <p>Phone: {invoice.brand?.phone}</p>
                            <p>Email: {invoice.brand?.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-brand-600 mb-2">INVOICE</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">#{invoice.invoiceNumber}</p>
                        <div className="mt-4">
                            <Badge variant={invoice.status === 'Paid' ? 'success' : 'warning'}>
                                {invoice.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Billing Info */}
                <div className="p-8 grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-wider">Bill To:</h4>
                        <div className="text-gray-800 dark:text-gray-200">
                            <p className="font-bold text-base mb-1">{invoice.customer?.fullName}</p>
                            <p className="text-sm">{invoice.customer?.email}</p>
                            <p className="text-sm">{invoice.customer?.phone1}</p>
                            <p className="text-sm">{invoice.customer?.place}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="space-y-2">
                            <p className="text-sm">
                                <span className="text-gray-500 dark:text-gray-400 font-medium mr-2">Invoice Date:</span>
                                <span className="text-gray-800 dark:text-gray-200 font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                            </p>
                            {invoice.dueDate && (
                                <p className="text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium mr-2">Due Date:</span>
                                    <span className="text-gray-800 dark:text-gray-200 font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="p-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-100 dark:border-gray-800">
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-24">Qty</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right w-32">Rate</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right w-32">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-5 text-gray-800 dark:text-gray-200 font-medium">{item.description}</td>
                                    <td className="py-5 text-gray-600 dark:text-gray-400 text-center">{item.quantity}</td>
                                    <td className="py-5 text-gray-600 dark:text-gray-400 text-right">{item.rate.toLocaleString()}</td>
                                    <td className="py-5 text-gray-800 dark:text-gray-200 font-semibold text-right">{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="flex justify-between items-start">
                        <div className="w-1/2">
                            {invoice.notes && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Notes:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.notes}</p>
                                </div>
                            )}
                            {invoice.terms && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Terms:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">{invoice.terms}</p>
                                </div>
                            )}
                        </div>
                        <div className="w-1/3 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Sub Total</span>
                                <span className="text-gray-800 dark:text-gray-200 font-semibold">{invoice.subTotal.toLocaleString()}</span>
                            </div>
                            {invoice.tax > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Tax (%)</span>
                                    <span className="text-gray-800 dark:text-gray-200 font-semibold">{invoice.tax}%</span>
                                </div>
                            )}
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span className="font-medium">Discount</span>
                                    <span className="font-semibold">-{invoice.discount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t-2 border-gray-100 dark:border-gray-700 flex justify-between items-center text-xl font-bold">
                                <span className="text-gray-800 dark:text-white uppercase">Total</span>
                                <span className="text-brand-600 tracking-tight">{invoice.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-8 text-center border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Thank you for your business!
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-area, #print-area * {
                        visibility: visible;
                    }
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            ` }} />
        </div>
    );
};

export default InvoiceDetails;
