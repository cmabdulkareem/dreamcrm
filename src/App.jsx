import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import NewLead from "./pages/LeadManagement/NewLead";
import ManageLeads from "./pages/LeadManagement/ManageLeads";
import LeadBlank from "./pages/LeadManagement/LeadBlank";
import NewStudent from "./pages/StudentManagement/NewStudent";
import ManageStudents from "./pages/StudentManagement/ManageStudents";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import LeadsOverview from "./pages/Dashboard/LeadsOverview";
import StudentsOverview from "./pages/Dashboard/StudentsOverview";
import RevenueOverview from "./pages/Dashboard/RevenewOverview";
import CampaignSettings from "./pages/Settings/CampaignSettings";
import ContactPointSettings from "./pages/Settings/ContactPointSettings";
import CourseManagement from "./pages/Settings/CourseManagement";
import UserManagement from "./pages/Settings/UserManagement";
import EmailInbox from "./pages/Email/EmailInbox";
import EventManagement from "./pages/EventManagement/index";
import EventRegistrations from "./pages/EventManagement/EventRegistrations";
import EventRegistration from "./pages/EventRegistration";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import { CalendarProvider } from "./context/calendarContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext";
import DnDProvider from "./context/DnDProvider";
import ChatWidget from "./components/chat/ChatWidget";

export default function App() {
  return (
    <>
      <NotificationProvider>
        <CalendarProvider>
          <ChatProvider>
            <DnDProvider>
              <Router>
                <ScrollToTop />
                <Routes>
              {/* Dashboard Layout */}
              <Route element={<AppLayout />}>
                <Route index path="/" element={<ProtectedRoutes><LeadsOverview /></ProtectedRoutes>} />
                <Route path="/students-overview" element={<ProtectedRoutes><StudentsOverview /></ProtectedRoutes>} />
                <Route path="/revenue-overview" element={<ProtectedRoutes><RevenueOverview /></ProtectedRoutes>} />

                {/* Others Page */}
                <Route path="/profile" element={<ProtectedRoutes><UserProfiles /></ProtectedRoutes>} />
                <Route path="/calendar" element={<ProtectedRoutes><Calendar /></ProtectedRoutes>} />
                <Route path="/email" element={<ProtectedRoutes><EmailInbox /></ProtectedRoutes>} />
                <Route path="/blank" element={<ProtectedRoutes><Blank /></ProtectedRoutes>} />
                
                {/* Settings */}
                <Route path="/settings/campaigns" element={<ProtectedRoutes><CampaignSettings /></ProtectedRoutes>} />
                <Route path="/settings/contact-points" element={<ProtectedRoutes><ContactPointSettings /></ProtectedRoutes>} />
                <Route path="/settings/courses" element={<ProtectedRoutes requireAdmin={true}><CourseManagement /></ProtectedRoutes>} />
                <Route path="/settings/users" element={<ProtectedRoutes requireAdmin={true}><UserManagement /></ProtectedRoutes>} />
                
                {/* Event Management - Moved out of settings */}
                <Route path="/events" element={<ProtectedRoutes requireAdmin={true}><EventManagement /></ProtectedRoutes>} />
                <Route path="/events/:id/registrations" element={<ProtectedRoutes requireAdmin={true}><EventRegistrations /></ProtectedRoutes>} />

                {/* Forms */}
                <Route path="/new-lead" element={<ProtectedRoutes><NewLead /></ProtectedRoutes>} />
                <Route path="/lead-management" element={<ProtectedRoutes><ManageLeads /></ProtectedRoutes>} />
                <Route path="/lead-blank" element={<ProtectedRoutes><LeadBlank /></ProtectedRoutes>} />
                <Route path="/new-student" element={<ProtectedRoutes><NewStudent /></ProtectedRoutes>} />
                <Route path="/manage-students" element={<ProtectedRoutes><ManageStudents /></ProtectedRoutes>} />

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

              {/* Fallback Route */}
              <Route path="*" element={<NotFound />} />
              
              {/* Public Routes */}
              <Route path="/event-registration/:link" element={<EventRegistration />} />
            </Routes>
          </Router>
          <ChatWidget />
        </DnDProvider>
      </ChatProvider>
    </CalendarProvider>
  </NotificationProvider>
    </>
  );
}