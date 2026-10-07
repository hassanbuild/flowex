import LegalPage from "@/components/LegalPage";

const sections = [
  {
    title: "1. About these Terms and your account",
    content: <>
      <p>These Terms apply when you access or use Flowex, including its website, lead capture tools, dashboards, integrations, and automation features. By using Flowex, you agree to these Terms.</p>
      <p>You are responsible for your account credentials, the activity under your account, and keeping your account information accurate. Contact Flowex if you believe your account has been used without authorization.</p>
    </>,
  },
  {
    title: "2. The Flowex service",
    content: <p>Flowex provides tools to configure lead flows, receive submissions from Flowex forms or connected external forms, view lead records, send configured email replies and team notifications, schedule follow-up messages, and deliver lead data to connected services. Features depend on your plan and configuration. Automation can fail or be delayed, and you remain responsible for monitoring messages and lead handling.</p>,
  },
  {
    title: "3. Plans, trials, payment, cancellation, and refunds",
    content: <>
      <p>The current checkout offers a seven-day trial followed by the selected monthly or annual subscription, shown at checkout (currently $15 per month or $120 per year). The checkout is processed by Lemon Squeezy. The price and billing terms shown at checkout control your purchase.</p>
      <p>Subscriptions may renew according to the terms presented at checkout. Renewal, cancellation requests and timing, and refund eligibility are governed by the applicable checkout and payment-provider terms and applicable law. Flowex reflects subscription status reported by Lemon Squeezy.</p>
    </>,
  },
  {
    title: "4. Lead and customer data; your responsibilities",
    content: <>
      <p>You decide what information to collect and where to send it. You are responsible for having the rights, notices, permissions, and other legal basis needed to collect and use lead information, and for complying with laws that apply to your forms, recipients, and communications.</p>
      <p>Do not submit information you are not authorized to process. You remain responsible for your field configuration, destination choices, message content, and decisions made using Flowex.</p>
    </>,
  },
  {
    title: "5. Integrations and automated actions",
    content: <>
      <p>When you connect a service, you authorize Flowex to use the connection and configuration you provide to perform the actions you select. Current integrations include Google Sheets and Gmail, Microsoft Excel, Airtable, Notion, and HubSpot. Email delivery also uses Resend for configured team notifications.</p>
      <p>Flowex may create or update records, append rows, or send emails according to your settings. You are responsible for checking mappings, destinations, recipients, and message content. Third-party services operate under their own terms and may change, limit, or interrupt their services. Disconnecting an integration removes its stored Flowex connection or destination; it does not delete data already sent to the third party or necessarily revoke access at that provider.</p>
    </>,
  },
  {
    title: "6. Data retention and account deletion",
    content: <>
      <p>Flowex sets lead records to expire after seven days and its scheduled follow-up process deletes expired lead records. Other account and configuration data remains associated with your account until you delete the account or it is otherwise removed under the service's operation.</p>
      <p>You can request account deletion using the account deletion feature in Flowex. Deletion removes the Flowex authentication account and records linked to it in Flowex; it does not delete records already sent to connected services and does not itself cancel a Lemon Squeezy subscription. Handle subscription cancellation separately with the payment provider.</p>
    </>,
  },
  {
    title: "7. Acceptable use",
    content: <p>You may not use Flowex to break the law, send unlawful or abusive communications, submit malicious content, interfere with or disrupt the service, bypass access controls, or access another person's account or data without permission. We may restrict access when reasonably needed to protect the service, users, or third parties.</p>,
  },
  {
    title: "8. Ownership and feedback",
    content: <p>You retain your rights in the content and data you submit. You grant Flowex permission to host and process it as needed to provide and operate the features you use. Flowex and its software, branding, and interface remain Flowex's property. If you provide suggestions, Flowex may use them to improve the service.</p>,
  },
  {
    title: "9. Service changes and availability",
    content: <p>Flowex may change or discontinue features as the product develops. We work to operate the service but do not promise uninterrupted or error-free availability. Access can be affected by maintenance, technical issues, or third-party services.</p>,
  },
  {
    title: "10. Disclaimers and limitation of liability",
    content: <>
      <p>To the extent permitted by applicable law, Flowex is provided on an “as available” basis without a promise that automations, integrations, messages, or results will be uninterrupted, timely, or error-free. Flowex does not guarantee business outcomes or that a recipient will receive or act on a message.</p>
      <p>To the extent permitted by applicable law, Flowex is not liable for indirect, incidental, special, consequential, or punitive loss, or for loss arising from third-party services, failed delivery, or your configuration and use of the service. Nothing in these Terms excludes liability that applicable law does not allow to be excluded.</p>
    </>,
  },
  {
    title: "11. Changes",
    content: <>
      <p>We may update these Terms as Flowex changes. The updated date at the top of this page identifies the latest version.</p>
    </>,
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms & Conditions" label="Terms & Conditions" lastUpdated="October 7, 2026" sections={sections} />;
}
