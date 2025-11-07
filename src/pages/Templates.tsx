import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FormInput, Mail, ClipboardList, UserPlus, MessageSquare, Loader2 } from "lucide-react";
import { getTemplates } from "@/lib/queries";
import { createForm, createStep, createField } from "@/lib/queries";

// Icon mapping for templates
const iconMap: Record<string, any> = {
  Mail: Mail,
  ClipboardList: ClipboardList,
  UserPlus: UserPlus,
  MessageSquare: MessageSquare,
  FormInput: FormInput,
};

const Templates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data || []);
    } catch (error: any) {
      toast({ 
        title: "Error loading templates", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = async (template: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    try {
      // Parse the config to get form structure
      const config = typeof template.config === 'string' 
        ? JSON.parse(template.config) 
        : template.config;

      // Create form
      const formId = `form-${Date.now()}`;
      const form = await createForm({
        id: formId,
        userId: session.user.id,
        title: template.name,
        description: template.description,
        templateId: template.id,
      });

      // Create steps and fields from template config
      if (config.steps && Array.isArray(config.steps)) {
        for (let i = 0; i < config.steps.length; i++) {
          const step = config.steps[i];
          
          const stepId = `step-${Date.now()}-${i}`;
          const newStep = await createStep({
            id: stepId,
            formId: form.id,
            title: step.title || `Step ${i + 1}`,
            description: step.description || "",
            orderIndex: i,
          });

          // Create fields for this step
          if (step.fields && Array.isArray(step.fields)) {
            for (let idx = 0; idx < step.fields.length; idx++) {
              const field = step.fields[idx];
              
              await createField({
                id: `field-${Date.now()}-${i}-${idx}`,
                stepId: newStep.id,
                type: field.type || "text",
                label: field.label || "Field",
                placeholder: field.placeholder,
                required: field.required || false,
                options: field.options || null,
                orderIndex: idx,
              });
            }
          }
        }
      }

      toast({ title: "Template applied!", description: "Form created successfully" });
      navigate(`/builder/${form.id}`);
    } catch (error: any) {
      toast({ 
        title: "Error creating form", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <FormInput className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FormFlow AI
            </h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Form Templates</h2>
          <p className="text-muted-foreground mt-1">Start with a pre-built template</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="p-12 text-center">
            <FormInput className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No templates available</h3>
            <p className="text-muted-foreground mb-6">
              Templates will appear here once configured
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const IconComponent = iconMap[template.icon] || FormInput;
              return (
                <Card key={template.id} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    {template.category && (
                      <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {template.category}
                      </span>
                    )}
                  </div>
                  <Button onClick={() => useTemplate(template)} className="w-full">
                    Use Template
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;