import './globals.css'
import Navigation from '../components/Navigation'

export const metadata = {
  title: 'AccessER - Accessibility-Adjusted Emergency Room Burden Platform',
  description: 'Real-time accessibility equity layer for emergency departments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  )
}
