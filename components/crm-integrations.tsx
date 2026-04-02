"use client";

import { useState } from "react";
import { MessageCircle, Mail, Calendar, Webhook, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Integration {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
  setupSteps?: string[];
  docsUrl?: string;
}

const INTEGRATIONS: Integration[] = [
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
      { key: "fromEmail", label: "Your Email Address", placeholder: "you@yourcompany.co.za" },
      { key: "signature", label: "Email Signature", placeholder: "Kind regards,\nYour Name" },
    ],
    setupSteps: [
      "Enter your sender details above",
      "Click the email icon next to any contact to open a pre-filled email",
      "Your default email client will open with the contact's details",
    ],
  },
  {
    id: "google_calendar",
    label: "Google Calendar",
    description: "Link your Google Calendar to schedule meetings directly from the CRM.",
    icon: <Calendar className="h-6 w-6" />,
    color: "text-brand-navy bg-brand-green/10",
    fields: [
      { key: "calendarEmail", label: "Google Calendar Email", placeholder: "you@gmail.com" },
      { key: "defaultDuration", label: "Default Meeting Duration (minutes)", placeholder: "60", type: "number" },
    ],
    setupSteps: [
      "Enter your Google account email above",
      "Use the 'Schedule Meeting' button on any contact to create a calendar event",
      "You'll be redirected to Google Calendar with details pre-filled",
    ],
    docsUrl: "https://calendar.google.com",
  },
  {
    id: "webhook",
    label: "Webhook",
    description: "Send CRM events to your own endpoint for custom automations.",
    icon: <Webhook className="h-6 w-6" />,
    color: "text-brand-navy bg-gray-100",
    fields: [
      { key: "url", label: "Webhook URL", placeholder: "https://your-service.com/webhook" },
      { key: "secret", label: "Secret (optional)", placeholder: "your-secret-key" },
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

export default function IntegrationsClient() {
  const [configs, setConfigs] = useState<ConfigMap>({});
  const [active, setActive] = useState<ActiveMap>({});
  const [expanded, setExpanded] = useState<string | null>("whatsapp");
  const [saving, setSaving] = useState<string | null>(null);

  function updateField(integrationId: string, key: string, value: string) {
    setConfigs((prev) => ({
      ...prev,
      [integrationId]: { ...(prev[integrationId] ?? {}), [key]: value },
    }));
  }

  async function handleSave(integration: Integration) {
    setSaving(integration.id);
    await fetch("/api/crm/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: integration.id, config: configs[integration.id] ?? {}, active: true }),
    });
    setActive((prev) => ({ ...prev, [integration.id]: true }));
    setSaving(null);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Integrations</h1>
        <p className="text-sm text-gray-400 mt-0.5">Connect your CRM to the tools you already use</p>
      </div>

      <div className="space-y-4">
        {INTEGRATIONS.map((integration) => {
          const isExpanded = expanded === integration.id;
          const isActive = active[integration.id] ?? false;
          const config = configs[integration.id] ?? {};

          return (
            <Card key={integration.id} className={`transition-all ${isExpanded ? "ring-2 ring-brand-green/30" : ""}`}>
              <CardHeader
                className="cursor-pointer select-none pb-3"
                onClick={() => toggleExpand(integration.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${integration.color}`}>
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-brand-navy text-base">{integration.label}</CardTitle>
                        {isActive && (
                          <span className="flex items-center gap-1 text-xs text-brand-green font-medium">
                            <CheckCircle2 className="h-3 w-3" />Connected
                          </span>
                        )}
                        {!isActive && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Circle className="h-3 w-3" />Not configured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{integration.description}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-5">
                  {/* Config fields */}
                  <div className="space-y-3 border-t pt-4">
                    {integration.fields.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <Label>{field.label}</Label>
                        <Input
                          type={field.type ?? "text"}
                          placeholder={field.placeholder}
                          value={config[field.key] ?? ""}
                          onChange={(e) => updateField(integration.id, field.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Setup steps */}
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

                  <div className="flex items-center gap-3">
                    <Button onClick={() => handleSave(integration)} disabled={saving === integration.id}>
                      {saving === integration.id ? "Saving..." : "Save Configuration"}
                    </Button>
                    {integration.docsUrl && (
                      <a
                        href={integration.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-brand-green hover:underline"
                      >
                        Open {integration.label} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
