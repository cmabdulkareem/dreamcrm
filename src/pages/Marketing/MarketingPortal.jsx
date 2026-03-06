import React, { useState, useEffect, useContext, useMemo } from 'react';
import { toast } from 'react-toastify';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus } from 'lucide-react';

// Common Components
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { Table, TableBody, TableHeader, TableRow, TableCell } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import DatePicker from "../../components/form/date-picker";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";

// Context & Hooks
import { AuthContext } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";

// Icons
import { PlusIcon, AlertIcon, ChatIcon, CalendarIcon, ChevronDownIcon } from '../../icons/index';

// Refactored Modules
import marketingService from './services/marketingService';
import { getPriorityModalClass } from './utils/taskHelpers';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from './constants/taskConstants';

// Refactored Components
import TaskRow from './components/TaskRow';
import TaskFilters from './components/TaskFilters';
import TeamSelector from './components/TeamSelector';

const MarketingPortal = () => {
    const { selectedBrand, user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [fetchingTeam, setFetchingTeam] = useState(false);
    const [teamSearch, setTeamSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Expansion & Modal states
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const { isOpen: isTaskModalOpen, openModal: openTaskModal, closeModal: closeTaskModal } = useModal();
    const { isOpen: isRemarkModalOpen, openModal: openRemarkModal, closeModal: closeRemarkModal } = useModal();

    // Inline Sub-task states
    const [newSubTask, setNewSubTask] = useState("");
    const [newSubTaskDate, setNewSubTaskDate] = useState("");
    const [newSubTaskAssignedTo, setNewSubTaskAssignedTo] = useState("");

    const [formData, setFormData] = useState({
        title: '', description: '', priority: 'Medium', status: 'Pending',
        scheduledDate: '', subTasks: [], team: []
    });
    const [remark, setRemark] = useState('');

    const brandId = useMemo(() => selectedBrand?._id || selectedBrand?.id, [selectedBrand]);

    useEffect(() => {
        if (brandId) {
            loadTasks();
            loadTeamMembers();
        }
    }, [brandId]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await marketingService.fetchTasks(brandId);
            if (data.success) setTasks(data.tasks);
        } catch (error) {
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const loadTeamMembers = async () => {
        setFetchingTeam(true);
        try {
            const data = await marketingService.fetchTeamMembers(brandId);
            if (data.users) setTeamMembers(data.users);
        } catch (error) {
            console.error('Error fetching team members:', error);
        } finally {
            setFetchingTeam(false);
        }
    };

    // --- Task Handlers ---
    const handleAddTask = () => {
        setSelectedTask(null);
        setFormData({ title: '', description: '', priority: 'Medium', status: 'Pending', scheduledDate: '', subTasks: [], team: [] });
        openTaskModal();
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            scheduledDate: task.scheduledDate ? new Date(task.scheduledDate).toISOString().split('T')[0] : '',
            subTasks: task.subTasks || [],
            team: (task.team || []).map(m => m._id || m)
        });
        openTaskModal();
    };

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (selectedTask) {
                await marketingService.updateTask(brandId, selectedTask._id, formData);
                toast.success('Task updated successfully');
            } else {
                await marketingService.createTask(brandId, formData);
                toast.success('Task created successfully');
            }
            closeTaskModal();
            loadTasks();
        } catch (error) {
            toast.error('Failed to save task');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await marketingService.deleteTask(brandId, id);
            toast.success('Task dropped successfully');
            loadTasks();
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    // --- Sub-task Handlers ---
    const handleToggleSubTask = async (taskId, subTaskId) => {
        try {
            await marketingService.toggleSubTask(brandId, taskId, subTaskId);
            loadTasks();
        } catch (error) {
            toast.error('Failed to update sub-task');
        }
    };

    const handleAddSubTaskToTask = async (taskId) => {
        if (!newSubTask.trim()) return;
        setIsLoading(true);
        try {
            await marketingService.addSubTask(brandId, taskId, {
                title: newSubTask.trim(),
                targetDate: newSubTaskDate || null,
                assignedTo: newSubTaskAssignedTo || null
            });
            setNewSubTask(""); setNewSubTaskDate(""); setNewSubTaskAssignedTo("");
            loadTasks();
            toast.success('Sub-task added');
        } catch (error) {
            toast.error('Failed to add sub-task');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSubTaskFromTask = async (taskId, subTaskId) => {
        if (!window.confirm('Delete this sub-task?')) return;
        try {
            await marketingService.deleteSubTask(brandId, taskId, subTaskId);
            loadTasks();
            toast.success('Sub-task deleted');
        } catch (error) {
            toast.error('Failed to delete sub-task');
        }
    };



    const handleAddRemark = (task) => { setSelectedTask(task); setRemark(''); openRemarkModal(); };

    const handleSubmitRemark = async (e) => {
        e.preventDefault();
        try {
            await marketingService.addRemark(brandId, selectedTask._id, { remark, user: user?._id });
            toast.success('Remark added');
            closeRemarkModal();
            loadTasks();
        } catch (error) {
            toast.error('Failed to add remark');
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
            const matchesStatus = statusFilter ? task.status === statusFilter : true;
            const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [tasks, search, statusFilter, priorityFilter]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <PageMeta title="Marketing Portal | CDC Insights" />
            <PageBreadcrumb pageTitle="Manage Your Marketing Tasks" />

            {!selectedBrand ? (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <AlertIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Brand Selected</h3>
                    <p className="text-sm text-gray-500">Please select a brand from the switcher to view its marketing tasks.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                    {loading ? (
                        <LoadingSpinner className="py-20" />
                    ) : (
                        <>
                            <div className="space-y-4 mb-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Marketing Tasks</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Total: {filteredTasks.length} records</p>
                                    </div>
                                    <Button size="sm" variant="primary" onClick={handleAddTask} startIcon={<PlusIcon className="w-5 h-5" />}>
                                        Add Task
                                    </Button>
                                </div>
                                <TaskFilters
                                    showFilters={showFilters} setShowFilters={setShowFilters}
                                    search={search} setSearch={setSearch}
                                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                                    priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
                                />
                            </div>

                            <div className="overflow-auto max-h-[calc(100vh-320px)] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar">
                                <Table className="min-w-full border-collapse">
                                    <TableHeader className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
                                        <TableRow>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest pl-8 bg-inherit">Task Name</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Sub-tasks</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Team</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Status</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Remarks</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Actions</TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredTasks.length === 0 ? (
                                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-gray-500">No marketing tasks found.</TableCell></TableRow>
                                        ) : (
                                            filteredTasks.map((task) => (
                                                <TaskRow
                                                    key={task._id} task={task}
                                                    expandedTaskId={expandedTaskId} setExpandedTaskId={setExpandedTaskId}
                                                    handleEditTask={handleEditTask} toggleDropdown={setOpenDropdownId}
                                                    openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId}
                                                    handleAddRemark={handleAddRemark} handleDeleteTask={handleDeleteTask}
                                                    newSubTask={newSubTask} setNewSubTask={setNewSubTask}
                                                    newSubTaskDate={newSubTaskDate} setNewSubTaskDate={setNewSubTaskDate}
                                                    newSubTaskAssignedTo={newSubTaskAssignedTo} setNewSubTaskAssignedTo={setNewSubTaskAssignedTo}
                                                    handleAddSubTaskToTask={handleAddSubTaskToTask}
                                                    handleToggleSubTask={handleToggleSubTask}
                                                    handleDeleteSubTask={handleDeleteSubTaskFromTask}
                                                    isLoading={isLoading} teamMembers={teamMembers}
                                                />
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Task Modal */}
            <DndProvider backend={HTML5Backend}>
                <Modal isOpen={isTaskModalOpen} onClose={closeTaskModal} className="max-w-4xl">
                    <div className="p-6 pb-0">
                        <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100 dark:border-gray-800 pr-12">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTask ? "Edit Task" : "New Marketing Task"}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedTask ? `Editing task · #${selectedTask._id.slice(-6)}` : "Fill in the details below to create a task"}</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getPriorityModalClass(formData.priority)}`}>
                                {formData.priority} Priority
                            </span>
                        </div>

                        <form onSubmit={handleSubmitTask}>
                            <div className="max-h-[68vh] overflow-y-auto custom-scrollbar pr-1">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Task Title <span className="text-red-500">*</span></label>
                                            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Q1 Campaign" required className="h-11 text-sm text-start" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Remarks</label>
                                                <span className={`text-xs font-medium ${formData.description.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>{formData.description.length}/500</span>
                                            </div>
                                            <textarea value={formData.description} onChange={(e) => e.target.value.length <= 500 && setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 min-h-[130px] transition-all resize-none placeholder:text-gray-400 text-start" placeholder="Goals, context..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Priority</label>
                                            <div className="flex gap-2">
                                                {PRIORITY_OPTIONS.map(label => (
                                                    <button key={label} type="button" onClick={() => setFormData({ ...formData, priority: label })} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${formData.priority === label ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-600 hover:border-brand-300'}`}>{label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Status</label>
                                                <div className="relative">
                                                    <div className="flex items-center gap-2 h-11 px-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 cursor-pointer text-start">
                                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{formData.status}</span>
                                                        <ChevronDownIcon className="size-4 text-gray-400" />
                                                    </div>
                                                    <select className="absolute inset-0 opacity-0 cursor-pointer w-full" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                                                </div>
                                            </div>
                                            <div>
                                                <DatePicker
                                                    id="scheduledDate"
                                                    label="Due Date"
                                                    value={formData.scheduledDate}
                                                    onChange={(dates, dateStr) => setFormData({ ...formData, scheduledDate: dateStr })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <TeamSelector
                                            teamMembers={teamMembers} selectedTeam={formData.team}
                                            teamSearch={teamSearch} setTeamSearch={setTeamSearch}
                                            onToggleMember={(id) => setFormData({ ...formData, team: formData.team.includes(id) ? formData.team.filter(i => i !== id) : [...formData.team, id] })}
                                            fetchingTeam={fetchingTeam}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky bottom-0">
                                <Button variant="outline" onClick={closeTaskModal} type="button" className="h-10 px-6 rounded-xl text-sm font-medium">Cancel</Button>
                                <Button type="submit" disabled={isLoading || !formData.title.trim()} className={`h-10 px-8 rounded-xl text-sm font-semibold transition-all ${isLoading || !formData.title.trim() ? 'bg-gray-100 text-gray-400' : 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600'}`}>
                                    {isLoading ? <LoadingSpinner className="size-4" /> : selectedTask ? "Update Task" : "Create Task"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </DndProvider>

            {/* Remarks Modal */}
            <Modal isOpen={isRemarkModalOpen} onClose={closeRemarkModal} className="max-w-2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800 pr-12">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Task History & Timeline</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track updates and team comments.</p>
                        </div>
                    </div>
                    <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <ComponentCard title="Activity Feed">
                            <div className="space-y-10">
                                <div className="space-y-6">
                                    {selectedTask?.remarks?.length === 0 ? (
                                        <div className="text-center py-12 opacity-30"><ChatIcon className="w-12 h-12 mx-auto mb-3" /><p>No activity yet.</p></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {[...(selectedTask?.remarks || [])].reverse().map((r, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <div className="shrink-0"><div className="size-10 rounded-full bg-brand-50 flex items-center justify-center font-bold">{r.user?.fullName?.charAt(0) || 'S'}</div></div>
                                                    <div className="flex-1 bg-gray-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-start">
                                                        <div className="flex justify-between items-center mb-2"><span className="text-sm font-bold">{r.user?.fullName || 'System'}</span><span className="text-[10px] text-gray-400">{new Date(r.date).toLocaleString()}</span></div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">{r.remark}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                                    <form onSubmit={handleSubmitRemark} className="space-y-4">
                                        <textarea value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] text-sm h-28 resize-none text-start" placeholder="Post a remark..." required />
                                        <div className="flex justify-end gap-3">
                                            <Button variant="outline" onClick={closeRemarkModal} type="button" className="h-10 px-6 rounded-lg text-xs font-bold">Close</Button>
                                            <Button type="submit" disabled={!remark.trim()} className="h-10 px-8 rounded-lg bg-brand-500 text-white font-bold uppercase tracking-wider">Post Update</Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </ComponentCard>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MarketingPortal;
