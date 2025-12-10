import { useState, useEffect, useContext } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import ProfileImageUpload from "./ProfileImageUpload";
import { bloodGroupOptions, countryOptions, stateOptions, accountGender } from "../../data/DataSets";

import API from "../../config/api";

export default function UserInfoCard({ user }) {
  const { setUser } = useContext(AuthContext);
  const { isOpen, openModal, closeModal } = useModal();

  // Form state
  const [instagram, setInstagram] = useState(user?.instagram || "");
  const [location, setLocation] = useState(user?.location || "");
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || "");
  const [country, setCountry] = useState(user?.country || "");
  const [state, setState] = useState(user?.state || "");
  const [reportingHead, setReportingHead] = useState(user?.reportingHead?.id || user?.reportingHead || "");
  const [designation, setDesignation] = useState(user?.designation || "");
  const [gender, setGender] = useState(user?.gender || "notDisclosed");
  const [dob, setDob] = useState(user?.dob || "");
  const [users, setUsers] = useState([]);

  // Reset form state when user changes
  useEffect(() => {
    if (user) {
      setInstagram(user?.instagram || "");
      setLocation(user?.location || "");
      setBloodGroup(user?.bloodGroup || "");
      setCountry(user?.country || "");
      setState(user?.state || "");
      setGender(user?.gender || "notDisclosed");
      setDob(user?.dob || "");
      setDesignation(user?.designation || "");
      setReportingHead(user?.reportingHead?._id || "");
    }
  }, [user]);

  // Fetch all users for reporting head dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API}/users/dropdown`, { withCredentials: true });
        setUsers(response.data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    // Fetch users when modal opens or when component mounts
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!user || !user.id) {
      console.error("User data is not available");
      return;
    }

    try {
      const payload = {};

      // Only include fields that have been modified
      if (instagram !== (user?.instagram || "")) payload.instagram = instagram;
      if (location !== (user?.location || "")) payload.location = location;
      if (bloodGroup !== (user?.bloodGroup || "")) payload.bloodGroup = bloodGroup;
      if (country !== (user?.country || "")) payload.country = country;
      if (state !== (user?.state || "")) payload.state = state;
      if (gender !== (user?.gender || "notDisclosed")) payload.gender = gender;
      if (dob !== (user?.dob || "")) payload.dob = dob || null;
      if (designation !== (user?.designation || "")) payload.designation = designation;
      if (reportingHead !== (user?.reportingHead?._id || "")) payload.reportingHead = reportingHead || null;

      // If no fields have been modified, don't make the request
      if (Object.keys(payload).length === 0) {
        console.log("No fields have been modified");
        return;
      }

      const response = await axios.put(
        `${API}/users/update/${user.id}`,
        payload,
        { withCredentials: true }
      );

      // Update user context with the updated user data
      if (setUser && typeof setUser === 'function') {
        setUser(response.data.user);
      }

      // Close the modal after successful save
      closeModal();
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  // Reporting head options (other users)
  const reportingHeadOptions = [
    { value: "", label: "Select Reporting Head" },
    ...users
      .filter(u => u.id !== user?.id) // Exclude current user
      .map(u => ({ value: u.id, label: u.fullName }))
      // Filter out duplicate user IDs to prevent key prop warnings
      .filter((user, index, self) =>
        index === self.findIndex(u => u.value === user.value)
      )
  ];

  // Don't render the component if user data is not available
  if (!user) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p>Loading user data...</p>
      </div>
    );
  }

  // derive a readable gender label from user.gender (string or object)
  const getGenderLabel = (g) => {
    if (!g) return "Not Disclosed";
    // if it's a string like "male"
    if (typeof g === "string") {
      const found = accountGender.find((opt) => opt.value === g);
      return found ? found.label : g;
    }
    // if it's an object like { value, label }
    if (typeof g === "object") {
      return g.label || g.value || "Not Disclosed";
    }
    return "Not Disclosed";
  };

  const displayGender = getGenderLabel(user?.gender);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col items-center w-full gap-6 lg:flex-row">
          <ProfileImageUpload user={user} updateAvatar={setUser} />
          <div className="order-2 lg:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 lg:text-left">
              {user?.fullName} ({user?.location || "Not set"})
            </h4>
            <div className="flex flex-col items-center gap-1 text-center lg:flex-row lg:gap-3 lg:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.phone || ""}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 lg:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email || "DreamZone"}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 lg:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.designation || "General"}
              </p>
            </div>
          </div>
          <div className="flex items-center order-1 gap-2 grow lg:order-3 lg:justify-end">
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

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Personal Information
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Full Name
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.fullName || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Email
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.email || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Phone
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.phone || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Gender
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {displayGender}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Date of Birth
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.dob ? new Date(user.dob).toLocaleDateString() : "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Designation
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.designation || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Instagram
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.instagram || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Location
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.location || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Blood Group
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.bloodGroup || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Country
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.country || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              State
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.state || "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Reporting Head
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.reportingHead?.fullName || "Not set"}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={openModal}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto mt-6"
      >
        <svg
          className="fill-current"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
            fill=""
          />
        </svg>
        Edit
      </button>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      value={user?.fullName || ""}
                      disabled
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input
                      type="text"
                      value={user?.phone || ""}
                      disabled
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Gender</Label>
                    <Select
                      options={accountGender}
                      value={gender}
                      onChange={setGender}
                      placeholder="Select Gender"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Designation</Label>
                    <Input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Your designation"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Blood Group</Label>
                    <Select
                      options={bloodGroupOptions}
                      value={bloodGroup}
                      onChange={setBloodGroup}
                      placeholder="Select Blood Group"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Country</Label>
                    <Select
                      options={countryOptions}
                      value={country}
                      onChange={setCountry}
                      placeholder="Select Country"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>State</Label>
                    <Select
                      options={stateOptions}
                      value={state}
                      onChange={setState}
                      placeholder="Select State"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Location</Label>
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Your address"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Reporting Head</Label>
                    <Select
                      options={reportingHeadOptions}
                      value={reportingHead}
                      onChange={setReportingHead}
                      placeholder="Select Reporting Head"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Instagram</Label>
                    <Input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Instagram username"
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
    </div>
  );
}