import { Shield, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Admin Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Security and operations configuration for admin access.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-green" />Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>Admin is locked to one owner account only.</p>
          <p>Set `OWNER_USER_ID` (recommended) or `OWNER_EMAIL` in environment variables.</p>
          <p className="text-xs text-gray-400">
            Example: `OWNER_EMAIL=you@yourcompany.com`
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <UserCog className="h-4 w-4 text-brand-green" />Support Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          Use the Admin Support tab to answer client tickets, update status, and generate AI-assisted replies.
        </CardContent>
      </Card>
    </div>
  );
}
