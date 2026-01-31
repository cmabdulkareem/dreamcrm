import React, { useState, useCallback, useRef, useContext } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
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
  CloseIcon,
  ChevronDownIcon
} from '../../icons';

axios.defaults.withCredentials = true;

import API from "../../config/api";

const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

const CreateEvent = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    eventDate: '',
    eventTime: '10:00', // Default to 10 AM
    maxRegistrations: 0,
    eventPin: generatePin(), // Auto-generate PIN
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
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
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
        eventDate: new Date(`${formData.eventDate}T${formData.eventTime}:00`).toISOString()
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

  const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx || !crop) {
      throw new Error('No context or crop');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
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
      setCrop(undefined);
      setCompletedCrop(undefined);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      const pixelCrop = convertToPixelCrop(
        completedCrop,
        imgRef.current.naturalWidth,
        imgRef.current.naturalHeight
      );

      const croppedBlob = await getCroppedImg(imgRef.current, pixelCrop);
      setCroppedBannerBlob(croppedBlob);
      setCroppedBannerUrl(URL.createObjectURL(croppedBlob));
    } catch (e) {
      console.error('Error cropping image:', e);
      toast.error("Failed to crop image. Please try again.");
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
      <PageBreadcrumb pageTitle="Create Your Event Here" />
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
            </div>
          </ComponentCard>

          {/* Section 2: Details & Media */}
          <ComponentCard title="2. Description & Media" desc="Add description and banner.">
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
              </div>

              {/* Right side: Event Media (Red Area) */}
              <div className="lg:col-span-6">
                <Label>Event Banner</Label>
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
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 p-4 overflow-auto">
                          <div style={{ width: 'fit-content', margin: '0 auto' }}>
                            <ReactCrop
                              crop={crop}
                              onChange={(c) => setCrop(c)}
                              onComplete={(c) => setCompletedCrop(c)}
                              aspect={16 / 9}
                            >
                              <img
                                ref={imgRef}
                                src={bannerPreview}
                                alt="To be cropped"
                                onLoad={onImageLoad}
                                style={{
                                  maxHeight: '500px',
                                  width: 'auto',
                                  display: 'block'
                                }}
                              />
                            </ReactCrop>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={removeBanner}
                            startIcon={<TrashBinIcon className="size-3.5" />}
                            className="flex-1 text-xs"
                          >
                            Discard
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleCropComplete}
                            startIcon={<CheckCircleIcon className="size-3.5" />}
                            className="flex-1 text-xs"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 relative shadow-sm">
                          <img
                            src={croppedBannerUrl}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button variant="primary" size="sm" onClick={triggerBannerUpload} startIcon={<PencilIcon className="size-3.5" />} className="!h-8 !px-3 text-[10px]">
                              Change
                            </Button>
                            <Button variant="danger" size="sm" onClick={removeBanner} startIcon={<TrashBinIcon className="size-3.5" />} className="!h-8 !px-3 text-[10px]">
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
                    className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl h-[200px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-white/[0.02] cursor-pointer hover:border-brand-500 hover:bg-brand-50/10 transition-all group"
                  >
                    <div className="size-10 rounded-full bg-white dark:bg-gray-900 shadow-theme-xs flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <PlusIcon className="size-5 text-brand-500" />
                    </div>
                    <p className="text-gray-700 dark:text-white/90 font-semibold text-xs mb-1">Upload banner</p>
                    <p className="text-[10px] text-gray-400">16:9 ratio</p>
                  </div>
                )}
              </div>
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
          </ComponentCard >
        </div>

        {/* Right Side: Live Preview (Sticky) */}
        <div className="w-full lg:w-2/5 flex justify-center">
          <div className="sticky top-6 w-full max-w-[390px]">
            {/* iPhone Frame */}
            <div className="relative bg-black rounded-[50px] p-3 shadow-2xl border-[6px] border-gray-900 shadow-brand-500/10">

              {/* iPhone Buttons - Volume Drop/Power */}
              <div className="absolute -left-[10px] top-32 w-[4px] h-16 bg-gray-800 rounded-l-md"></div>
              <div className="absolute -left-[10px] top-52 w-[4px] h-12 bg-gray-800 rounded-l-md"></div>
              <div className="absolute -right-[10px] top-40 w-[4px] h-20 bg-gray-800 rounded-r-md"></div>

              {/* Dynamic Island */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-end px-4 gap-1.5 shadow-lg shadow-black/20">
                <div className="size-1.5 rounded-full bg-blue-500/20"></div>
                <div className="size-2 rounded-full bg-green-500/40 blur-[1px]"></div>
              </div>

              {/* Status Bar Elements */}
              <div className="absolute top-8 left-10 text-[10px] font-bold text-black z-40">9:41</div>
              <div className="absolute top-8 right-10 flex gap-1 z-40">
                <div className="w-4 h-2 rounded-[2px] border border-black/20 relative">
                  <div className="absolute right-0.5 top-0.5 bottom-0.5 left-0.5 bg-black rounded-[0.5px]"></div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="bg-white rounded-[40px] overflow-hidden shadow-inner h-[760px] flex flex-col scrollbar-hide">
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
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 px-1">
          <Button
            variant="outline"
            className="flex-1 !rounded-[20px] !py-4 text-xs font-bold"
            onClick={() => navigate('/events')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-2 !rounded-[20px] !py-4 text-xs font-bold shadow-lg shadow-brand-500/20"
            startIcon={<CheckCircleIcon className="size-4" />}
          >
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;


