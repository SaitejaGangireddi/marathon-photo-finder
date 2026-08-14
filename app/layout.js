export const metadata = {
  title: 'Marathon Photo Finder',
  description: 'Find your marathon race photos by BIB or selfie',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f9fafb' }}>
        {children}
      </body>
    </html>
  );
}
