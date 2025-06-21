import * as Dialog from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface PublishThemeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPublish: (data: { name: string }) => void;
}

const validateThemeName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Theme name is required";
    if (trimmed.length < 3) return "Theme name must be at least 3 characters";
    if (trimmed.length > 50) return "Theme name must be less than 50 characters";
    if (!/^[a-zA-Z0-9\s-_]+$/.test(trimmed)) return "Theme name contains invalid characters";
    return null;
};

export function PublishThemeDialog({ open, onOpenChange, onPublish }: PublishThemeDialogProps) {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        const error = validateThemeName(name);
        if (error) {
            toast.error(error);
            return;
        }
        onPublish({ name: name.trim() });
        onOpenChange(false);
        setName("");
    };

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-md">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Publish Theme</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Please provide a unique theme name.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <label htmlFor="theme-name" className="text-sm font-medium">Theme Name</label>
                        <Input
                            id="theme-name"
                            placeholder="Enter theme name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>
                </div>

                <Dialog.DialogFooter>
                    <Button className="w-full" onClick={handleSubmit} disabled={!name.trim()}>
                        Publish
                    </Button>
                </Dialog.DialogFooter>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    );
} 