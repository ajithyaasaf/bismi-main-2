import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  entityName: string;
  entityType: 'supplier' | 'customer';
  currentAmount?: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  entityName,
  entityType,
  currentAmount = 0
}: PaymentModalProps) {
  const [amount, setAmount] = useState<string>(currentAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return; // Form validation will handle this
    }
    
    setIsSubmitting(true);
    onSubmit(numAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter the payment amount for {entityName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  ₹
                </span>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="pl-7"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {entityType === 'supplier' && (
              <div className="text-sm text-gray-500 px-4">
                This amount will be deducted from the {entityType}'s outstanding debt.
              </div>
            )}
            {entityType === 'customer' && (
              <div className="text-sm text-gray-500 px-4">
                This amount will be deducted from the {entityType}'s pending amount.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}