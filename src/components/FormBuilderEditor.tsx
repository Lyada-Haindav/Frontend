import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Trash2, Plus, Sparkles } from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import { generateFieldSuggestions } from "@/api/ai-field-suggestions";
import { useToast } from "@/hooks/use-toast";

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  orderIndex: number;
}

interface FormBuilderEditorProps {
  fields: Field[];
  onChange: (fields: Field[]) => void;
}

const SortableField = ({ field, onUpdate, onDelete }: { field: Field; onUpdate: (updates: Partial<Field>) => void; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const [isExpanded, setIsExpanded] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "number", label: "Number" },
    { value: "tel", label: "Phone" },
    { value: "url", label: "URL" },
    { value: "textarea", label: "Textarea" },
    { value: "select", label: "Select" },
    { value: "radio", label: "Radio" },
    { value: "checkbox", label: "Checkbox" },
    { value: "date", label: "Date" },
  ];

  const needsOptions = ["select", "radio", "checkbox"].includes(field.type);

  return (
    <Card ref={setNodeRef} style={style} className="p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <button type="button" className="mt-2 cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Field Type</Label>
                <Select value={field.type} onValueChange={(value) => onUpdate({ type: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={field.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="Field label"
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? "Less" : "More"}
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label className="text-xs">Placeholder</Label>
                <Input
                  value={field.placeholder || ""}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  placeholder="Placeholder text"
                  className="h-9"
                />
              </div>

              {needsOptions && (
                <div>
                  <Label className="text-xs">Options (one per line)</Label>
                  <Textarea
                    value={(field.options || []).join("\n")}
                    onChange={(e) => onUpdate({ options: e.target.value.split("\n").filter(Boolean) })}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch checked={field.required} onCheckedChange={(checked) => onUpdate({ required: checked })} id={`required-${field.id}`} />
                <Label htmlFor={`required-${field.id}`} className="text-xs">
                  Required field
                </Label>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const FormBuilderEditor = ({ fields, onChange }: FormBuilderEditorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      const newFields = arrayMove(fields, oldIndex, newIndex).map((f, idx) => ({
        ...f,
        orderIndex: idx,
      }));
      onChange(newFields);
    }
  };

  const addField = () => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      orderIndex: fields.length,
    };
    onChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id).map((f, idx) => ({ ...f, orderIndex: idx })));
  };

  const handleVoiceInput = async (text: string) => {
    setIsGenerating(true);
    try {
      const data = await generateFieldSuggestions(text);

      if (data?.fields && Array.isArray(data.fields)) {
        const newFields = data.fields.map((f: any, idx: number) => ({
          id: `field-${Date.now()}-${idx}`,
          type: f.type || "text",
          label: f.label || f.name || "Field",
          placeholder: f.placeholder,
          required: f.required || false,
          options: f.options,
          orderIndex: fields.length + idx,
        }));
        onChange([...fields, ...newFields]);
        toast({ title: "Fields generated", description: `Added ${newFields.length} fields from your voice input` });
      }
    } catch (error: any) {
      toast({ 
        title: "AI generation failed", 
        description: error.message || "Please add fields manually.",
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" onClick={addField} className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
        <VoiceInput
          onTranscript={handleVoiceInput}
          className={isGenerating ? "animate-pulse" : ""}
        />
      </div>

      {fields.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No fields yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add fields manually or use voice input to generate them with AI
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={addField}>Add Field</Button>
            <VoiceInput onTranscript={handleVoiceInput} />
          </div>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((field) => (
              <SortableField
                key={field.id}
                field={field}
                onUpdate={(updates) => updateField(field.id, updates)}
                onDelete={() => deleteField(field.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};