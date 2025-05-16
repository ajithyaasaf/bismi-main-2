import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default"
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-[90vw] max-w-md rounded-xl p-5 sm:p-6">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-lg sm:text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row mt-6 sm:mt-8">
          <AlertDialogCancel className="mt-2 sm:mt-0 w-full sm:w-auto h-10 sm:h-11 text-sm font-medium">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={`w-full sm:w-auto h-10 sm:h-11 text-sm font-medium ${
              variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}