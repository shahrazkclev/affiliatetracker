import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AffiliateMango',
  description: 'Privacy Policy for AffiliateMango by Cleverpoly LLC.',
};

export default function PrivacyPolicy() {
  return (
    <>
      <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Privacy Policy</h1>
      <p className="text-zinc-400 mb-10">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="space-y-8 text-zinc-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
          <p>
            Cleverpoly LLC ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. The Data We Collect About You</h2>
          <p>
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-zinc-400">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Financial Data</strong> includes payment card details (processed securely via Stripe).</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Personal Data</h2>
          <p>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-zinc-400">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Contact Details</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us in the following ways:
          </p>
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mt-4">
            <p className="font-bold text-white mb-2">Cleverpoly LLC</p>
            <p>30 N Gould St</p>
            <p>Sheridan, WY 82802</p>
            <p className="mt-2 text-orange-400">hello@affiliatemango.com</p>
          </div>
        </section>
      </div>
    </>
  );
}
