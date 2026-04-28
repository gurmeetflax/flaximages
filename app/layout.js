import './globals.css';

export const metadata = {
  title: 'Flax Ops',
  description: 'Image review portal for Flax Healthy Living outlet operations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
