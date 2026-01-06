import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

const RecordPaymentModal = ({ isOpen, onClose, invoice, onPaymentRecorded }) => {
    const [formData, setFormData] = useState({
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: "Cash",
        referenceNumber: "",
        notes: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (invoice) {
            // Calculate effective balance due
            // If balanceDue is present and > 0, use it.
            // If status is Paid, balance is 0.
            // Otherwise if balanceDue is 0 (likely default legacy), calculate it.
            let effectiveBalance = invoice.balanceDue;

            if (invoice.status === 'Paid') {
                effectiveBalance = 0;
            } else {
                effectiveBalance = invoice.totalAmount - (invoice.amountReceived || 0);
            }

            setFormData(prev => ({
                ...prev,
                amount: effectiveBalance // Default to full balance
            }));
        }
    }, [invoice]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${API}/receipts`, {
                ...formData,
                invoiceId: invoice._id
            }, { withCredentials: true });

            toast.success("Payment recorded successfully!");
            onPaymentRecorded(); // Refresh parent data
            onClose();
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error.response?.data?.message || "Failed to record payment");
        } finally {
            setSubmitting(false);
        }
    };

    if (!invoice) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Record Payment</h3>
            <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Invoice Number:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">
                        {invoice.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance Due:</span>
                    <span className="font-bold text-red-500">
                        {((invoice.status === 'Paid' ? 0 : (invoice.totalAmount - (invoice.amountReceived || 0))) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount Received <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                        <input
                            type="number"
                            name="amount"
                            required
                            min="1"
                            max={invoice.status === 'Paid' ? 0 : (invoice.totalAmount - (invoice.amountReceived || 0))}
                            value={formData.amount}
                            onChange={handleChange}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="paymentDate"
                            required
                            value={formData.paymentDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payment Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="paymentMode"
                            value={formData.paymentMode}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Online">Online</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reference Number
                    </label>
                    <input
                        type="text"
                        name="referenceNumber"
                        placeholder="e.g. Transaction ID, Cheque No."
                        value={formData.referenceNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                    </label>
                    <textarea
                        name="notes"
                        rows="2"
                        value={formData.notes}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={submitting}>
                        Record Payment
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default RecordPaymentModal;
