import LegalPage from "@/components/LegalPage";

const sections = [
  {
    title: "1. Scope",
    content: <p>This Privacy Policy describes information Flowex handles when you use the Flowex website and application. It reflects the features currently implemented in the product.</p>,
  },
  {
    title: "2. Account, lead, integration, and billing information",
    content: <>
      <p><strong>Flowex account data:</strong> Supabase authentication account information, including your account email, plus profile details you provide or save, such as your name, phone number, and profile image.</p>
      <p><strong>Lead and customer data you submit:</strong> submissions received through Flowex or connected external forms may include email, phone number, and any other field values you configure. Flowex also stores associated lead-flow and source identifiers, timestamps, status, and follow-up state. You choose the fields and are responsible for what you submit.</p>
      <p><strong>Workflow and integration data:</strong> Flowex stores your flow, reply, follow-up, and notification settings; destination identifiers and field mappings; connected provider account details such as account email; and OAuth credentials used to access integrations. Flowex encrypts OAuth credentials when saving them through its credential-storage helper.</p>
      <p><strong>Payment data:</strong> checkout sends Lemon Squeezy your name and email, Flowex account identifier, and selected billing interval. Flowex receives subscription status and related provider identifiers and dates through payment events. Payment card details are entered with the payment provider and are not submitted to Flowex's checkout API.</p>
      <p>Flowex also uses local browser storage to remember your light or dark appearance setting.</p>
    </>,
  },
  {
    title: "3. How information is used",
    content: <p>Flowex uses this information to authenticate accounts, operate lead flows, store and display leads, send configured replies, team notifications and follow-ups, transfer data to selected destinations, maintain integration connections, reflect subscription status, respond to requests, and protect the service from misuse.</p>,
  },
  {
    title: "4. Lead data and your role",
    content: <p>When you use Flowex to collect information from a lead, that information is processed to provide the features you configure. You choose the fields, sources, recipients, destinations, and automation settings. You are responsible for providing any notices and obtaining permissions required for that collection and use.</p>,
  },
  {
    title: "5. Integrations and other services",
    content: <>
      <p>Supabase provides Flowex authentication and application data storage. Depending on your configuration, Flowex sends lead information to Google Sheets, Gmail, Microsoft Excel, Airtable, Notion, or HubSpot; configured team notification email is sent through Resend. Lemon Squeezy handles checkout and sends subscription events to Flowex. Each service receives information needed for the action you request and handles it under its own terms and privacy practices.</p>
      <p>Flowex does not control these third-party services or their privacy and availability practices. Review the applicable service terms and privacy notices before connecting or using them.</p>
    </>,
  },
  {
    title: "6. Data retention",
    content: <>
      <p>Flowex sets lead records to expire seven days after receipt. A scheduled process deletes expired leads; deletion may be delayed if that process does not run successfully. Outbox actions associated with a lead are removed with the lead.</p>
      <p>Account, profile, workflow, destination, integration, and subscription records remain while associated with your account unless you delete them or they are otherwise removed in the operation of the service. Flowex does not define a fixed retention period for those records in the application.</p>
    </>,
  },
  {
    title: "7. Account deletion and connected data",
    content: <>
      <p>You can delete your Flowex account through the account deletion feature. When deletion succeeds, Flowex deletes the authentication account and database records linked by cascade relationships. Account deletion does not delete copies already sent to Google, Microsoft, Airtable, Notion, HubSpot, Resend, or Lemon Squeezy, and it does not cancel a subscription. Manage provider-held data and subscription cancellation under the relevant provider's terms.</p>
      <p>Disconnecting an integration removes the corresponding Flowex connection and destination records, but does not delete data previously sent to that provider or necessarily revoke authorization there.</p>
    </>,
  },
  {
    title: "8. Security",
    content: <p>Flowex uses access controls and encrypts OAuth credentials in its application credential storage path. No online service or storage method can be represented as completely secure, and Flowex does not promise that unauthorized access can never occur.</p>,
  },
  {
    title: "9. Your choices",
    content: <p>You can update account details and configuration through the available account and application screens, disconnect integrations, and delete your account. You can also choose what information you collect and which integrations receive it.</p>,
  },
  {
    title: "10. Changes and account choices",
    content: <>
      <p>We may update this Policy as Flowex changes. We will update the date above when this page is revised.</p>
      <p>You can update the account and profile details exposed in Flowex, disconnect integrations, or use the account deletion feature. Payment and provider-held data choices are managed with the relevant provider.</p>
    </>,
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" label="Privacy Policy" lastUpdated="October 7, 2026" sections={sections} />;
}
