"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, CheckSquare, Square, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  contact: { firstName: string; lastName: string | null } | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  medium: "bg-brand-navy/5 text-brand-navy",
  high: "bg-red-100 text-red-600",
};

const EMPTY_FORM = { title: "", description: "", dueDate: "", priority: "medium", status: "todo" };

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = filterStatus === "open" ? "status=todo&status=in_progress" : filterStatus === "done" ? "status=done" : "";
    const res = await fetch(`/api/crm/tasks?${params}`);
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function toggleDone(task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done";
    await fetch(`/api/crm/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/crm/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        dueDate: form.dueDate || null,
        priority: form.priority,
        status: form.status,
      }),
    });
    setShowForm(false);
    setForm(EMPTY_FORM);
    fetchTasks();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/crm/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Tasks</h1>
          {overdueTasks.length > 0 && (
            <p className="text-sm text-red-500 mt-0.5">{overdueTasks.length} overdue</p>
          )}
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Task
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { id: "open", label: "Open" },
          { id: "done", label: "Done" },
          { id: "", label: "All" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === f.id ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
            return (
              <Card key={task.id} className={`hover:shadow-sm transition-shadow ${task.status === "done" ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleDone(task)} className="mt-0.5 flex-shrink-0">
                      {task.status === "done"
                        ? <CheckSquare className="h-5 w-5 text-brand-green" />
                        : <Square className="h-5 w-5 text-gray-300 hover:text-brand-green transition-colors" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${task.status === "done" ? "line-through text-gray-400" : "text-brand-navy"}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {task.dueDate && (
                          <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString("en-ZA")}
                            {isOverdue && " · Overdue"}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_STYLES[task.priority] ?? "bg-gray-100 text-gray-500"}`}>
                          {task.priority}
                        </span>
                        {task.contact && (
                          <span className="text-xs text-gray-400">
                            {task.contact.firstName} {task.contact.lastName ?? ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckSquare className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">No tasks</h3>
            <p className="text-sm text-gray-400 mb-5">Stay organised by adding tasks and follow-ups</p>
            <Button onClick={() => setShowForm(true)}>Add Task</Button>
          </CardContent>
        </Card>
      )}

      {/* Add task slide-over */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-brand-navy text-lg">New Task</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 p-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Task Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Follow up with client" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="More details..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <Button className="flex-1" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? "Saving..." : "Add Task"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
