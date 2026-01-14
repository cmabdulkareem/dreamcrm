import { lazy, Suspense, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import { AuthContext } from "./context/AuthContext";
import { hasRole, isManager, isOwner } from "./utils/roleHelpers";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext";
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
const Blank = lazy(() => import("./pages/Blank"));
const ManageEvents = lazy(() => import("./pages/EventManagement/ManageEvents"));
const CreateEvent = lazy(() => import("./pages/EventManagement/CreateEvent"));
const EventRegistrations = lazy(() => import("./pages/EventManagement/EventRegistrations"));
const LeaveManagement = lazy(() => import("./pages/LeaveManagement"));
const NewLead = lazy(() => import("./pages/LeadManagement/NewLead"));
const ManageLeads = lazy(() => import("./pages/LeadManagement/ManageLeads"));
const CallList = lazy(() => import("./pages/LeadManagement/CallList"));
const LeadBlank = lazy(() => import("./pages/LeadManagement/LeadBlank"));
const NewStudent = lazy(() => import("./pages/StudentManagement/NewStudent"));
const ManageStudents = lazy(() => import("./pages/StudentManagement/ManageStudents"));
const BatchManagement = lazy(() => import("./pages/StudentManagement/BatchManagement"));
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
import ChatWidget from "./components/chat/ChatWidget";
import BrandManagement from "./components/brandManagement/BrandManagement";
import PublicAttendance from "./pages/PublicAttendance";


function App() {
  const { user } = useContext(AuthContext);
  const isFaculty = user && hasRole(user, "Instructor") && !isManager(user) && !user.isAdmin && !isOwner(user);
  const isAC = user && hasRole(user, "Academic Coordinator");

  return (
    <>
      <NotificationProvider>
        <CalendarProvider>
          <ChatProvider>
            <DndProvider backend={HTML5Backend}>
              <Router>
                <Routes>
                  {/* Authenticated Routes */}
                  <Route element={<ProtectedRoutes><AppLayout /></ProtectedRoutes>}>
                    <Route index element={
                      isFaculty ? <Navigate to="/calendar" replace /> :
                        isAC ? <Navigate to="/batch-management" replace /> :
                          <Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>
                    } />
                    <Route path="/dashboard" element={
                      isFaculty ? <Navigate to="/calendar" replace /> :
                        isAC ? <Navigate to="/batch-management" replace /> :
                          <Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>
                    } />
                    <Route path="/ecommerce-dashboard" element={<Suspense fallback={<LoadingSpinner />}><EcommerceDashboard /></Suspense>} />
                    <Route path="/calendar" element={<Suspense fallback={<LoadingSpinner />}><Calendar /></Suspense>} />
                    <Route path="/email" element={<Suspense fallback={<LoadingSpinner />}><EmailInbox /></Suspense>} />
                    <Route path="/blank" element={<Suspense fallback={<LoadingSpinner />}><Blank /></Suspense>} />

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
                    {/* Leave Management */}
                    <Route path="/leave-management">
                      <Route index element={<ProtectedRoutes><LeaveManagement /></ProtectedRoutes>} />
                      <Route path="apply" element={<ProtectedRoutes><ApplyLeave /></ProtectedRoutes>} />
                      <Route path="my-leaves" element={<ProtectedRoutes><MyLeaves /></ProtectedRoutes>} />
                      <Route path="requests" element={<ProtectedRoutes><LeaveManagement /></ProtectedRoutes>} />
                    </Route>

                    {/* Forms */}
                    <Route path="/new-lead" element={<ProtectedRoutes>{isAC ? <Navigate to="/batch-management" replace /> : <NewLead />}</ProtectedRoutes>} />
                    <Route path="/lead-management" element={<ProtectedRoutes>{isAC ? <Navigate to="/batch-management" replace /> : <ManageLeads />}</ProtectedRoutes>} />
                    <Route path="/lead-management/call-list" element={<ProtectedRoutes><Suspense fallback={<LoadingSpinner />}><CallList /></Suspense></ProtectedRoutes>} />
                    <Route path="/lead-blank" element={<ProtectedRoutes><LeadBlank /></ProtectedRoutes>} />
                    <Route path="/new-student" element={<ProtectedRoutes><NewStudent /></ProtectedRoutes>} />
                    <Route path="/manage-students" element={<ProtectedRoutes><ManageStudents /></ProtectedRoutes>} />
                    <Route path="/batch-management" element={<ProtectedRoutes><BatchManagement /></ProtectedRoutes>} />


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
                  </Route>

                  {/* Auth Layout */}
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Fallback Route */}
                  <Route path="*" element={<NotFound />} />

                  {/* Public Routes */}
                  <Route path="/event-registration/:link" element={<EventRegistration />} />
                  <Route path="/public/attendance/:shareToken" element={<PublicAttendance />} />
                </Routes>
              </Router>
              <ChatWidget />
            </DndProvider>
          </ChatProvider>
        </CalendarProvider>
      </NotificationProvider>
    </>
  );
}

export default App;