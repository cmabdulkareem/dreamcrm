import { useState, useEffect } from "react";
import axios from "axios";
import { FileIcon, PencilIcon, RupeeIcon, PaperAirplaneIcon } from "../../icons";
import Button from "../ui/button/Button";
import ReceiptVoucher from "./ReceiptVoucher";

const API = import.meta.env.VITE_API_URL;

const InvoiceViewer = ({ invoice, onPrint, onEdit, onMarkAsSent, showHeader = true }) => {
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    useEffect(() => {
        if (invoice?._id) {
            fetchReceipts();
        }
    }, [invoice]);

    const fetchReceipts = async () => {
        try {
            const response = await axios.get(`${API}/receipts/invoice/${invoice._id}`, { withCredentials: true });
            setReceipts(response.data);
        } catch (error) {
            console.error("Error fetching receipts:", error);
        }
    };

    const handlePrint = () => {
        if (onPrint) {
            onPrint();
        } else {
            window.print();
        }
    };

    if (!invoice) return null;

    if (selectedReceipt) {
        return (
            <ReceiptVoucher
                receipt={selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
            />
        );
    }

    return (
        <div className="w-full">
            {showHeader && (
                <div className="flex justify-between items-center mb-8 mt-2 print:hidden px-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Invoice Preview</h3>
                    <div className="flex gap-2.5 pr-20">
                        {onEdit && invoice.status !== 'Paid' && (
                            <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center text-xs h-10 border-gray-300 dark:border-gray-600 px-4">
                                <PencilIcon className="size-4 mr-2 text-blue-600" />
                                Edit
                            </Button>
                        )}
                        {onMarkAsSent && invoice.status === 'Draft' && (
                            <Button variant="outline" size="sm" onClick={onMarkAsSent} className="flex items-center text-xs h-10 border-gray-300 dark:border-gray-600 px-4 hover:border-blue-500 hover:text-blue-600">
                                <PaperAirplaneIcon className="size-4 mr-2 text-blue-600" />
                                Mark as Sent
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center text-xs h-10 border-gray-300 dark:border-gray-600 px-4">
                            <FileIcon className="size-4.5 mr-2 text-green-600" />
                            Print / PDF
                        </Button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-sm overflow-hidden p-8 sm:p-14 print:shadow-none print:border-0" id="print-area">
                {/* Brand & Invoice Header */}
                <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <img src="/images/logo/logo.svg" alt="DreamCRM Logo" className="h-10 w-auto print:h-12" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white print:text-black leading-tight">
                                {invoice.brand?.name || 'DreamCRM'}
                            </h2>
                            <div className="text-[13px] text-gray-500 dark:text-gray-400 print:text-gray-600 leading-normal max-w-[250px]">
                                <p>3rd Floor, Square 9 Mall,</p>
                                <p>New Bus Stand Jn, Kasaragod.</p>
                                <p>Kerala - 671121</p>
                                {invoice.brand?.phone && <p>{invoice.brand.phone}</p>}
                                {invoice.brand?.email && <p>{invoice.brand.email}</p>}
                            </div>
                        </div>
                    </div>
                    {/* Invoice Meta */}
                    <div className="text-right">
                        <h1 className="text-5xl font-normal text-gray-800 dark:text-gray-100 print:text-black mb-1 tracking-tight">Invoice</h1>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 print:text-gray-600 mb-6">
                            Invoice# <span className="text-gray-900 dark:text-white print:text-black font-medium">{invoice.invoiceNumber}</span>
                        </p>
                        <div className="flex flex-col items-end gap-1">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px]">Balance Due</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white print:text-black">
                                {((invoice.status === 'Paid' ? 0 : (invoice.totalAmount - (invoice.amountReceived || 0))) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Info & Dates */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white print:text-black mb-1">
                            {invoice.customer?.fullName}
                        </h3>
                        <div className="text-[13px] text-gray-600 dark:text-gray-300 print:text-gray-600 leading-relaxed">
                            {invoice.customer?.address && <p>{invoice.customer.address}</p>}
                            <p>{invoice.customer?.phone || invoice.customer?.phone1}</p>
                            <p>{invoice.customer?.email}</p>
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="flex justify-end gap-8 text-[13px]">
                            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Invoice Date :</span>
                            <span className="font-semibold text-gray-900 dark:text-white print:text-black w-24">
                                {new Date(invoice.invoiceDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-end gap-8 text-[13px]">
                            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Due Date :</span>
                            <span className="font-semibold text-gray-900 dark:text-white print:text-black w-24">
                                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                            </span>
                        </div>
                        <div className="flex justify-end gap-8 text-[13px]">
                            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Terms :</span>
                            <span className="font-semibold text-gray-900 dark:text-white print:text-black w-24">
                                {invoice.terms || 'Due On Receipt'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full">
                        <thead className="bg-gray-700 text-white">
                            <tr>
                                <th className="py-2 px-3 text-left text-[11px] font-bold uppercase tracking-wider w-12 border-r border-gray-600">#</th>
                                <th className="py-2 px-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-gray-600">Item & Description</th>
                                <th className="py-2 px-3 text-right text-[11px] font-bold uppercase tracking-wider w-20 border-r border-gray-600">Qty</th>
                                <th className="py-2 px-3 text-right text-[11px] font-bold uppercase tracking-wider w-24 border-r border-gray-600">Rate</th>
                                <th className="py-2 px-3 text-right text-[11px] font-bold uppercase tracking-wider w-20 border-r border-gray-600">Discount</th>
                                <th className="py-2 px-3 text-right text-[11px] font-bold uppercase tracking-wider w-28">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {invoice.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-3 text-[13px] text-gray-500 text-center">{index + 1}</td>
                                    <td className="py-3 px-3">
                                        <p className="text-[13px] font-bold text-gray-900 dark:text-white print:text-black mb-0.5">{item.description}</p>
                                        <p className="text-[11px] text-gray-500 italic">Standard service description</p>
                                    </td>
                                    <td className="py-3 px-3 text-right text-[13px] text-gray-600 dark:text-gray-300 print:text-gray-600">
                                        {Number(item.quantity).toFixed(2)}
                                    </td>
                                    <td className="py-3 px-3 text-right text-[13px] text-gray-600 dark:text-gray-300 print:text-gray-600">
                                        {Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3 px-3 text-right text-[13px] text-gray-600 dark:text-gray-300 print:text-gray-600">
                                        {Number(0).toFixed(2)}
                                    </td>
                                    <td className="py-3 px-3 text-right text-[13px] font-semibold text-gray-900 dark:text-white print:text-black">
                                        {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 max-w-sm space-y-3">
                        <div className="flex justify-between text-[13px] text-gray-600 dark:text-gray-400 print:text-gray-600">
                            <span>Sub Total</span>
                            <span className="font-medium text-gray-900 dark:text-white print:text-black">
                                {invoice.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between text-[13px] text-gray-600 dark:text-gray-400 print:text-gray-600">
                            <span>Total</span>
                            <span className="font-bold text-gray-900 dark:text-white print:text-black">
                                {(invoice.totalAmount + (parseFloat(invoice.discount) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        {parseFloat(invoice.tax) > 0 && (
                            <div className="flex justify-between text-[13px] text-gray-600 dark:text-gray-400">
                                <span>Tax ({invoice.tax}%)</span>
                                <span>{((invoice.subTotal * invoice.tax) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        {parseFloat(invoice.discount) > 0 && (
                            <div className="flex justify-between text-[13px] text-red-500 dark:text-red-400">
                                <span>Discount</span>
                                <span>-{Number(invoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-bold text-gray-900 dark:text-white print:text-black">Total</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white print:text-black">
                                {invoice.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[13px] text-red-500 pt-1">
                            <span>Payment Made</span>
                            <span>(-) {((invoice.amountReceived || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <span className="text-sm font-bold text-gray-900 dark:text-white print:text-black">Balance Due</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white print:text-black">
                                {((invoice.status === 'Paid' ? 0 : (invoice.totalAmount - (invoice.amountReceived || 0))) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payments Section */}
                {receipts.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-dashed border-gray-300 dark:border-gray-700">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white print:text-black uppercase tracking-wider mb-4">Payments Received</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-2 font-semibold">Date</th>
                                        <th className="px-4 py-2 font-semibold">Receipt #</th>
                                        <th className="px-4 py-2 font-semibold">Mode</th>
                                        <th className="px-4 py-2 font-semibold text-right">Amount</th>
                                        <th className="px-4 py-2 font-semibold text-center print:hidden">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {receipts.map((receipt) => (
                                        <tr key={receipt._id} className="hover:bg-white dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                                                {new Date(receipt.paymentDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2 font-medium text-brand-600 dark:text-brand-400">
                                                {receipt.receiptNumber}
                                            </td>
                                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                                                {receipt.paymentMode}
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-green-600 dark:text-green-400">
                                                {receipt.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                            </td>
                                            <td className="px-4 py-2 text-center print:hidden">
                                                <button
                                                    onClick={() => setSelectedReceipt(receipt)}
                                                    className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline"
                                                >
                                                    View Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Invoice Footer */}
                {(invoice.notes || invoice.terms) && (
                    <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800">
                        {invoice.notes && (
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</h4>
                                <p className="text-[13px] text-gray-600 dark:text-gray-400">{invoice.notes}</p>
                            </div>
                        )}
                        {invoice.terms && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Terms & Conditions</h4>
                                <p className="text-[13px] text-gray-600 dark:text-gray-400">{invoice.terms}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes & Footer */}
                <div className="space-y-8">
                    <div>
                        <h4 className="text-[12px] font-bold text-gray-400 mb-1">Notes</h4>
                        <p className="text-[13px] text-gray-600 dark:text-gray-300">Thanks for your business.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-gray-900 py-1 print:hidden">
                        <span className="text-[12px] text-gray-400">Payment Options</span>
                        <div className="flex gap-4">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-[14px]" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-[10px]" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="text-[12px] font-bold text-gray-400 mb-1">Terms & Conditions</h4>
                        <p className="text-[13px] text-gray-600 dark:text-gray-300 italic">Please pay the Invoice before the due date.</p>
                    </div>

                    <div className="pt-20 text-center opacity-30 pointer-events-none pb-4">
                        <p className="text-[10px] text-gray-400">Authorized Signatory</p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
@media print {
    @page {
        margin: 0;
        size: auto;
    }
    body {
        margin: 0;
        padding: 0;
        background: white !important;
    }

    /* Ensure background colors are printed */
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    /* Hide everything by default */
    body * {
        visibility: hidden !important;
    }

    /* Show only print area and its children */
    #print-area, #print-area * {
        visibility: visible !important;
    }

    /* Position the print area */
    #print-area {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        background: white !important;
        z-index: 2147483647 !important; /* Max z-index */
    }

    .print\\:hidden {
        display: none !important;
    }
}
` }} />
        </div>
    );
};

export default InvoiceViewer;
