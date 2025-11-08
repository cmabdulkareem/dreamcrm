import { useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField.tsx";
import Select from "../Select";
import MultiSelect from "../MultiSelect";
import DatePicker from "../date-picker.tsx";

export default function SelectInputs() {
  const options = [
    { value: "marketing", label: "Marketing" },
    { value: "template", label: "Template" },
    { value: "development", label: "Development" },
  ];
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const courseOptions = [
    { value: "1", text: "Interior Design", selected: false },
    { value: "2", text: "Fashion Design", selected: false },
    { value: "3", text: "Graphic Design", selected: false },
    { value: "4", text: "General", selected: false },
  ];

  const contactPoints = [
    { value: "walkIn", label: "Walk-In" },
    { value: "teleCall", label: "Tele Call" },
    { value: "other", label: "Other" },
  ];

  const campaigns = [
    { value: "campaign1", label: "Campaign 1" },
    { value: "campaign2", label: "Campaign 2" },
    { value: "campaign3", label: "Campaign 3" }
  ]

  const handledBy = [
    { value: "counselor1", label: "Counselor 1" },
    { value: "counselor2", label: "Counselor 2" },
    { value: "counselor3", label: "Counselor 3" }
  ];

  return (
    <ComponentCard title="Enquiry / Lead Information">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-full">
            <MultiSelect
              label="Course Preferrence"
              options={courseOptions}
              defaultSelected={["4"]}
              onChange={(values) => setSelectedValues(values)}
            />
            <p className="sr-only">
              Selected Values: {selectedValues.join(", ")}
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <Label>Contact Point</Label>
            <Select
              options={contactPoints}
              placeholder="Contacted Through"
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
            />
          </div>
          <div className="w-full md:w-1/4">
            <Label htmlFor="otherContactPoint">Other</Label>
            <Input type="text" id="otherContactPoint" disabled />
          </div>
          <div className="w-full md:w-1/4">
            <Label>Campaign</Label>
            <Select
              options={campaigns}
              placeholder="Campaigns"
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
            />
          </div>
          <div className="w-full md:w-1/4">
            <Label>Handleb By</Label>
            <Select
              options={handledBy}
              placeholder="Handled By"
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-full">
            <Label htmlFor="leadRemarks">Remarks</Label>
            <Input type="text" id="leadRemarks" />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <DatePicker
              id="date-picker"
              label="Follow Up Date"
              placeholder="Select a date"
              onChange={(dates, currentDateString) => {
                console.log({ dates, currentDateString });
              }}
            />
          </div>
        </div>
      </div>
    </ComponentCard>
  );
}
