import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import API from "../../config/api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const CollectPayment = () => {
    const [activeTab, setActiveTab] = useState("student"); // student or lead
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedPayer, setSelectedPayer] = useState(null);

    const [formData, setFormData] = useState({
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: "Cash",
        transactionId: "",
        remarks: ""
    });
    const [submitting, setSubmitting] = useState(false);

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 2) {
                performSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, activeTab]);

    const performSearch = async () => {
        setSearching(true);
        try {
            const endpoint = activeTab === 'student' ? `${API}/students/all` : `${API}/customers/all`;
            // Start with broad search, filter client side for now as simpler search API might not exist yet
            // In prod, use specific search endpoint
            const response = await axios.get(endpoint, { withCredentials: true });

            const data = activeTab === 'student' ? response.data.students : response.data.customers;

            const filtered = data.filter(item => {
                const name = item.fullName || `${item.firstName} ${item.lastName}`;
                const phone = item.phone || item.phone1;
                const search = searchQuery.toLowerCase();
                return name.toLowerCase().includes(search) || (phone && phone.includes(search));
            }).slice(0, 5); // Limit to 5 results

            setSearchResults(filtered);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectPayer = (payer) => {
        setSelectedPayer(payer);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPayer) {
            toast.error("Please select a Student or Lead");
            return;
        }
        if (!formData.amount || formData.amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                studentId: activeTab === 'student' ? selectedPayer._id : undefined,
                leadId: activeTab === 'lead' ? selectedPayer._id : undefined,
                brandId: selectedPayer.brand // Associate with payer's brand
            };

            await axios.post(`${API}/payments/create`, payload, { withCredentials: true });

            toast.success("Payment recorded successfully!");
            // Reset form
            setFormData({
                amount: "",
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMode: "Cash",
                transactionId: "",
                remarks: ""
            });
            setSelectedPayer(null);
        } catch (error) {
            console.error("Payment submission error:", error);
            toast.error(error.response?.data?.message || "Failed to record payment");
        } finally {
            setSubmitting(false);
        }
    };

    const paymentModes = [
        { value: "Cash", label: "Cash" },
        { value: "Bank Transfer", label: "Bank Transfer" },
        { value: "UPI", label: "UPI" },
        { value: "Cheque", label: "Cheque" },
        { value: "Card", label: "Card" },
        { value: "Online", label: "Online" }
    ];

    return (
        <div>
            <PageMeta title="Collect Payment" description="Record received payments" />
            <PageBreadcrumb pageTitle="Collect Payment" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Selection Panel */}
                <div className="space-y-6">
                    <ComponentCard title="Select This Payer">
                        <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                            <button
                                className={`pb-2 px-4 font-medium ${activeTab === 'student' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}
                                onClick={() => { setActiveTab('student'); setSelectedPayer(null); }}
                            >
                                Student
                            </button>
                            <button
                                className={`pb-2 px-4 font-medium ${activeTab === 'lead' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}
                                onClick={() => { setActiveTab('lead'); setSelectedPayer(null); }}
                            >
                                Lead
                            </button>
                        </div>

                        <div className="relative">
                            <Label>Search by Name or Phone</Label>
                            <Input
                                placeholder="Type to search..."
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
                                            onClick={() => handleSelectPayer(item)}
                                        >
                                            <p className="font-medium text-gray-800 dark:text-white">
                                                {item.fullName || `${item.firstName} ${item.lastName}`}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.email} | {item.phone || item.phone1}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedPayer && (
                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Selected Payer Details</h4>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                    <p><span className="font-medium">Name:</span> {selectedPayer.fullName || `${selectedPayer.firstName} ${selectedPayer.lastName}`}</p>
                                    <p><span className="font-medium">Phone:</span> {selectedPayer.phone || selectedPayer.phone1}</p>
                                    <p><span className="font-medium">Email:</span> {selectedPayer.email}</p>
                                </div>
                                <Button
                                    className="mt-3 text-xs"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedPayer(null)}
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        )}
                    </ComponentCard>
                </div>

                {/* Payment Form Panel */}
                <div>
                    <ComponentCard title="Payment Details">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label required>Amount</Label>
                                <Input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    disabled={!selectedPayer}
                                    min="0"
                                />
                            </div>

                            <div>
                                <Label required>Date</Label>
                                <Input
                                    type="date"
                                    name="paymentDate"
                                    value={formData.paymentDate}
                                    onChange={handleInputChange}
                                    disabled={!selectedPayer}
                                />
                            </div>

                            <div>
                                <Label required>Mode</Label>
                                <Select
                                    options={paymentModes}
                                    value={formData.paymentMode}
                                    onChange={(val) => setFormData(prev => ({ ...prev, paymentMode: val }))}
                                    disabled={!selectedPayer}
                                />
                            </div>

                            <div>
                                <Label>Transaction ID (Optional)</Label>
                                <Input
                                    name="transactionId"
                                    value={formData.transactionId}
                                    onChange={handleInputChange}
                                    disabled={!selectedPayer}
                                    placeholder="e.g. UPI Ref Number"
                                />
                            </div>

                            <div>
                                <Label>Remarks</Label>
                                <Input
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    disabled={!selectedPayer}
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    disabled={!selectedPayer || submitting}
                                >
                                    {submitting ? "Processing..." : "Receive Payment"}
                                </Button>
                            </div>
                        </form>
                    </ComponentCard>
                </div>
            </div>
        </div>
    );
};

export default CollectPayment;
