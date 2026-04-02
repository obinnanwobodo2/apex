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
          <p>Configure `ADMIN_USER_IDS` and/or `ADMIN_EMAILS` in your environment to control admin access.</p>
          <p className="text-xs text-gray-400">
            Example: `ADMIN_EMAILS=you@yourcompany.com,ops@yourcompany.com`
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

