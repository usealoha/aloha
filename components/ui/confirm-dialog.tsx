"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
}: ConfirmDialogProps) {
  // Render into document.body so transformed / overflow-hidden ancestors in
  // the trigger's subtree can't clip or confine the overlay. Mounted flag
  // guards SSR — `document` isn't available until hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-display text-[18px] text-ink">{title}</h3>
            <div className="mt-2 text-[13px] text-ink/70 leading-[1.5]">
              {description}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/50 hover:text-ink hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Hook for easy usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm"> & {
    onConfirm?: () => void;
  }>({
    title: "",
    description: "",
  });

  const open = (props: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm"> & {
    onConfirm: () => void;
  }) => {
    setConfig(props);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const Dialog = ({ onConfirm }: { onConfirm?: () => void }) => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={close}
      onConfirm={onConfirm || config.onConfirm || (() => {})}
      title={config.title}
      description={config.description}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
    />
  );

  return { open, close, Dialog, isOpen };
}

// Wrapper component for form-based deletes
export type ConfirmDeleteFormProps = {
  action: (formData: FormData) => Promise<void> | void;
  feedId?: string;
  id?: string;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  children: React.ReactNode;
  className?: string;
};

export function ConfirmDeleteForm({
  action,
  feedId,
  id,
  title,
  description,
  confirmText = "Delete",
  children,
  className,
}: ConfirmDeleteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    const formData = new FormData();
    if (feedId) formData.append("feedId", feedId);
    if (id) formData.append("id", id);
    await action(formData);
    setPending(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {children}
      </button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title={title}
        description={description}
        confirmText={pending ? "Deleting..." : confirmText}
        variant="destructive"
      />
    </>
  );
}
