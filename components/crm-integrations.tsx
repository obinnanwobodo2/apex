"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  Mail,
  Calendar,
  Webhook,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Circle,
  FileText,
  FolderKanban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "number" | "email" | "password" | "url";
}

interface Integration {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: IntegrationField[];
  setupSteps?: string[];
  docsUrl?: string;
}

interface StoredIntegration {
  type: string;
  config: string;
  active: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "google_calendar",
    label: "Google Calendar API",
    description: "Sync CRM meetings to your Google Calendar using OAuth credentials.",
    icon: <Calendar className="h-6 w-6" />,
    color: "text-brand-navy bg-brand-green/10",
    fields: [
      { key: "clientId", label: "OAuth Client ID", placeholder: "xxxxxxxx.apps.googleusercontent.com" },
      { key: "clientSecret", label: "OAuth Client Secret", placeholder: "Paste client secret", type: "password" },
      { key: "refreshToken", label: "Refresh Token", placeholder: "Paste refresh token", type: "password" },
      { key: "calendarId", label: "Calendar ID", placeholder: "primary" },
      { key: "timezone", label: "Default Timezone", placeholder: "Africa/Johannesburg" },
      { key: "defaultDuration", label: "Default Duration (minutes)", placeholder: "60", type: "number" },
    ],
    setupSteps: [
      "Create OAuth credentials in Google Cloud Console",
      "Enable Google Calendar API and generate refresh token",
      "Save credentials here to unlock event sync from CRM actions",
    ],
    docsUrl: "https://developers.google.com/calendar/api",
  },
  {
    id: "notion",
    label: "Notion API",
    description: "Send contacts, deals, and tasks into your Notion workspace.",
    icon: <FileText className="h-6 w-6" />,
    color: "text-brand-navy bg-brand-navy/5",
    fields: [
      { key: "internalToken", label: "Internal Integration Token", placeholder: "secret_xxx", type: "password" },
      { key: "databaseId", label: "Database ID", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "parentPageId", label: "Parent Page ID (optional)", placeholder: "Notion page ID" },
      { key: "workspaceName", label: "Workspace Label", placeholder: "Apex CRM Workspace" },
    ],
    setupSteps: [
      "Create an internal integration inside Notion",
      "Share your target database/page with that integration",
      "Paste token and IDs above to enable sync actions",
    ],
    docsUrl: "https://developers.notion.com/reference/intro",
  },
  {
    id: "monday",
    label: "Monday.com API",
    description: "Push CRM leads and tasks into Monday.com boards.",
    icon: <FolderKanban className="h-6 w-6" />,
    color: "text-brand-navy bg-brand-green/10",
    fields: [
      { key: "apiToken", label: "API Token", placeholder: "Paste Monday.com API token", type: "password" },
      { key: "boardId", label: "Board ID", placeholder: "1234567890" },
      { key: "groupId", label: "Group ID (optional)", placeholder: "topics" },
      { key: "ownerId", label: "Owner/User ID (optional)", placeholder: "11223344" },
    ],
    setupSteps: [
      "Generate your API token from Monday.com admin settings",
      "Choose target board and optional group for synced items",
      "Save configuration to route CRM updates into Monday",
    ],
    docsUrl: "https://developer.monday.com/api-reference/docs",
  },
  {
    id: "slack",
    label: "Slack API",
    description: "Send CRM activity alerts to Slack channels.",
    icon: <MessageCircle className="h-6 w-6" />,
    color: "text-brand-navy bg-brand-navy/5",
    fields: [
      { key: "botToken", label: "Bot User OAuth Token", placeholder: "xoxb-...", type: "password" },
      { key: "signingSecret", label: "Signing Secret", placeholder: "Paste signing secret", type: "password" },
      { key: "appId", label: "Slack App ID", placeholder: "A1234567890" },
      { key: "defaultChannel", label: "Default Channel", placeholder: "#sales-updates" },
      { key: "workspaceUrl", label: "Workspace URL (optional)", placeholder: "https://yourteam.slack.com", type: "url" },
    ],
    setupSteps: [
      "Create a Slack app and grant bot scopes",
      "Install app to workspace and copy token + signing secret",
      "Choose a default channel for CRM event notifications",
    ],
    docsUrl: "https://api.slack.com/start",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Send WhatsApp messages directly to contacts and log conversations.",
    icon: <MessageCircle className="h-6 w-6" />,
    color: "text-brand-navy bg-brand-green/10",
    fields: [
      { key: "phoneNumber", label: "Your WhatsApp Business Number", placeholder: "+27 82 000 0000" },
      { key: "defaultMessage", label: "Default Greeting Message", placeholder: "Hi {name}, thanks for reaching out..." },
    ],
    setupSteps: [
      "Enter your WhatsApp Business number above",
      "Click 'Open WhatsApp' next to any contact to start a chat",
      "Messages will be pre-filled with your default greeting",
    ],
  },
  {
    id: "gmail",
    label: "Gmail / Email",
    description: "Configure your email sender details to draft and send emails to contacts.",
    icon: <Mail className="h-6 w-6" />,
    color: "text-brand-navy bg-brand-navy/5",
    fields: [
      { key: "fromName", label: "Sender Name", placeholder: "Your Name or Business" },
      { key: "fromEmail", label: "Your Email Address", placeholder: "you@yourcompany.co.za", type: "email" },
      { key: "signature", label: "Email Signature", placeholder: "Kind regards, Your Name" },
    ],
    setupSteps: [
      "Enter your sender details above",
      "Click the email icon next to any contact to open a pre-filled email",
      "Your default email client will open with the contact's details",
    ],
  },
  {
    id: "webhook",
    label: "Webhook",
    description: "Send CRM events to your own endpoint for custom automations.",
    icon: <Webhook className="h-6 w-6" />,
    color: "text-brand-navy bg-gray-100",
    fields: [
      { key: "url", label: "Webhook URL", placeholder: "https://your-service.com/webhook", type: "url" },
      { key: "secret", label: "Secret (optional)", placeholder: "your-secret-key", type: "password" },
    ],
    setupSteps: [
      "Enter your endpoint URL above",
      "Events (new contact, deal stage change, task done) will POST to your URL",
      "Payload format: { event, data, timestamp }",
    ],
  },
];

type ConfigMap = Record<string, Record<string, string>>;
type ActiveMap = Record<string, boolean>;

function hasAnyValue(config: Record<string, string> | undefined) {
  if (!config) return false;
  return Object.values(config).some((value) => value.trim().length > 0);
}

function parseStoredConfig(raw: unknown): Record<string, string> {
  if (typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const config: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === null || value === undefined) continue;
      config[key] = String(value);
    }
    return config;
  } catch {
    return {};
  }
}

export default function IntegrationsClient() {
  const [configs, setConfigs] = useState<ConfigMap>({});
  const [active, setActive] = useState<ActiveMap>({});
  const [expanded, setExpanded] = useState<string | null>("google_calendar");
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crm/integrations", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load integrations");

      const data = (await res.json()) as StoredIntegration[];
      const nextConfigs: ConfigMap = {};
      const nextActive: ActiveMap = {};

      for (const item of data) {
        nextConfigs[item.type] = parseStoredConfig(item.config);
        nextActive[item.type] = Boolean(item.active);
      }

      setConfigs(nextConfigs);
      setActive(nextActive);
    } catch {
      setError("Could not load your integration settings. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  function updateField(integrationId: string, key: string, value: string) {
    setConfigs((prev) => ({
      ...prev,
      [integrationId]: { ...(prev[integrationId] ?? {}), [key]: value },
    }));
  }

  async function handleSave(integration: Integration) {
    setSaving(integration.id);
    setError(null);

    const config = configs[integration.id] ?? {};

    try {
      const res = await fetch("/api/crm/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: integration.id,
          config,
          active: hasAnyValue(config),
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to save integration");
      }

      const saved = (await res.json()) as StoredIntegration;
      setConfigs((prev) => ({ ...prev, [integration.id]: parseStoredConfig(saved.config) }));
      setActive((prev) => ({ ...prev, [integration.id]: Boolean(saved.active) }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save integration";
      setError(message);
    } finally {
      setSaving(null);
    }
  }

  async function handleDisconnect(integration: Integration) {
    setSaving(integration.id);
    setError(null);

    try {
      const res = await fetch("/api/crm/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: integration.id, config: {}, active: false }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to disconnect integration");
      }

      setConfigs((prev) => ({ ...prev, [integration.id]: {} }));
      setActive((prev) => ({ ...prev, [integration.id]: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect integration";
      setError(message);
    } finally {
      setSaving(null);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Integrations</h1>
        <p className="text-sm text-gray-400 mt-0.5">Connect your CRM to external tools and APIs</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {INTEGRATIONS.map((integration) => {
            const isExpanded = expanded === integration.id;
            const config = configs[integration.id] ?? {};
            const hasConfig = hasAnyValue(config);
            const isActive = active[integration.id] ?? false;

            return (
              <Card key={integration.id} className={`transition-all ${isExpanded ? "ring-2 ring-brand-green/30" : ""}`}>
                <CardHeader
                  className="cursor-pointer select-none pb-3"
                  onClick={() => toggleExpand(integration.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${integration.color}`}>
                        {integration.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-brand-navy text-base">{integration.label}</CardTitle>
                          {isActive ? (
                            <span className="flex items-center gap-1 text-xs text-brand-green font-medium">
                              <CheckCircle2 className="h-3 w-3" />Connected
                            </span>
                          ) : hasConfig ? (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <Circle className="h-3 w-3" />Saved (inactive)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Circle className="h-3 w-3" />Not configured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{integration.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-5">
                    <div className="space-y-3 border-t pt-4">
                      {integration.fields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <Label>{field.label}</Label>
                          <Input
                            type={field.type ?? "text"}
                            placeholder={field.placeholder}
                            value={config[field.key] ?? ""}
                            onChange={(e) => updateField(integration.id, field.key, e.target.value)}
                            autoComplete={field.type === "password" ? "new-password" : "off"}
                          />
                        </div>
                      ))}
                    </div>

                    {integration.setupSteps && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">How it works</p>
                        <ol className="space-y-1.5">
                          {integration.setupSteps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs text-gray-500">
                              <span className="font-bold text-brand-green flex-shrink-0">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={() => handleSave(integration)} disabled={saving === integration.id}>
                        {saving === integration.id ? "Saving..." : "Save Configuration"}
                      </Button>
                      {isActive && (
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(integration)}
                          disabled={saving === integration.id}
                        >
                          Disconnect
                        </Button>
                      )}
                      {integration.docsUrl && (
                        <a
                          href={integration.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-brand-green hover:underline"
                        >
                          Open Docs <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
