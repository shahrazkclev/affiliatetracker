import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | AffiliateMango',
  description: 'Terms of Service for AffiliateMango by Cleverpoly LLC.',
};

export default function TermsOfService() {
  return (
    <>
      <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Terms of Service</h1>
      <p className="text-zinc-400 mb-10">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="space-y-8 text-zinc-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
          <p>
            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Cleverpoly LLC ("we," "us" or "our"), doing business as AffiliateMango, concerning your access to and use of the affiliatemango.com website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. User Representations</h2>
          <p>
            By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Fees and Payment</h2>
          <p>
            We accept various forms of payment including Stripe. You may be required to purchase or pay a fee to access some of our services. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Site. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Governing Law</h2>
          <p>
            These Terms shall be governed by and defined following the laws of the State of Wyoming. Cleverpoly LLC and yourself irrevocably consent that the courts of Wyoming shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
          <p>
            In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:
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
