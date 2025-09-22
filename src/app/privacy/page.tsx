export const metadata = {
    title: "Privacy Policy • XBay",
  };
  
  export default function PrivacyPage() {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Last updated: January 2025
        </p>
  
        <div className="prose prose-invert mt-8 max-w-none">
          <p>
            XBay Inc. is committed to protecting patient privacy and safeguarding
            the security of clinical data. This policy explains what we collect,
            how we use it, and your choices.
          </p>
  
          <h2>What we collect</h2>
          <ul>
            <li>Workspace and product usage to improve reliability and UX</li>
            <li>Support and account information provided by you</li>
            <li>
              Clinical or synthetic datasets you upload to XBay tooling (processed
              under your control)
            </li>
          </ul>
  
          <h2>How we use data</h2>
          <ul>
            <li>Operate and improve the service</li>
            <li>Detect abuse and ensure security</li>
            <li>Provide support and product communications</li>
          </ul>
  
          <h2>Security</h2>
          <p>
            We follow industry best practices for encryption in transit and at rest,
            role-based access, and least-privilege operations.
          </p>
  
          <h2>Your choices</h2>
          <p>
            You may request deletion or export of your workspace data by contacting
            support@xbay.ai.
          </p>
  
          <h2>Contact</h2>
          <p>
            Questions? Email <a href="mailto:privacy@xbay.ai">privacy@xbay.ai</a>.
          </p>
        </div>
      </div>
    );
  }
  