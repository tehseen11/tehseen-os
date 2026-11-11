"use client";

import React, { useState } from "react";
import {
  StickyNote,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Search,
  Tag,
  X,
  Sparkles,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { QuickNote } from "@/types";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface NotesViewProps {
  onOpenQuickAdd: (tab?: "note") => void;
}

export function NotesView({ onOpenQuickAdd }: NotesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [editingNote, setEditingNote] = useState<QuickNote | null>(null);

  const notes = useLiveQuery(
    async () => {
      return await db.notes.toArray();
    },
    [],
    []
  );

  // Extract unique categories
  const categories = Array.from(new Set(notes.map((n) => n.category))).filter(Boolean);

  const filteredNotes = notes.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedCategory !== "All" && n.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Sort pinned first, then by updatedAt
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  // Toggle pin
  const handleTogglePin = async (note: QuickNote) => {
    if (!note.id) return;
    await db.notes.update(note.id, {
      pinned: !note.pinned,
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete note
  const handleDeleteNote = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this note?")) {
      await db.notes.delete(id);
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.id) return;
    await db.notes.put({
      ...editingNote,
      updatedAt: new Date().toISOString(),
    });
    setEditingNote(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-brand-500" />
            <span>Quick Notes & Personal Workspace</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Capture snippets, commands, concepts, and scratchpad ideas instantaneously
          </p>
        </div>

        <button
          onClick={() => onOpenQuickAdd("note")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-card border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("All")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
              selectedCategory === "All"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground bg-card border border-border"
            )}
          >
            All Notes
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                selectedCategory === c
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-card border border-border"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedNotes.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-card border border-dashed border-border text-xs text-muted-foreground">
            No notes found matching your criteria.
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "p-5 rounded-3xl border transition-all relative flex flex-col justify-between bg-card group",
                note.pinned
                  ? "border-brand-500/50 shadow-sm bg-gradient-to-br from-card to-brand-500/5"
                  : "border-border hover:border-brand-500/30"
              )}
            >
              <div>
                {/* Note Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                    {note.category}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        note.pinned
                          ? "text-brand-500"
                          : "text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
                      )}
                      title={note.pinned ? "Unpin note" : "Pin note to top"}
                    >
                      {note.pinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditingNote(note)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded-md text-muted-foreground hover:text-rose-500 opacity-60 group-hover:opacity-100"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-foreground mb-2">{note.title}</h3>

                <p className="text-xs text-muted-foreground/90 whitespace-pre-wrap font-mono leading-relaxed line-clamp-6">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 mt-4 text-[10px] text-muted-foreground font-mono">
                Updated {format(parseISO(note.updatedAt), "MMM d, yyyy")}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingNote(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-5 shadow-2xl z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-bold text-base text-foreground">Edit Note</h3>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingNote.category}
                  onChange={(e) => setEditingNote({ ...editingNote, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Content
                </label>
                <textarea
                  rows={6}
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs font-mono resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={editingNote.pinned}
                    onChange={(e) => setEditingNote({ ...editingNote, pinned: e.target.checked })}
                    className="rounded border-border text-brand-500"
                  />
                  <span>Pin to top</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNote(null)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
