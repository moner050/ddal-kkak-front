import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 사이트 제목 및 설명 */}
        <title>딸깍 - 스마트 투자 분석 플랫폼</title>
        <meta name="description" content="데이터 기반의 종목 분석과 투자 인사이트를 제공하는 스마트 투자 플랫폼입니다. 종합 점수, 재무 분석, 공시 정보를 한눈에 확인하세요." />
        <meta name="keywords" content="주식, 투자, 종목 분석, 재무 분석, 공시, 스마트 투자, 딸깍" />
        <meta name="author" content="딸깍" />

        {/* Favicon - SVG */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>" />

        {/* Open Graph 메타태그 */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="딸깍" />
        <meta property="og:title" content="딸깍 - 스마트 투자 분석 플랫폼" />
        <meta property="og:description" content="데이터 기반의 종목 분석과 투자 인사이트를 제공하는 스마트 투자 플랫폼입니다." />
        <meta property="og:image" content="https://ddal-kkak.com/og-image.jpg" />
        <meta property="og:url" content="https://ddal-kkak.com" />

        {/* Twitter Card 메타태그 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="딸깍 - 스마트 투자 분석 플랫폼" />
        <meta name="twitter:description" content="데이터 기반의 종목 분석과 투자 인사이트를 제공하는 스마트 투자 플랫폼입니다." />
        <meta name="twitter:image" content="https://ddal-kkak.com/og-image.jpg" />

        {/* 테마 색상 */}
        <meta name="theme-color" content="#4f46e5" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
