import { useState } from "react";
import ComponentCard from "../../common/ComponentCard.jsx";
import Label from "../Label.tsx";
import Input from "../input/InputField.tsx";
import PhoneInput from "../group-input/PhoneInput.tsx";
import Select from "../Select.tsx";
import { EyeCloseIcon, EyeIcon, TimeIcon } from "../../../icons/index.ts";
import DatePicker from "../date-picker.tsx";

export default function DefaultInputs() {

  const [email, setEmail] = useState("");
  const [emailTwo, setEmailTwo] = useState("");
  const [error, setError] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Simulate a validation check
  const validateEmail = (value) => {
    const isValidEmail =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setError(!isValidEmail);
    return isValidEmail;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handleEmailTwoChange = (e) => {
    const value = e.target.value;
    setEmailTwo(value);
    validateEmail(value);
  };

  const countries = [
    // Home
    { code: "IN", label: "+91" }, // India

    // GCC (Gulf Cooperation Council)
    { code: "AE", label: "+971" }, // UAE
    { code: "SA", label: "+966" }, // Saudi Arabia
    { code: "KW", label: "+965" }, // Kuwait
    { code: "OM", label: "+968" }, // Oman
    { code: "QA", label: "+974" }, // Qatar
    { code: "BH", label: "+973" }, // Bahrain

    // North America
    { code: "US", label: "+1" }, // United States
    { code: "CA", label: "+1" }, // Canada

    // Europe
    { code: "UK", label: "+44" }, // United Kingdom
    { code: "DE", label: "+49" }, // Germany
    { code: "FR", label: "+33" }, // France
    { code: "IT", label: "+39" }, // Italy
    { code: "NL", label: "+31" }, // Netherlands
    { code: "ES", label: "+34" }, // Spain
    { code: "IE", label: "+353" }, // Ireland
    { code: "CH", label: "+41" }, // Switzerland
    { code: "SE", label: "+46" }, // Sweden
    { code: "NO", label: "+47" }, // Norway

    // Asia-Pacific
    { code: "AU", label: "+61" }, // Australia
    { code: "NZ", label: "+64" }, // New Zealand
    { code: "SG", label: "+65" }, // Singapore
    { code: "MY", label: "+60" }, // Malaysia
    { code: "TH", label: "+66" }, // Thailand
    { code: "JP", label: "+81" }, // Japan
    { code: "KR", label: "+82" }, // South Korea
    { code: "CN", label: "+86" }, // China
    { code: "HK", label: "+852" }, // Hong Kong

    // Africa
    { code: "ZA", label: "+27" }, // South Africa
    { code: "KE", label: "+254" }, // Kenya
    { code: "NG", label: "+234" }, // Nigeria
    { code: "MU", label: "+230" }, // Mauritius

    // Other common destinations
    { code: "TR", label: "+90" }, // Turkey
    { code: "RU", label: "+7" }, // Russia
    { code: "BR", label: "+55" }, // Brazil
  ];

  const handlePhoneNumberChange = (phoneNumber) => {
    console.log("Updated phone number:", phoneNumber);
  };

  const enquirerGender = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  const enquirerStatus = [
    { value: "studying", label: "Studying" },
    { value: "working", label: "Working" },
    { value: "selfEmployed", label: "Self Employed" },
    { value: "freelancer", label: "Freelancer" },
    { value: "homeMaker", label: "Homemaker" },
    { value: "jobSeeker", label: "Job Seeker" },
    { value: "doingNothing", label: "Not Engaged" },
  ];

  const enquirerEducation = [
    { value: "notEducated", label: "No Education" },
    { value: "below10th", label: "Below 10th" },
    { value: "10th", label: "10th" },
    { value: "12th", label: "12th" },
    { value: "diploma", label: "Diploma" },
    { value: "graduate", label: "Graduate" },
    { value: "postGraduate", label: "Post Graduate" },
  ]

  const placeOptions = [
    { value: "Manjeshwar", label: "Manjeshwar" },
    { value: "Kasaragod", label: "Kasaragod" },
    { value: "Uduma", label: "Uduma" },
    { value: "Kanjangad", label: "Kanjangad" },
    { value: "Trikarippur", label: "Trikarippur" },
    { value: "Other", label: "Other" },
  ]

  const handleSelectChange = (value) => {
    console.log("Selected value:", value);
  };

  return (
    <ComponentCard title="Basic Details">
      <div className="space-y-6">
        {/* Row with two half-width inputs */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <Label htmlFor="firstName">Full Name</Label>
            <Input type="text" id="firstName" />
          </div>
          <div className="w-full md:w-1/2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              error={error}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              hint={error ? "This is an invalid email address." : ""}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <Label>Phone</Label>
            <PhoneInput
              selectPosition="end"
              countries={countries}
              placeholder="+1 (555) 000-0000"
              onChange={handlePhoneNumberChange}
            />
          </div>
          <div className="w-full md:w-1/2">
            <Label>Phone (optional)</Label>
            <PhoneInput
              selectPosition="end"
              countries={countries}
              placeholder="+1 (555) 000-0000"
              onChange={handlePhoneNumberChange}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <Label>Gender</Label>
            <Select
              options={enquirerGender}
              placeholder="Select Gender"
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
            />
          </div>
          <div className="w-full md:w-1/4">
            <DatePicker
              id="date-picker"
              label="DoB"
              placeholder="Select a date"
              onChange={(dates, currentDateString) => {
                console.log({ dates, currentDateString });
              }}
            />
          </div>
          <div className="w-full md:w-1/4">
            <Label>Place</Label>
            <Select
              options={placeOptions}
              placeholder="Select Place"
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
            />
          </div>
          <div className="w-full md:w-1/4">
            <Label htmlFor="otherPlace">Other Place</Label>
            <Input type="text" id="otherPlace" disabled />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-stretch">
  <div className="flex-[0.5] flex flex-col">
    <Label>Current Status</Label>
    <Select
      options={enquirerStatus}
      placeholder="Select Status"
      onChange={handleSelectChange}
      className="h-12 dark:bg-dark-900"
    />
  </div>

  <div className="flex-[0.5] flex flex-col">
    <Label>Education</Label>
    <Select
      options={enquirerEducation}
      placeholder="Select Status"
      onChange={handleSelectChange}
      className="h-12 dark:bg-dark-900"
    />
  </div>

  <div className="flex-1 flex flex-col">
    <Label htmlFor="remarks">Remarks</Label>
    <Input type="text" id="remarks" className="h-12" />
  </div>
</div>
      </div>
    </ComponentCard>
  );
}
