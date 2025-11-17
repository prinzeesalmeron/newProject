import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* GDPR Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                Your Privacy Rights
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                We are committed to protecting your privacy and complying with GDPR, CCPA, and other privacy regulations. You have the right to access, correct, delete, or export your personal data at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. Information We Collect
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Personal Information
              </h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Name, email address, phone number</li>
                <li>Government-issued ID for KYC verification</li>
                <li>Address and proof of residence</li>
                <li>Date of birth and nationality</li>
                <li>Financial information (for accredited investor verification)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-6">
                Blockchain & Wallet Information
              </h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Cryptocurrency wallet addresses</li>
                <li>Transaction history and blockchain records</li>
                <li>Token balances and holdings</li>
                <li>Smart contract interactions</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-6">
                Usage Information
              </h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>IP address, browser type, and device information</li>
                <li>Pages visited and features used</li>
                <li>Time and date of access</li>
                <li>Referral source</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. How We Use Your Information
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Provide and improve our Platform services</li>
                <li>Verify your identity and comply with KYC/AML regulations</li>
                <li>Process transactions and distribute payments</li>
                <li>Communicate with you about your account and investments</li>
                <li>Detect and prevent fraud, abuse, and illegal activity</li>
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Analyze usage patterns and improve user experience</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. Legal Basis for Processing (GDPR)
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We process your data based on:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li><strong>Contract Performance:</strong> To provide services you've requested</li>
                <li><strong>Legal Obligation:</strong> To comply with KYC/AML and tax laws</li>
                <li><strong>Legitimate Interests:</strong> To prevent fraud and improve services</li>
                <li><strong>Consent:</strong> For marketing communications and optional features</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. Information Sharing
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li><strong>Service Providers:</strong> Payment processors (Stripe), KYC providers, hosting services</li>
                <li><strong>Legal Authorities:</strong> When required by law or to comply with legal process</li>
                <li><strong>Professional Advisors:</strong> Lawyers, auditors, insurers (under confidentiality)</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                <strong>We never sell your personal information to third parties.</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Blockchain & Public Information
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Important:</strong> Blockchain transactions are permanent and public. When you interact with smart contracts, your wallet address and transaction details are recorded on the blockchain and visible to anyone. We cannot delete or modify blockchain records.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Data Security
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We protect your information using:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Encryption in transit (TLS/SSL) and at rest</li>
                <li>Multi-factor authentication (MFA) requirements</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and employee training</li>
                <li>Automated monitoring and threat detection</li>
                <li>Secure data centers with SOC 2 compliance</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                However, no system is 100% secure. You are responsible for maintaining the security of your account credentials and wallet private keys.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Data Retention
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We retain your information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>While your account is active</li>
                <li>For 7 years after account closure (regulatory requirement)</li>
                <li>As long as necessary to comply with legal obligations</li>
                <li>Until you request deletion (where permissible)</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                Some data must be retained longer due to financial regulations, tax requirements, and legal obligations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Your Privacy Rights
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Receive your data in machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Restriction:</strong> Request limitation of processing</li>
                <li><strong>Withdraw Consent:</strong> For processing based on consent</li>
                <li><strong>Complain:</strong> File a complaint with data protection authorities</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                To exercise these rights, contact us at privacy@yourcompany.com
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Cookies & Tracking
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for Platform functionality</li>
                <li><strong>Analytics Cookies:</strong> To understand usage patterns (Google Analytics, Mixpanel)</li>
                <li><strong>Performance Cookies:</strong> To improve site speed and reliability</li>
                <li><strong>Marketing Cookies:</strong> For targeted advertising (with consent)</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                You can manage cookie preferences through your browser settings or our cookie consent tool.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. International Data Transfers
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                Your data may be transferred to and processed in countries outside your residence. We ensure adequate protection through:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2 mt-3">
                <li>Standard Contractual Clauses (EU-approved)</li>
                <li>Adequacy decisions by regulatory authorities</li>
                <li>Your explicit consent where required</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. Children's Privacy
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                Our Platform is not intended for individuals under 18 years of age. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              12. California Privacy Rights (CCPA)
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                California residents have additional rights:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if information is sold or shared (we don't sell)</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of sale of personal information</li>
                <li>Right to non-discrimination for exercising rights</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              13. Changes to This Policy
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                We may update this Privacy Policy periodically. We will notify you of material changes via email or prominent notice on our Platform. Continued use after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              14. Contact Us
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                For privacy-related questions or to exercise your rights:
              </p>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-900 dark:text-white font-medium">Data Protection Officer</p>
                <p className="text-gray-600 dark:text-gray-400">Email: privacy@yourcompany.com</p>
                <p className="text-gray-600 dark:text-gray-400">Address: [Company Address]</p>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm">
                EU Representative (GDPR): [EU Representative Contact]<br />
                UK Representative (UK GDPR): [UK Representative Contact]
              </p>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-between items-center text-sm">
          <Link
            to="/terms-of-service"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Terms of Service →
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
