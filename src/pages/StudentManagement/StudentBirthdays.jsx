import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import PageMeta from "../../components/common/PageMeta";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import axios from "axios";
import API from "../../config/api";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import StudentProfileModal from "../../components/StudentManagement/StudentProfileModal";

const StudentBirthdays = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/students/all`, { withCredentials: true });
            const studentData = response.data.students || [];
            setStudents(studentData);
            generateEvents(studentData);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateEvents = (studentData) => {
        const currentYear = new Date().getFullYear();
        const birthdayEvents = studentData
            .filter(student => student.dob)
            .flatMap(student => {
                const dob = new Date(student.dob);
                // Create events for multiple years to allow navigation
                return [-1, 0, 1].map(offset => {
                    const year = currentYear + offset;
                    const birthday = new Date(year, dob.getMonth(), dob.getDate());
                    return {
                        id: `${student._id}-${year}`,
                        title: `🍰 ${student.fullName}`,
                        start: birthday.toISOString().split('T')[0],
                        allDay: true,
                        extendedProps: {
                            student,
                            isBirthday: true
                        },
                        backgroundColor: '#f472b6', // pink-400
                        borderColor: '#db2777', // pink-600
                    };
                });
            });
        setEvents(birthdayEvents);
    };

    const handleEventClick = (clickInfo) => {
        setSelectedStudent(clickInfo.event.extendedProps.student);
        openModal();
    };

    const viewFullProfile = () => {
        setIsProfileModalOpen(true);
        closeModal();
    };

    return (
        <>
            <PageMeta
                title="Student Birthdays | DreamCRM"
                description="View student birthdays on a calendar"
            />

            <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Student Birthday Calendar</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Celebrate and engage with students on their special day</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="custom-calendar birthday-calendar">
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: "prev,next today",
                                    center: "title",
                                    right: "dayGridMonth,timeGridWeek",
                                }}
                                events={events}
                                eventClick={handleEventClick}
                                eventContent={renderEventContent}
                                height="auto"
                            />
                        </div>
                    )}
                </div>

                {/* Quick View Modal */}
                <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[400px] p-6 text-center">
                    {selectedStudent && (
                        <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                                <img
                                    src={selectedStudent.photo ? `${API.replace('/api', '')}${selectedStudent.photo}` : "/images/user/user-01.jpg"}
                                    alt={selectedStudent.fullName}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-pink-100 dark:border-pink-900/30"
                                    onError={(e) => { e.target.src = "/images/user/user-01.jpg"; }}
                                />
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 p-1.5 rounded-full shadow-sm">
                                    <span className="text-xl">🍰</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{selectedStudent.fullName}</h3>
                            <p className="text-sm text-gray-500 mb-4">Birthday on {new Date(selectedStudent.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>

                            <div className="w-full space-y-2">
                                <a
                                    href={`tel:${selectedStudent.phone1}`}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-success-500 text-white font-medium hover:bg-success-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    Call Student
                                </a>
                                <button
                                    onClick={viewFullProfile}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    View Full Profile
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

                {selectedStudent && (
                    <StudentProfileModal
                        isOpen={isProfileModalOpen}
                        onClose={() => setIsProfileModalOpen(false)}
                        student={selectedStudent}
                    />
                )}
            </div>
        </>
    );
};

const renderEventContent = (eventInfo) => {
    return (
        <div className="flex items-center gap-1 p-1 overflow-hidden">
            <div className="text-xs truncate font-medium text-white">
                {eventInfo.event.title}
            </div>
        </div>
    );
};

export default StudentBirthdays;
