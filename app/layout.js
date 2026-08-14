export const metadata = {
  title: 'Marathon Photo Finder',
  description: 'Find your marathon race photos using Face Recognition & Bib OCR',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Load face-api models and script via CDN */}
        <script defer src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"></script>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
