// Version: 1.1 - Fixed brand ID and customer search endpoint
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
            // The brand filter is automatically applied by the backend middleware
            // using the x-brand-id header provided by AuthContext
            const endpoint = `${API}/customers/all`;

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
        } catch (error) {
            console.error("Invoice submission error:", error);
            toast.error(error.response?.data?.message || "Failed to generate invoice");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <PageMeta title="Generate Invoice" description="Create a new invoice" />
            <PageBreadcrumb pageTitle="Generate Invoice" />

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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Description</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 w-24">Qty</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 w-32">Rate</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 w-32">Amount</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3">
                                            <Input
                                                placeholder="Item description"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                                min="1"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                type="number"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                                                min="0"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-500 hover:text-red-700 transition"
                                            >
                                                <TrashBinIcon className="size-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            <PlusIcon className="size-4 mr-2" />
                            Add Row
                        </Button>
                    </div>
                </ComponentCard>

                {/* Totals and Footer */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <ComponentCard title="Notes & Terms">
                            <div className="space-y-4">
                                <div>
                                    <Label>Customer Notes</Label>
                                    <textarea
                                        className="w-full p-2 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700 text-sm"
                                        rows="3"
                                        value={invoiceData.notes}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                                        placeholder="Notes will be visible to the customer"
                                    ></textarea>
                                </div>
                                <div>
                                    <Label>Terms & Conditions</Label>
                                    <textarea
                                        className="w-full p-2 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700 text-sm"
                                        rows="3"
                                        value={invoiceData.terms}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, terms: e.target.value })}
                                        placeholder="Standard terms and conditions"
                                    ></textarea>
                                </div>
                            </div>
                        </ComponentCard>
                    </div>
                    <div>
                        <ComponentCard title="Summary">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Sub Total</span>
                                    <span className="font-medium">{subTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Tax (%)</span>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            value={invoiceData.tax}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, tax: e.target.value })}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            value={invoiceData.discount}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, discount: e.target.value })}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-lg font-bold">
                                    <span className="text-gray-800 dark:text-white">Total</span>
                                    <span className="text-brand-600 font-bold">{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full py-3"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Generating..." : "Generate Invoice"}
                                    </Button>
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
