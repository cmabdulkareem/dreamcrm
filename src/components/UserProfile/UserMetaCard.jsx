import { useState, useContext, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import { useNavigate } from "react-router";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "axios";
import ProfileImageUpload from "./ProfileImageUpload";
import { AuthContext } from "../../context/authContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function UserMetaCard({ user, setUsers }) {
  const { user: currentUser, setUser, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  // Don't render the component if user data is not available
  if (!user) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-3">
        <p>Loading user data...</p>
      </div>
    );
  }

  const { isOpen, openModal, closeModal } = useModal();
  
  // Initialize state with user data and reset when user changes
  const [instagram, setInstagram] = useState(user?.instagram || "");
  const [location, setLocation] = useState(user?.location || "");
  const [error, setError] = useState(false);

  // Reset form state when user changes
  useEffect(() => {
    if (user) {
      setInstagram(user?.instagram || "");
      setLocation(user?.location || "");
    }
  }, [user]);

  // Check if the current user is editing their own profile
  const isOwnProfile = currentUser?._id === user?._id;

  const handleInstagramChange = (e) => {
    const value = e.target.value;
    setInstagram(value);
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Debugging: Log user data in handleSubmit
    console.log("handleSubmit - user:", user);
    console.log("handleSubmit - user._id:", user?._id);
    
    // Check if user exists
    if (!user || !user._id) {
      console.error("User data is not available");
      return;
    }
    
    const payload = {
      instagram,
      location
    };

    axios
      .put(`${API}/users/update/${user._id}`, payload, { withCredentials: true })
      .then((response) => {
        const updatedUser = response.data.user || response.data;
        // Update user context if this is the current user
        if (setUser && typeof setUser === 'function' && currentUser?._id === updatedUser._id) {
          setUser(updatedUser);
        }
        // Update users list if setUsers is provided
        if (setUsers && typeof setUsers === 'function') {
          setUsers((prevUsers) =>
            prevUsers.map((u) => (u._id === updatedUser._id ? updatedUser : u))
          );
        }
        // Don't close the modal - keep it open for continued editing
        // closeModal(); // Commented out to keep modal open
      })
      .catch((err) => {
        console.error("Error updating user", err);
      });
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-3">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            {currentUser?._id === user?._id ? (
              <ProfileImageUpload user={user} updateAvatar={setUser} />
            ) : (
              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                <img src={user?.avatar || "/images/user/user-01.jpg"} alt="user" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user?.fullName} ({user?.location})
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.phone || ""}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email || "DreamZone"}
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {user?.instagram && (
                <a
                  href={`https://www.instagram.com/${user?.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.8567 1.66699C11.7946 1.66854 12.2698 1.67351 12.6805 1.68573L12.8422 1.69102C13.0291 1.69766 13.2134 1.70599 13.4357 1.71641C14.3224 1.75738 14.9273 1.89766 15.4586 2.10391C16.0078 2.31572 16.4717 2.60183 16.9349 3.06503C17.3974 3.52822 17.6836 3.99349 17.8961 4.54141C18.1016 5.07197 18.2419 5.67753 18.2836 6.56433C18.2935 6.78655 18.3015 6.97088 18.3081 7.15775L18.3133 7.31949C18.3255 7.73011 18.3311 8.20543 18.3328 9.1433L18.3335 9.76463C18.3336 9.84055 18.3336 9.91888 18.3336 9.99972L18.3335 10.2348L18.333 10.8562C18.3314 11.794 18.3265 12.2694 18.3142 12.68L18.3089 12.8417C18.3023 13.0286 18.294 13.213 18.2836 13.4351C18.2426 14.322 18.1016 14.9268 17.8961 15.458C17.6842 16.0074 17.3974 16.4713 16.9349 16.9345C16.4717 17.397 16.0057 17.6831 15.4586 17.8955C14.9273 18.1011 14.3224 18.2414 13.4357 18.2831C13.2134 18.293 13.0291 18.3011 12.8422 18.3076L12.6805 18.3128C12.2698 18.3251 11.7946 18.3306 10.8567 18.3324L10.2353 18.333C10.1594 18.333 10.0811 18.333 10.0002 18.333H9.76516L9.14375 18.3325C8.20591 18.331 7.7306 18.326 7.31997 18.3137L7.15824 18.3085C6.97136 18.3018 6.78703 18.2935 6.56481 18.2831C5.67801 18.2421 5.07384 18.1011 4.5419 17.8955C3.99328 17.6838 3.5287 17.397 3.06551 16.9345C2.60231 16.4713 2.3169 16.0053 2.1044 15.458C1.89815 14.9268 1.75856 14.322 1.7169 13.4351C1.707 13.213 1.69892 13.0286 1.69238 12.8417L1.68714 12.68C1.67495 12.2694 1.66939 11.794 1.66759 10.8562L1.66748 9.1433C1.66903 8.20543 1.67399 7.73011 1.68621 7.31949L1.69151 7.15775C1.69815 6.97088 1.70648 6.78655 1.7169 6.56433C1.75786 5.67683 1.89815 5.07266 2.1044 4.54141C2.3162 3.9928 2.60231 3.52822 3.06551 3.06503C3.5287 2.60183 3.99398 2.31641 4.5419 2.10391C5.07315 1.89766 5.67731 1.75808 6.56481 1.71641C6.78703 1.70652 6.97136 1.69844 7.15824 1.6919L7.31997 1.68666C7.7306 1.67446 8.20591 1.6689 9.14375 1.6671L10.8567 1.66699ZM10.0002 5.83308C7.69781 5.83308 5.83356 7.69935 5.83356 9.99972C5.83356 12.3021 7.69984 14.1664 10.0002 14.1664C12.3027 14.1664 14.1669 12.3001 14.1669 9.99972C14.1669 7.69732 12.3006 5.83308 10.0002 5.83308ZM10.0002 7.49974C11.381 7.49974 12.5002 8.61863 12.5002 9.99972C12.5002 11.3805 11.3813 12.4997 10.0002 12.4997C8.6195 12.4997 7.50023 11.3809 7.50023 9.99972C7.50023 8.61897 8.61908 7.49974 10.0002 7.49974ZM14.3752 4.58308C13.8008 4.58308 13.3336 5.04967 13.3336 5.62403C13.3336 6.19841 13.8002 6.66572 14.3752 6.66572C14.9496 6.66572 15.4169 6.19913 15.4169 5.62403C15.4169 5.04967 14.9488 4.58236 14.3752 4.58308Z"
                      fill=""
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Profile
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your profile information.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={(e) => {
            // Debugging: Log user data before submission
            console.log("Form submission - user:", user);
            console.log("Form submission - user._id:", user?._id);
            
            // Prevent submission if user data is not available
            if (!user || !user._id) {
              e.preventDefault();
              console.error("User data is not available");
              return;
            }
            
            // Additional check right before submission
            if (!user || !user._id) {
              e.preventDefault();
              console.error("User data is not available at form submission");
              return;
            }
            
            handleSubmit(e);
          }}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Social Media
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="w-full">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input 
                      type="text" 
                      id="instagram" 
                      value={instagram} 
                      onChange={handleInstagramChange} 
                      placeholder="Instagram username"
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="location">Address</Label>
                    <Input 
                      type="text" 
                      id="location" 
                      value={location} 
                      onChange={handleLocationChange} 
                      placeholder="Your address"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} type="button">
                Close
              </Button>
              <Button size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}