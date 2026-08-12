import { Inter, Plus_Jakarta_Sans, Fira_Code } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-heading' });
const fira = Fira_Code({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'Nishi Punjabi | QA Automation Engineer',
  description: 'Portfolio of Nishi Punjabi, a QA Automation Engineer specializing in Playwright, API testing, manual testing, e-commerce QA, payment validation, and test automation.',
  keywords: [
    'QA Automation Engineer',
    'Software Tester',
    'Quality Assurance Engineer',
    'Playwright Automation',
    'API Testing',
    'Manual Testing',
    'Software Testing',
    'E-commerce QA',
    'Test Automation',
    'Nishi Punjabi'
  ],
  authors: [{ name: 'Nishi Punjabi' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body class={`${inter.variable} ${jakarta.variable} ${fira.variable}`}>
        {children}
      </body>
    </html>
  );
}
