import { Moon, Sun } from "lucide-react";
import { useTheme } from "../themes-provider";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type Theme = "dark" | "light";

interface ThemeToggleProps {
    /**
     * Callback fired when the theme has been toggled.
     * Receives the new theme ("light" | "dark").
     */
    onToggle?: (theme: Theme) => void;
}

export function ThemeToggle({ onToggle }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const handleThemeChange = (value: Theme) => {
        if (value === theme) return;

        // Inform parent component of the theme change if a callback was provided.
        onToggle?.(value);

        setTheme(value);
    };

    return (
        <div className="px-2">
            <Select value={theme} onValueChange={handleThemeChange}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SelectTrigger className="w-28 justify-between">
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Choose light or dark theme</TooltipContent>
                </Tooltip>
                <SelectContent>
                    <SelectItem value="light" className="flex items-center gap-2">
                        Light
                    </SelectItem>
                    <SelectItem value="dark" className="flex items-center gap-2">
                        Dark
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}