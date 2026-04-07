"use client";

import { type ChangeEvent, type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Upload, File, ImageIcon, FileText, Trash2, Download, FolderOpen, Palette, FileCheck2, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileItem {
  id: string;
  userId: string;
  originalName: string;
  type: string;
  size: number;
  category: "image" | "document" | "brand" | "other";
  uploadedAt: string;
}

const FILE_CATS = [
  { id: "all", label: "All Files" },
  { id: "image", label: "Images" },
  { id: "document", label: "Documents" },
  { id: "brand", label: "Brand Assets" },
  { id: "other", label: "Other" },
];
const MAX_CLIENT_FILE_SIZE = 3 * 1024 * 1024;

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image")) return <ImageIcon className="h-5 w-5 text-brand-green" />;
  if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
}

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

export default function FilesPage() {
  const { isLoaded, userId } = useAuth();
  const isAuthenticated = Boolean(userId);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredFiles = useMemo(() => {
    if (tab === "all") return files;
    return files.filter((file) => file.category === tab);
  }, [files, tab]);

  const loadFiles = useCallback(async () => {
    if (!isAuthenticated) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/files", { cache: "no-store" });
      if (res.status === 401) { setFiles([]); return; }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to load files");
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isLoaded) return;
    void loadFiles();
  }, [isLoaded, loadFiles]);

  function openPicker() {
    inputRef.current?.click();
  }

  async function uploadFiles(list: FileList | File[]) {
    if (!isAuthenticated) {
      setError("Sign in to upload files.");
      return;
    }
    const incoming = Array.from(list).filter(Boolean);
    if (incoming.length === 0) return;

    const oversized = incoming.filter((file) => file.size > MAX_CLIENT_FILE_SIZE);
    const allowed = incoming.filter((file) => file.size <= MAX_CLIENT_FILE_SIZE);
    if (oversized.length > 0) {
      const sample = oversized.slice(0, 2).map((file) => file.name).join(", ");
      setError(`Some files exceed the 3MB limit: ${sample}. Try compressing images before uploading.`);
    }
    if (allowed.length === 0) return;

    setUploading(true);
    if (oversized.length === 0) setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      allowed.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      const uploaded = Array.isArray(data?.uploaded) ? (data.uploaded as FileItem[]) : [];
      const rejected = Array.isArray(data?.rejected) ? data.rejected as { name: string; reason: string }[] : [];

      if (uploaded.length > 0) {
        setFiles((prev) => {
          const existing = new Set(prev.map((file) => file.id));
          const fresh = uploaded.filter((file) => !existing.has(file.id));
          return [...fresh, ...prev];
        });
        setSuccess(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded and shared with admin.`);
      }

      if (rejected.length > 0) {
        const details = rejected.slice(0, 2).map((item) => `${item.name} (${item.reason})`).join(", ");
        setError(`Some files were skipped: ${details}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeFile(id: string) {
    if (!isAuthenticated) return;
    setDeleteId(id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/files?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete file");
      }
      setFiles((prev) => prev.filter((file) => file.id !== id));
      setSuccess("File removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setDeleteId(null);
    }
  }

  async function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;
    await uploadFiles(event.target.files);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    await uploadFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Files & Assets</h1>
          <p className="text-sm text-gray-400 mt-0.5">Upload design files, brand assets, API credentials and more</p>
        </div>
        <Button onClick={openPicker} disabled={uploading || !isAuthenticated}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? "Uploading..." : "Upload Files"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
        accept="image/*,.pdf,.txt,.doc,.docx,.rtf,.zip,.svg"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-brand-green/20 bg-brand-green/10 px-4 py-3 text-sm text-brand-navy">{success}</div>
      )}

      {/* Upload zone */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={openPicker}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          dragging ? "border-brand-green bg-brand-green/5" : "border-gray-200 hover:border-brand-green/40 hover:bg-gray-50"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-10 w-10 mx-auto mb-3 text-brand-green animate-spin" />
        ) : (
          <Upload className={`h-10 w-10 mx-auto mb-3 ${dragging ? "text-brand-green" : "text-gray-300"}`} />
        )}
        <p className="font-semibold text-brand-navy">Drag & drop files here</p>
        <p className="text-sm text-gray-400 mt-1">or click to browse · Max 3MB per file · Sent to admin automatically</p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {["Logo files", "Brand guidelines", "Photos", "Documents", "API keys"].map((cat) => (
            <span key={cat} className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-500">{cat}</span>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {FILE_CATS.map((c) => (
          <button key={c.id} onClick={() => setTab(c.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === c.id ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Files */}
      {loading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-3 text-gray-300 animate-spin" />
            <p className="text-sm text-gray-400">Loading files...</p>
          </CardContent>
        </Card>
      ) : !isAuthenticated ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">Sign in required</h3>
            <p className="text-sm text-gray-400">Sign in to view your files.</p>
          </CardContent>
        </Card>
      ) : filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <FileIcon type={f.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brand-navy truncate">{f.originalName}</div>
                    <div className="text-xs text-gray-400">
                      {formatBytes(f.size)} · {new Date(f.uploadedAt).toLocaleDateString("en-ZA")}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <a
                      href={`/api/files/${f.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-green hover:bg-gray-100 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => void removeFile(f.id)}
                      disabled={deleteId === f.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                      title="Delete"
                    >
                      {deleteId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">No files yet</h3>
            <p className="text-sm text-gray-400 mb-5">
              {tab === "all"
                ? "Upload your logo, brand assets, or project documents"
                : `No files found in ${FILE_CATS.find((c) => c.id === tab)?.label ?? "this"} category`}
            </p>
            <Button variant="outline" onClick={openPicker}>
              <Upload className="h-4 w-4 mr-2" />Upload Your First File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Palette className="h-5 w-5 text-brand-navy" />, title: "Brand Assets", desc: "Upload logos, colour palettes, and brand guidelines for your team" },
          { icon: <FileCheck2 className="h-5 w-5 text-brand-navy" />, title: "Documents", desc: "Store contracts, briefs, scope documents, and credentials securely" },
          { icon: <ShieldCheck className="h-5 w-5 text-brand-navy" />, title: "API Credentials", desc: "Safely share integration credentials and access keys with our team" },
        ].map((tip) => (
          <div key={tip.title} className="bg-gray-50 rounded-xl p-4">
            <div className="mb-2">{tip.icon}</div>
            <div className="font-semibold text-brand-navy text-sm">{tip.title}</div>
            <div className="text-xs text-gray-400 mt-1 leading-relaxed">{tip.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
