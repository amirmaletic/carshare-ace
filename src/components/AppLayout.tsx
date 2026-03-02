import { AppSidebar } from "./AppSidebar";
import { AiAssistant } from "./AiAssistant";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
      <AiAssistant />
    </div>
  );
}
