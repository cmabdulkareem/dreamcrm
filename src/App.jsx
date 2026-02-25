import { lazy, Suspense, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import { AuthContext } from "./context/AuthContext";
import { hasRole, isManager, isOwner, isCounsellor as checkIsCounsellor, HR_ROLES, MANAGER_ROLES } from "./utils/roleHelpers";
import { NotificationProvider } from "./context/NotificationContext";

import { CalendarProvider } from "./context/calendarContext";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Import pages
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import NotFound from "./pages/OtherPage/NotFound";
import CampaignSettings from "./pages/Settings/CampaignSettings";
import ContactPointSettings from "./pages/Settings/ContactPointSettings";
import CourseManagement from "./pages/Settings/CourseManagement";
import UserManagement from "./pages/Settings/UserManagement";
import AnnouncementManagement from "./pages/Settings/AnnouncementManagement";
import AppBackup from "./pages/Settings/AppBackup";
import UserProfiles from "./pages/UserProfiles";


// Lazy load other components
const AppLayout = lazy(() => import("./layout/AppLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard/LeadsOverview"));
const EcommerceDashboard = lazy(() => import("./pages/Dashboard/RevenewOverview"));
const Calendar = lazy(() => import("./pages/Calendar"));
const EmailInbox = lazy(() => import("./pages/Email/EmailInbox"));
const Databases = lazy(() => import("./pages/Marketing/Databases"));
const Promotional = lazy(() => import("./pages/Marketing/Promotional"));

// HR Module
const HRDashboard = lazy(() => import("./pages/HR/HRDashboard"));
const EmployeeList = lazy(() => import("./pages/HR/EmployeeList"));
const EmployeeForm = lazy(() => import("./pages/HR/EmployeeForm"));
const JobPostings = lazy(() => import('./pages/HR/Recruitment/JobPostings'));
const JobForm = lazy(() => import('./pages/HR/Recruitment/JobForm'));
const CandidateList = lazy(() => import('./pages/HR/Recruitment/CandidateList'));
const InterviewSchedule = lazy(() => import("./pages/HR/Recruitment/InterviewSchedule"));
const ManageEvents = lazy(() => import("./pages/EventManagement/ManageEvents"));
const CreateEvent = lazy(() => import("./pages/EventManagement/CreateEvent"));
const EventRegistrations = lazy(() => import("./pages/EventManagement/EventRegistrations"));
const LeaveManagement = lazy(() => import("./pages/LeaveManagement"));
const NewLead = lazy(() => import("./pages/LeadManagement/NewLead"));
const ManageLeads = lazy(() => import("./pages/LeadManagement/ManageLeads"));
const CallList = lazy(() => import("./pages/LeadManagement/CallList"));
const Reports = lazy(() => import("./pages/Reports/Reports"));
const LeadBlank = lazy(() => import("./pages/LeadManagement/LeadBlank"));
const NewStudent = lazy(() => import("./pages/StudentManagement/NewStudent"));
const ManageStudents = lazy(() => import("./pages/StudentManagement/ManageStudents"));
const BatchManagement = lazy(() => import("./pages/StudentManagement/BatchManagement"));
const StudentBirthdays = lazy(() => import("./pages/StudentManagement/StudentBirthdays"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const EventRegistration = lazy(() => import("./pages/EventRegistration"));
const LeaveRequestPortal = lazy(() => import("./pages/LeaveRequestPortal"));
const LeaveStatusCheck = lazy(() => import("./pages/LeaveStatusCheck"));
const ApplyLeave = lazy(() => import("./pages/LeaveManagement/ApplyLeave"));
const MyLeaves = lazy(() => import("./pages/LeaveManagement/MyLeaves"));
const CollectPayment = lazy(() => import("./pages/Finance/CollectPayment"));
const InvoiceList = lazy(() => import("./pages/Finance/InvoiceList"));
const InvoiceGenerator = lazy(() => import("./pages/Finance/InvoiceGenerator"));
const InvoiceDetails = lazy(() => import("./pages/Finance/InvoiceDetails"));
const SupportDashboard = lazy(() => import("./pages/Support/SupportDashboard"));
const UserUsageAnalysis = lazy(() => import("./pages/UserUsageAnalysis"));

// Compute Lab Module
const LabScheduler = lazy(() => import("./pages/Lab/LabScheduler"));
const Softwares = lazy(() => import("./pages/Lab/Softwares"));
const Complaints = lazy(() => import("./pages/Lab/Complaints"));

import BrandManagement from "./components/brandManagement/BrandManagement";
import PublicAttendance from "./pages/PublicAttendance";
const VerifyTicket = lazy(() => import("./pages/EventManagement/VerifyTicket"));

// Student Portal Imports
const StudentSignup = lazy(() => import("./pages/StudentPortal/StudentSignup"));
const StudentLogin = lazy(() => import("./pages/StudentPortal/StudentLogin"));
const StudentPortalLayout = lazy(() => import("./pages/StudentPortal/StudentPortalLayout"));
const StudentDashboard = lazy(() => import("./pages/StudentPortal/StudentDashboard"));
const StudentAttendance = lazy(() => import("./pages/StudentPortal/StudentAttendance"));
const StudentProfile = lazy(() => import("./pages/StudentPortal/StudentProfile"));
const StudentRequests = lazy(() => import("./pages/StudentPortal/StudentRequests"));
const ChangePassword = lazy(() => import("./pages/StudentPortal/ChangePassword"));

import PageMeta from "./components/common/PageMeta";

function App() {
  const { user } = useContext(AuthContext);
  const isFaculty = user && hasRole(user, "Instructor") && !isManager(user) && !user.isAdmin && !isOwner(user);
  const isAC = user && hasRole(user, "Academic Coordinator");
  const isCounsellor = user && hasRole(user, "Counsellor");

  return (
    <>
      <PageMeta
        title="Streamline Your Business"
        description="Manage leads, students, events, and more with our comprehensive CRM solution."
      />
      <NotificationProvider>
        <CalendarProvider>

          <DndProvider backend={HTML5Backend}>
            <Router>
              <Routes>
                {/* Authenticated Routes */}
                <Route element={<ProtectedRoutes><AppLayout /></ProtectedRoutes>}>
                  <Route index element={<Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>} />
                  <Route path="/dashboard" element={<Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>} />

                  <Route path="/calendar" element={<Suspense fallback={<LoadingSpinner />}><Calendar /></Suspense>} />
                  <Route path="/email" element={<Suspense fallback={<LoadingSpinner />}><EmailInbox /></Suspense>} />
                  <Route path="/databases" element={<ProtectedRoutes><Suspense fallback={<LoadingSpinner />}><Databases /></Suspense></ProtectedRoutes>} />
                  <Route path="/marketing/promotional" element={<ProtectedRoutes><Suspense fallback={<LoadingSpinner />}><Promotional /></Suspense></ProtectedRoutes>} />

                  {/* Settings */}
                  <Route path="/settings/campaigns" element={<ProtectedRoutes requireManager={true}><CampaignSettings /></ProtectedRoutes>} />
                  <Route path="/settings/contact-points" element={<ProtectedRoutes requireManager={true}><ContactPointSettings /></ProtectedRoutes>} />
                  <Route path="/settings/courses" element={<ProtectedRoutes requireManager={true}><CourseManagement /></ProtectedRoutes>} />
                  <Route path="/settings/users" element={<ProtectedRoutes requireAdmin={true}><UserManagement /></ProtectedRoutes>} />
                  <Route path="/settings/brands" element={<ProtectedRoutes requireAdmin={true}><BrandManagement /></ProtectedRoutes>} />
                  <Route path="/settings/announcements" element={<ProtectedRoutes requireAdmin={true}><AnnouncementManagement /></ProtectedRoutes>} />
                  <Route path="/settings/backup" element={<ProtectedRoutes requireManager={true}><AppBackup /></ProtectedRoutes>} />

                  {/* Finance */}
                  <Route path="/finance/collect-payment" element={<ProtectedRoutes requireAccountant={true}><CollectPayment /></ProtectedRoutes>} />
                  <Route path="/finance/invoices" element={<ProtectedRoutes requireAccountant={true}><InvoiceList /></ProtectedRoutes>} />
                  <Route path="/finance/generate-invoice" element={<ProtectedRoutes requireAccountant={true}><InvoiceGenerator /></ProtectedRoutes>} />
                  <Route path="/finance/invoices/:id" element={<ProtectedRoutes requireAccountant={true}><InvoiceDetails /></ProtectedRoutes>} />
                  {/* Profile */}
                  <Route path="/profile" element={<ProtectedRoutes><UserProfiles /></ProtectedRoutes>} />
                  {/* Event Management */}
                  <Route path="/events" element={<ProtectedRoutes requireManager={true}><ManageEvents /></ProtectedRoutes>} />
                  <Route path="/events/create" element={<ProtectedRoutes requireManager={true}><CreateEvent /></ProtectedRoutes>} />
                  <Route path="/events/:id/registrations" element={<ProtectedRoutes requireManager={true}><EventRegistrations /></ProtectedRoutes>} />
                  {/* Leave Management */}
                  <Route path="/leave-management">
                    <Route index element={<ProtectedRoutes><LeaveManagement /></ProtectedRoutes>} />
                    <Route path="apply" element={<ProtectedRoutes><ApplyLeave /></ProtectedRoutes>} />
                    <Route path="my-leaves" element={<ProtectedRoutes><MyLeaves /></ProtectedRoutes>} />
                    <Route path="requests" element={<ProtectedRoutes><LeaveManagement /></ProtectedRoutes>} />
                  </Route>
                  {/* Forms */}
                  <Route path="/new-lead" element={<ProtectedRoutes><NewLead /></ProtectedRoutes>} />
                  <Route path="/lead-management" element={<ProtectedRoutes><ManageLeads /></ProtectedRoutes>} />
                  <Route path="/lead-management/call-list" element={<ProtectedRoutes><Suspense fallback={<LoadingSpinner />}><CallList /></Suspense></ProtectedRoutes>} />
                  <Route path="/reports" element={<ProtectedRoutes><Suspense fallback={<LoadingSpinner />}><Reports /></Suspense></ProtectedRoutes>} />
                  <Route path="/lead-blank" element={<ProtectedRoutes><LeadBlank /></ProtectedRoutes>} />
                  <Route path="/new-student" element={<ProtectedRoutes>{isAC ? <Navigate to="/manage-students" replace /> : isCounsellor ? <Navigate to="/batch-management" replace /> : <NewStudent />}</ProtectedRoutes>} />
                  <Route path="/manage-students" element={<ProtectedRoutes>{isCounsellor ? <Navigate to="/batch-management" replace /> : <ManageStudents />}</ProtectedRoutes>} />
                  <Route path="/batch-management" element={<ProtectedRoutes><BatchManagement /></ProtectedRoutes>} />
                  <Route path="/student-birthdays" element={<ProtectedRoutes><StudentBirthdays /></ProtectedRoutes>} />
                  {/* Tables */}
                  <Route path="/basic-tables" element={<ProtectedRoutes><BasicTables /></ProtectedRoutes>} />
                  {/* Ui Elements */}
                  <Route path="/alerts" element={<ProtectedRoutes><Alerts /></ProtectedRoutes>} />
                  <Route path="/avatars" element={<ProtectedRoutes><Avatars /></ProtectedRoutes>} />
                  <Route path="/badge" element={<ProtectedRoutes><Badges /></ProtectedRoutes>} />
                  <Route path="/buttons" element={<ProtectedRoutes><Buttons /></ProtectedRoutes>} />
                  <Route path="/images" element={<ProtectedRoutes><Images /></ProtectedRoutes>} />
                  <Route path="/videos" element={<ProtectedRoutes><Videos /></ProtectedRoutes>} />
                  {/* Charts */}
                  <Route path="/line-chart" element={<ProtectedRoutes><LineChart /></ProtectedRoutes>} />
                  <Route path="/bar-chart" element={<ProtectedRoutes><BarChart /></ProtectedRoutes>} />
                  <Route path="/marketing-materials" element={<ProtectedRoutes><Images /></ProtectedRoutes>} />
                  <Route path="/course-curriculum" element={<ProtectedRoutes><Images /></ProtectedRoutes>} />
                  <Route path="/support-dashboard" element={<ProtectedRoutes><Suspense fallback={<LoadingSpinner />}><SupportDashboard /></Suspense></ProtectedRoutes>} />
                  <Route path="/user-usage-analysis" element={<ProtectedRoutes requireManager={true}><Suspense fallback={<LoadingSpinner />}><UserUsageAnalysis /></Suspense></ProtectedRoutes>} />

                  {/* HR Module Routes */}
                  <Route path="/hr">
                    <Route index element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><Suspense fallback={<LoadingSpinner />}><HRDashboard /></Suspense></ProtectedRoutes>} />
                    <Route path="employees" element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><Suspense fallback={<LoadingSpinner />}><EmployeeList /></Suspense></ProtectedRoutes>} />
                    <Route path="employees/new" element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><Suspense fallback={<LoadingSpinner />}><EmployeeForm /></Suspense></ProtectedRoutes>} />
                    <Route path="recruitment/jobs" element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><Suspense fallback={<LoadingSpinner />}><JobPostings /></Suspense></ProtectedRoutes>} />
                    <Route path="recruitment/jobs/new" element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><Suspense fallback={<LoadingSpinner />}><JobForm /></Suspense></ProtectedRoutes>} />
                    <Route path="recruitment/jobs/:id/edit" element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><Suspense fallback={<LoadingSpinner />}><JobForm /></Suspense></ProtectedRoutes>} />
                    <Route path="recruitment/candidates" element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><Suspense fallback={<LoadingSpinner />}><CandidateList /></Suspense></ProtectedRoutes>} />
                    <Route path="recruitment/interviews" element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><Suspense fallback={<LoadingSpinner />}><InterviewSchedule /></Suspense></ProtectedRoutes>} />
                    <Route path="payroll" element={<ProtectedRoutes allowedRoles={[...HR_ROLES, ...MANAGER_ROLES]}><div className="p-6">Payroll Module Coming Soon</div></ProtectedRoutes>} />
                  </Route>

                  {/* Compute Lab Module Routes */}
                  <Route path="/compute-lab">
                    <Route path="scheduler" element={<ProtectedRoutes allowedRoles={['Owner', 'Brand Manager', 'Academic Coordinator', 'Instructor', 'Lab Assistant', 'IT Support']}><Suspense fallback={<LoadingSpinner />}><LabScheduler /></Suspense></ProtectedRoutes>} />
                    <Route path="softwares" element={<ProtectedRoutes allowedRoles={['Owner', 'Brand Manager', 'Academic Coordinator', 'Instructor', 'Lab Assistant', 'IT Support']}><Suspense fallback={<LoadingSpinner />}><Softwares /></Suspense></ProtectedRoutes>} />
                    <Route path="complaints" element={<ProtectedRoutes allowedRoles={['Owner', 'Brand Manager', 'Academic Coordinator', 'Instructor', 'Lab Assistant', 'IT Support']}><Suspense fallback={<LoadingSpinner />}><Complaints /></Suspense></ProtectedRoutes>} />
                  </Route>
                </Route>

                {/* Auth Layout */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Public Verification Route */}
                <Route path="/events/verify-ticket/:registrationId" element={<VerifyTicket />} />

                {/* Fallback Route */}
                <Route path="*" element={<NotFound />} />

                {/* Public Routes */}
                <Route path="/event-registration/:link" element={<EventRegistration />} />
                <Route path="/public/attendance/:shareToken" element={<PublicAttendance />} />

                {/* Student Portal Routes */}
                <Route path="/student/signup" element={<Suspense fallback={<LoadingSpinner />}><StudentSignup /></Suspense>} />
                <Route path="/student/login" element={<Suspense fallback={<LoadingSpinner />}><StudentLogin /></Suspense>} />
                <Route path="/student" element={<ProtectedRoutes redirectTo="/student/login"><Suspense fallback={<LoadingSpinner />}><StudentPortalLayout /></Suspense></ProtectedRoutes>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Suspense fallback={<LoadingSpinner />}><StudentDashboard /></Suspense>} />
                  <Route path="attendance" element={<Suspense fallback={<LoadingSpinner />}><StudentAttendance /></Suspense>} />
                  <Route path="attendance/:batchId" element={<Suspense fallback={<LoadingSpinner />}><StudentAttendance /></Suspense>} />
                  <Route path="profile" element={<Suspense fallback={<LoadingSpinner />}><StudentProfile /></Suspense>} />
                  <Route path="requests" element={<Suspense fallback={<LoadingSpinner />}><StudentRequests /></Suspense>} />
                  <Route path="change-password" element={<Suspense fallback={<LoadingSpinner />}><ChangePassword /></Suspense>} />
                </Route>
              </Routes>
            </Router>
          </DndProvider>
        </CalendarProvider>
      </NotificationProvider>
    </>
  );
}

export default App;