import { Construction } from "lucide-react";

interface Props {
  title: string;
  description: string;
}

const SettingsPlaceholder = ({ title, description }: Props) => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
      <Construction className="w-7 h-7 text-muted-foreground" />
    </div>
    <h2 className="text-xl font-heading font-bold text-foreground">{title}</h2>
    <p className="text-sm text-muted-foreground max-w-md">{description}</p>
  </div>
);

export default SettingsPlaceholder;
