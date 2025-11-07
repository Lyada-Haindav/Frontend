import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FormInput, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { getFormById, getStepsByFormId, getFieldsByStepId, createSubmission } from "@/lib/queries";
import { VoiceInput } from "@/components/VoiceInput";

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Step {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  fields: Field[];
}

const FormPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadForm();
    // Load saved responses for this form (helps prevent accidental clears)
    if (id) {
      try {
        const saved = localStorage.getItem(`formData:${id}`);
        if (saved) {
          setFormData(JSON.parse(saved));
        }
      } catch {}
    }
  }, [id]);

  // Persist responses as the user types/speaks
  useEffect(() => {
    if (!id) return;
    try {
      localStorage.setItem(`formData:${id}`, JSON.stringify(formData));
    } catch {}
  }, [id, formData]);

  const loadForm = async () => {
    try {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const formData = await getFormById(id);

      if (!formData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!formData.isPublished) {
        toast({ title: "Form not published", description: "This form is not available", variant: "destructive" });
        setNotFound(true);
        setLoading(false);
        return;
      }

      const stepsData = await getStepsByFormId(id!);

      // Load fields for each step
      const stepsWithFields = await Promise.all(
        (stepsData || []).map(async (step: any) => {
          const fields = await getFieldsByStepId(step.id);
          return { ...step, fields: fields || [] };
        })
      );

      setForm(formData);
      setSteps(stepsWithFields);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };
  const handleVoiceFill = (fieldId: string) => async (text: string) => {
    setFormData((prev) => {
      const current = prev[fieldId] || "";
      const next = current ? `${current} ${text}` : text;
      return { ...prev, [fieldId]: next };
    });
  };

  const validateCurrentStep = () => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return true;
    for (const field of currentStepData.fields) {
      const val = formData[field.id];
      if (!field.required) continue;
      if (field.type === "checkbox") {
        if (field.options && field.options.length > 0) {
          if (!Array.isArray(val) || val.length === 0) {
            toast({ title: "Required field", description: `${field.label} is required`, variant: "destructive" });
            return false;
          }
        } else {
          if (val !== true) {
            toast({ title: "Required field", description: `${field.label} is required`, variant: "destructive" });
            return false;
          }
        }
      } else if (!val) {
        toast({ title: "Required field", description: `${field.label} is required`, variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setSubmitting(true);
    try {
      const submissionData: Record<string, any> = {};
      steps.forEach((step) => {
        step.fields.forEach((field) => {
          submissionData[field.label] = formData[field.id] || "";
        });
      });

      await createSubmission({
        id: `submission-${Date.now()}`,
        formId: id!,
        data: submissionData,
      });

      setSubmitted(true);
      toast({ title: "Success", description: "Form submitted successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: Field) => {
    const value = formData[field.id] || "";
    const type = (field.type || '').toLowerCase();
    const opts = Array.isArray(field.options)
      ? field.options
      : typeof (field as any).options === 'string'
        ? String((field as any).options).split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    switch (type) {
      case "textarea":
        return (
          <div className="flex gap-2 items-start">
            <Textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="flex-1"
            />
            <VoiceInput onTranscript={handleVoiceFill(field.id)} />
          </div>
        );

      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <RadioGroup value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            {opts.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "boolean":
      case "bool":
      case "checkbox":
        if (!opts || opts.length === 0) {
          return (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`${field.id}-single`}
                className="h-5 w-5 border-2 rounded-md appearance-auto accent-purple-600 border-gray-400"
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              />
              <Label htmlFor={`${field.id}-single`}>{field.label}</Label>
            </div>
          );
        }
        return (
          <div className="space-y-2">
            {opts.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.id}-${idx}`}
                  className="h-5 w-5 border-2 rounded-md appearance-auto accent-purple-600 border-gray-400"
                  checked={(Array.isArray(value) ? value : []).includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleFieldChange(field.id, newValues);
                  }}
                />
                <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="flex gap-2">
            <Input
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="flex-1"
            />
            <VoiceInput onTranscript={handleVoiceFill(field.id)} />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-6">Your response has been recorded successfully.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Submit Another Response
          </Button>
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Form not found</h2>
          <p className="text-muted-foreground mb-6">The link might be invalid or the form is not published.</p>
          <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <FormInput className="w-6 h-6 text-white" />
            </div>
            <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg">
              FormFlow AI
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{form?.title}</h1>
            {form?.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </div>

          {steps.length > 1 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-sm font-medium">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {steps[currentStep] && (
            <div className="space-y-6 mb-8">
              {steps[currentStep].title && steps.length > 1 && (
                <div>
                  <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
                  {steps[currentStep].description && (
                    <p className="text-sm text-muted-foreground mt-1">{steps[currentStep].description}</p>
                  )}
                </div>
              )}

              {steps[currentStep].fields.map((field) => (
                <div key={field.id}>
                  {field.type !== "checkbox" && (
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  )}
                  <div className="mt-2">{renderField(field)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} className="ml-auto">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="ml-auto">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FormPreview;