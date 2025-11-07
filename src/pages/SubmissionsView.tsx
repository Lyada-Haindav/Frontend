import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FormInput, Download, Loader2, FileSpreadsheet, Trash2 } from "lucide-react";
import { getFormById, getSubmissionsByFormId } from "@/lib/queries";
import { db } from "@/lib/db-client";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";

const SubmissionsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    loadSubmissions();
  };

  const loadSubmissions = async () => {
    try {
      const formData = await getFormById(id!);
      const submissionsData = await getSubmissionsByFormId(id!);

      setForm(formData);
      setSubmissionsList(submissionsData || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    try {
      await db.delete(submissions).where(eq(submissions.id, submissionId));
      setSubmissionsList(submissionsList.filter(s => s.id !== submissionId));
      toast({ title: "Deleted", description: "Submission deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    if (submissionsList.length === 0) {
      toast({ title: "No data", description: "No submissions to export", variant: "destructive" });
      return;
    }

    const allKeys = new Set<string>();
    submissionsList.forEach(sub => {
      Object.keys(sub.data || {}).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    const csvHeaders = ["Submission Date", ...headers].join(",");

    const csvRows = submissionsList.map(sub => {
      const date = new Date(sub.submittedAt).toLocaleString();
      const values = headers.map(header => {
        const value = sub.data?.[header] || "";
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      return [date, ...values].join(",");
    });

    const csv = [csvHeaders, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form?.title || "form"}-submissions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "CSV file downloaded successfully" });
  };

  const exportToJSON = () => {
    if (submissionsList.length === 0) {
      toast({ title: "No data", description: "No submissions to export", variant: "destructive" });
      return;
    }

    const exportData = submissionsList.map(sub => ({
      id: sub.id,
      submitted_at: sub.submittedAt,
      data: sub.data,
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form?.title || "form"}-submissions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "JSON file downloaded successfully" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const allFields = new Set<string>();
  submissionsList.forEach(sub => {
    Object.keys(sub.data || {}).forEach(key => allFields.add(key));
  });
  const fields = Array.from(allFields);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <FormInput className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Submissions
              </h1>
              <p className="text-xs text-muted-foreground">{form?.title}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Form Submissions</h2>
            <p className="text-muted-foreground mt-1">
              {submissionsList.length} {submissionsList.length === 1 ? "response" : "responses"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} disabled={submissionsList.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportToJSON} disabled={submissionsList.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {submissionsList.length === 0 ? (
          <Card className="p-12 text-center">
            <FormInput className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">
              Share your form to start collecting responses
            </p>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Submitted At</TableHead>
                  {fields.map((field) => (
                    <TableHead key={field}>{field}</TableHead>
                  ))}
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionsList.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </TableCell>
                    {fields.map((field) => (
                      <TableCell key={field}>
                        {Array.isArray(submission.data?.[field])
                          ? submission.data[field].join(", ")
                          : String(submission.data?.[field] || "-")}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSubmission(submission.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubmissionsView;