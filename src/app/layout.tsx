import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TESAT Master | Luyện thi Kinh tế Hàn Quốc Hankyung TESAT",
  description:
    "Nền tảng luyện thi chứng chỉ kinh tế quốc gia Hàn Quốc Hankyung TESAT (80 câu / 300 điểm / 100 phút) dành cho người học Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased selection:bg-blue-600/15 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
