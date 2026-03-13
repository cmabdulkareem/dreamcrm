import React, { useState } from "react";
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
    PencilIcon,
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
    const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false);
    const [isEditingEducation, setIsEditingEducation] = useState(false);

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
                <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white lg:text-2xl">Edit Lead</h2>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Manage lead details, qualifications, and activity history.</p>
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
                        <div className="space-y-6 overflow-y-auto pr-3 brand-scrollbar">

                            {/* Section 1: Lead Information */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <UserCircleIcon className="size-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Lead Information</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingLeadInfo(!isEditingLeadInfo)}
                                        className={`p-1.5 rounded-md transition-colors ${isEditingLeadInfo ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`}
                                    >
                                        <PencilIcon className="size-3.5" />
                                    </button>
                                </div>

                                {!isEditingLeadInfo ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Full Name</span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{fullName || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Email</span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 break-all">{email || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Phone 1</span>
                                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{phone1 || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Phone 2</span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{phone2 || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Gender / DoB</span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                {gender || "N/A"} {dob ? ` / ${formatDate(dob)}` : ""}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Place</span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{place === "Other" ? otherPlace : place || "N/A"}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div>
                                            <Label htmlFor="firstName">Full Name *</Label>
                                            <input type="text" id="firstName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!canEditFields} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
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
                                )}
                            </div>

                            {/* Section 2: Education & Interest */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <FileIcon className="size-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Education & Interest</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingEducation(!isEditingEducation)}
                                        className={`p-1.5 rounded-md transition-colors ${isEditingEducation ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`}
                                    >
                                        <PencilIcon className="size-3.5" />
                                    </button>
                                </div>

                                {!isEditingEducation ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Current Status</span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{status || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Education</span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{education === "Other" ? otherEducation : education || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Contact Point</span>
                                            <div className="flex items-center gap-1.5">
                                                {contactPoint && (() => {
                                                    const { icon: Icon, color } = getContactPointIcon(contactPoint, otherContactPoint);
                                                    return <Icon className={`size-3 ${color}`} />;
                                                })()}
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                    {contactPoint || "N/A"}
                                                    {(contactPoint === "other" || contactPoint?.toLowerCase() === "reference" || contactPoint?.toLowerCase() === "referance") && otherContactPoint ? ` (${otherContactPoint})` : ""}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="md:col-span-3 flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Course Preferences</span>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {selectedValues && selectedValues.length > 0 ? (
                                                    selectedValues.map(val => (
                                                        <Badge key={val} size="sm" variant="outline" className="text-[9px] px-1.5 py-0 leading-none h-4">{val}</Badge>
                                                    ))
                                                ) : <span className="text-xs text-gray-400 italic">None</span>}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
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
                                )}
                            </div>

                            {/* Section 3: Management & Follow-up */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                        <BoltIcon className="size-4 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Management & Follow-up</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="otherContactPoint">Potential *</Label>
                                        <Select options={leadPotentialOptions} value={leadPotential} onChange={setLeadPotential} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="otherContactPoint">Campaign</Label>
                                        <Select options={campaignOptions} value={campaign} onChange={onCampaignChange} disabled={!hasManagerRole} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="otherContactPoint">Lead Status *</Label>
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
                                    <div className="flex flex-col gap-1.5">
                                        {(leadStatus !== "converted" && leadStatus !== "lost") && (
                                            <>
                                                <Label htmlFor="followupDate">Next Follow Up *</Label>
                                                <DatePicker id="followupDate" value={followUpDate} disablePastDates={true} onChange={(_, str) => setFollowUpDate(str)} />
                                            </>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <Label htmlFor="remarks">New Remark *</Label>
                                            <span className="text-[9px] text-gray-400 italic">Internal Note</span>
                                        </div>
                                        <textarea
                                            id="remarks"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Add followup notes..."
                                            className="w-full min-h-[80px] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all outline-none resize-none placeholder:text-[10px]"
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

                                {(() => {
                                    const allActivities = [
                                        ...(selectedRow?.remarks || []).map(r => ({ ...r, type: 'remark' })),
                                        ...(selectedRow?.callLogs || []).map(c => ({ ...c, type: 'call', updatedOn: c.timestamp }))
                                    ].sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn));

                                    if (allActivities.length === 0) {
                                        return (
                                            <div className="text-center py-10 opacity-50">
                                                <ChatIcon className="size-6 text-gray-300 mx-auto mb-2" />
                                                <p className="text-[10px] text-gray-500">No activity yet</p>
                                            </div>
                                        );
                                    }

                                    return allActivities.map((activity, index) => {
                                        if (activity.type === 'remark') {
                                            const statusColor = getLeadStatusColor(activity.leadStatus || "new");
                                            return (
                                                <div key={`remark-${index}`} className="relative pl-8 group">
                                                    <div className={`absolute left-1.5 top-1.5 size-2.5 rounded-full border-2 border-white dark:border-gray-900 z-10 ${statusColor === 'success' ? 'bg-green-500' : statusColor === 'info' ? 'bg-blue-500' : statusColor === 'warning' ? 'bg-yellow-500' : statusColor === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{activity.handledBy || "System"}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {activity.updatedOn ? new Date(activity.updatedOn).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                                                            </span>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all shadow-sm">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <Badge size="sm" color={statusColor} className="px-1.5 py-0 text-[10px] font-medium leading-none">
                                                                    {getLeadStatusLabel(activity.leadStatus || "new")}
                                                                </Badge>
                                                                {activity.isUnread && (
                                                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-500">
                                                                        <span className="size-1 bg-red-500 rounded-full animate-ping" /> NEW
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-normal break-words">{activity.remark || "Record updated"}</p>
                                                            {activity.nextFollowUpDate && (
                                                                <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-700/50 flex items-center gap-1.5 text-[10px] text-gray-400 italic">
                                                                    <CalendarIcon className="size-3" /> Next: <strong className="text-gray-500 dark:text-gray-300">{new Date(activity.nextFollowUpDate).toLocaleDateString()}</strong>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            const typeStr = String(activity.type);
                                            const isMissed = typeStr === 'MISSED' || typeStr === '3' || typeStr === 'REJECTED' || typeStr === '5' || activity.duration === 0;

                                            const bgColor = isMissed ? 'bg-red-500' : 'bg-green-500';
                                            const badgeBg = isMissed ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-green-50/50 dark:bg-green-900/10';
                                            const badgeBorder = isMissed ? 'border-red-100/50 dark:border-red-800/30 hover:border-red-200 dark:hover:border-red-700' : 'border-green-100/50 dark:border-green-800/30 hover:border-green-200 dark:hover:border-green-700';
                                            const textColor = isMissed ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
                                            const durationColor = isMissed ? 'text-red-500' : 'text-green-500';
                                            
                                            let label = '📞 Call Log';
                                            if (typeStr === 'MISSED' || typeStr === '3') label = '📵 Missed Call';
                                            else if (typeStr === 'REJECTED' || typeStr === '5') label = '📵 Rejected Call';
                                            else if (typeStr === 'INCOMING' || typeStr === '1') label = activity.duration > 0 ? '📲 Incoming Answered' : '📵 Incoming Missed';
                                            else if (typeStr === 'OUTGOING' || typeStr === '2') label = activity.duration > 0 ? '📞 Outgoing Answered' : '📵 Outgoing Unanswered';

                                            return (
                                                <div key={`call-${index}`} className="relative pl-8 group">
                                                    <div className={`absolute left-1.5 top-1.5 size-2.5 rounded-full border-2 border-white dark:border-gray-900 z-10 ${bgColor}`} />
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{activity.handledBy || "Mobile User"}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {activity.timestamp ? new Date(activity.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                                                            </span>
                                                        </div>
                                                        <div className={`${badgeBg} p-3 rounded-lg border ${badgeBorder} transition-all shadow-sm`}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className={`p-1 ${bgColor} rounded text-white`}>
                                                                    <Phone className="size-2.5" />
                                                                </div>
                                                                <span className={`text-[10px] font-bold uppercase tracking-tight ${textColor}`}>{label}</span>
                                                                <span className={`text-[10px] font-medium ${durationColor}`}>({Math.floor(activity.duration / 60)}m {activity.duration % 60}s)</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-normal italic">"{activity.remark || "No remarks provided"}"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex items-center justify-between py-4 px-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 shrink-0">
                    <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                        <UserIcon className="size-2.5" />
                        <span>Last updated: {formatDate(selectedRow?.updatedAt)}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-9 py-1.5 px-4 text-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onSave}
                            loading={isSubmitting}
                            disabled={phoneExists}
                            className="h-9 py-1.5 px-6 text-sm shadow-lg shadow-blue-500/10"
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
