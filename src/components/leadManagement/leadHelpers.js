import { leadStatusOptions } from "../../data/DataSets.jsx";
import {
  MapPin,
  PhoneCall,
  PhoneIncoming,
  MessageCircleMore,
  Instagram,
  Facebook,
  Users,
  Mail,
  Globe,
  Search,
  GraduationCap,
  Activity,
  HelpCircle,
  Linkedin,
  Youtube,
  Twitter
} from "lucide-react";


// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Get lead status label from value
export const getLeadStatusLabel = (lead) => {
  if (lead?.isAdmissionTaken) return "Converted";
  const value = typeof lead === 'string' ? lead : lead?.leadStatus;
  if (!value) return "New Lead";
  const option = leadStatusOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Get lead status color for badge
export const getLeadStatusColor = (lead) => {
  const status = typeof lead === 'string' ? lead : (lead?.isAdmissionTaken ? 'converted' : lead?.leadStatus);
  if (status === 'converted' || status === 'qualified') return "success";
  if (status === 'negotiation' || status === 'contacted') return "info";
  if (status === 'callBackLater' || status === 'new') return "warning";
  if (status === 'lost' || status === 'notInterested') return "error";
  return "light";
};

// Get latest remark from lead
export const getLatestRemark = (remarks) => {
  if (remarks && remarks.length > 0) {
    return remarks[remarks.length - 1].remark;
  }
  return "No remarks yet";
};

// Check if lead has unread remarks
export const hasUnreadRemarks = (remarks, userId) => {
  if (!remarks || remarks.length === 0) return false;

  // Check if any remark is unread
  return remarks.some(remark => remark.isUnread);
};

// Check if user can view this lead (created by user, assigned to user, or admin/manager)
export const canViewLead = (lead, user) => {
  // Admins can view all leads
  if (user?.isAdmin) return true;

  // Managers can view all leads
  if (user?.roles?.includes('Manager')) return true;

  // Check if user is the creator of the lead
  if (lead.handledBy === user?.fullName) return true;

  // Check if user is assigned to this lead
  // Handle both populated object (assignedTo._id) and string ObjectId
  const userId = user?.id?.toString() || user?._id?.toString();
  const assignedId = lead.assignedTo?._id?.toString() || lead.assignedTo?.toString();

  if (assignedId && assignedId === userId) return true;

  return false;
};

// Map contact point to icon and label
export const getContactPointIcon = (contactPoint, otherContactPoint = "") => {
  const primary = (contactPoint || "").toLowerCase().trim();
  const secondary = (otherContactPoint || "").toLowerCase().trim();

  // Normalize string for searching: remove hyphens, spaces, underscores
  const normalize = (str) => str.replace(/[-_\s]/g, "").trim();
  const cp = normalize(`${primary}${secondary}`);

  if (cp.includes("walkin")) {
    return { icon: MapPin, label: "Walk-In", color: "text-blue-500" };
  }
  if (cp.includes("coldcall")) {
    return { icon: PhoneCall, label: "Cold Call", color: "text-orange-500" };
  }
  if (cp.includes("incoming") || cp.includes("telecall") || cp.includes("phone")) {
    return { icon: PhoneIncoming, label: "Call", color: "text-green-500" };
  }
  if (cp.includes("whatsapp")) {
    return { icon: MessageCircleMore, label: "WhatsApp", color: "text-emerald-500" };
  }
  if (cp.includes("instagram") || cp === "ig") {
    return { icon: Instagram, label: "Instagram", color: "text-pink-500" };
  }
  if (cp.includes("facebook") || cp === "fb") {
    return { icon: Facebook, label: "Facebook", color: "text-blue-600" };
  }
  if (cp.includes("refer")) {
    return { icon: Users, label: "Reference", color: "text-purple-500" };
  }
  if (cp.includes("email") || cp === "mail") {
    return { icon: Mail, label: "Email", color: "text-red-500" };
  }
  if (cp.includes("website") || cp.includes("web") || cp.includes("online")) {
    return { icon: Globe, label: "Website", color: "text-indigo-500" };
  }
  if (cp.includes("google") || cp.includes("search") || cp.includes("seo")) {
    return { icon: Search, label: "Google / Search", color: "text-blue-400" };
  }
  if (cp.includes("alumni")) {
    return { icon: GraduationCap, label: "Alumni", color: "text-amber-600" };
  }
  if (cp.includes("activit")) {
    return { icon: Activity, label: "Activities", color: "text-rose-500" };
  }
  if (cp.includes("linkedin")) {
    return { icon: Linkedin, label: "LinkedIn", color: "text-blue-700" };
  }
  if (cp.includes("youtube") || cp === "yt") {
    return { icon: Youtube, label: "YouTube", color: "text-red-600" };
  }
  if (cp.includes("twitter") || cp === "x") {
    return { icon: Twitter, label: "Twitter", color: "text-sky-400" };
  }

  // Fallback to title-cased content
  const rawLabel = primary === "other" && secondary ? otherContactPoint : (contactPoint || "Other");
  const fallbackLabel = rawLabel.split(/[-_\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  return { icon: HelpCircle, label: fallbackLabel, color: "text-gray-400" };
};
