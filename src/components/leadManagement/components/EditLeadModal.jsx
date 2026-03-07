import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import Label from "../../form/Label";
import Input from "../../form/input/InputField";
import PhoneInput from "../../form/group-input/PhoneInput";
import DatePicker from "../../form/date-picker";
import MultiSelect from "../../form/MultiSelect";
import Select from "../../form/Select";
import Badge from "../../ui/badge/Badge";
import { Phone, MessageCircle } from "lucide-react";
import {
    CloseIcon,
    UserCircleIcon,
    CalendarIcon,
    FileIcon,
    BoltIcon,
    UserIcon,
    ChatIcon,
} from "../../../icons";
import {
    countries,
    enquirerGender,
    enquirerStatus,
    enquirerEducation,
    placeOptions,
    leadStatusOptions,
    leadPotentialOptions,
    immediateFollowupOptions,
} from "../../../data/DataSets";
import { formatDate, getLeadStatusColor, getLeadStatusLabel, getContactPointIcon } from "../leadHelpers";
import { isAdmin, isManager } from "../../../utils/roleHelpers";

/**
 * EditLeadModal
 * 3-column lead editing modal with fixed header and footer.
 */
const EditLeadModal = ({
    isOpen,
    onClose,
    // Form state
    fullName, setFullName,
    email, setEmail,
    phone1, setPhone1,
    phone2, setPhone2,
    gender, setGender,
    dob, setDob,
    place, setPlace,
    otherPlace, setOtherPlace,
    status, setStatus,
    education, setEducation,
    otherEducation, setOtherEducation,
    contactPoint, setContactPoint,
    otherContactPoint, setOtherContactPoint,
    campaign, setCampaign,
    followUpDate, setFollowUpDate,
    selectedValues, setSelectedValues,
    leadStatus, setLeadStatus,
    leadPotential, setLeadPotential,
    remarks, setRemarks,
    // Metadata
    selectedRow,
    error, // email validation error
    // Phone validation
    phoneExists,
    checkingPhone,
    validationErrors,
    // Submission
    isSubmitting,
    onSave,
    onEmailChange,
    onPhone1Change,
    // Options
    campaignOptions,
    dynamicCourseOptions,
    contactPointOptions,
    // Permissions
    user,
    brandIdForRoles,
    hasManagerRole,
    // Campaign handler
    onCampaignChange,
}) => {
    const canEditFields = isAdmin(user, brandIdForRoles) || hasManagerRole;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            overlayClassName="bg-black/5 backdrop-blur-none"
            className="max-w-6xl p-0 h-[90vh] overflow-hidden"
        >
            <div className="flex flex-col h-full bg-white dark:bg-gray-900">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white lg:text-2xl">Edit Lead</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage and update lead details, qualifications, and activity history.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <CloseIcon className="size-6 text-gray-400" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-hidden p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

                        {/* ===== Column 1: Form Details ===== */}
                        <div className="space-y-8 overflow-y-auto pr-3 brand-scrollbar">

                            {/* Section 1: Lead Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <UserCircleIcon className="size-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Lead Information</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName">Full Name *</Label>
                                        <input type="text" id="firstName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!canEditFields} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input type="email" value={email} error={error} onChange={onEmailChange} placeholder="Enter email" disabled={!canEditFields} />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="mb-0">Phone 1 *</Label>
                                            <div className="flex gap-2">
                                                <a href={`tel:${phone1}`} className="p-1 rounded bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors"><Phone className="size-3" /></a>
                                                <a href={`https://wa.me/${phone1.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors"><MessageCircle className="size-3" /></a>
                                            </div>
                                        </div>
                                        <PhoneInput selectPosition="end" countries={countries} value={phone1} onChange={onPhone1Change} error={!!validationErrors.phone1 || phoneExists} disabled={!canEditFields} />
                                        {checkingPhone && <p className="text-[10px] text-blue-500 mt-0.5 animate-pulse">Checking uniqueness...</p>}
                                        {validationErrors.phone1 && <p className="text-[10px] text-red-500 mt-0.5">{validationErrors.phone1}</p>}
                                    </div>
                                    <div>
                                        <Label>Phone 2</Label>
                                        <PhoneInput selectPosition="end" countries={countries} value={phone2} onChange={setPhone2} />
                                    </div>
                                    <div>
                                        <Label>Gender</Label>
                                        <Select options={enquirerGender} value={gender} onChange={setGender} />
                                    </div>
                                    <div>
                                        <DatePicker id="dob" label="DoB" value={dob} onChange={(_, str) => setDob(str)} />
                                    </div>
                                    <div>
                                        <Label>Place *</Label>
                                        <Select options={placeOptions} value={place} onChange={setPlace} />
                                    </div>
                                    {place === "Other" && (
                                        <div>
                                            <Label htmlFor="otherPlace">Specify other</Label>
                                            <Input type="text" id="otherPlace" value={otherPlace} onChange={(e) => setOtherPlace(e.target.value)} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Education & Interest */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <FileIcon className="size-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Education & Interest</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Current Status</Label>
                                        <Select options={enquirerStatus} value={status} onChange={setStatus} />
                                    </div>
                                    <div>
                                        <Label>Education *</Label>
                                        <Select options={enquirerEducation} value={education} onChange={setEducation} />
                                    </div>
                                    {education === "Other" && (
                                        <div>
                                            <Label htmlFor="otherEducation">Specify other</Label>
                                            <Input type="text" id="otherEducation" value={otherEducation} onChange={(e) => setOtherEducation(e.target.value)} />
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="mb-0">Contact Point</Label>
                                            {contactPoint && (() => {
                                                const { icon: Icon, color } = getContactPointIcon(contactPoint, otherContactPoint);
                                                return <Icon className={`size-3.5 ${color}`} />;
                                            })()}
                                        </div>
                                        <Select
                                            options={hasManagerRole ? contactPointOptions : contactPointOptions.filter(cp => cp.value !== "__add_new__")}
                                            value={contactPoint}
                                            onChange={setContactPoint}
                                            disabled={!hasManagerRole}
                                        />
                                    </div>
                                    {(contactPoint === "other" || contactPoint?.toLowerCase() === "reference" || contactPoint?.toLowerCase() === "referance") && (
                                        <div>
                                            <Label htmlFor="otherContactPoint">Other source/ref</Label>
                                            <Input type="text" id="otherContactPoint" value={otherContactPoint} onChange={(e) => setOtherContactPoint(e.target.value)} />
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <MultiSelect label="Course Preference" options={dynamicCourseOptions} selectedValues={selectedValues} onChange={setSelectedValues} className="py-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Lead Qualification */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                        <BoltIcon className="size-4 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Lead Qualification</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Label className="mb-0">Lead Potential *</Label>
                                            {leadPotential && (
                                                <div className={`size-2 rounded-full ${leadPotential === 'strongProspect' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]' : leadPotential === 'potentialProspect' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                                            )}
                                        </div>
                                        <Select options={leadPotentialOptions} value={leadPotential} onChange={setLeadPotential} />
                                    </div>
                                    <div>
                                        <Label>Campaign</Label>
                                        <Select options={campaignOptions} value={campaign} onChange={onCampaignChange} disabled={!hasManagerRole} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Lead Status *</Label>
                                        <Select
                                            id="leadStatus"
                                            options={leadStatusOptions}
                                            value={leadStatus}
                                            onChange={(value) => {
                                                setLeadStatus(value);
                                                if (value === "converted" || value === "lost") setFollowUpDate("");
                                            }}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Follow-up Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <CalendarIcon className="size-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Follow-up Details</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(leadStatus !== "converted" && leadStatus !== "lost") && (
                                        <div>
                                            <DatePicker id="followupDate" label="Next Follow Up *" value={followUpDate} disablePastDates={true} onChange={(_, str) => setFollowUpDate(str)} />
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <Label className="mb-0">New Remark *</Label>
                                            <span className="text-xs text-gray-400 italic">Internal Note</span>
                                        </div>
                                        <textarea
                                            id="remarks"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Add followup notes..."
                                            className="w-full h-32 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all outline-none resize-none placeholder:text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== Column 2: Activity Timeline ===== */}
                        <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Activity History</h3>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                                    {selectedRow?.remarks?.length || 0} Events
                                </span>
                            </div>

                            <div className="relative space-y-6 flex-1 overflow-y-auto pr-3 brand-scrollbar">
                                {/* Vertical Line */}
                                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-800" />

                                {selectedRow?.remarks && selectedRow.remarks.length > 0 ? (
                                    [...selectedRow.remarks].reverse().map((remark, index) => {
                                        const statusColor = getLeadStatusColor(remark.leadStatus || "new");
                                        return (
                                            <div key={index} className="relative pl-8 group">
                                                {/* Dot */}
                                                <div className={`absolute left-1.5 top-1.5 size-2.5 rounded-full border-2 border-white dark:border-gray-900 z-10 ${statusColor === 'success' ? 'bg-green-500' : statusColor === 'info' ? 'bg-blue-500' : statusColor === 'warning' ? 'bg-yellow-500' : statusColor === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{remark.handledBy || "System"}</span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {remark.updatedOn ? new Date(remark.updatedOn).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all shadow-sm">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <Badge size="sm" color={statusColor} className="px-1.5 py-0 text-[10px] font-medium leading-none">
                                                                {getLeadStatusLabel(remark.leadStatus || "new")}
                                                            </Badge>
                                                            {remark.isUnread && (
                                                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-500">
                                                                    <span className="size-1 bg-red-500 rounded-full animate-ping" /> NEW
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-normal break-words">{remark.remark || "Record updated"}</p>
                                                        {remark.nextFollowUpDate && (
                                                            <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-700/50 flex items-center gap-1.5 text-[10px] text-gray-400 italic">
                                                                <CalendarIcon className="size-3" /> Next: <strong className="text-gray-500 dark:text-gray-300">{new Date(remark.nextFollowUpDate).toLocaleDateString()}</strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <ChatIcon className="size-6 text-gray-300 mx-auto mb-2" />
                                        <p className="text-[10px] text-gray-500">No activity yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 shrink-0">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                        <UserIcon className="size-3" />
                        <span>Last updated: {formatDate(selectedRow?.updatedAt)}</span>
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="text-xs px-4 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onSave}
                            loading={isSubmitting}
                            disabled={phoneExists}
                            className="text-xs px-8 shadow-lg shadow-blue-500/10"
                        >
                            Update Lead
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EditLeadModal;
