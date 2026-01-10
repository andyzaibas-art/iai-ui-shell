import { useState } from "react";
import { toast } from "sonner";
import ConsentModal from "../components/ConsentModal";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

interface SavedEntry {
  id: string;
  title: string;
  body: string;
  tags: string;
  type: string;
  timestamp: string;
}

const STORAGE_KEY = "iai_saved_entries";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("other");
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in title and body fields");
      return;
    }
    setOpen(true);
  };

  const handleConfirmSave = () => {
    const newEntry: SavedEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      body: body.trim(),
      tags: tags.trim(),
      type: type || "other",
      timestamp: new Date().toISOString(),
    };

    let entries: SavedEntry[] = [];
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      try {
        entries = JSON.parse(existing);
        if (!Array.isArray(entries)) entries = [];
      } catch {
        entries = [];
      }
    }

    entries.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

    setOpen(false);
    toast.success("Content saved successfully!");

    setTitle("");
    setBody("");
    setTags("");
    setType("other");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Write</CardTitle>
            <CardDescription>
              Create and save new content. Data is stored locally in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your content here..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai, product, research..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-600"
              >
                <option value="article">Article</option>
                <option value="note">Note</option>
                <option value="research">Research</option>
                <option value="draft">Draft</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <ConsentModal
          open={open}
          onOpenChange={setOpen}
          onConfirm={handleConfirmSave}
        />
      </div>
    </div>
  );
}
