import { Inter, Plus_Jakarta_Sans, Fira_Code } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-heading' });
const fira = Fira_Code({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'Nishi Punjabi | QA Automation Engineer | Web & Mobile (Android & iOS) Testing',
  description: 'Official Portfolio of Nishi Punjabi, QA Automation Engineer at WoodenStreet. Specializing in Playwright automation, Android & iOS app testing, API testing, payment gateway rollout, CMS bulk price integrity, and JIRA bug triage.',
  keywords: [
    'Nishi Punjabi',
    'QA Automation Engineer',
    'Website & Mobile App Testing',
    'Android App Testing',
    'iOS App Testing',
    'Playwright Automation',
    'API Testing',
    'Manual & Functional QA',
    'E-commerce QA Engineer',
    'Payment Gateway QA',
    'WoodenStreet QA Engineer',
    'Software Testing Engineer'
  ],
  authors: [{ name: 'Nishi Punjabi', url: 'https://linkedin.com/in/nishi-punjabi-b610b8259' }],
  openGraph: {
    title: 'Nishi Punjabi | QA Automation Engineer | Web & Mobile Testing',
    description: 'Specializing in Playwright automation, Android & iOS app testing, API validation, payment gateway rollout, and e-commerce QA.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Nishi Punjabi Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nishi Punjabi | QA Automation Engineer',
    description: 'QA Automation Engineer specializing in Playwright, Android & iOS App Testing, REST API testing, and payment gateway QA.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Nishi Punjabi',
    jobTitle: 'QA Automation Engineer',
    worksFor: {
      '@type': 'Organization',
      name: 'WoodenStreet Furniture',
    },
    url: 'https://linkedin.com/in/nishi-punjabi-b610b8259',
    sameAs: [
      'https://linkedin.com/in/nishi-punjabi-b610b8259',
      'https://github.com/nishipunjabi875-droid'
    ],
    knowsAbout: [
      'QA Automation',
      'Playwright',
      'Android App Testing',
      'iOS App Testing',
      'API Testing',
      'Payment Gateway Validation',
      'Page Object Model',
      'JIRA Bug Lifecycle'
    ]
  };

  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} ${fira.variable}`}>
        {children}
      </body>
    </html>
  );
}
