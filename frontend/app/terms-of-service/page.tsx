export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-headline mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none space-y-6 text-body">
        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using the JabClub membership platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">2. Membership Eligibility</h2>
          <p>
            This platform is exclusively for active JabClub Gym members. By creating an account, you represent and warrant that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are an active member of JabClub Gym</li>
            <li>All information you provide is accurate and current</li>
            <li>You are at least 18 years old (or have parental consent for members under 18)</li>
            <li>You will maintain the security of your account credentials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">3. Class Bookings</h2>
          <h3 className="text-xl font-semibold text-headline mb-2">Booking Rules</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Classes must be booked using valid session credits</li>
            <li>Bookings are subject to class capacity limits</li>
            <li>Cancellations must be made at least 1 hour before class start time</li>
            <li>No-show policies apply as per JabClub Gym rules</li>
          </ul>
          
          <h3 className="text-xl font-semibold text-headline mb-2 mt-4">Cancellation Policy</h3>
          <p>
            You may cancel a booking up to 1 hour before the class start time. Cancellations made within 1 hour of class start time will not be eligible for credit refunds.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">4. Session Credits and Packages</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Session credits are non-transferable and non-refundable except as required by law</li>
            <li>Credits expire according to the terms of your purchased package</li>
            <li>Package prices and terms are subject to change</li>
            <li>Unused credits expire on the package expiry date</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">5. Payment Terms</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All payments must be made through approved payment methods</li>
            <li>Payment proof must be submitted for manual review</li>
            <li>Packages are activated upon payment approval</li>
            <li>Refunds are subject to JabClub Gym's refund policy</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">6. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the platform for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to the platform</li>
            <li>Interfere with or disrupt the platform's operation</li>
            <li>Share your account credentials with others</li>
            <li>Create multiple accounts</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">7. Platform Availability</h2>
          <p>
            We strive to maintain platform availability but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the platform at any time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">8. Limitation of Liability</h2>
          <p>
            JabClub Gym and its platform providers are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you paid for services in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">9. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account if you violate these terms, engage in fraudulent activity, or if your JabClub Gym membership is terminated.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">10. Changes to Terms</h2>
          <p>
            We may modify these Terms of Service at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">11. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact your JabClub Gym location or refer to your membership agreement.
          </p>
        </section>

        <p className="text-sm text-body/60 mt-8">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
