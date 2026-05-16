import { Sidebar } from '@/components/sidebar'
import { DashboardWrapper } from '@/components/dashboard-wrapper'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardWrapper>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Main content area with its own scrollbar */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    </DashboardWrapper>
  )
}
