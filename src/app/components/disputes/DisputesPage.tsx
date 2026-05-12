import { MessageSquare } from "lucide-react";

export default function DisputesPage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-3 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
        <MessageSquare size={20} className="text-violet-600" />
      </div>
      <p className="text-sm font-medium text-slate-700">Disputes</p>
      <p className="text-xs text-slate-400 max-w-xs">
        Vendor conversations and dispute threads will appear here.
        Disputes are raised from the Exceptions page.
      </p>
    </div>
  );
}
