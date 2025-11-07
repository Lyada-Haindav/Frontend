import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, LogOut, FileText, Eye, Download, Trash2, FormInput, Share2, Copy, QrCode, Sparkles, Wand2, Zap, Bot, Brain, Stars } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { getFormsByUserIdWithCounts, deleteForm, updateForm } from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState("forms");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    loadForms(session.user.id);
  };

  const loadForms = useCallback(async (userId: string) => {
    try {
      // Fast single-query load with submission counts
      const data = await getFormsByUserIdWithCounts(userId);
      setForms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Memoize computed values for better performance
  const publishedForms = useMemo(() => forms.filter(f => f.isPublished), [forms]);
  const totalSubmissions = useMemo(() => forms.reduce((acc, f) => acc + (f.submission_count || 0), 0), [forms]);
  const draftForms = useMemo(() => forms.filter(f => !f.isPublished), [forms]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/");
  }, [navigate]);

  const handleDeleteForm = useCallback(async (id: string) => {
    try {
      await deleteForm(id);
      setForms(prev => prev.filter(f => f.id !== id));
      toast({ title: "Form deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const togglePublish = useCallback(async (form: any) => {
    try {
      await updateForm(form.id, { isPublished: !form.isPublished });
      setForms(prev => prev.map(f => f.id === form.id ? { ...f, isPublished: !f.isPublished } : f));
      toast({
        title: form.isPublished ? "Form unpublished" : "Form published",
        description: form.isPublished ? "Form is now private" : "Form is now public",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const getFormUrl = useCallback((formId: string) => {
    const base = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
    return `${base}/preview/${formId}`;
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Link copied to clipboard" });
  }, [toast]);

  const openShareDialog = useCallback((form: any) => {
    setSelectedForm(form);
    setShareDialogOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-blue-950">
      <nav className="border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 flex items-center justify-center shadow-xl transform hover:scale-110 transition-all duration-300 hover:rotate-3">
              <FormInput className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
              FormFlow AI
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/scan")} className="hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-300 hover:scale-105">
              <QrCode className="w-4 h-4 mr-2" />
              Scan
            </Button>
            <Button variant="ghost" onClick={() => navigate("/templates")} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-300 hover:scale-105">
              Templates
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-300 hover:scale-105">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg">
            <TabsTrigger value="forms" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300">
              <FileText className="w-4 h-4 mr-2" />
              My Forms
            </TabsTrigger>
            <TabsTrigger value="ai-build" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Build
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forms" className="mt-0">
            {/* Quick Actions Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 text-white border-0 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] hover:-rotate-1 cursor-pointer group" onClick={() => navigate("/builder")}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                      Create New Form
                    </h3>
                    <p className="text-purple-100">Build a custom form from scratch with drag-and-drop editor</p>
                  </div>
                  <Wand2 className="w-12 h-12 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-[1.02] hover:rotate-1 cursor-pointer group" onClick={() => setActiveTab("ai-build")}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                      AI Form Builder
                    </h3>
                    <p className="text-indigo-100">Let AI generate your form structure from a description</p>
                  </div>
                  <Sparkles className="w-12 h-12 opacity-50 group-hover:scale-110 transition-transform" />
                </div>
              </Card>
            </div>

            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">My Forms</h2>
                <p className="text-muted-foreground mt-2 text-lg">Manage and organize your forms</p>
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : forms.length === 0 ? (
              <Card className="p-12 text-center shadow-xl border-2 border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-500 transition-colors">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <FileText className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No forms yet</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Get started by creating your first form
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate("/builder")} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Form
                  </Button>
                  <Button onClick={() => setActiveTab("ai-build")} size="lg" variant="outline" className="shadow-lg hover:shadow-xl transition-all">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Build
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                  <Card key={form.id} className="p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 border-0 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600 transition-all">{form.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{form.description}</p>
                      </div>
                      {form.isPublished && (
                        <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs rounded-full whitespace-nowrap ml-2 shadow-md animate-pulse">
                          Live
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3">
                      <span className="flex items-center gap-1 font-medium">
                        <FileText className="h-4 w-4 text-purple-600" />
                        {form.submission_count}
                      </span>
                      <span>•</span>
                      <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/builder/${form.id}`)} className="hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all hover:scale-105">
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublish(form)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all hover:scale-105"
                      >
                        {form.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/preview/${form.id}`)}
                        disabled={!form.isPublished}
                        className="hover:bg-green-50 dark:hover:bg-green-900/30 transition-all hover:scale-105"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openShareDialog(form)}
                        disabled={!form.isPublished}
                        className="hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all hover:scale-105"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/submissions/${form.id}`)} className="hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all hover:scale-105">
                        <Download className="w-4 h-4 mr-1" />
                        Data
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteForm(form.id)} className="hover:bg-red-50 dark:hover:bg-red-900/30 transition-all hover:scale-105">
                        <Trash2 className="w-4 h-4 mr-1 text-red-600" />
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-build" className="mt-0">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  AI-Powered Form Builder
                </h2>
                <p className="text-muted-foreground text-lg">
                  Harness the power of artificial intelligence to create professional forms instantly
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Smart Generation</h3>
                  <p className="text-sm text-muted-foreground">AI analyzes your description and creates the perfect form structure</p>
                </Card>

                <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">Generate complete forms in seconds instead of hours</p>
                </Card>

                <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Stars className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Professional Results</h3>
                  <p className="text-sm text-muted-foreground">AI ensures best practices and optimal user experience</p>
                </Card>
              </div>

              <Card className="p-8 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 text-white shadow-2xl border-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Start Building with AI</h3>
                    <p className="text-indigo-100">Describe your form and watch AI bring it to life</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Example Prompts:
                  </h4>
                  <ul className="space-y-2 text-indigo-100">
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-1">•</span>
                      <span>"Create a customer feedback form with rating scales and comment boxes"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-1">•</span>
                      <span>"Build an event registration form with attendee details and meal preferences"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-1">•</span>
                      <span>"Design a job application form with resume upload and experience questions"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-1">•</span>
                      <span>"Generate a contact form with name, email, subject, and message fields"</span>
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={() => navigate("/builder?ai=true")} 
                  size="lg" 
                  className="w-full bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg py-6"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Form with AI
                  <Zap className="w-5 h-5 ml-2" />
                </Button>
              </Card>

              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-lg">Field Suggestions</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Get AI-powered field suggestions while building your form</p>
                </Card>

                <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-lg">Auto-Formatting</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">AI automatically formats and organizes your form fields</p>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Share Form</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm mb-2 block font-semibold">Form Link</Label>
                <div className="flex gap-2">
                  <Input value={getFormUrl(selectedForm.id)} readOnly className="flex-1 bg-purple-50 dark:bg-purple-900/20" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getFormUrl(selectedForm.id))}
                    className="hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all hover:scale-110"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 pt-4 border-t">
                <Label className="text-sm font-semibold">QR Code</Label>
                <div className="p-4 bg-white rounded-lg shadow-lg" ref={qrRef}>
                  <QRCodeSVG value={getFormUrl(selectedForm.id)} size={200} />
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => window.open(getFormUrl(selectedForm.id), "_blank")}
                    className="w-full shadow-md hover:shadow-lg transition-all"
                  >
                    Open Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const root = qrRef.current;
                      if (!root) return;
                      const svg = root.querySelector("svg");
                      if (svg) {
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        const img = new Image();
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          canvas.toBlob((blob) => {
                            if (blob) {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${selectedForm.title}-qr-code.png`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          });
                        };
                        img.src = "data:image/svg+xml;base64," + btoa(svgData);
                        toast({ title: "Downloaded", description: "QR code saved" });
                      }
                    }}
                    className="w-full shadow-md hover:shadow-lg transition-all"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;