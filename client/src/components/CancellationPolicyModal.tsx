import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface CancellationPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReadComplete: () => void;
}

export function CancellationPolicyModal({ isOpen, onClose, onReadComplete }: CancellationPolicyModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      // Reset scroll position when modal opens
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleScroll = () => {
    if (!contentRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
      onReadComplete();
      // Don't auto-close - let user close manually
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Prevent modal from closing when clicking backdrop during scroll
    // Only close with X button or Escape key
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        data-testid="cancellation-policy-modal"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-black">
              Cancellation Policy
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Please read the complete policy below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          className="overflow-y-auto max-h-[60vh] p-6"
          onScroll={handleScroll}
          data-testid="modal-content"
        >
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h3 className="text-lg font-semibold text-black mb-3">
                No Refund Policy
              </h3>
              <p className="leading-relaxed">
                All payments made for Tonelab Pilates events are <strong>final and non-refundable</strong>. 
                Once your booking is confirmed and payment is processed, no refunds will be issued under any circumstances.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-black mb-3">
                Cancellation Terms
              </h3>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  • <strong>Event Cancellations:</strong> If you need to cancel your participation, 
                  you may do so at any time before the event, but no refund will be provided.
                </p>
                <p className="leading-relaxed">
                  • <strong>Transfer Policy:</strong> Bookings are non-transferable to other participants 
                  or future events.
                </p>
                <p className="leading-relaxed">
                  • <strong>Emergency Situations:</strong> Even in cases of personal emergencies, illness, 
                  or unforeseen circumstances, no refunds will be issued.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-black mb-3">
                Event Changes by Tonelab
              </h3>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  • If Tonelab cancels or significantly modifies an event due to unforeseen circumstances, 
                  participants will be offered the option to attend a rescheduled session or receive store credit 
                  for future events.
                </p>
                <p className="leading-relaxed">
                  • Minor changes to event timing, location within the same venue, or instructor assignments 
                  do not qualify for refunds or credits.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-black mb-3">
                Understanding & Agreement
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="leading-relaxed text-red-800 dark:text-red-200">
                  <strong>Important:</strong> By proceeding with your booking and checking the cancellation policy 
                  agreement, you acknowledge that you have read, understood, and agree to this no-refund policy. 
                  Please ensure you are certain about your participation before completing your booking.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-black mb-3">
                Contact Information
              </h3>
              <p className="leading-relaxed">
                If you have questions about this policy or need assistance with your booking, 
                please contact us at:
              </p>
              <div className="mt-3 space-y-1">
                <p><strong>Email:</strong> collective.tonelab@gmail.com</p>
                <p><strong>Phone:</strong> 090-001-6646 (Coach Gade)</p>
                <p><strong>Instagram:</strong> @tonelab.club</p>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Last updated: August 2025
              </p>
              {hasScrolledToBottom && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
                    <span className="text-sm font-medium">✓ Policy read completely</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scroll to bottom to complete reading
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium transition-colors border-0 cursor-pointer"
              style={{ 
                color: 'white',
                backgroundColor: '#000000'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}