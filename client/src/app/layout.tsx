import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  viewport:{
    width:"device-width",
    initialScale:1,
    maximumScale:1,
  },
  title: "DiaWatch - AI-Powered Diabetes Risk Assessment",
  description: `Professional AI-powered medical prediction tool for diabetes risk assessment. Get immediate, actionable insights into your health.
 track your habit, monitor your glucose and insulin level, bmi, skinthickness and history.`,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32x32.png",
  },
  keywords: [
    "Diawatch",
    "Diabetes prediction",
    "AI health app",
    "Medical AI",
    "Healthcare analytics",
    "ML deployment",
    "Risk assessment",
  ],
  authors: [{ name: "DiaWatch Team", url: "https://jimmyesang.vercel.app" }],
  robots: "index, follow",
  openGraph: {
    title: "DiaWatch - Professional Diabetes Risk Prediction",
    description: `Use DiaWatch to quickly assess diabetes risk based on key health metrics with AI-powered analysis
 Track your health history`,
    url: "https://diawatch.fly.dev/",
    siteName: "DiaWatch",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DiaWatch - Professional Diabetes Risk Prediction",
    description:
      "AI-powered diabetes risk prediction with explainable AI insights.",
    images: ["/og.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
//   const cookieStore = await cookies();
//   const hasRefreshToken = cookieStore.has("refresh_token");
//   console.log("hasRefreshToken: ", hasRefreshToken);
//   console.log("cookie store: ", cookieStore);

  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#14b8a6" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
