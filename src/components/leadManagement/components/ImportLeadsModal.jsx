import React from "react";
import axios from "axios";
import Papa from "papaparse";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { DownloadIcon } from "../../../icons";
import { toast } from "react-toastify";
import { fetchCustomers } from "../leadDataManagement";
import API from "../../../config/api";

/**
 * ImportLeadsModal
 * CSV import modal with template download + file upload + API call.
 */
const ImportLeadsModal = ({ isOpen, onClose, isSubmitting, setIsSubmitting, setData, setLoading }) => {
    const downloadTemplate = () => {
        const headers = ["Full Name", "Phone", "Email", "Place", "Education", "Course Preference", "Contact Point", "Campaign", "Next Follow Up Date", "Remarks", "Lead Potential"];
        const sampleData = [
            ["John Doe", "9876543210", "john@example.com", "New York", "Bachelor's", "Python;Java", "Website", "Summer 2024", "2024-07-15", "Interested in backend", "strongProspect"],
            ["Jane Smith", "9123456789", "jane@test.com", "London", "Master's", "AWS", "LinkedIn", "Winter Sale", "2024-07-20", "Wants to switch career", "potentialProspect"],
        ];
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...sampleData].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lead_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = () => {
        const fileInput = document.getElementById('csv-upload');
        if (!fileInput || fileInput.files.length === 0) {
            toast.error("Please select a file first");
            return;
        }

        setIsSubmitting(true);
        const file = fileInput.files[0];

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const findKey = (keys, candidates) => {
                    if (!keys) return null;
                    const lowerKeys = keys.map(k => k.toLowerCase().trim());
                    for (const candidate of candidates) {
                        const index = lowerKeys.indexOf(candidate.toLowerCase());
                        if (index !== -1) return keys[index];
                    }
                    return null;
                };

                const headers = results.meta.fields || [];
                const nameKey = findKey(headers, ["Full Name", "Name", "Student Name", "Lead Name", "Enquiry Name"]);
                const phoneKey = findKey(headers, ["Phone", "Phone Number", "Mobile", "Contact", "Phone 1", "Contact Number"]);
                const emailKey = findKey(headers, ["Email", "Email Address", "Email ID"]);
                const placeKey = findKey(headers, ["Place", "City", "Location", "Address"]);
                const educationKey = findKey(headers, ["Education", "Qualification"]);
                const courseKey = findKey(headers, ["Course Preference", "Course", "Interest", "Subject"]);
                const contactPointKey = findKey(headers, ["Contact Point", "Source"]);
                const campaignKey = findKey(headers, ["Campaign"]);
                const followupKey = findKey(headers, ["Next Follow Up Date", "Follow Up Date", "Follow Up", "Date"]);
                const remarksKey = findKey(headers, ["Remarks", "Note", "Comment"]);
                const potentialKey = findKey(headers, ["Lead Potential", "Potential", "Status"]);
                const dateCreatedKey = findKey(headers, ["Date Created", "Created At", "Creation Date", "Date Added"]);

                if (!nameKey || !phoneKey) {
                    toast.error(`Missing required columns! Found: ${headers.join(", ")}. Need at least 'Name' and 'Phone'.`, { autoClose: 10000 });
                    setIsSubmitting(false);
                    return;
                }

                const parsedLeads = results.data.map(row => ({
                    fullName: row[nameKey],
                    phone1: row[phoneKey],
                    email: emailKey ? row[emailKey] : "",
                    place: placeKey ? row[placeKey] : "",
                    education: educationKey ? row[educationKey] : "Other",
                    coursePreference: courseKey ? row[courseKey] : "",
                    contactPoint: contactPointKey ? row[contactPointKey] : "Other",
                    campaign: campaignKey ? row[campaignKey] : "",
                    nextFollowUpDate: followupKey ? row[followupKey] : "",
                    remarks: remarksKey ? row[remarksKey] : "",
                    leadStatus: "new",
                    leadPotential: potentialKey ? (row[potentialKey] || "potentialProspect") : "potentialProspect",
                    createdAt: dateCreatedKey ? row[dateCreatedKey] : null,
                }));

                const validLeads = parsedLeads.filter(l => l.fullName && l.phone1);
                if (validLeads.length === 0) {
                    toast.error("No valid leads found in file. Check Name and Phone columns.");
                    setIsSubmitting(false);
                    return;
                }

                try {
                    const response = await axios.post(
                        `${API}/customers/import-leads`,
                        { leads: validLeads },
                        { withCredentials: true }
                    );

                    const { summary } = response.data;
                    if (summary.success > 0) {
                        toast.success(`Successfully imported ${summary.success} leads!`);
                        fetchCustomers(setData, setLoading);
                    }
                    if (summary.failed > 0) {
                        toast.warn(`${summary.failed} leads failed to import. Check console for details.`);
                        console.warn("Import Errors:", summary.errors);
                    }
                    onClose();
                } catch (error) {
                    console.error("Import failed:", error);
                    toast.error(error.response?.data?.message || "Import failed. Please try again.");
                } finally {
                    setIsSubmitting(false);
                }
            },
            error: (error) => {
                console.error("CSV Parse Error:", error);
                toast.error("Failed to parse CSV file.");
                setIsSubmitting(false);
            },
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Import Leads</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload a CSV file to bulk import your leads into the system.</p>
            </div>

            <div className="p-6">
                <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="bg-brand-50/50 dark:bg-brand-500/5 p-4 rounded-xl border border-brand-100 dark:border-brand-500/20 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-brand-700 dark:text-brand-400">Step 1: Get the template</h4>
                            <p className="text-xs text-brand-600/80 dark:text-brand-400/60 mt-0.5">Use our CSV template to ensure correct data formatting.</p>
                        </div>
                        <Button size="sm" variant="outline" className="bg-white dark:bg-gray-900" onClick={downloadTemplate}>
                            Download Sample
                        </Button>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Step 2: Upload your file</h4>
                        <div
                            className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-brand-300 dark:hover:border-brand-800 transition-colors cursor-pointer group"
                            onClick={() => document.getElementById('csv-upload').click()}
                        >
                            <div className="size-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 transition-colors">
                                <DownloadIcon className="size-6 text-gray-400 group-hover:text-brand-500 rotate-180" />
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-400 mt-1">Only CSV files are supported (max 5MB)</p>
                            <input
                                type="file"
                                id="csv-upload"
                                className="hidden"
                                accept=".csv"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
                                            toast.error("Please upload a valid CSV file");
                                            return;
                                        }
                                        toast.info(`Processing ${file.name}...`);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="flex gap-3 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="size-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] text-white font-bold">i</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Important Notes:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Ensure dates are in YYYY-MM-DD format.</li>
                                <li>"Full Name" and "Phone" are required fields.</li>
                                <li>"Course Preference" can be multiple items separated by semi-colons.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="primary" loading={isSubmitting} onClick={handleImport}>Confirm Import</Button>
            </div>
        </Modal>
    );
};

export default ImportLeadsModal;
