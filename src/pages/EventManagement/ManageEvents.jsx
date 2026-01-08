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
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { isManager } from '../../utils/roleHelpers';
import { AuthContext } from '../../context/AuthContext';

axios.defaults.withCredentials = true;

import API from "../../config/api";

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
    maxRegistrations: 0,
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
      maxRegistrations: 0,
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
        maxRegistrations: event.maxRegistrations || 0,
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

    try {
      const eventData = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString()
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

  const onImageLoad = useCallback((img) => {
    if (img) {
      imgRef.current = img;
    }
  }, []);

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
      <PageMeta title="Manage Events - CRM" />
      <PageBreadcrumb
        items={[
          { name: 'Dashboard', path: '/' },
          { name: 'Events', path: '/events' },
          { name: 'Manage Events' }
        ]}
      />
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />

      {!isManager(user) && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Access Limited</p>
          <p>You don't have permission to manage events.</p>
        </div>
      )}

      {showEditForm && isManager(user) ? (
        <ComponentCard title="Edit Event">
          <form onSubmit={handleUpdateEvent}>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    type="text"
                    id="eventName"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="w-full md:w-1/2">
                  <DatePicker
                    id="eventDate"
                    label="Event Date *"
                    value={formData.eventDate}
                    onChange={(date, dateString) => setFormData({ ...formData, eventDate: dateString })}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <div>
                    <Label htmlFor="eventDescription">Event Description</Label>
                    <textarea
                      id="eventDescription"
                      name="eventDescription"
                      value={formData.eventDescription}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800 rounded-lg shadow-theme-xs"
                    ></textarea>
                  </div>
                  <div>
                    <Label htmlFor="maxRegistrations">Max Registrations (0 for unlimited)</Label>
                    <Input
                      type="number"
                      id="maxRegistrations"
                      name="maxRegistrations"
                      value={formData.maxRegistrations}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label>Registration Fields</Label>
                        {formData.registrationFields.map((field, index) => (
                          <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="w-full md:w-2/5">
                              <Label>Field Name</Label>
                              <Input
                                type="text"
                                value={field.fieldName}
                                onChange={(e) => handleFieldChange(index, 'fieldName', e.target.value)}
                                placeholder="Field Name"
                              />
                            </div>
                            <div className="w-full md:w-2/5">
                              <Label>Field Type</Label>
                              <Select
                                options={[
                                  { value: "text", label: "Text" },
                                  { value: "email", label: "Email" },
                                  { value: "number", label: "Number" },
                                  { value: "textarea", label: "Textarea" },
                                  { value: "select", label: "Select" }
                                ]}
                                value={field.fieldType}
                                onChange={(value) => handleFieldChange(index, 'fieldType', value)}
                              />
                              {field.fieldType === 'select' && (
                                <div className="mt-2">
                                  <Label>Options (comma separated)</Label>
                                  <Input
                                    type="text"
                                    value={field.options ? field.options.join(', ') : ''}
                                    onChange={(e) => handleFieldChange(index, 'options', e.target.value.split(',').map(opt => opt.trim()))}
                                    placeholder="Option 1, Option 2, Option 3"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="w-full md:w-1/5 flex items-end">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.isRequired}
                                  onChange={(e) => handleFieldChange(index, 'isRequired', e.target.checked)}
                                  className="mr-2 h-5 w-5 text-brand-500 rounded focus:ring-brand-500"
                                />
                                <Label className="mb-0">Required</Label>
                              </div>
                            </div>
                            <div className="w-full md:w-auto flex items-end">
                              <button
                                type="button"
                                onClick={() => removeRegistrationField(index)}
                                className="text-red-500 hover:text-red-700 px-3 py-2"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-full md:w-2/5">
                          <Input
                            type="text"
                            name="fieldName"
                            value={newField.fieldName}
                            onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })}
                            placeholder="New Field Name"
                          />
                        </div>
                        <div className="w-full md:w-2/5">
                          <Select
                            options={[
                              { value: "text", label: "Text" },
                              { value: "email", label: "Email" },
                              { value: "number", label: "Number" },
                              { value: "date", label: "Date" },
                              { value: "textarea", label: "Textarea" },
                              { value: "select", label: "Select" }
                            ]}
                            value={newField.fieldType}
                            onChange={(value) => setNewField({ ...newField, fieldType: value })}
                          />
                          {newField.fieldType === 'select' && (
                            <div className="mt-2">
                              <Label>Options (comma separated)</Label>
                              <Input
                                type="text"
                                value={newField.options ? newField.options.join(', ') : ''}
                                onChange={(e) => setNewField({ ...newField, options: e.target.value.split(',').map(opt => opt.trim()) })}
                                placeholder="Option 1, Option 2, Option 3"
                              />
                            </div>
                          )}
                        </div>
                        <div className="w-full md:w-1/5 flex items-end">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="isRequired"
                              checked={newField.isRequired}
                              onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                              className="mr-2 h-5 w-5 text-brand-500 rounded focus:ring-brand-500"
                            />
                            <span className="text-sm">Required</span>
                          </div>
                        </div>
                        <div className="w-full md:w-auto flex items-end">
                          <button
                            type="button"
                            onClick={addRegistrationField}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                          >
                            Add Field
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner Upload Section - Edit form */}
                <div className="w-full md:w-1/2">
                  <Label>Banner Image (Optional)</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleBannerUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {bannerPreview ? (
                    <div className="mt-2">
                      {!croppedBannerUrl ? (
                        <div>
                          <div className="relative">
                            <div className="w-full overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                              <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={16 / 9}
                                minWidth={100}
                                minHeight={100 * (9 / 16)}
                                ruleOfThirds
                                crossorigin="anonymous"
                              >
                                <img
                                  ref={onImageLoad}
                                  src={bannerPreview}
                                  alt="Banner Preview"
                                  className="w-full h-auto max-h-96 object-contain"
                                />
                              </ReactCrop>
                            </div>

                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                type="button"
                                onClick={triggerBannerUpload}
                                className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={removeBanner}
                                className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              type="button"
                              onClick={handleCropComplete}
                              className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                            >
                              Crop Banner
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="relative">
                            <div className="w-full pt-[56.25%] overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 relative">
                              <img
                                src={croppedBannerUrl}
                                alt="Cropped Banner Preview"
                                className="absolute top-0 left-0 w-full h-full object-cover"
                              />
                            </div>

                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                type="button"
                                onClick={triggerBannerUpload}
                                className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={removeBanner}
                                className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Label>Cropped Banner Preview</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This is how your banner will appear on the event registration form.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div
                        onClick={triggerBannerUpload}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-48 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-brand-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">Click to upload banner</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">16:9 aspect ratio recommended</p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Optional: Upload a banner image for this event</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
              >
                Update Event
              </button>
            </div>
          </form>
        </ComponentCard>
      ) : (
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
                  <ComponentCard key={event._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{event.eventName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-5 line-clamp-2">
                        {event.eventDescription || 'No description provided'}
                      </p>

                      <div className="mb-5 space-y-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Date:</span>
                          <span className="ml-2">{new Date(event.eventDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-medium">Registrations:</span>
                          <span className="ml-2">{event.currentRegistrations} / {event.maxRegistrations || 'Unlimited'}</span>
                        </div>
                      </div>

                      {event.registrationLink && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            <span className="font-medium">Registration Link:</span>
                          </p>
                          <div className="flex">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/event-registration/${event.registrationLink}`}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-l dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <button
                              onClick={() => copyRegistrationLink(event.registrationLink)}
                              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-r text-sm dark:bg-gray-600 dark:hover:bg-gray-500"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {isManager(user) && (
                          <>
                            <button
                              onClick={() => toggleEventStatus(event._id)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${event.isActive
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                            >
                              {event.isActive ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                              onClick={() => handleEditEvent(event._id)}
                              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => viewRegistrations(event._id)}
                              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-sm font-medium transition-colors"
                            >
                              View Registrations
                            </button>

                            <button
                              onClick={() => deleteEvent(event._id)}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {!isManager(user) && (
                          <button
                            onClick={() => viewRegistrations(event._id)}
                            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            View Registrations
                          </button>
                        )}
                      </div>
                    </div>
                  </ComponentCard>
                ))
              )}
            </div>
          </div>
        </ComponentCard>
      )}
    </>
  );
};

export default ManageEvents;

