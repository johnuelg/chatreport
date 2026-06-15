import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Ambulance,
  ScanLine,
  Droplets,
  Microscope,
  Baby,
  HeartPulse,
  Stethoscope,
  Award,
  Cross,
  Activity,
  Brain,
  Pill,
} from "lucide-react";

type FloatItem = {
  Icon: LucideIcon;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
};

// Hospital domains mapped to lucide icons (ED, RAD, BB, LAB, NICU, PICU, CPR, Nursing, HQI + extras)
const ITEMS: FloatItem[] = [
  { Icon: Ambulance,    top: "12%", left: "6%",  size: 30, duration: 9,  delay: 0,   drift: 14, opacity: 0.16 },
  { Icon: ScanLine,     top: "22%", left: "88%", size: 26, duration: 11, delay: 1.2, drift: 18, opacity: 0.14 },
  { Icon: Droplets,     top: "70%", left: "5%",  size: 24, duration: 8,  delay: 0.6, drift: 12, opacity: 0.18 },
  { Icon: Microscope,   top: "78%", left: "92%", size: 28, duration: 10, delay: 1.8, drift: 16, opacity: 0.15 },
  { Icon: Baby,         top: "42%", left: "3%",  size: 26, duration: 12, delay: 0.4, drift: 10, opacity: 0.16 },
  { Icon: HeartPulse,   top: "55%", left: "94%", size: 30, duration: 9,  delay: 2.1, drift: 14, opacity: 0.18 },
  { Icon: Stethoscope,  top: "8%",  left: "78%", size: 28, duration: 10, delay: 1.5, drift: 12, opacity: 0.15 },
  { Icon: Award,        top: "85%", left: "45%", size: 22, duration: 11, delay: 0.9, drift: 18, opacity: 0.13 },
  { Icon: Cross,        top: "16%", left: "40%", size: 22, duration: 8,  delay: 2.4, drift: 12, opacity: 0.13 },
  { Icon: Activity,     top: "62%", left: "20%", size: 24, duration: 9,  delay: 0.2, drift: 14, opacity: 0.14 },
  { Icon: Brain,        top: "30%", left: "70%", size: 26, duration: 12, delay: 1.0, drift: 16, opacity: 0.14 },
  { Icon: Pill,         top: "88%", left: "72%", size: 22, duration: 10, delay: 1.6, drift: 12, opacity: 0.15 },
];

const FloatingDomainIcons = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {ITEMS.map((item, i) => {
        const { Icon } = item;
        return (
          <motion.div
            key={i}
            className="absolute text-primary"
            style={{
              top: item.top,
              left: item.left,
              opacity: item.opacity,
              filter: "drop-shadow(0 4px 12px hsl(var(--primary) / 0.25))",
            }}
            animate={{
              y: [0, -item.drift, 0, item.drift * 0.6, 0],
              x: [0, item.drift * 0.4, 0, -item.drift * 0.3, 0],
              rotate: [0, 4, 0, -4, 0],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay,
            }}
          >
            <Icon
              className="text-primary"
              strokeWidth={1.6}
              {...({ style: { width: item.size, height: item.size } } as any)}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingDomainIcons;
