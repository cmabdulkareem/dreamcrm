import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ComponentCard from '../../components/common/ComponentCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import DatePicker from '../../components/form/date-picker';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { isManager } from '../../utils/roleHelpers';
import { AuthContext } from '../../context/AuthContext';
import { Dropdown } from '../../components/ui/dropdown/Dropdown';
import { DropdownItem } from '../../components/ui/dropdown/DropdownItem';
import Button from '../../components/ui/button/Button';
import {
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
  ListIcon,
  CalendarIcon,
  FileIcon,
  CheckCircleIcon,
  CloseIcon,
  ChevronDownIcon,
  GridIcon
} from '../../icons';
import { getImageUrl } from '../../utils/imageHelper';

axios.defaults.withCredentials = true;

import API from "../../config/api";

const ItemType = {
  FIELD: 'field',
};

const DraggableField = ({ field, index, moveField, removeField, handleFieldChange }) => {
  const ref = useRef(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemType.FIELD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveField(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.FIELD,
    item: () => {
      return { id: index, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      data-handler-id={handlerId}
      className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-2xl transition-all hover:border-brand-200 dark:hover:border-brand-800 group relative"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-none flex items-center justify-center size-10 bg-white dark:bg-gray-900 rounded-xl shadow-theme-xs text-gray-400 cursor-move">
            <GridIcon className="size-5" />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 block">Field Label</Label>
              <Input
                type="text"
                value={field.fieldName}
                onChange={(e) => handleFieldChange(index, 'fieldName', e.target.value)}
                className="!h-9 !py-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 block">Type</Label>
              <Select
                options={[
                  { value: "text", label: "Short Text" },
                  { value: "email", label: "Email Address" },
                  { value: "number", label: "Number" },
                  { value: "date", label: "Date" },
                  { value: "textarea", label: "Long Text" },
                  { value: "select", label: "Dropdown Select" }
                ]}
                value={field.fieldType}
                onChange={(value) => handleFieldChange(index, 'fieldType', value)}
                className="!h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex h-full items-end gap-4 pb-1">
            <label className="flex items-center gap-2 cursor-pointer group/check">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={field.isRequired}
                  onChange={(e) => handleFieldChange(index, 'isRequired', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${field.isRequired ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                <div className={`absolute left-1 top-1 size-3 bg-white rounded-full transition-all ${field.isRequired ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Required</span>
            </label>

            <button
              type="button"
              onClick={() => removeField(index)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Remove Field"
            >
              <TrashBinIcon className="size-5" />
            </button>
          </div>
        </div>

        {field.fieldType === 'select' && (
          <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-800">
            <Label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 block">Options (Comma separated)</Label>
            <Input
              type="text"
              value={field.options ? field.options.join(',') : ''}
              onChange={(e) => handleFieldChange(index, 'options', e.target.value.split(','))}
              onBlur={(e) => handleFieldChange(index, 'options', e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt !== ""))}
              placeholder="Option 1, Option 2, etc."
              className="!h-9 !py-1 text-sm font-normal"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ManageEvents = () => {
  const { isAdmin, user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    eventDate: '',
    eventTime: '10:00',
    registrationStartDate: '',
    registrationStartTime: '09:00',
    registrationClosesDate: '',
    registrationClosesTime: '23:59',
    maxRegistrations: 0,
    eventPin: '',
    registrationFields: [
      { fieldName: 'Full Name', fieldType: 'text', isRequired: true },
      { fieldName: 'Email', fieldType: 'email', isRequired: true }
    ]
  });
  const [newField, setNewField] = useState({
    fieldName: '',
    fieldType: 'text',
    isRequired: false,
    options: []
  });
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Banner image state for editing
  const [bannerPreview, setBannerPreview] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 56.25,
    aspect: 16 / 9
  });

  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedBannerUrl, setCroppedBannerUrl] = useState(null);
  const [croppedBannerBlob, setCroppedBannerBlob] = useState(null);

  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/events`, { withCredentials: true });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle registration field changes
  const handleFieldChange = (index, field, value) => {
    const updatedFields = [...formData.registrationFields];
    updatedFields[index][field] = value;
    setFormData(prev => ({
      ...prev,
      registrationFields: updatedFields
    }));
  };

  const moveRegistrationField = useCallback((dragIndex, hoverIndex) => {
    const dragField = formData.registrationFields[dragIndex];
    const updatedFields = [...formData.registrationFields];
    updatedFields.splice(dragIndex, 1);
    updatedFields.splice(hoverIndex, 0, dragField);

    setFormData(prev => ({
      ...prev,
      registrationFields: updatedFields
    }));
  }, [formData.registrationFields]);

  // Add a new registration field
  const addRegistrationField = () => {
    if (newField.fieldName.trim() === '') {
      toast.error('Field name is required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      registrationFields: [
        ...prev.registrationFields,
        { ...newField }
      ]
    }));

    setNewField({
      fieldName: '',
      fieldType: 'text',
      isRequired: false,
      options: []
    });
  };

  // Remove a registration field
  const removeRegistrationField = (index) => {
    const updatedFields = [...formData.registrationFields];
    updatedFields.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      registrationFields: updatedFields
    }));
  };

  const uploadBannerForEvent = async (eventId, blob) => {
    try {
      if (!isManager(user)) {
        throw new Error('Access denied. Manager privileges required.');
      }

      const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("banner", file);

      const uploadResponse = await axios.post(
        `${API}/events/upload-banner/${eventId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return uploadResponse.data.bannerImage;
    } catch (error) {
      console.error("Error uploading banner:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to upload banner";
      toast.error(errorMessage);
      throw error;
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      eventName: '',
      eventDescription: '',
      eventDate: '',
      eventTime: '10:00',
      registrationStartDate: '',
      registrationStartTime: '09:00',
      registrationClosesDate: '',
      registrationClosesTime: '23:59',
      maxRegistrations: 0,
      eventPin: '',
      registrationFields: [
        { fieldName: 'Full Name', fieldType: 'text', isRequired: true },
        { fieldName: 'Email', fieldType: 'email', isRequired: true }
      ]
    });
    setNewField({
      fieldName: '',
      fieldType: 'text',
      isRequired: false,
      options: []
    });

    setBannerPreview(null);
    setCroppedBannerUrl(null);
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 56.25,
      aspect: 16 / 9
    });
    setCompletedCrop(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch single event for editing
  const fetchEventForEdit = async (eventId) => {
    try {
      const response = await axios.get(`${API}/events/${eventId}`, { withCredentials: true });
      const event = response.data.event;

      setFormData({
        eventName: event.eventName || '',
        eventDescription: event.eventDescription || '',
        eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
        eventTime: event.eventDate ? new Date(event.eventDate).getUTCHours().toString().padStart(2, '0') + ':' + new Date(event.eventDate).getUTCMinutes().toString().padStart(2, '0') : '10:00',
        registrationStartDate: event.registrationStartsAt ? new Date(event.registrationStartsAt).toISOString().split('T')[0] : '',
        registrationStartTime: event.registrationStartsAt ? new Date(event.registrationStartsAt).getUTCHours().toString().padStart(2, '0') + ':' + new Date(event.registrationStartsAt).getUTCMinutes().toString().padStart(2, '0') : '09:00',
        registrationClosesDate: event.registrationClosesAt ? new Date(event.registrationClosesAt).toISOString().split('T')[0] : '',
        registrationClosesTime: event.registrationClosesAt ? new Date(event.registrationClosesAt).getUTCHours().toString().padStart(2, '0') + ':' + new Date(event.registrationClosesAt).getUTCMinutes().toString().padStart(2, '0') : '23:59',
        maxRegistrations: event.maxRegistrations || 0,
        eventPin: event.eventPin || '',
        registrationFields: event.registrationFields || [
          { fieldName: 'Full Name', fieldType: 'text', isRequired: true },
          { fieldName: 'Email', fieldType: 'email', isRequired: true }
        ]
      });

      if (event.bannerImage) {
        setBannerPreview(`${API.replace('/api', '')}${event.bannerImage}`);
        setCroppedBannerUrl(`${API.replace('/api', '')}${event.bannerImage}`);
      } else {
        setBannerPreview(null);
        setCroppedBannerUrl(null);
      }

      setCurrentEventId(eventId);
      setShowEditForm(true);
    } catch (error) {
      console.error('Error fetching event for edit:', error);
      toast.error('Failed to load event details');
    }
  };

  // Handle edit event
  const handleEditEvent = (eventId) => {
    fetchEventForEdit(eventId);
  };

  // Update event
  const handleUpdateEvent = async (e) => {
    e.preventDefault();

    if (!isManager(user)) {
      toast.error('Access denied. Manager privileges required.');
      return;
    }

    if (newField.fieldName && newField.fieldName.trim() !== '') {
      toast.warning("You have an unsaved field in the 'New Field' section. Please click 'Add Field' to include it, or clear the input.");
      return;
    }

    if (!formData.eventName || !formData.eventDate || !formData.registrationStartDate || !formData.registrationClosesDate) {
      toast.error("Event name, date, and registration window are required");
      return;
    }

    const eventStart = new Date(`${formData.eventDate}T${formData.eventTime}:00`);
    const regStart = new Date(`${formData.registrationStartDate}T${formData.registrationStartTime}:00`);
    const regClose = new Date(`${formData.registrationClosesDate}T${formData.registrationClosesTime}:00`);

    if (regStart >= regClose) {
      toast.error("Registration must start before it closes");
      return;
    }

    if (regClose > eventStart) {
      toast.error("Registration must close before or at the time the event starts");
      return;
    }

    try {
      const eventData = {
        ...formData,
        eventDate: eventStart.toISOString(),
        registrationStartsAt: regStart.toISOString(),
        registrationClosesAt: regClose.toISOString()
      };

      const response = await axios.put(`${API}/events/update/${currentEventId}`, eventData, { withCredentials: true });

      if (croppedBannerBlob || (bannerPreview && !croppedBannerUrl.includes(API.replace('/api', '')))) {
        try {
          if (croppedBannerBlob) {
            await uploadBannerForEvent(response.data.event._id, croppedBannerBlob);
          } else if (bannerPreview?.startsWith("data:")) {
            const res = await fetch(bannerPreview);
            const blob = await res.blob();
            await uploadBannerForEvent(response.data.event._id, blob);
          }
          await fetchEvents();
        } catch (bannerError) {
          console.error('Error uploading banner:', bannerError);
          toast.error('Event updated but banner upload failed');
        }
      } else {
        await fetchEvents();
      }

      toast.success('Event updated successfully');
      setShowEditForm(false);
      resetForm();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'Failed to update event');
    }
  };

  // Toggle event status
  const toggleEventStatus = async (eventId) => {
    if (!isManager(user)) {
      toast.error('Access denied. Manager privileges required.');
      return;
    }

    try {
      await axios.patch(`${API}/events/toggle-status/${eventId}`, {}, { withCredentials: true });
      toast.success('Event status updated');
      fetchEvents();
    } catch (error) {
      console.error('Error toggling event status:', error);
      toast.error(error.response?.data?.message || 'Failed to update event status');
    }
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    if (!isManager(user)) {
      toast.error('Access denied. Manager privileges required.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await axios.delete(`${API}/events/delete/${eventId}`, { withCredentials: true });
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  // View registrations
  const viewRegistrations = (eventId) => {
    navigate(`/events/${eventId}/registrations`);
  };

  // Copy registration link to clipboard
  const copyRegistrationLink = (link) => {
    const fullLink = `${window.location.origin}/event-registration/${link}`;
    navigator.clipboard.writeText(fullLink);
    toast.success('Registration link copied to clipboard');
  };

  const onImageLoad = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 9,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(crop);
  };

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    let cropX, cropY, cropWidth, cropHeight;

    if (crop.unit === '%' || crop.unit === undefined) {
      cropX = (crop.x / 100) * image.width;
      cropY = (crop.y / 100) * image.height;
      cropWidth = (crop.width / 100) * image.width;
      cropHeight = (crop.height / 100) * image.height;
    } else {
      cropX = crop.x;
      cropY = crop.y;
      cropWidth = crop.width;
      cropHeight = crop.height;
    }

    const targetRatio = 16 / 9;
    if (cropWidth / cropHeight > targetRatio) {
      cropWidth = cropHeight * targetRatio;
    } else {
      cropHeight = cropWidth / targetRatio;
    }

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      cropX * scaleX,
      cropY * scaleY,
      cropWidth * scaleX,
      cropHeight * scaleY,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        blob.name = fileName;
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target.result);
      setCroppedBannerUrl(null);
      setCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 56.25,
        aspect: 16 / 9
      });

      setCompletedCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 56.25,
        aspect: 16 / 9
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    const cropToUse = completedCrop || crop;

    if (!cropToUse || !imgRef.current) {
      toast.error("Please select an area to crop");
      return;
    }

    if (!imgRef.current.complete || imgRef.current.naturalWidth === 0) {
      toast.error("Image not fully loaded. Please try again.");
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        cropToUse,
        'banner.jpg'
      );

      setCroppedBannerBlob(croppedBlob);
      setCroppedBannerUrl(URL.createObjectURL(croppedBlob));
    } catch (e) {
      console.error('Error cropping image:', e);
      toast.error("Failed to crop image");
    }
  };

  const triggerBannerUpload = () => {
    fileInputRef.current?.click();
  };

  const removeBanner = () => {
    setBannerPreview(null);
    setCroppedBannerUrl(null);
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 56.25,
      aspect: 16 / 9
    });

    setCompletedCrop(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <LoadingSpinner />
    );
  }

  return (
    <>

      {!isManager(user) && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Access Limited</p>
          <p>You don't have permission to manage events.</p>
        </div>
      )}

      {showEditForm && isManager(user) ? (
        <DndProvider backend={HTML5Backend}>
          <PageMeta title="Update Event | DreamCRM" />
          <div className="max-w-(--breakpoint-2xl) mx-auto pb-20">
            <PageBreadcrumb pageTitle="Update Your Event Details" />
            <ToastContainer position="top-right" autoClose={3000} />
            <form onSubmit={handleUpdateEvent} className="flex flex-col lg:flex-row gap-8 w-full mt-8">
              {/* Left Side: Form Controls */}
            <div className="w-full lg:w-3/5 space-y-8">

              {/* Section 1: Basic Information */}
              <ComponentCard title="1. Basic Information" desc="Update the core details of your event.">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="eventName">Event Name <span className="text-red-500">*</span></Label>
                      <Input
                        type="text"
                        id="eventName"
                        name="eventName"
                        placeholder="e.g. Annual Tech Summit 2024"
                        value={formData.eventName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex-1">
                      <DatePicker
                        id="eventDate"
                        label="Event Date *"
                        value={formData.eventDate}
                        onChange={(date, dateString) => setFormData({ ...formData, eventDate: dateString })}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="eventTime">Event Time *</Label>
                      <Input
                        type="time"
                        id="eventTime"
                        name="eventTime"
                        value={formData.eventTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Registration Window */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Label className="text-brand-500 font-bold mb-4 block uppercase tracking-wider text-xs">Registration Window</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <DatePicker
                          id="registrationStartDate"
                          label="Registration Starts *"
                          value={formData.registrationStartDate}
                          onChange={(date, dateString) => setFormData({ ...formData, registrationStartDate: dateString })}
                          required
                        />
                        <Input
                          type="time"
                          id="registrationStartTime"
                          name="registrationStartTime"
                          label="Start Time *"
                          value={formData.registrationStartTime}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-4">
                        <DatePicker
                          id="registrationClosesDate"
                          label="Registration Closes *"
                          value={formData.registrationClosesDate}
                          onChange={(date, dateString) => setFormData({ ...formData, registrationClosesDate: dateString })}
                          required
                        />
                        <Input
                          type="time"
                          id="registrationClosesTime"
                          name="registrationClosesTime"
                          label="Close Time *"
                          value={formData.registrationClosesTime}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ComponentCard>

              {/* Section 2: Details & Media */}
              <ComponentCard title="2. Description & Media" desc="Update description and banner.">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left side: Description & Capacity */}
                  <div className="lg:col-span-6 space-y-6">
                    <div>
                      <Label htmlFor="eventDescription">Event Description</Label>
                      <textarea
                        id="eventDescription"
                        name="eventDescription"
                        placeholder="Tell people what this event is about..."
                        value={formData.eventDescription}
                        onChange={handleInputChange}
                        rows="5"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white transition-all resize-none shadow-theme-xs"
                      ></textarea>
                    </div>

                    <div className="w-full max-w-xs">
                      <Label htmlFor="maxRegistrations">Maximum Registrations</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          id="maxRegistrations"
                          name="maxRegistrations"
                          value={formData.maxRegistrations}
                          onChange={handleInputChange}
                          min="0"
                          className="!pr-20"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 pointer-events-none uppercase tracking-wider">
                          0 = ∞
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-xs">
                      <Label htmlFor="eventPin">Event PIN (4 Digits)</Label>
                      <Input
                        type="text"
                        id="eventPin"
                        name="eventPin"
                        value={formData.eventPin}
                        onChange={handleInputChange}
                        maxLength={4}
                        pattern="\d{4}"
                        placeholder="e.g. 1234"
                      />
                    </div>
                  </div>

                  {/* Right side: Event Media */}
                  <div className="lg:col-span-6">
                    <div>
                      <Label>Event Banner</Label>
                      <div className="mt-2">
                        {!bannerPreview ? (
                          <div
                            onClick={() => fileInputRef.current.click()}
                            className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center cursor-pointer hover:border-brand-500/50 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-all group"
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleBannerUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <div className="size-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <PlusIcon className="size-8 text-brand-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Click to upload banner</p>
                            <p className="text-xs text-gray-500">Suggested size: 1200x630px (Max 5MB)</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {!croppedBannerUrl ? (
                              <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/50">
                                  <span className="text-white text-xs font-bold uppercase tracking-widest">Crop Banner Image</span>
                                  <button
                                    type="button"
                                    onClick={removeBanner}
                                    className="size-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-red-500 transition-colors"
                                  >
                                    <CloseIcon className="size-4" />
                                  </button>
                                </div>
                                <div className="max-h-[500px] overflow-hidden flex items-center justify-center bg-black/40">
                                  <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={16 / 9}
                                    className="max-w-full"
                                  >
                                    <img
                                      ref={imgRef}
                                      alt="Crop me"
                                      src={bannerPreview}
                                      onLoad={onImageLoad}
                                      style={{ maxHeight: '500px' }}
                                    />
                                  </ReactCrop>
                                </div>
                                <div className="p-4 bg-gray-900/50 border-t border-white/10 flex justify-center">
                                  <Button
                                    onClick={handleCropComplete}
                                    startIcon={<CheckCircleIcon className="size-4" />}
                                  >
                                    Save Crop
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
                                <img src={croppedBannerUrl} alt="Banner Preview" className="w-full aspect-video object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <Button
                                    size="sm"
                                    variant="neutral"
                                    onClick={() => setCroppedBannerUrl(null)}
                                    startIcon={<PencilIcon className="size-4" />}
                                  >
                                    Recrop
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={removeBanner}
                                    startIcon={<TrashBinIcon className="size-4" />}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ComponentCard>

              {/* Section 3: Registration Fields Builder */}
              <ComponentCard title="3. Form Builder" desc="Customize the fields people need to fill out to register.">
                <div className="space-y-6">

                  {/* Existing Fields List */}
                  <div className="space-y-3">
                    {formData.registrationFields.map((field, index) => (
                      <DraggableField
                        key={index}
                        index={index}
                        field={field}
                        moveField={moveRegistrationField}
                        removeField={removeRegistrationField}
                        handleFieldChange={handleFieldChange}
                      />
                    ))}
                  </div>

                  {/* Add New Field UI */}
                  <div className="p-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/50 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>New Field Label</Label>
                        <Input
                          type="text"
                          placeholder="e.g. Phone Number"
                          value={newField.fieldName}
                          onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Field Type</Label>
                        <Select
                          options={[
                            { value: "text", label: "Short Text" },
                            { value: "email", label: "Email Address" },
                            { value: "number", label: "Number" },
                            { value: "date", label: "Date" },
                            { value: "textarea", label: "Long Text" },
                            { value: "select", label: "Dropdown Select" }
                          ]}
                          value={newField.fieldType}
                          onChange={(value) => setNewField({ ...newField, fieldType: value })}
                        />
                      </div>
                    </div>

                    {newField.fieldType === 'select' && (
                      <div>
                        <Label>Select Options (Comma separated)</Label>
                        <Input
                          type="text"
                          placeholder="Choice 1, Choice 2, Choice 3"
                          value={newField.options?.join(',') || ''}
                          onChange={(e) => setNewField({ ...newField, options: e.target.value.split(',') })}
                          onBlur={(e) => setNewField({ ...newField, options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt !== "") })}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={newField.isRequired}
                            onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors ${newField.isRequired ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                          <div className={`absolute left-1 top-1 size-4 bg-white rounded-full transition-all ${newField.isRequired ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-white/90">Make this field required</span>
                      </label>

                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={addRegistrationField}
                        startIcon={<PlusIcon className="size-4" />}
                      >
                        Add to Form
                      </Button>
                    </div>
                  </div>
                </div>
              </ComponentCard>
            </div>

              {/* Right Side: Live Preview (Sticky) */}
              <div className="w-full lg:w-2/5 flex flex-col items-center">
                <div className="sticky top-6 w-full max-w-[300px]">
                  {/* iPhone Frame */}
                  <div className="relative bg-black rounded-[45px] p-2.5 shadow-2xl border-[5px] border-gray-900 shadow-brand-500/10">

                    {/* iPhone Buttons - Volume Drop/Power */}
                    <div className="absolute -left-[8px] top-24 w-[3px] h-12 bg-gray-800 rounded-l-md"></div>
                    <div className="absolute -left-[8px] top-40 w-[3px] h-10 bg-gray-800 rounded-l-md"></div>
                    <div className="absolute -right-[8px] top-32 w-[3px] h-16 bg-gray-800 rounded-r-md"></div>

                    {/* Dynamic Island */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-50 flex items-center justify-end px-3 gap-1 shadow-lg shadow-black/20">
                      <div className="size-1 rounded-full bg-blue-500/20"></div>
                      <div className="size-1.5 rounded-full bg-green-500/40 blur-[1px]"></div>
                    </div>

                    {/* Status Bar Elements */}
                    <div className="absolute top-7 left-8 text-[9px] font-bold text-black z-40">9:41</div>
                    <div className="absolute top-7 right-8 flex gap-1 z-40">
                      <div className="w-3 h-1.5 rounded-[1px] border border-black/20 relative">
                        <div className="absolute right-0.5 top-0.5 bottom-0.5 left-0.5 bg-black rounded-[0.5px]"></div>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-white rounded-[35px] overflow-hidden shadow-inner h-[620px] flex flex-col scrollbar-hide">
                      <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {/* Simulated Header Banner */}
                        <div className="relative">
                          {croppedBannerUrl ? (
                            <img src={croppedBannerUrl} alt="Preview Header" className="w-full aspect-video object-cover" />
                          ) : (
                            <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-300">
                              <FileIcon className="size-16" />
                            </div>
                          )}
                        </div>

                        {/* Event Title & Date Below Banner */}
                        <div className="px-6 pt-6 pb-2">
                          <h2 className="text-gray-900 text-xl font-bold leading-tight">
                            {formData.eventName || "Your Event Brand Here"}
                          </h2>
                          <div className="flex items-center gap-2 text-gray-500 text-xs mt-2 font-medium">
                            <CalendarIcon className="size-4 text-brand-500" />
                            {formData.eventDate ? new Date(formData.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "Select a date..."}
                            {formData.eventTime && ` at ${formData.eventTime}`}
                          </div>
                        </div>

                        {/* Simulated Form Body */}
                        <div className="px-6 pb-6 pt-2 space-y-6">
                          {formData.eventDescription && (
                            <p className="text-gray-500 text-sm leading-relaxed border-b border-gray-100 pb-5 whitespace-pre-wrap italic">
                              {formData.eventDescription}
                            </p>
                          )}

                          <div className="space-y-4">
                            {formData.registrationFields.length > 0 ? (
                              formData.registrationFields.map((field, idx) => (
                                <div key={idx} className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1">
                                    {field.fieldName || `Untitled Field ${idx + 1}`}
                                    {field.isRequired && <span className="text-red-500">*</span>}
                                  </label>
                                  {field.fieldType === 'textarea' ? (
                                    <div className="w-full h-20 bg-gray-50/50 border border-gray-100 rounded-xl"></div>
                                  ) : field.fieldType === 'select' ? (
                                    <div className="w-full h-10 px-4 bg-gray-50/50 border border-gray-100 rounded-xl flex items-center justify-between text-gray-400 text-[11px]">
                                      Select from options...
                                      <ChevronDownIcon className="size-3.5" />
                                    </div>
                                  ) : (
                                    <div className="w-full h-10 px-4 bg-gray-50/50 border border-gray-100 rounded-xl flex items-center text-gray-400 text-[11px]">
                                      {field.fieldType === 'date' ? 'YYYY-MM-DD' : field.fieldType === 'number' ? '0' : `Enter ${field.fieldName.toLowerCase()}...`}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-10 border-2 border-dashed border-gray-50 rounded-3xl">
                                <p className="text-gray-400 text-[11px]">Add fields to see the form preview</p>
                              </div>
                            )}

                            <div className="pt-4">
                              <div className="w-full py-3.5 bg-brand-500 text-white rounded-2xl font-bold text-center text-sm shadow-lg shadow-brand-500/30">
                                Register Now
                              </div>
                              <p className="text-[9px] text-center text-gray-400 mt-4 px-4 leading-tight">
                                By clicking register you agree to our terms of service and privacy policy.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full z-20"></div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8 px-1">
                    <Button
                      variant="outline"
                      type="button"
                      className="flex-1 !rounded-[20px] !py-4 text-xs font-bold"
                      onClick={() => {
                        setShowEditForm(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-2 !rounded-[20px] !py-4 text-xs font-bold shadow-lg shadow-brand-500/20"
                      startIcon={<CheckCircleIcon className="size-4" />}
                      disabled={loading}
                    >
                      Update Event
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </DndProvider>
      ) : (
        <>
          <PageMeta title="Manage Events - CRM" />
          <PageBreadcrumb pageTitle="Manage Your Events Here" />
          <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
          <ComponentCard title="Manage Events">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No events found.</p>
                  <a
                    href="/events/create"
                    className="inline-block px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors"
                  >
                    Create your first event
                  </a>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event._id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                      {event.bannerImage ? (
                        <img
                          src={getImageUrl(event.bannerImage)}
                          alt={event.eventName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-gray-400">
                          <svg className="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-medium uppercase tracking-wider opacity-50">No Banner</span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${event.isActive
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                          }`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {isManager(user) && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === event._id ? null : event._id);
                              }}
                              className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="Actions"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>

                            <Dropdown
                              isOpen={openDropdownId === event._id}
                              onClose={() => setOpenDropdownId(null)}
                              className="absolute right-0 mt-2 w-48"
                            >
                              <div className="py-1">
                                <DropdownItem onClick={() => { handleEditEvent(event._id); setOpenDropdownId(null); }}>
                                  <div className="flex items-center gap-2">
                                    <PencilIcon className="w-4 h-4" />
                                    <span>Edit Event</span>
                                  </div>
                                </DropdownItem>

                                <DropdownItem onClick={() => { toggleEventStatus(event._id); setOpenDropdownId(null); }}>
                                  <div className="flex items-center gap-2">
                                    {event.isActive ? (
                                      <>
                                        <CloseIcon className="w-4 h-4 text-yellow-500" />
                                        <span>Deactivate</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                        <span>Activate</span>
                                      </>
                                    )}
                                  </div>
                                </DropdownItem>

                                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

                                <DropdownItem
                                  onClick={() => { deleteEvent(event._id); setOpenDropdownId(null); }}
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <div className="flex items-center gap-2">
                                    <TrashBinIcon className="w-4 h-4" />
                                    <span>Delete Event</span>
                                  </div>
                                </DropdownItem>
                              </div>
                            </Dropdown>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg" title={event.eventName}>
                        {event.eventName}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2 min-h-[40px]">
                        {event.eventDescription || 'No description provided'}
                      </p>

                      <div className="mt-4 space-y-2.5">
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold">Date:</span>
                          <span className="ml-1.5">{new Date(event.eventDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-semibold">Capacity:</span>
                          <span className="ml-1.5">{event.currentRegistrations} / {event.maxRegistrations || '∞'}</span>
                        </div>
                      </div>

                      {event.registrationLink && (                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Registration Link</p>
                              <p className="text-xs text-brand-500 truncate font-medium">
                                {`${window.location.origin}/event-registration/${event.registrationLink}`}
                              </p>
                            </div>
                            <button
                              onClick={() => copyRegistrationLink(event.registrationLink)}
                              className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-gray-400 hover:text-brand-500 rounded transition-colors shrink-0"
                              title="Copy Link"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => viewRegistrations(event._id)}
                          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-lg transition-all shadow-sm shadow-brand-500/10 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Registrations
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>
          </ComponentCard>
        </>
      )}
    </>
  );
};

export default ManageEvents;
