import { useNavigate } from "react-router";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TitleBarProps {
  className?: string;
  title: string;
}

export default function TitleBar({ title, className }: TitleBarProps) {
  const navigate = useNavigate();
  return (
    <header className={cn("flex items-center gap-2 mb-6 text-2xl ", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="rounded-full"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="font-bold">{title}</h1>
    </header>
  );
}
