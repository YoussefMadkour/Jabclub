export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-headline mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none space-y-6 text-body">
        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">1. Introduction</h2>
          <p>
            JabClub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our membership platform and services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold text-headline mb-2">Personal Information</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name, email address, and phone number</li>
            <li>Membership and payment information</li>
            <li>Class booking history and preferences</li>
            <li>Children's information (if booking classes for children)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process and manage your membership and bookings</li>
            <li>Send you booking confirmations and class reminders</li>
            <li>Process payments and manage your session credits</li>
            <li>Communicate with you about your account and our services</li>
            <li>Improve our platform and services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">5. Data Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your information only with:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Service providers who assist us in operating our platform</li>
            <li>Coaches and staff at JabClub Gym locations for class management</li>
            <li>When required by law or to protect our rights</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and update your personal information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt-out of certain communications</li>
            <li>Request a copy of your data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist in our marketing efforts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-headline mb-4">9. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through your JabClub Gym location or via the contact information provided in your membership materials.
          </p>
        </section>

        <p className="text-sm text-body/60 mt-8">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
