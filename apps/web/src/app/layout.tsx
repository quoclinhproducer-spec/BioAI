import './globals.css';

export const metadata = {
  title: 'BioAI Console',
  description: 'Biomass composting IoT and AI platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
