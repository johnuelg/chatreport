import { useState } from "react";
import {
  Ambulance, ScanLine, Droplets, Microscope, Baby, HeartPulse,
  Stethoscope, Award, Activity, Syringe, Pill, Thermometer,
  Bone, Brain, Eye, Ear, HandHeart, ShieldPlus, Bed, Clipboard,
  Clock, FileHeart, Hospital, Radiation, Scissors, TestTube,
  UserRound, Zap, AlertTriangle, Cross
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const DOMAIN_ICONS: Record<string, { icon: React.ComponentType<any>; label: string }> = {
  ambulance: { icon: Ambulance, label: "Ambulance" },
  "scan-line": { icon: ScanLine, label: "X-ray / Imaging" },
  droplets: { icon: Droplets, label: "Blood" },
  microscope: { icon: Microscope, label: "Microscope" },
  baby: { icon: Baby, label: "Baby" },
  "heart-pulse": { icon: HeartPulse, label: "Heartbeat / CPR" },
  stethoscope: { icon: Stethoscope, label: "Stethoscope" },
  award: { icon: Award, label: "Award / Quality" },
  activity: { icon: Activity, label: "Activity Monitor" },
  syringe: { icon: Syringe, label: "Syringe" },
  pill: { icon: Pill, label: "Medication" },
  thermometer: { icon: Thermometer, label: "Thermometer" },
  bone: { icon: Bone, label: "Bone / Orthopedics" },
  brain: { icon: Brain, label: "Brain / Neurology" },
  eye: { icon: Eye, label: "Eye / Ophthalmology" },
  ear: { icon: Ear, label: "Ear / ENT" },
  "hand-heart": { icon: HandHeart, label: "Care / Palliative" },
  "shield-plus": { icon: ShieldPlus, label: "Safety / Infection" },
  bed: { icon: Bed, label: "Bed / Inpatient" },
  clipboard: { icon: Clipboard, label: "Clipboard / Records" },
  clock: { icon: Clock, label: "Clock / Triage" },
  "file-heart": { icon: FileHeart, label: "Medical Records" },
  hospital: { icon: Hospital, label: "Hospital" },
  radiation: { icon: Radiation, label: "Radiation" },
  scissors: { icon: Scissors, label: "Surgery" },
  "test-tube": { icon: TestTube, label: "Test Tube" },
  "user-round": { icon: UserRound, label: "Patient" },
  cross: { icon: Cross, label: "Cross / Nursing" },
  zap: { icon: Zap, label: "Emergency / Code" },
  "alert-triangle": { icon: AlertTriangle, label: "Alert / Critical" },
};

export const getIconComponent = (iconKey: string) => {
  return DOMAIN_ICONS[iconKey]?.icon || Activity;
};

interface DomainIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

const DomainIconPicker = ({ value, onChange, color = "#6366f1" }: DomainIconPickerProps) => {
  const [open, setOpen] = useState(false);
  const SelectedIcon = getIconComponent(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full h-10 justify-start gap-2">
          <SelectedIcon className="w-4 h-4" style={{ color }} />
          <span className="text-xs truncate">{DOMAIN_ICONS[value]?.label || "Select icon"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-2">Select Icon</p>
        <div className="grid grid-cols-6 gap-1.5 max-h-[240px] overflow-y-auto">
          {Object.entries(DOMAIN_ICONS).map(([key, { icon: Icon, label }]) => (
            <button
              key={key}
              title={label}
              onClick={() => { onChange(key); setOpen(false); }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                value === key
                  ? "bg-primary/15 ring-2 ring-primary"
                  : "hover:bg-secondary"
              }`}
            >
              <Icon className="w-5 h-5" style={{ color: value === key ? color : undefined }} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DomainIconPicker;
