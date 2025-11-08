import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import { EnvelopeIcon } from "../../../icons";
import PhoneInput from "../group-input/PhoneInput";

export default function InputGroup() {
  const countries = [
    // Home
    { code: "IN", label: "+91" },   // India

    // GCC (Gulf Cooperation Council)
    { code: "AE", label: "+971" },  // UAE
    { code: "SA", label: "+966" },  // Saudi Arabia
    { code: "KW", label: "+965" },  // Kuwait
    { code: "OM", label: "+968" },  // Oman
    { code: "QA", label: "+974" },  // Qatar
    { code: "BH", label: "+973" },  // Bahrain

    // North America
    { code: "US", label: "+1" },    // United States
    { code: "CA", label: "+1" },    // Canada

    // Europe
    { code: "UK", label: "+44" },   // United Kingdom
    { code: "DE", label: "+49" },   // Germany
    { code: "FR", label: "+33" },   // France
    { code: "IT", label: "+39" },   // Italy
    { code: "NL", label: "+31" },   // Netherlands
    { code: "ES", label: "+34" },   // Spain
    { code: "IE", label: "+353" },  // Ireland
    { code: "CH", label: "+41" },   // Switzerland
    { code: "SE", label: "+46" },   // Sweden
    { code: "NO", label: "+47" },   // Norway

    // Asia-Pacific
    { code: "AU", label: "+61" },   // Australia
    { code: "NZ", label: "+64" },   // New Zealand
    { code: "SG", label: "+65" },   // Singapore
    { code: "MY", label: "+60" },   // Malaysia
    { code: "TH", label: "+66" },   // Thailand
    { code: "JP", label: "+81" },   // Japan
    { code: "KR", label: "+82" },   // South Korea
    { code: "CN", label: "+86" },   // China
    { code: "HK", label: "+852" },  // Hong Kong

    // Africa
    { code: "ZA", label: "+27" },   // South Africa
    { code: "KE", label: "+254" },  // Kenya
    { code: "NG", label: "+234" },  // Nigeria
    { code: "MU", label: "+230" },  // Mauritius

    // Other common destinations
    { code: "TR", label: "+90" },   // Turkey
    { code: "RU", label: "+7" },    // Russia
    { code: "BR", label: "+55" }    // Brazil
  ];

  const handlePhoneNumberChange = (phoneNumber) => {
    console.log("Updated phone number:", phoneNumber);
  };

  return (
    <ComponentCard title="Input Group">
      <div className="space-y-6">
        <div>
          <Label>Email</Label>
          <div className="relative">
            <Input
              placeholder="info@gmail.com"
              type="text"
              className="pl-[62px]"
            />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <EnvelopeIcon className="size-6" />
            </span>
          </div>
        </div>
        <div>
          <Label>Phone</Label>
          <PhoneInput
            selectPosition="start"
            countries={countries}
            placeholder="+1 (555) 000-0000"
            onChange={handlePhoneNumberChange}
          />
        </div>
        <div>
          <Label>Phone</Label>
          <PhoneInput
            selectPosition="end"
            countries={countries}
            placeholder="+1 (555) 000-0000"
            onChange={handlePhoneNumberChange}
          />
        </div>
      </div>
    </ComponentCard>
  );
}
