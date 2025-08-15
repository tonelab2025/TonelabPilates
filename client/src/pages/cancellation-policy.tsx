import { Card, CardContent } from "@/components/ui/card";

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="bg-white border border-gray-200 shadow-xl">
          <CardContent className="p-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black mb-4">
                Cancellation Policy
              </h1>
              <p className="text-lg text-gray-600">
                Tonelab Pilates Event Terms & Conditions
              </p>
            </div>

            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-black mb-3">
                  No Refund Policy
                </h2>
                <p className="leading-relaxed">
                  All payments made for Tonelab Pilates events are <strong>final and non-refundable</strong>. 
                  Once your booking is confirmed and payment is processed, no refunds will be issued under any circumstances.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-black mb-3">
                  Cancellation Terms
                </h2>
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
                <h2 className="text-xl font-semibold text-black mb-3">
                  Event Changes by Tonelab
                </h2>
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
                <h2 className="text-xl font-semibold text-black mb-3">
                  Understanding & Agreement
                </h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="leading-relaxed text-red-800">
                    <strong>Important:</strong> By proceeding with your booking and checking the cancellation policy 
                    agreement, you acknowledge that you have read, understood, and agree to this no-refund policy. 
                    Please ensure you are certain about your participation before completing your booking.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-black mb-3">
                  Contact Information
                </h2>
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
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Last updated: August 2025
              </p>
              <div className="mt-4">
                <button 
                  onClick={() => window.history.back()}
                  className="px-6 py-3 rounded-lg font-semibold transition-colors border-0 cursor-pointer"
                  style={{ 
                    color: 'white',
                    backgroundColor: '#000000'
                  }}
                >
                  Back to Booking
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}