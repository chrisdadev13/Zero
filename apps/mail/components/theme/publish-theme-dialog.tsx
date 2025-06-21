"use client";

import * as Dialog from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PublishThemeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPublish: (data: { name: string }) => void;
}

export function PublishThemeDialog({ open, onOpenChange, onPublish }: PublishThemeDialogProps) {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return;
        onPublish({ name: name.trim() });
        onOpenChange(false);
        // reset
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
                        <label className="text-sm font-medium">Theme Name</label>
                        <Input placeholder="Enter theme name..." value={name} onChange={(e) => setName(e.target.value)} />
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