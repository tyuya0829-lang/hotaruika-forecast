import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ホタルイカ予報 - 兵庫・鳥取・福井版',
  description: '兵庫・鳥取・福井の日本海沿岸のホタルイカ身投げ予報。月齢・天気・風向から湧き量を予測します。',
  keywords: ['ホタルイカ', '浜坂', '香住', '浦富海岸', '鳥取', '兵庫', '越前', '三国', '福井', '身投げ', '掬い'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950">{children}</body>
    </html>
  )
}
