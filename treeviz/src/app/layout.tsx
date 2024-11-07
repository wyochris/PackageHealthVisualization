
import { CsvDataProvider } from "@/utils/CsvDataContext";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CsvDataProvider>
          {children}
        </CsvDataProvider>
      </body>
    </html>
  );
}
