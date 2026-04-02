import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { listAllStoredFiles } from "@/lib/file-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FolderOpen, ImageIcon, FileText } from "lucide-react";

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default async function AdminFilesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const files = await listAllStoredFiles();
  const userIds = [...new Set(files.map((file) => file.userId))];

  const profiles = userIds.length > 0
    ? await prisma.profile.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, companyName: true, phone: true },
    })
    : [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Client Files</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Logos, photos, and documents uploaded by clients for project design work.
        </p>
      </div>

      {files.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy">
              {files.length} uploaded file{files.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file) => {
              const profile = profileMap.get(file.userId);
              const clientName = profile?.companyName || profile?.fullName || file.userId.slice(0, 8);
              const isImage = file.type.startsWith("image/");
              return (
                <div key={file.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isImage ? (
                          <ImageIcon className="h-4 w-4 text-brand-green" />
                        ) : (
                          <FileText className="h-4 w-4 text-brand-navy" />
                        )}
                        <p className="text-sm font-semibold text-brand-navy truncate">{file.originalName}</p>
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {file.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Client: {clientName}
                        {profile?.phone ? ` · ${profile.phone}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatBytes(file.size)} · Uploaded {new Date(file.uploadedAt).toLocaleString("en-ZA")}
                      </p>
                    </div>
                    <a
                      href={`/api/files/${file.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-navy hover:text-brand-green"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">No uploads yet</h3>
            <p className="text-sm text-gray-400">Client-uploaded logos and files will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
