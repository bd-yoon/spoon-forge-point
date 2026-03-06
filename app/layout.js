import './globals.css'

export const metadata = {
  title: '숟가락 대장간',
  description: '돌덩이를 두드려 수저를 만들고 토스포인트로 교환하세요',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <meta name="theme-color" content="#C5E8F8" />
      </head>
      <body>{children}</body>
    </html>
  )
}
