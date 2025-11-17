import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Terms of Service
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-400 mb-2">
                Important Legal Notice
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                This is a template Terms of Service. Before launching commercially, you must have this document reviewed and customized by a licensed attorney familiar with securities law, real estate regulations, and blockchain technology in your jurisdiction.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                By accessing or using the services provided by [Company Name] ("we," "us," or "our"), including our website, mobile applications, and smart contracts (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                These Terms constitute a legally binding agreement between you and [Company Name]. We reserve the right to update these Terms at any time, and your continued use of the Platform constitutes acceptance of any modifications.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. Eligibility
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                To use our Platform, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Be at least 18 years of age or the legal age of majority in your jurisdiction</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using the Platform under applicable laws</li>
                <li>Complete our identity verification (KYC/AML) process</li>
                <li>Meet accredited investor requirements where applicable</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. Services Description
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Our Platform facilitates:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Tokenization of real estate properties into digital assets</li>
                <li>Trading of property tokens between users</li>
                <li>Distribution of rental income to token holders</li>
                <li>Governance participation for platform decisions</li>
                <li>Staking mechanisms for earning rewards</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                <strong>Important:</strong> We are a technology platform provider. We do not own, manage, or operate the underlying properties. We are not a real estate broker, investment advisor, or financial institution.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. Securities & Investment Risks
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <strong>Property tokens may be considered securities</strong> under federal and state laws. By purchasing tokens, you acknowledge:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>All investments involve risk, including total loss of capital</li>
                <li>Past performance does not guarantee future results</li>
                <li>Property values can fluctuate significantly</li>
                <li>Tokens may be illiquid and difficult to sell</li>
                <li>Rental income is not guaranteed</li>
                <li>Smart contracts may contain bugs or vulnerabilities</li>
                <li>Blockchain technology risks (network congestion, high gas fees)</li>
                <li>Regulatory risks and potential legal changes</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4 font-semibold">
                YOU SHOULD ONLY INVEST WHAT YOU CAN AFFORD TO LOSE. CONSULT WITH FINANCIAL, TAX, AND LEGAL ADVISORS BEFORE MAKING INVESTMENT DECISIONS.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. User Accounts & Security
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Securing your cryptocurrency wallet and private keys</li>
                <li>Notifying us immediately of unauthorized access</li>
                <li>Providing accurate and complete information</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                <strong>Warning:</strong> If you lose access to your wallet or private keys, we cannot recover your tokens. Cryptocurrency transactions are irreversible.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. KYC/AML Compliance
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                We are required to verify your identity under anti-money laundering (AML) and know-your-customer (KYC) regulations. You agree to provide accurate identification documents and information. We may refuse service or freeze accounts that fail verification or exhibit suspicious activity.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Prohibited Activities
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You may not:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Engage in market manipulation or fraudulent activities</li>
                <li>Use the Platform for money laundering or terrorist financing</li>
                <li>Attempt to hack, disrupt, or compromise our systems</li>
                <li>Create multiple accounts to circumvent restrictions</li>
                <li>Impersonate others or provide false information</li>
                <li>Interfere with other users' access to the Platform</li>
                <li>Use automated tools to access the Platform (except APIs)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Fees & Payments
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We charge fees for platform services:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Platform fee: 2.5% on transactions</li>
                <li>Payment processing fees (Stripe/crypto network fees)</li>
                <li>Blockchain gas fees (paid to network, not us)</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                All fees are clearly disclosed before you confirm transactions. Fees are non-refundable except as required by law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Intellectual Property
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                All content, features, and functionality of the Platform are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. Disclaimers
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF INFORMATION</li>
                <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
                <li>SECURITY OR ABSENCE OF VIRUSES</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. Limitation of Liability
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA, OR INVESTMENT LOSSES, ARISING FROM YOUR USE OF THE PLATFORM.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES YOU PAID TO US IN THE 12 MONTHS PRIOR TO THE EVENT GIVING RISE TO LIABILITY.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              12. Dispute Resolution
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <strong>Binding Arbitration:</strong> Any disputes arising from these Terms shall be resolved through binding arbitration in [Jurisdiction], rather than in court, except for claims that may be brought in small claims court.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                <strong>Class Action Waiver:</strong> You agree to resolve disputes on an individual basis and waive the right to participate in class action lawsuits.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              13. Termination
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                We may suspend or terminate your access to the Platform at any time, with or without cause, with or without notice. Upon termination, your right to use the Platform ceases immediately. You may close your account at any time by contacting support.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              14. Governing Law
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                These Terms are governed by the laws of [State/Country], without regard to conflict of law principles. You consent to the exclusive jurisdiction of courts in [Jurisdiction].
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              15. Contact Information
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-900 dark:text-white font-medium">[Company Name]</p>
                <p className="text-gray-600 dark:text-gray-400">[Address]</p>
                <p className="text-gray-600 dark:text-gray-400">Email: legal@yourcompany.com</p>
                <p className="text-gray-600 dark:text-gray-400">Phone: [Phone Number]</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-between items-center text-sm">
          <Link
            to="/privacy-policy"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Privacy Policy →
          </Link>
          <Link
            to="/"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
