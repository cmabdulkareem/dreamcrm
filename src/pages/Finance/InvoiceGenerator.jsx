// Version: 1.3 - Search converted customers including students
import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import API from "../../config/api";
import { AuthContext } from "../../context/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { PlusIcon, TrashBinIcon } from "../../icons";

const InvoiceGenerator = () => {
    const { selectedBrand } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [items, setItems] = useState([
        { description: "", quantity: 1, rate: 0, amount: 0 }
    ]);

    const [invoiceData, setInvoiceData] = useState({
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: "",
        tax: 0,
        discount: 0,
        notes: "",
        terms: "",
        status: "Draft"
    });

    const [subTotal, setSubTotal] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);
    const [fetchingInvoice, setFetchingInvoice] = useState(false);

    // Check for edit mode
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('edit');
        if (id) {
            setEditId(id);
            fetchInvoiceForEdit(id);
        }
    }, []);

    const fetchInvoiceForEdit = async (id) => {
        setFetchingInvoice(true);
        try {
            const response = await axios.get(`${API}/invoices/${id}`, { withCredentials: true });
            const invoice = response.data;

            setSelectedCustomer(invoice.customer);
            setItems(invoice.items);
            setInvoiceData({
                invoiceDate: invoice.invoiceDate.split('T')[0],
                dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : "",
                tax: invoice.tax,
                discount: invoice.discount,
                notes: invoice.notes,
                terms: invoice.terms,
                status: invoice.status
            });
        } catch (error) {
            console.error("Error fetching invoice for edit:", error);
            toast.error("Failed to load invoice for editing");
        } finally {
            setFetchingInvoice(false);
        }
    };

    // Debounced search for customers
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 2) {
                performSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const performSearch = async () => {
        setSearching(true);
        try {
            // Include students in the search (some converted leads might have already taken admission)
            const endpoint = `${API}/customers/converted?includeStudents=true`;

            const response = await axios.get(endpoint, { withCredentials: true });
            const data = response.data.customers || response.data;

            const filtered = data.filter(item => {
                const name = item.fullName || `${item.firstName} ${item.lastName}`;
                const phone = item.phone || item.phone1;
                const search = searchQuery.toLowerCase();
                return name.toLowerCase().includes(search) || (phone && phone.includes(search));
            }).slice(0, 5);

            setSearchResults(filtered);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    useEffect(() => {
        const calculatedSubTotal = items.reduce((sum, item) => sum + item.amount, 0);
        setSubTotal(calculatedSubTotal);

        const taxVal = parseFloat(invoiceData.tax) || 0;
        const discountVal = parseFloat(invoiceData.discount) || 0;

        const taxAmount = (calculatedSubTotal * taxVal) / 100;
        setTotalAmount(calculatedSubTotal + taxAmount - discountVal);
    }, [items, invoiceData.tax, invoiceData.discount]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) {
            toast.error("Please select a customer");
            return;
        }
        if (!selectedBrand) {
            toast.error("Please select a brand from the header");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...invoiceData,
                customer: selectedCustomer._id,
                items,
                subTotal,
                totalAmount,
                brand: selectedBrand?._id || selectedBrand?.id
            };

            if (editId) {
                await axios.patch(`${API}/invoices/${editId}`, payload, { withCredentials: true });
                toast.success("Invoice updated successfully!");
                setTimeout(() => window.location.href = '/finance/invoices', 1500);
            } else {
                await axios.post(`${API}/invoices`, payload, { withCredentials: true });
                toast.success("Invoice generated successfully!");
                // Reset form
                setItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
                setSelectedCustomer(null);
                setInvoiceData({
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: "",
                    tax: 0,
                    discount: 0,
                    notes: "",
                    terms: "",
                    status: "Draft"
                });
            }
        } catch (error) {
            console.error("Invoice submission error:", error);
            toast.error(error.response?.data?.message || `Failed to ${editId ? 'update' : 'generate'} invoice`);
        } finally {
            setSubmitting(false);
        }
    };

    if (fetchingInvoice) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

    return (
        <div className="max-w-5xl mx-auto">
            <PageMeta title={editId ? "Update Invoice" : "Generate Invoice"} description={editId ? "Edit existing invoice" : "Create a new invoice"} />
            <PageBreadcrumb pageTitle={editId ? `Update Invoice #${editId.substring(editId.length - 4)}` : "Generate Invoice"} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Customer Selection */}
                    <div className="lg:col-span-2">
                        <ComponentCard title="Customer Information">
                            {!selectedCustomer ? (
                                <div className="relative">
                                    <Label required>Search Customer</Label>
                                    <Input
                                        placeholder="Search by name or phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searching && <div className="absolute right-3 top-9"><LoadingSpinner size="sm" /></div>}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
                                            {searchResults.map((item) => (
                                                <div
                                                    key={item._id}
                                                    className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-700"
                                                    onClick={() => handleSelectCustomer(item)}
                                                >
                                                    <p className="font-medium text-gray-800 dark:text-white">
                                                        {item.fullName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.email} | {item.phone1}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-white">{selectedCustomer.fullName}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.email}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.phone1}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                                        Change
                                    </Button>
                                </div>
                            )}
                        </ComponentCard>
                    </div>

                    {/* Invoice Meta */}
                    <div className="lg:col-span-1">
                        <ComponentCard title="Invoice Details">
                            <div className="space-y-4">
                                <div>
                                    <Label required>Invoice Date</Label>
                                    <Input
                                        type="date"
                                        value={invoiceData.invoiceDate}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={invoiceData.dueDate}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </ComponentCard>
                    </div>
                </div>

                {/* Items Table */}
                <ComponentCard title="Line Items">
                    <div className="overflow-x-auto -mx-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-700 text-white">
                                    <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider">Description</th>
                                    <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider w-20 text-center">Qty</th>
                                    <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider w-28 text-right">Rate</th>
                                    <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider w-28 text-right">Amount</th>
                                    <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-5 py-2">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none py-1 text-[13px] text-gray-900 dark:text-gray-100 font-medium"
                                                placeholder="Item description"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-5 py-2">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none py-1 text-center text-[13px] text-gray-900 dark:text-gray-100"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                min="1"
                                            />
                                        </td>
                                        <td className="px-5 py-2">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none py-1 text-right text-[13px] text-gray-900 dark:text-gray-100"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                                min="0"
                                            />
                                        </td>
                                        <td className="px-5 py-2 text-right font-semibold text-[13px] text-gray-900 dark:text-gray-100">
                                            {item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <TrashBinIcon className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="flex items-center text-xs h-8">
                            <PlusIcon className="size-3.5 mr-1.5" />
                            Add Row
                        </Button>
                    </div>
                </ComponentCard>

                {/* Totals and Footer */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <ComponentCard title="Notes & Terms">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-[12px]">Customer Notes</Label>
                                    <textarea
                                        className="w-full p-2.5 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700 text-[13px] focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                        rows="2"
                                        value={invoiceData.notes}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                                        placeholder="Thanks for your business"
                                    ></textarea>
                                </div>
                                <div>
                                    <Label className="text-[12px]">Terms & Conditions</Label>
                                    <textarea
                                        className="w-full p-2.5 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700 text-[13px] focus:ring-1 focus:ring-brand-500 outline-none transition-all italic"
                                        rows="2"
                                        value={invoiceData.terms}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, terms: e.target.value })}
                                        placeholder="Please pay by the due date"
                                    ></textarea>
                                </div>
                            </div>
                        </ComponentCard>
                    </div>
                    <div>
                        <ComponentCard title="Summary">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-gray-500 dark:text-gray-400">Sub Total</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{subTotal.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-gray-500 dark:text-gray-400">Tax (%)</span>
                                    <div className="w-20">
                                        <input
                                            type="number"
                                            className="w-full p-1.5 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700 text-right text-[13px] focus:ring-1 focus:ring-brand-500 outline-none"
                                            value={invoiceData.tax}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, tax: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-gray-500 dark:text-gray-400">Discount (Amt)</span>
                                    <div className="w-20">
                                        <input
                                            type="number"
                                            className="w-full p-1.5 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700 text-right text-[13px] focus:ring-1 focus:ring-brand-500 outline-none text-red-500"
                                            value={invoiceData.discount}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, discount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-900 dark:text-white font-bold text-[14px]">Total</span>
                                        <span className="text-brand-600 dark:text-brand-400 font-bold text-xl">
                                            {totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full py-3 h-12 rounded shadow-sm hover:shadow transition-all font-bold text-[15px]"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <LoadingSpinner size="sm" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (editId ? "Update Invoice" : "Generate Invoice")}
                                    </Button>
                                    {editId && (
                                        <button
                                            type="button"
                                            onClick={() => window.location.href = '/finance/invoices'}
                                            className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Discard Changes
                                        </button>
                                    )}
                                    <p className="text-center text-[11px] text-gray-400 mt-3 italic">
                                        * {editId ? "Changes will be applied immediately." : "Stored as Draft by default."}
                                    </p>
                                </div>
                            </div>
                        </ComponentCard>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InvoiceGenerator;
