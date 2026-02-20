import React, { useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import InputField from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import { useNavigate } from 'react-router-dom';

const EmployeeForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        department: '',
        joinDate: '',
        salary: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Employee Data:', formData);
        // Add API call here
        navigate('/hr/employees');
    };

    return (
        <>
            <PageMeta title="Add Employee - CRM" />
            <PageBreadCrumb items={[{ name: 'HR', path: '/hr' }, { name: 'Employees', path: '/hr/employees' }, { name: 'Add' }]} />

            <ComponentCard title="Employee Details">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <InputField
                                label="First Name"
                                name="firstName"
                                id="firstName"
                                placeholder="Enter first name"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <InputField
                                label="Last Name"
                                name="lastName"
                                id="lastName"
                                placeholder="Enter last name"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <InputField
                                type="email"
                                label="Email"
                                name="email"
                                id="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="role">Role</Label>
                            <Select
                                options={[
                                    { value: 'Manager', label: 'Manager' },
                                    { value: 'HR', label: 'HR' },
                                    { value: 'Counselor', label: 'Counselor' },
                                    { value: 'Instructor', label: 'Instructor' },
                                    { value: 'Accountant', label: 'Accountant' },
                                ]}
                                value={formData.role}
                                onChange={(value) => handleSelectChange('role', value)}
                                placeholder="Select Role"
                            />
                        </div>
                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Select
                                options={[
                                    { value: 'Sales', label: 'Sales' },
                                    { value: 'Academic', label: 'Academic' },
                                    { value: 'HR', label: 'Human Resources' },
                                    { value: 'Finance', label: 'Finance' },
                                    { value: 'Operations', label: 'Operations' },
                                ]}
                                value={formData.department}
                                onChange={(value) => handleSelectChange('department', value)}
                                placeholder="Select Department"
                            />
                        </div>
                        <div>
                            <Label htmlFor="joinDate">Join Date</Label>
                            <InputField
                                type="date"
                                label="Join Date"
                                name="joinDate"
                                id="joinDate"
                                value={formData.joinDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => navigate('/hr/employees')} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">Save Employee</button>
                    </div>
                </form>
            </ComponentCard>
        </>
    );
};

export default EmployeeForm;
