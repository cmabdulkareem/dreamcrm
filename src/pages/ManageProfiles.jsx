import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import PageMeta from "../components/common/PageMeta";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function UserProfiles() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/users/allusers`)
      .then((response) => {
        setUsers(response.data.users); // Set all users
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, []);

  return (
    <>
      <PageMeta
        title="DreamCRM, a customer management app | Built by Dreamzone Kasaragod"
        description="React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Profiles" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profiles
        </h3>
        <div className="space-y-6">
          {users.length > 0 ? (
            users.map((user) => (
              <UserMetaCard key={user._id} user={user} setUsers={setUsers} />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No users found.</p>
          )}
        </div>
      </div>
    </>
  );
}
