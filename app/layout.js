import './globals.css';

export const metadata = {
  title: 'Annual Attendance Record',
  description: 'Hospital staff leave, duty roster and Hijri / English attendance calendar',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
