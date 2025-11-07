import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FormInput, Save, Eye, Sparkles, Plus, Trash2, Loader2, Wand2 } from "lucide-react";
import { FormBuilderEditor } from "@/components/FormBuilderEditor";
import { VoiceInput } from "@/components/VoiceInput";
import { Switch } from "@/components/ui/switch";
import { getFormById, getStepsByFormId, getFieldsByStepId, createForm, updateForm, createStep, createField, deleteStep } from "@/lib/queries";
import { generateForm } from "@/api/ai-generate-form";

interface Step {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  fields: Field[];
}

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  orderIndex: number;
}

interface FormData {
  id?: string;
  title: string;
  description: string;
  isPublished: boolean;
  steps: Step[];
}

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState("0");
  const [showAIPanel, setShowAIPanel] = useState(searchParams.get("ai") === "true");
  const [formData, setFormData] = useState<FormData>({
    title: "Untitled Form",
    description: "",
    isPublished: false,
    steps: [
      {
        id: `step-${Date.now()}`,
        title: "Step 1",
        description: "",
        orderIndex: 0,
        fields: [],
      },
    ],
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    if (id) {
      await loadForm(id);
    } else {
      setLoading(false);
    }
  };

  const loadForm = async (formId: string) => {
    try {
      const form = await getFormById(formId);
      const steps = await getStepsByFormId(formId);

      // Load fields for each step
      const stepsWithFields = await Promise.all(
        (steps || []).map(async (step: any) => {
          const fields = await getFieldsByStepId(step.id);
          return {
            ...step,
            fields: fields || [],
          };
        })
      );

      setFormData({
        id: form.id,
        title: form.title,
        description: form.description || "",
        isPublished: form.isPublished,
        steps: stepsWithFields.length > 0 ? stepsWithFields : [
          {
            id: `step-${Date.now()}`,
            title: "Step 1",
            description: "",
            orderIndex: 0,
            fields: [],
          },
        ],
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let formId = formData.id;

      if (!formId) {
        // Create new form
        formId = `form-${Date.now()}`;
        await createForm({
          id: formId,
          userId: session.user.id,
          title: formData.title,
          description: formData.description,
          isPublished: formData.isPublished,
        });
      } else {
        // Update existing form
        await updateForm(formId, {
          title: formData.title,
          description: formData.description,
          isPublished: formData.isPublished,
        });

        // Delete existing steps (cascade will delete fields)
        const existingSteps = await getStepsByFormId(formId);
        await Promise.all(
          existingSteps.map((step: any) => deleteStep(step.id))
        );
      }

      // Insert steps and fields
      for (const step of formData.steps) {
        const stepId = `step-${Date.now()}-${step.orderIndex}`;
        await createStep({
          id: stepId,
          formId: formId,
          title: step.title,
          description: step.description,
          orderIndex: step.orderIndex,
        });

        if (step.fields.length > 0) {
          for (const field of step.fields) {
            await createField({
              id: `field-${Date.now()}-${step.orderIndex}-${field.orderIndex}`,
              stepId: stepId,
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              required: field.required,
              options: field.options || null,
              orderIndex: field.orderIndex,
            });
          }
        }
      }

      toast({ title: "Success", description: "Form saved successfully" });
      if (!formData.id) {
        navigate(`/builder/${formId}`);
      }
      setFormData({ ...formData, id: formId });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async (prompt: string) => {
    setGenerating(true);
    try {
      const { formConfig } = await generateForm(prompt);

      if (formConfig) {
        const steps = (formConfig.steps || []).map((s: any, idx: number) => ({
          id: `step-${Date.now()}-${idx}`,
          title: s.title || `Step ${idx + 1}`,
          description: s.description || "",
          orderIndex: idx,
          fields: (s.fields || []).map((f: any, fIdx: number) => ({
            id: `field-${Date.now()}-${idx}-${fIdx}`,
            type: f.type || "text",
            label: f.label || f.name || "Field",
            placeholder: f.placeholder,
            required: f.required || false,
            options: f.options,
            orderIndex: fIdx,
          })),
        }));

        setFormData({
          ...formData,
          title: formConfig.title || formData.title,
          description: formConfig.description || formData.description,
          steps: steps.length > 0 ? steps : formData.steps,
        });

        toast({ title: "✨ AI Generated!", description: "Form structure created successfully" });
      }
    } catch (error: any) {
      toast({ 
        title: "AI Error", 
        description: error.message || "Failed to generate form. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  };

  const addStep = () => {
    const newStep: Step = {
      id: `step-${Date.now()}`,
      title: `Step ${formData.steps.length + 1}`,
      description: "",
      orderIndex: formData.steps.length,
      fields: [],
    };
    setFormData({ ...formData, steps: [...formData.steps, newStep] });
    setActiveStep(String(formData.steps.length));
  };

  const updateStep = (stepIndex: number, updates: Partial<Step>) => {
    const newSteps = [...formData.steps];
    newSteps[stepIndex] = { ...newSteps[stepIndex], ...updates };
    setFormData({ ...formData, steps: newSteps });
  };

  const handleDeleteStep = (stepIndex: number) => {
    if (formData.steps.length === 1) {
      toast({ title: "Cannot delete", description: "Form must have at least one step", variant: "destructive" });
      return;
    }
    const newSteps = formData.steps
      .filter((_, idx) => idx !== stepIndex)
      .map((s, idx) => ({ ...s, orderIndex: idx }));
    setFormData({ ...formData, steps: newSteps });
    setActiveStep("0");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-blue-950">
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <FormInput className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="inline-flex px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white font-semibold">
                Form Builder
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.id ? "Editing" : "Creating"} • {formData.steps.reduce((acc, s) => acc + s.fields.length, 0)} fields
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="shadow-sm hover:shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
            {formData.id && (
              <Button variant="outline" onClick={() => navigate(`/preview/${formData.id}`)} className="shadow-sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="shadow-md bg-gradient-to-r from-purple-600 to-blue-600">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="shadow-sm">
              Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className={`grid gap-6 ${showAIPanel ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          <div className={showAIPanel ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="space-y-6">
              <Card className="p-6 shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">Form Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter form title"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of your form"
                      rows={2}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <Switch
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                      id="published"
                    />
                    <Label htmlFor="published" className="font-semibold">Publish form (make it public)</Label>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Form Steps</h3>
                  <Button onClick={addStep} size="sm" className="shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                <Tabs value={activeStep} onValueChange={setActiveStep}>
                  <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-purple-100 dark:bg-purple-900/30">
                    {formData.steps.map((step, idx) => (
                      <TabsTrigger key={step.id} value={String(idx)} className="flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                        {step.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {formData.steps.map((step, idx) => (
                    <TabsContent key={step.id} value={String(idx)} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-semibold">Step Title</Label>
                          <Input
                            value={step.title}
                            onChange={(e) => updateStep(idx, { title: e.target.value })}
                            placeholder="Step title"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStep(idx)}
                            disabled={formData.steps.length === 1}
                            className="w-full shadow-md"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Step
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Step Description (optional)</Label>
                        <Textarea
                          value={step.description || ""}
                          onChange={(e) => updateStep(idx, { description: e.target.value })}
                          placeholder="Describe this step"
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-3">Fields</h4>
                        <FormBuilderEditor
                          fields={step.fields}
                          onChange={(fields) => updateStep(idx, { fields })}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            {showAIPanel && (
              <Card className="p-6 shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">AI Assistant</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe your form and let AI generate the structure for you
                </p>
                <div className="space-y-3">
                  <Textarea
                    placeholder="E.g., Create a customer feedback form with rating, comments, and contact details"
                    rows={4}
                    id="ai-prompt"
                    className="bg-white dark:bg-gray-900"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all"
                      onClick={() => {
                        const prompt = (document.getElementById("ai-prompt") as HTMLTextAreaElement)?.value;
                        if (prompt) handleAIGenerate(prompt);
                      }}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                    <VoiceInput
                      onTranscript={(text) => {
                        (document.getElementById("ai-prompt") as HTMLTextAreaElement).value = text;
                        handleAIGenerate(text);
                      }}
                    />
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Form Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-sm font-medium">Total Steps:</span>
                  <span className="font-bold text-purple-600">{formData.steps.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm font-medium">Total Fields:</span>
                  <span className="font-bold text-blue-600">
                    {formData.steps.reduce((acc, s) => acc + s.fields.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <span className="text-sm font-medium">Required Fields:</span>
                  <span className="font-bold text-pink-600">
                    {formData.steps.reduce((acc, s) => acc + s.fields.filter(f => f.required).length, 0)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`font-bold ${formData.isPublished ? "text-green-600" : "text-gray-600"}`}>
                    {formData.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;