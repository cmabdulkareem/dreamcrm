const placeOptions = [
  { value: "Dakshina Kannada", label: "Dakshina Kannada" },
  { value: "Udupi", label: "Udupi" },
  { value: "Uttara Kannada", label: "Uttara Kannada" },
  { value: "Kodagu", label: "Kodagu" },
  { value: "Chikkamagaluru", label: "Chikkamagaluru" },
  { value: "Kasaragod", label: "Kasaragod" },
  { value: "Kannur", label: "Kannur" },
  { value: "Wayanad", label: "Wayanad" },
  { value: "Calicut", label: "Calicut" },
  { value: "Malappuram", label: "Malappuram" },
  { value: "Other", label: "Other" },
];

const bloodGroupOptions = [
  { value: "", label: "Select Blood Group" },
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" }
];

const countries = [
  { code: "IN", label: "+91" },   // India
  { code: "AE", label: "+971" },  // UAE
  { code: "SA", label: "+966" },  // Saudi Arabia
  { code: "US", label: "+1" },    // United States
  { code: "GB", label: "+44" },   // United Kingdom

  { code: "CA", label: "+1" },    // Canada
  { code: "AU", label: "+61" },   // Australia
  { code: "NZ", label: "+64" },   // New Zealand
  { code: "SG", label: "+65" },   // Singapore
  { code: "MY", label: "+60" },   // Malaysia
  { code: "PK", label: "+92" },   // Pakistan
  { code: "BD", label: "+880" },  // Bangladesh
  { code: "LK", label: "+94" },   // Sri Lanka
  { code: "NP", label: "+977" },  // Nepal
  { code: "TH", label: "+66" },   // Thailand
  { code: "PH", label: "+63" },   // Philippines
  { code: "VN", label: "+84" },   // Vietnam
  { code: "ID", label: "+62" },   // Indonesia
  { code: "CN", label: "+86" },   // China
  { code: "JP", label: "+81" },   // Japan
  { code: "KR", label: "+82" },   // South Korea
  { code: "HK", label: "+852" },  // Hong Kong
  { code: "TW", label: "+886" },  // Taiwan
  { code: "QA", label: "+974" },  // Qatar
  { code: "KW", label: "+965" },  // Kuwait
  { code: "OM", label: "+968" },  // Oman
  { code: "BH", label: "+973" },  // Bahrain
  { code: "EG", label: "+20" },   // Egypt
  { code: "ZA", label: "+27" },   // South Africa
  { code: "NG", label: "+234" },  // Nigeria
  { code: "KE", label: "+254" },  // Kenya
  { code: "TZ", label: "+255" },  // Tanzania
  { code: "GH", label: "+233" },  // Ghana
  { code: "DE", label: "+49" },   // Germany
  { code: "FR", label: "+33" },   // France
  { code: "IT", label: "+39" },   // Italy
  { code: "ES", label: "+34" },   // Spain
  { code: "PT", label: "+351" },  // Portugal
  { code: "NL", label: "+31" },   // Netherlands
  { code: "BE", label: "+32" },   // Belgium
  { code: "CH", label: "+41" },   // Switzerland
  { code: "SE", label: "+46" },   // Sweden
  { code: "NO", label: "+47" },   // Norway
  { code: "DK", label: "+45" },   // Denmark
  { code: "FI", label: "+358" },  // Finland
  { code: "IE", label: "+353" },  // Ireland
  { code: "RU", label: "+7" },    // Russia
  { code: "TR", label: "+90" },   // Turkey
  { code: "IR", label: "+98" },   // Iran
  { code: "BR", label: "+55" },   // Brazil
  { code: "MX", label: "+52" },   // Mexico
  { code: "AR", label: "+54" },   // Argentina
  { code: "CL", label: "+56" },   // Chile
  { code: "CO", label: "+57" },   // Colombia
  { code: "PE", label: "+51" },   // Peru
];

const countryOptions = [
  { value: "", label: "Select Country" },
  { value: "India", label: "India" },
  { value: "USA", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" }
];

const stateOptions = [
  { value: "", label: "Select State" },
  { value: "Kerala", label: "Kerala" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Delhi", label: "Delhi" }
];

const enquirerGender = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const accountGender = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "notDisclosed", label: "Not Disclosed" },
];

const departments = [
  { value: "general", label: "General" },
  { value: "managerial", label: "Managerial" },
  { value: "marketing", label: "Marketing & Admissions" },
  { value: "placement", label: "Placement & Student Support" },
  { value: "counselling", label: "Counselling" },
  { value: "finance", label: "Accounts & Finance" },
  { value: "administration", label: "Administration" },
  { value: "it", label: "IT & Technical Support" },
  { value: "interior", label: "Interior Design Department" },
  { value: "fashion", label: "Fashion Design Department" },
  { value: "graphic", label: "Graphic Design Department" },
  { value: "other", label: "Other" },
];

const accountStatus = [
  { value: "Pending", label: "Pending" },
  { value: "Active", label: "Active" },
  { value: "Suspended", label: "Suspended" },
  { value: "Deactivated", label: "Deactivated" }
];

const employmentType = [
  { value: "fullTime", label: "Full Time" },
  { value: "partTime", label: "Part Time" },
  { value: "guest", label: "Guest Faculty / Consultant" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "volunteer", label: "Volunteer" },
  { value: "temporary", label: "Temporary" },
  { value: "seasonal", label: "Seasonal" },
];



const enquirerStatus = [
  { value: "studying", label: "Studying" },
  { value: "working", label: "Working" },
  { value: "selfEmployed", label: "Self Employed" },
  { value: "freelancer", label: "Freelancer" },
  { value: "homeMaker", label: "Homemaker" },
  { value: "jobSeeker", label: "Job Seeker" },
  { value: "doingNothing", label: "Not Engaged" },
];

const enquirerEducation = [
  { value: "below10th", label: "Below 10th" },
  { value: "10th", label: "10th" },
  { value: "12th", label: "12th" },
  { value: "diploma", label: "Diploma" },
  { value: "graduate", label: "Graduate" },
  { value: "postGraduate", label: "Post Graduate" },
  { value: "Other", label: "Other" },
];

// Data with Date objects and unique enquiryStatus
const tableData = [
  {
    id: 1,
    name: "Zahid Mohammed",
    course: "Interior Design",
    phone: "+91 9876543210",
    email: "cmabdulkareem@gmail.com",
    enquiryStatus: "Converted",
    date: new Date("2025-09-01"),
    contactPoint: "Walk-In",
    campaign: "Campaign 1",
    followUpDate: new Date("2025-09-27"),
    handledBy: "John Doe",
  },
  {
    id: 2,
    name: "Athira Rajeevan",
    course: "Graphic Design",
    phone: "+91 9123456780",
    email: "kareemchala@gmail.com",
    enquiryStatus: "Call Back Later",
    date: new Date("2025-09-20"),
    contactPoint: "Tele Call",
    campaign: "Campaign 2",
    followUpDate: new Date("2025-09-25"),
    handledBy: "Alex Antony",
  },
];


const sortOrderList = [
  { value: "followup_latest", label: "Follow-up Date (Latest First)" },
  { value: "followup_oldest", label: "Follow-up Date (Oldest First)" },
  { value: "desc", label: "Newest First" },
  { value: "asc", label: "Oldest First" },
];

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "Converted", label: "Converted" },
  { value: "Call Back Later", label: "Call Back Later" },
  { value: "Pending", label: "Pending" },
];

const courseOptions = [
  { value: "Interior", label: "Interior Design" },
  { value: "Fashion", label: "Fashion Design" },
  { value: "Graphics", label: "Graphic Design" },
  { value: "General", label: "General" },
];


const rolesOptions = [
  { value: "Leads", label: "Leads" },
  { value: "Students", label: "Students" },
  { value: "Finance", label: "Finance" },
  { value: "Marketing", label: "Marketing" },
];

// Options
const contactPoints = [
  { value: "walkIn", label: "Walk-In" },
  { value: "teleCall", label: "Tele Call" },
  { value: "other", label: "Other" },
];

const campaigns = [
  { value: "campaign1", label: "Campaign 1" },
  { value: "campaign2", label: "Campaign 2" },
  { value: "campaign3", label: "Campaign 3" },
];

const handledBy = [
  { value: "counselor1", label: "Counselor 1" },
  { value: "counselor2", label: "Counselor 2" },
  { value: "counselor3", label: "Counselor 3" },
];

const leadStatusOptions = [
  { value: "new", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiation", label: "In Negotiation" },
  { value: "converted", label: "Converted" },
  { value: "callBackLater", label: "Call Back Later" },
  { value: "notInterested", label: "Not Interested" },
  { value: "lost", label: "Lost" },
];

// Lead Potential options
const leadPotentialOptions = [
  { value: "strongProspect", label: "Strong Prospect", color: "text-green-600 bg-green-100" },
  { value: "potentialProspect", label: "Potential Prospect", color: "text-blue-600 bg-blue-100" },
  { value: "weakProspect", label: "Weak Prospect", color: "text-orange-600 bg-orange-100" },
  { value: "notAProspect", label: "Not a Prospect", color: "text-gray-600 bg-gray-100" },
];

const callListStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  { value: 'called', label: 'Called', color: 'bg-blue-100 text-blue-700' },
  { value: 'wrong-number', label: 'Wrong Number', color: 'bg-red-100 text-red-700' },
  { value: 'not-picked', label: 'Not Picked', color: 'bg-orange-100 text-orange-700' },
  { value: 'busy', label: 'Busy', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'interested', label: 'Interested', color: 'bg-green-100 text-green-700' },
  { value: 'not-interested', label: 'Not Interested', color: 'bg-red-100 text-red-700' },
  { value: 'copied-to-leads', label: 'Copied to Leads', color: 'bg-purple-100 text-purple-700' },
];

export {
  placeOptions,
  bloodGroupOptions,
  countries,
  countryOptions,
  stateOptions,
  enquirerGender,
  enquirerStatus,
  enquirerEducation,
  tableData,
  sortOrderList,
  statusOptions,
  courseOptions,
  contactPoints,
  campaigns,
  handledBy,
  accountStatus,
  accountGender,
  departments,
  employmentType,
  rolesOptions,
  leadStatusOptions,
  leadPotentialOptions,
  callListStatusOptions
};