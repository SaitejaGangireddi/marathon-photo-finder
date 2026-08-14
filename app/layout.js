export const metadata = {
  title: 'Marathon Photo Finder',
  description: 'Find your marathon race photos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
