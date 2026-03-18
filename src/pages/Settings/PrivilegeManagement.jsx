import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { isAdmin } from "../../utils/roleHelpers";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Checkbox from "../../components/form/input/Checkbox";
import Select from "../../components/form/Select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import API from "../../config/api";
import "react-toastify/dist/ReactToastify.css";

const PrivilegeManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState("Owner");
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const roleOptions = [
    { value: "Owner", label: "Owner" },
    { value: "Academic Coordinator", label: "Academic Coordinator" },
    { value: "Brand Manager", label: "Brand Manager" },
    { value: "Counsellor", label: "Counsellor" },
    { value: "Marketing / Social Media Executive", label: "Marketing / Social Media Executive" },
    { value: "Instructor", label: "Instructor" },
    { value: "Placement Officer", label: "Placement Officer" },
    { value: "Lab Assistant", label: "Lab Assistant" },
    { value: "CADD Club Support", label: "CADD Club Support" },
    { value: "Accounts Executive", label: "Accounts Executive" },
    { value: "Front Office / Receptionist", label: "Front Office / Receptionist" },
    { value: "IT Support", label: "IT Support" },
    { value: "Event Coordinator", label: "Event Coordinator" },
    { value: "Housekeeping / Office Assistant", label: "Housekeeping / Office Assistant" },
    { value: "PRO", label: "PRO" },
    { value: "General", label: "General" }
  ];

  const moduleStructure = [
    { name: "Dashboard", subModules: ["Leads & Conversions"] },
    { name: "Lead Management", subModules: ["New Lead", "Manage Leads", "Cold Call list", "Reports"] },
    { name: "Student Management", subModules: ["Manage Students", "Student Pipeline", "Batch Management", "Birthday Calendar"] },
    { name: "EMS / HR", subModules: ["HR Dashboard", "Employee Roles", "Recruitment & Candidates", "Agreement Builder", "Leave Management", "Payroll"] },
    { name: "Lab Management", subModules: ["Lab Scheduler", "Softwares", "Complaints"] },
    { name: "Finance", subModules: ["Manage Invoices", "Generate Invoice"] },
    { name: "Calendar", subModules: [] },
    { name: "Events", subModules: ["Create Event", "Manage Events"] },
    { name: "Email", subModules: [] },
    { name: "Marketing", subModules: ["Databases", "Promotional", "Marketing Portal"] },
    { name: "Settings", subModules: ["Campaigns", "Contact Points", "Course Management", "Brand Management", "Announcements", "App Backup"] }
  ];

  // Flatten the hierarchy for the table
  const flattenedModules = [];
  moduleStructure.forEach((m) => {
    flattenedModules.push({ name: m.name, isMain: true });
    m.subModules.forEach((sm) => {
      flattenedModules.push({ name: sm, isMain: false, parent: m.name });
    });
  });

  useEffect(() => {
    if (isAdmin(currentUser)) {
       // In demo mode, we just use the default empty/false permissions
       const initialPrivileges = flattenedModules.map((mod) => ({
          role: selectedRole,
          module: mod.name,
          isMain: mod.isMain,
          parent: mod.parent,
          create: false,
          read: false,
          updateL1: false,
          updateL2: false,
          updateL3: false,
          delete: false,
          all: false
       }));
       setPrivileges(initialPrivileges);
       setLoading(false);
    }
  }, [currentUser, selectedRole]);

  const handleCheckboxChange = (moduleName, field, value) => {
    setPrivileges((prev) => {
      const updatedList = prev.map((p) => {
        if (p.module === moduleName) {
          const updated = { ...p, [field]: value };
          
          if (field === "all") {
            updated.create = value;
            updated.read = value;
            updated.updateL1 = value;
            updated.updateL2 = value;
            updated.updateL3 = value;
            updated.delete = value;
          } else {
            if (!value) {
              updated.all = false;
            } else {
              const { create, read, updateL1, updateL2, updateL3, delete: del } = updated;
              if (create && read && updateL1 && updateL2 && updateL3 && del) {
                updated.all = true;
              }
            }
          }
          return updated;
        }
        return p;
      });

      // If it's a main module, optionally update sub-modules (for fields other than 'all'?)
      // For now, let's just make it simple. If the user wants to set all sub-modules, they can click "All" on each.
      // But if we want to be helpful, toggling a main module's checkbox could affect sub-modules.
      const targetMod = updatedList.find(p => p.module === moduleName);
      if (targetMod && targetMod.isMain) {
          return updatedList.map(p => {
              if (p.parent === moduleName) {
                  const subUpdated = { ...p, [field]: value };
                  if (field === "all") {
                      subUpdated.create = value;
                      subUpdated.read = value;
                      subUpdated.updateL1 = value;
                      subUpdated.updateL2 = value;
                      subUpdated.updateL3 = value;
                      subUpdated.delete = value;
                  } else {
                      if (!value) subUpdated.all = false;
                      else {
                          const { create, read, updateL1, updateL2, updateL3, delete: del } = subUpdated;
                          if (create && read && updateL1 && updateL2 && updateL3 && del) subUpdated.all = true;
                      }
                  }
                  return subUpdated;
              }
              return p;
          });
      }

      return updatedList;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Simulating a save operation for demo mode
      setTimeout(() => {
        toast.info(`Demo Mode: Changes for ${selectedRole} would be saved in the production version.`);
        setSaving(false);
      }, 1000);
      
      /* Actual API call disabled for demo mode:
      const response = await axios.post(`${API}/privileges/bulk`, {
          role: selectedRole,
          privileges: privileges.map(({ isMain, parent, all, ...rest }) => rest)
      }, {
        withCredentials: true,
      });
      toast.success(response.data.message || `Privileges for ${selectedRole} updated.`);
      setSaving(false);
      */
    } catch (error) {
      console.error("Error saving privileges:", error);
      toast.error(`Failed to update privileges for ${selectedRole}.`);
      setSaving(false);
    }
  };

  if (!isAdmin(currentUser)) {
    return (
      <div>
        <PageMeta title="Access Denied" description="Access Denied" />
        <PageBreadcrumb pageTitle="Access Denied" />
        <div className="flex items-center justify-center h-64">
           <p className="text-gray-500">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="Privileges | Settings" description="Manage role-based privileges" />
      <PageBreadcrumb pageTitle="Privileges" />
      
      <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 dark:border-gray-800 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Manage Privileges <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/50">Demo Version</span></h3>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-bold">Set module and sub-module permissions (Changes will not be saved in demo mode)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-64">
                <Select 
                  options={roleOptions} 
                  value={selectedRole} 
                  onChange={(val) => setSelectedRole(val)} 
                  placeholder="Select Role"
                />
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving || loading}>
                {saving ? "Saving..." : "Save Privileges"}
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400">#</TableCell>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400">Module / Sub-module</TableCell>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 text-center">Create</TableCell>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 text-center">Read</TableCell>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 text-center">Update L1</TableCell>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 text-center">Update L2</TableCell>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 text-center">Update L3</TableCell>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 text-center">Delete</TableCell>
                  <TableCell isHeader className="py-4 px-5 text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 text-center border-l border-gray-100 dark:border-gray-800 bg-gray-100/30 dark:bg-white/5">All</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {privileges.map((p, index) => (
                  <TableRow 
                    key={p.module} 
                    className={`group transition-all ${p.isMain ? 'bg-gray-50/50 dark:bg-white/[0.02] font-semibold' : 'bg-transparent'}`}
                  >
                    <TableCell className="py-3 px-5 text-xs text-gray-400 dark:text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="py-3 px-5">
                       <span className={`${p.isMain ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-600 dark:text-gray-400 text-xs ml-6 flex items-center gap-2'}`}>
                          {!p.isMain && <span className="w-2 h-[1px] bg-gray-300 dark:bg-gray-700"></span>}
                          {p.module}
                       </span>
                    </TableCell>
                    <TableCell className="py-3 px-5 text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={p.create} 
                          onChange={(val) => handleCheckboxChange(p.module, "create", val)} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-5 text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={p.read} 
                          onChange={(val) => handleCheckboxChange(p.module, "read", val)} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-5 text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={p.updateL1} 
                          onChange={(val) => handleCheckboxChange(p.module, "updateL1", val)} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-5 text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={p.updateL2} 
                          onChange={(val) => handleCheckboxChange(p.module, "updateL2", val)} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-5 text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={p.updateL3} 
                          onChange={(val) => handleCheckboxChange(p.module, "updateL3", val)} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-5 text-center">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={p.delete} 
                          onChange={(val) => handleCheckboxChange(p.module, "delete", val)} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-5 text-center border-l border-gray-100 dark:border-gray-800 bg-gray-100/10 dark:bg-white/[0.01]">
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={p.all} 
                          onChange={(val) => handleCheckboxChange(p.module, "all", val)} 
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default PrivilegeManagement;
