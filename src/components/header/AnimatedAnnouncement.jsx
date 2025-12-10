import { useState, useEffect } from "react";
import axios from "axios";

import API from "../../config/api";

const AnimatedAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchActiveAnnouncements();

    // Refresh announcements every 5 minutes
    const interval = setInterval(fetchActiveAnnouncements, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Rotate through announcements every 30 seconds (increased from 5 seconds)
  useEffect(() => {
    if (announcements.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentAnnouncementIndex(prevIndex =>
        (prevIndex + 1) % announcements.length
      );
    }, 30000); // 30 seconds instead of 5 seconds

    return () => clearInterval(rotationInterval);
  }, [announcements]);

  const fetchActiveAnnouncements = async () => {
    try {
      // Removed: console.log("Fetching announcements from:", `${API}/announcements/active`);
      const response = await axios.get(`${API}/announcements/active`, { withCredentials: true });
      // Removed: console.log("Announcements response:", response.data);

      if (response.data.announcements && response.data.announcements.length > 0) {
        // Removed: console.log("Setting announcements:", response.data.announcements);
        setAnnouncements(response.data.announcements);
        setIsVisible(true);
      } else {
        // Removed: console.log("No active announcements found");
        setIsVisible(false);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      console.error("Error details:", error.response?.data || error.message);
      setIsVisible(false);
    }
  };

  // If not visible, don't render anything
  if (!isVisible) {
    // Removed: console.log("Announcement component is not visible");
    return null;
  }

  // If no announcements, show a simple status message
  if (announcements.length === 0) {
    // Removed: console.log("No announcements to display");
    return (
      <div className="w-full bg-white dark:bg-gray-900 text-pink-500 py-2 px-4 text-center text-sm font-medium border-b border-pink-500">
        <span>System Status: All systems operational</span>
      </div>
    );
  }

  // Show animated announcements with marquee effect
  const currentAnnouncement = announcements[currentAnnouncementIndex];
  // Removed console.log("Displaying announcement:", currentAnnouncement);

  return (
    <div className="w-full bg-white dark:bg-gray-900 text-pink-500 py-2 px-4 overflow-hidden border-b border-pink-500">
      <div className="flex items-center">
        <svg className="w-4 h-4 mr-2 flex-shrink-0 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <div className="w-full overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className="font-bold mr-2">{currentAnnouncement.title}:</span>
            <span>{currentAnnouncement.message}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedAnnouncement;