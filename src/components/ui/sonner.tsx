import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      position="bottom-center"
      offset={80}
      icons={{
        success: <CircleCheckIcon className="w-4 h-4 text-success" />,
        info: <InfoIcon className="w-4 h-4 text-primary" />,
        warning: <TriangleAlertIcon className="w-4 h-4 text-caution" />,
        error: <OctagonXIcon className="w-4 h-4 text-destructive" />,
        loading: <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          left: "50%",
          transform: "translateX(-50%)",
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster, toast };
