import { FileIcon } from "../../icons";
import Button from "../ui/button/Button";

const ReceiptVoucher = ({ receipt, onPrint, onClose }) => {
    if (!receipt) return null;

    const handlePrint = () => {
        if (onPrint) {
            onPrint();
        } else {
            window.print();
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8 mt-2 print:hidden px-4">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center">
                            ← Back to Invoice
                        </button>
                    )}
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Receipt Voucher</h3>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center text-xs h-10 border-gray-300 dark:border-gray-600 px-4">
                        <FileIcon className="size-4.5 mr-2 text-green-600" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-sm overflow-hidden p-8 sm:p-14 print:p-0 print:shadow-none print:border-0" id="print-area">
                {/* Brand & Header */}
                <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            {receipt.brand?.logo ? (
                                <img src={receipt.brand.logo} alt="Brand Logo" className="h-14 w-auto" />
                            ) : (
                                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                    {receipt.brand?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                {receipt.brand?.name}
                            </h2>
                            <div className="text-[13px] text-gray-500 dark:text-gray-400 leading-normal max-w-[250px]">
                                <p>{receipt.brand?.address}</p>
                                <p>{receipt.brand?.phone}</p>
                                <p>{receipt.brand?.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-light text-gray-800 dark:text-gray-100 mb-1 tracking-tight">PAYMENT RECEIPT</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receipt# <span className="text-gray-900 dark:text-white font-medium">{receipt.receiptNumber}</span>
                        </p>
                    </div>
                </div>

                <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-8 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 px-4">
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Payment Date</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {new Date(receipt.paymentDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Payment Mode</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{receipt.paymentMode}</span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Reference #</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{receipt.referenceNumber || '-'}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Amount Received</span>
                        <span className="text-xl font-bold text-green-600">
                            {receipt.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                    </div>
                </div>

                <div className="mb-12">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        Received with thanks from <span className="font-bold text-gray-900 dark:text-white">{receipt.customer?.fullName}</span> for payment of Invoice <span className="font-bold text-gray-900 dark:text-white">#{receipt.invoice?.invoiceNumber}</span>.
                    </p>

                    {receipt.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded text-sm text-yellow-800 dark:text-yellow-200">
                            <span className="font-bold block mb-1">Notes:</span>
                            {receipt.notes}
                        </div>
                    )}
                </div>

                {/* Footer Signature */}
                <div className="mt-20 flex justify-end">
                    <div className="text-center">
                        <div className="h-16 mb-2 border-b border-gray-300 w-48"></div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Authorized Signature</p>
                    </div>
                </div>
            </div>

            <style type="text/css" media="print">
                {`
                @page { size: auto; margin: 0mm; }
                body { visibility: hidden; }
                #print-area { 
                    visibility: visible; 
                    position: absolute; 
                    left: 0; 
                    top: 0; 
                    width: 100%; 
                    margin: 0;
                    padding: 20px 40px !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                #print-area * { visibility: visible; }
            `}
            </style>
        </div>
    );
};

export default ReceiptVoucher;
