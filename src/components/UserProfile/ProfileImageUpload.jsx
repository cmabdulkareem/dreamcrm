import { useState, useRef, useCallback, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AuthContext } from "../../context/authContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function ProfileImageUpload({ user, updateAvatar }) {
  const { updateUser } = useContext(AuthContext);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const onImageLoad = useCallback((img) => {
    imgRef.current = img;
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
    
    setIsUploadModalOpen(true);
  };

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
    
    // As a blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        blob.name = fileName;
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error("Please select an area to crop");
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        selectedFile.name
      );
      
      setCroppedImageUrl(URL.createObjectURL(croppedBlob));
    } catch (e) {
      console.error('Error cropping image:', e);
      toast.error("Failed to crop image");
    }
  };

  const handleUpload = async () => {
    if (!croppedImageUrl && !selectedFile) {
      toast.error("No file selected");
      return;
    }

    setIsUploading(true);
    
    // Use cropped image if available, otherwise use original
    let fileToUpload = selectedFile;
    if (croppedImageUrl) {
      try {
        const response = await fetch(croppedImageUrl);
        const blob = await response.blob();
        fileToUpload = new File([blob], selectedFile.name, { type: selectedFile.type });
      } catch (e) {
        console.error('Error processing cropped image:', e);
        toast.error("Error processing cropped image");
        setIsUploading(false);
        return;
      }
    }
    
    const formData = new FormData();
    formData.append('avatar', fileToUpload);

    try {
      const response = await axios.post(
        `${API}/profile/upload-avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );

      // Update user context/state if updateAvatar function is provided
      if (updateAvatar && typeof updateAvatar === 'function') {
        updateAvatar(response.data.avatar);
      } else if (updateUser && typeof updateUser === 'function') {
        // Fallback to updateUser if updateAvatar is not available
        updateUser({
          ...user,
          avatar: response.data.avatar
        });
      }

      toast.success("Profile image updated successfully!");
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCroppedImageUrl(null);
      setCrop({ unit: '%', width: 50, aspect: 1 });
      setCompletedCrop(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(error.response?.data?.message || "Failed to upload profile image");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <button
        key={user?.avatar || 'default-avatar'} // Add key prop to force remount when avatar changes
        onClick={triggerFileSelect}
        className="w-20 h-20 overflow-hidden border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-brand-500 transition-colors"
      >
        <img 
          src={user?.avatar || "/images/user/user-01.jpg"} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      </button>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} className="max-w-2xl p-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            Upload Profile Image
          </h3>
          
          <div className="mb-6 flex flex-col items-center">
            {previewUrl && !croppedImageUrl && (
              <div className="mb-4">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  minWidth={100}
                  minHeight={100}
                >
                  <img 
                    ref={onImageLoad}
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-96"
                  />
                </ReactCrop>
              </div>
            )}
            
            {croppedImageUrl && (
              <div className="mb-4">
                <img 
                  src={croppedImageUrl} 
                  alt="Cropped Preview" 
                  className="w-32 h-32 mx-auto rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
            
            {!previewUrl && !croppedImageUrl && (
              <p className="text-gray-500">No image selected</p>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {croppedImageUrl 
              ? "Preview of your cropped profile image" 
              : "Select an area to crop your profile image. The image should be in JPG, PNG, or GIF format and less than 5MB."}
          </p>
          
          <div className="flex justify-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            
            {!croppedImageUrl && previewUrl && (
              <Button 
                onClick={handleCropComplete}
                disabled={isUploading}
              >
                Crop Image
              </Button>
            )}
            
            <Button 
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : croppedImageUrl ? "Upload Cropped Image" : "Upload Original Image"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
