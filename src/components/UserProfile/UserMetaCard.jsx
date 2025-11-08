import { useState, useContext } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import { useNavigate } from "react-router";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import MultiSelect from "../form/MultiSelect";
import PhoneInput from "../form/group-input/PhoneInput";
import DatePicker from "../form/date-picker";
import Select from "../form/Select";
import { courseOptions, countries, accountStatus, accountGender, departments, employmentType, rolesOptions } from "../../data/DataSets";
import axios from "axios";
import ProfileImageUpload from "./ProfileImageUpload";
import { AuthContext } from "../../context/authContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function UserMetaCard({ user, setUsers }) {
  const { user: currentUser, setUser, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const { isOpen, openModal, closeModal } = useModal();
  const [employeeCode, setEmployeeCode] = useState(user?.employeeCode || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone1, setPhone1] = useState(user?.phone || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [dob, setDob] = useState(
    user?.dob ? new Date(user.dob.split("T")[0]) : null
  );
  const [department, setDepartment] = useState(user?.department || "");
  const [designation, setDesignation] = useState(user?.designation || "");
  const [employmentTypeVal, setEmploymentTypeVal] = useState(user?.employmentType || "");
  const [joiningDate, setJoiningDate] = useState(
    user?.joiningDate ? new Date(user.joiningDate.split("T")[0]) : null
  );
  const [accountStatusVal, setAccountStatusVal] = useState(user?.accountStatus || "");
  const [roles, setRoles] = useState(user?.roles || ["General"]);
  const [company, setCompany] = useState(user?.company || "");
  const [instagram, setInstagram] = useState(user?.instagram || "");
  const [location, setLocation] = useState(user?.location || ""); // Add location state
  const [error, setError] = useState(false);

  // Check if the current user is editing their own profile
  const isOwnProfile = currentUser?._id === user?._id;

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      employeeCode,
      fullName,
      email,
      phone: phone1,
      gender,
      dob: formatDate(dob),
      department,
      designation,
      employmentType: employmentTypeVal,
      joiningDate: formatDate(joiningDate),
      accountStatus: accountStatusVal,
      roles,
      company,
      instagram,
      location // Add location to payload
    };

    axios
      .put(`${API}/users/update/${user._id}`, payload)
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
        closeModal();
      })
      .catch((err) => {
        console.error("Error updating user", err);
      });
  };

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setError(!emailRegex.test(value));
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
                {user?.fullName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.designation || ""}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.location || "DreamZone, Kasaragod"}
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
          <button
            onClick={openModal}
            className={`flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 py-3 text-sm font-medium shadow-theme-xs lg:inline-flex lg:w-auto
    ${{
                Active:
                  "border-success-500 bg-white text-success-600 hover:bg-success-50 hover:text-success-700 dark:border-success-600 dark:bg-gray-800 dark:text-success-400 dark:hover:bg-success-900/20 dark:hover:text-success-300",
                Pending:
                  "border-yellow-400 bg-white text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 dark:border-yellow-500 dark:bg-gray-800 dark:text-yellow-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300",
                Suspended:
                  "border-red-500 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300",
                Deactivated:
                  "border-gray-400 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-900/20 dark:hover:text-gray-300",
              }[user?.accountStatus] || "border-gray-300 bg-white text-gray-500"}`}
          >
            {user?.accountStatus ? `${user.accountStatus} User` : "Unknown Status"}
          </button>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
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
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Member
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              This is where we manage our members and track their progress.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <div>
                  <MultiSelect
                    label="Modules"
                    options={rolesOptions}
                    defaultSelected={roles}
                    onChange={setRoles}
                    disabled={!isAdmin && isOwnProfile}
                  />
                </div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="w-full">
                    <Label htmlFor="employeeCode">Employee Code</Label>
                    <Input 
                      type="text" 
                      id="employeeCode" 
                      value={employeeCode} 
                      onChange={(e) => setEmployeeCode(e.target.value)} 
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      type="text" 
                      id="fullName" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      error={error}
                      onChange={handleEmailChange}
                      placeholder="Enter your email"
                      hint={error ? "This is an invalid email address." : ""}
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <Label>Phone</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone1}
                      onChange={(e) => setPhone1(e)}
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <Label>Gender</Label>
                    <Select
                      options={accountGender}
                      defaultValue={gender}
                      placeholder="Select Gender"
                      onChange={setGender}
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <DatePicker
                      id="dob"
                      label="DoB"
                      placeholder="Select a date"
                      defaultDate={dob}
                      onChange={(date) => setDob(date)}
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Professional Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="w-full">
                    <Label>Department</Label>
                    <Select
                      options={departments}
                      defaultValue={department}
                      placeholder="Select Department"
                      onChange={setDepartment}
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="designation">Designation</Label>
                    <Input 
                      type="text" 
                      id="designation" 
                      value={designation} 
                      onChange={(e) => setDesignation(e.target.value)} 
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <Label>Employment Type</Label>
                    <Select
                      options={employmentType}
                      defaultValue={employmentTypeVal || ""}
                      placeholder="Select Employment Type"
                      onChange={setEmploymentTypeVal}
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <DatePicker
                      id="joiningDate"
                      label="Joining Date"
                      placeholder="Joining Date"
                      defaultDate={joiningDate}
                      onChange={(date) => setJoiningDate(date)}
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <Label>Employment Status</Label>
                    <Select
                      options={accountStatus}
                      defaultValue={accountStatusVal || ""}
                      placeholder="Select Status"
                      onChange={setAccountStatusVal}
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="company">Company</Label>
                    <Input 
                      type="text" 
                      id="company" 
                      value={company} 
                      onChange={(e) => setCompany(e.target.value)} 
                      disabled={!isAdmin && isOwnProfile}
                    />
                  </div>
                </div>
              </div>
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
                      onChange={(e) => setInstagram(e.target.value)} 
                      // Users can edit their own Instagram
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="location">Address</Label>
                    <Input 
                      type="text" 
                      id="location" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      // Users can edit their own address
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
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