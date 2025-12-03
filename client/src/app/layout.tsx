import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DiaWatch - AI-Powered Diabetes Risk Assessment",
  description: `Professional AI-powered medical prediction tool for diabetes risk assessment. Get immediate, actionable insights into your health.
              track your habit, monitor your glucose and insulin level, bmi, skinthickness and history.`,
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },
  keywords: ['Diawatch', 'Diabetes prediction', 'AI health app', 'Medical AI', 'Healthcare analytics', 'ML deployment', 'Risk assessment'],
  authors: [{ name: 'DiaWatch Team', url: 'https://jimmyesang.vercel.app' }],
  robots: 'index, follow',
  openGraph: {
    title: 'DiaWatch - Professional Diabetes Risk Prediction',
    description: `Use DiaWatch to quickly assess diabetes risk based on key health metrics with AI-powered analysis
                  Track your health history`,
    url: 'https://diawatch.fly.dev/',
    siteName: 'DiaWatch',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiaWatch - Professional Diabetes Risk Prediction',
    description: 'AI-powered diabetes risk prediction with explainable AI insights.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#14b8a6" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}