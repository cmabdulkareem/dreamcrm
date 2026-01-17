import React, { useState, useCallback, useRef, useContext } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import DatePicker from '../../components/form/date-picker';
import { isManager } from '../../utils/roleHelpers';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/button/Button';
import {
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
  ListIcon,
  CalendarIcon,
  FileIcon,
  CheckCircleIcon,
  CloseIcon
} from '../../icons';

axios.defaults.withCredentials = true;

import API from "../../config/api";

const CreateEvent = () => {
  const { user } = useContext(AuthContext);
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

  // Banner image state
  const [bannerPreview, setBannerPreview] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 56.25, // 16:9 aspect ratio
    aspect: 16 / 9
  });

  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedBannerUrl, setCroppedBannerUrl] = useState(null);
  const [croppedBannerBlob, setCroppedBannerBlob] = useState(null);

  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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
      const uploadFormData = new FormData();
      uploadFormData.append("banner", file);

      const uploadResponse = await axios.post(
        `${API}/events/upload-banner/${eventId}`,
        uploadFormData,
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

  // Create a new event
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isManager(user)) {
      toast.error('Access denied. Manager privileges required.');
      return;
    }

    if (newField.fieldName && newField.fieldName.trim() !== '') {
      toast.warning("You have an unsaved field. Please click 'Add Field' or clear the input.");
      return;
    }

    if (!formData.eventName || !formData.eventDate) {
      toast.error("Event name and date are required");
      return;
    }

    try {
      const eventData = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString()
      };

      const response = await axios.post(`${API}/events/create`, eventData, { withCredentials: true });

      if (croppedBannerBlob || bannerPreview) {
        try {
          if (croppedBannerBlob) {
            await uploadBannerForEvent(response.data.event._id, croppedBannerBlob);
          } else if (bannerPreview?.startsWith("data:")) {
            const res = await fetch(bannerPreview);
            const blob = await res.blob();
            await uploadBannerForEvent(response.data.event._id, blob);
          }
        } catch (bannerError) {
          console.error('Error uploading banner:', bannerError);
          toast.error('Event created but banner upload failed');
        }
      }

      toast.success('Event created successfully');
      navigate('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    }
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

    if (!imgRef.current) return;

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
    setCroppedBannerBlob(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isManager(user)) {
    return (
      <div className="p-6">
        <PageMeta title="Access Denied - CRM" />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Access Denied</h2>
          <p className="text-red-600 dark:text-red-300">You don't have permission to create events. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-(--breakpoint-2xl) mx-auto pb-20">
      <PageMeta title="Create Event - CRM" />
      <PageBreadcrumb
        items={[
          { name: 'Dashboard', path: '/' },
          { name: 'Events', path: '/events' },
          { name: 'Create Event' }
        ]}
      />
      <ToastContainer position="top-right" className="!z-[999999]" />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Form Controls */}
        <div className="w-full lg:w-3/5 space-y-8">

          {/* Section 1: Basic Information */}
          <ComponentCard title="1. Basic Information" desc="Enter the core details of your event.">
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
                <div>
                  <DatePicker
                    id="eventDate"
                    label="Event Date *"
                    value={formData.eventDate}
                    onChange={(date, dateString) => setFormData({ ...formData, eventDate: dateString })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="eventDescription">Event Description</Label>
                <textarea
                  id="eventDescription"
                  name="eventDescription"
                  placeholder="Tell people what this event is about..."
                  value={formData.eventDescription}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white transition-all resize-none shadow-theme-xs"
                ></textarea>
              </div>

              <div className="w-full md:w-1/2">
                <Label htmlFor="maxRegistrations">Maximum Registrations</Label>
                <div className="relative">
                  <Input
                    type="number"
                    id="maxRegistrations"
                    name="maxRegistrations"
                    value={formData.maxRegistrations}
                    onChange={handleInputChange}
                    min="0"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    0 = Unlimited
                  </div>
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Section 2: Event Banner */}
          <ComponentCard title="2. Event Media" desc="Upload a banner image to make your event stand out.">
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleBannerUpload}
                accept="image/*"
                className="hidden"
              />

              {bannerPreview ? (
                <div className="space-y-4">
                  {!croppedBannerUrl ? (
                    <div className="relative group">
                      <div className="w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                        <ReactCrop
                          crop={crop}
                          onChange={(c) => setCrop(c)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={16 / 9}
                          minWidth={100}
                          ruleOfThirds
                        >
                          <img
                            ref={onImageLoad}
                            src={bannerPreview}
                            alt="To be cropped"
                            className="w-full h-auto max-h-[500px] object-contain"
                          />
                        </ReactCrop>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" size="sm" onClick={removeBanner} startIcon={<TrashBinIcon className="size-4" />}>
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleCropComplete} startIcon={<CheckCircleIcon className="size-4" />}>
                          Apply Crop
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 relative shadow-lg">
                        <img
                          src={croppedBannerUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <Button variant="primary" size="sm" onClick={triggerBannerUpload} startIcon={<PencilIcon className="size-4" />}>
                            Change Image
                          </Button>
                          <Button variant="danger" size="sm" onClick={removeBanner} startIcon={<TrashBinIcon className="size-4" />}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={triggerBannerUpload}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-white/[0.02] cursor-pointer hover:border-brand-500 hover:bg-brand-50/10 transition-all group"
                >
                  <div className="size-16 rounded-full bg-white dark:bg-gray-900 shadow-theme-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <PlusIcon className="size-8 text-brand-500" />
                  </div>
                  <p className="text-gray-700 dark:text-white/90 font-semibold mb-1">Click to upload banner</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">16:9 ratio recommended (e.g. 1920x1080)</p>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Section 3: Registration Fields Builder */}
          <ComponentCard title="3. Form Builder" desc="Customize the fields people need to fill out to register.">
            <div className="space-y-6">

              {/* Existing Fields List */}
              <div className="space-y-3">
                {formData.registrationFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-2xl transition-all hover:border-brand-200 dark:hover:border-brand-800 group"
                  >
                    <div className="flex-none flex items-center justify-center size-10 bg-white dark:bg-gray-900 rounded-xl shadow-theme-xs text-gray-400">
                      <ListIcon className="size-5" />
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 block">Settings</Label>
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
                        </div>

                        <button
                          type="button"
                          onClick={() => removeRegistrationField(index)}
                          className="mt-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Remove Field"
                        >
                          <TrashBinIcon className="size-5" />
                        </button>
                      </div>
                    </div>

                    {field.fieldType === 'select' && (
                      <div className="w-full mt-2 md:mt-0 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <Label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 block">Options (Comma separated)</Label>
                        <Input
                          type="text"
                          value={field.options ? field.options.join(', ') : ''}
                          onChange={(e) => handleFieldChange(index, 'options', e.target.value.split(',').map(opt => opt.trim()))}
                          placeholder="Option 1, Option 2, etc."
                          className="!h-9 !py-1 text-sm font-normal"
                        />
                      </div>
                    )}
                  </div>
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
                      value={newField.options?.join(', ') || ''}
                      onChange={(e) => setNewField({ ...newField, options: e.target.value.split(',').map(opt => opt.trim()) })}
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
        <div className="w-full lg:w-2/5">
          <div className="sticky top-6 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl ring-8 ring-gray-900/50">
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-500/80"></div>
                  <div className="size-3 rounded-full bg-yellow-500/80"></div>
                  <div className="size-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-4">Registration Form Preview</span>
                <div className="flex gap-2">
                  <div className="size-4 rounded-full bg-gray-700"></div>
                </div>
              </div>

              <div className="max-h-[700px] overflow-y-auto bg-white p-0 scrollbar-hide">
                {/* Simulated Header */}
                <div className="relative">
                  {croppedBannerUrl ? (
                    <img src={croppedBannerUrl} alt="Preview Header" className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-300">
                      <FileIcon className="size-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                    <h2 className="text-white text-xl font-bold leading-tight">
                      {formData.eventName || "Your Event Brand Here"}
                    </h2>
                    <div className="flex items-center gap-2 text-white/70 text-sm mt-2 font-medium">
                      <CalendarIcon className="size-4" />
                      {formData.eventDate ? new Date(formData.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "Select a date..."}
                    </div>
                  </div>
                </div>

                {/* Simulated Form Body */}
                <div className="p-8 space-y-6">
                  {formData.eventDescription && (
                    <p className="text-gray-500 text-sm leading-relaxed border-b border-gray-100 pb-6 whitespace-pre-wrap">
                      {formData.eventDescription}
                    </p>
                  )}

                  <div className="space-y-5">
                    {formData.registrationFields.length > 0 ? (
                      formData.registrationFields.map((field, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            {field.fieldName || `Untitled Field ${idx + 1}`}
                            {field.isRequired && <span className="text-red-500">*</span>}
                          </label>
                          {field.fieldType === 'textarea' ? (
                            <div className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg"></div>
                          ) : field.fieldType === 'select' ? (
                            <div className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-gray-400 text-sm">
                              Select from options...
                              <ChevronDownIcon className="size-4" />
                            </div>
                          ) : (
                            <div className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center text-gray-400 text-sm">
                              {field.fieldType === 'date' ? 'YYYY-MM-DD' : field.fieldType === 'number' ? '0' : `Enter ${field.fieldName.toLowerCase()}...`}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                        <p className="text-gray-400 text-sm">Add fields to see the form preview</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <div className="w-full py-4 bg-brand-500 text-white rounded-xl font-bold text-center shadow-lg shadow-brand-500/30">
                        Register Now
                      </div>
                      <p className="text-[10px] text-center text-gray-400 mt-4 px-6 italic">By registering, you agree to the event terms and conditions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 p-2">
              <Button
                variant="outline"
                className="flex-1 !rounded-2xl !py-4 font-bold"
                onClick={() => navigate('/events')}
              >
                Discard Changes
              </Button>
              <Button
                type="submit"
                className="flex-2 !rounded-2xl !py-4 font-bold shadow-xl shadow-brand-500/20"
                startIcon={<CheckCircleIcon className="size-5" />}
              >
                Publish Event
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;


