import { useState, useContext, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { bloodGroupOptions, countryOptions, stateOptions } from "../../data/DataSets";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

  // Reset form state when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      setInstagram(user?.instagram || "");
      setLocation(user?.location || "");
      setBloodGroup(user?.bloodGroup || "");
      setCountry(user?.country || "");
      setState(user?.state || "");
      setReportingHead(user?.reportingHead?.id || user?.reportingHead || "");
      setDesignation(user?.designation || "");
      setGender(user?.gender || "notDisclosed");
      setDob(user?.dob || "");
    }
  }, [user, isOpen]);

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
      const payload = {
        instagram: instagram,
        location: location,
        bloodGroup: bloodGroup,
        country: country,
        state: state,
        reportingHead: reportingHead || null,
        designation: designation,
        gender: gender,
        dob: dob || null
      };

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
  ];

  // Don't render the component if user data is not available
  if (!user) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
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
                {user?.gender === "male" ? "Male" : user?.gender === "female" ? "Female" : "Not Disclosed"}
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
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "notDisclosed", label: "Not Disclosed" }
                      ]}
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