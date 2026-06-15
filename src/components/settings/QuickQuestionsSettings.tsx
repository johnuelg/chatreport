import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Save, Eye, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  abbreviation: string | null;
}

interface QuickQuestion {
  id: string;
  question: string;
  display_order: number;
  is_active: boolean;
  domain_id: string | null;
}

interface SortableQuestionItemProps {
  question: QuickQuestion;
  domain?: Domain;
  onUpdate: (id: string, field: keyof QuickQuestion, value: string | boolean | number | null) => void;
  onDelete: (id: string) => void;
}

function SortableQuestionItem({ question, domain, onUpdate, onDelete }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-muted/50 rounded-lg ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1 flex items-center gap-2">
        <Input
          value={question.question}
          onChange={(e) => onUpdate(question.id, "question", e.target.value)}
          className="flex-1"
        />
        {domain && (
          <Badge 
            variant="outline" 
            className="shrink-0 text-xs"
            style={{ 
              borderColor: domain.color || undefined,
              color: domain.color || undefined,
            }}
          >
            {domain.abbreviation || domain.name}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={question.is_active}
          onCheckedChange={(checked) => onUpdate(question.id, "is_active", checked)}
        />
        <Label className="text-xs text-muted-foreground">Active</Label>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(question.id)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function QuickQuestionsSettings() {
  const [questions, setQuestions] = useState<QuickQuestion[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedDomainId]);

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from("domains")
        .select("id, name, slug, color, abbreviation")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setDomains(data || []);
      
      // Select first domain by default if available
      if (data && data.length > 0 && selectedDomainId === null) {
        setSelectedDomainId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast.error("Failed to load domains");
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("quick_questions")
        .select("*")
        .order("display_order", { ascending: true });
      
      // Filter by selected domain
      if (selectedDomainId === "global") {
        query = query.is("domain_id", null);
      } else if (selectedDomainId) {
        query = query.eq("domain_id", selectedDomainId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      const maxOrder = Math.max(...questions.map((q) => q.display_order), 0);
      const { data, error } = await supabase
        .from("quick_questions")
        .insert({
          question: newQuestion.trim(),
          display_order: maxOrder + 1,
          domain_id: selectedDomainId === "global" ? null : selectedDomainId,
        })
        .select()
        .single();

      if (error) throw error;
      setQuestions([...questions, data]);
      setNewQuestion("");
      toast.success("Question added");
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Failed to add question");
    }
  };

  const updateQuestion = (id: string, field: keyof QuickQuestion, value: string | boolean | number | null) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase.from("quick_questions").delete().eq("id", id);
      if (error) throw error;
      setQuestions(questions.filter((q) => q.id !== id));
      toast.success("Question deleted");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update display_order for all items
        return newItems.map((item, index) => ({
          ...item,
          display_order: index + 1,
        }));
      });
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      for (const question of questions) {
        const { error } = await supabase
          .from("quick_questions")
          .update({
            question: question.question,
            display_order: question.display_order,
            is_active: question.is_active,
          })
          .eq("id", question.id);

        if (error) throw error;
      }
      toast.success("Changes saved");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const getSelectedDomain = () => {
    if (selectedDomainId === "global") return null;
    return domains.find(d => d.id === selectedDomainId);
  };

  const getQuestionDomain = (domainId: string | null) => {
    if (!domainId) return undefined;
    return domains.find(d => d.id === domainId);
  };

  if (loading && domains.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedDomain = getSelectedDomain();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Questions</CardTitle>
        <CardDescription>
          Customize the default quick questions shown in the chat interface. Questions can be organized by domain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain Selector */}
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <Label className="text-sm font-medium">Select Domain</Label>
            <p className="text-xs text-muted-foreground">Manage quick questions for a specific domain</p>
          </div>
          <Select
            value={selectedDomainId || "global"}
            onValueChange={(value) => setSelectedDomainId(value === "global" ? "global" : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Global (All Domains)
                </span>
              </SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  <span className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: domain.color || '#6366f1' }}
                    />
                    {domain.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current domain indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Managing questions for:</span>
          {selectedDomainId === "global" ? (
            <Badge variant="secondary">Global (visible to all)</Badge>
          ) : selectedDomain ? (
            <Badge 
              style={{ 
                backgroundColor: selectedDomain.color || '#6366f1',
                color: 'white',
              }}
            >
              {selectedDomain.name}
            </Badge>
          ) : (
            <Badge variant="secondary">No domain selected</Badge>
          )}
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No questions for this domain yet.</p>
                  <p className="text-sm">Add your first question below.</p>
                </div>
              ) : (
                questions.map((question) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    domain={getQuestionDomain(question.domain_id)}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                  />
                ))
              )}
            </SortableContext>
          </DndContext>
        )}

        {/* Add new question */}
        <div className="flex gap-2 pt-2">
          <Input
            placeholder={`Add a new question for ${selectedDomainId === "global" ? "all domains" : selectedDomain?.name || "this domain"}...`}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuestion()}
          />
          <Button onClick={addQuestion} disabled={!newQuestion.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Preview */}
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen} className="pt-4 border-t">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4" />
                Preview
              </div>
              <span className="text-xs text-muted-foreground">
                {previewOpen ? "Hide" : "Show"}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="bg-background border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-3">
                This is how questions will appear in the chat for{" "}
                {selectedDomainId === "global" ? "all domains" : selectedDomain?.name || "this domain"}:
              </p>
              <div className="flex flex-wrap gap-2">
                {questions
                  .filter((q) => q.is_active)
                  .map((q) => (
                    <button
                      key={q.id}
                      className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors cursor-default"
                    >
                      {q.question}
                    </button>
                  ))}
              </div>
              {questions.filter((q) => q.is_active).length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No active questions to display
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-end pt-4">
          <Button onClick={saveChanges} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
