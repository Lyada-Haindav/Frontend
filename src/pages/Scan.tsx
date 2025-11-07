import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FormInput, QrCode, ArrowLeft } from "lucide-react";

const Scan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [manualUrl, setManualUrl] = useState("");
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);

  const handleDetected = useCallback((raw: string) => {
    const result = (raw || "").trim();
    try {
      const url = new URL(result);
      // Public access: allow any http(s) host
      if (url.protocol === "http:" || url.protocol === "https:") {
        window.location.href = url.toString();
        return;
      }
      toast({ title: "Invalid QR", description: "Unsupported URL protocol", variant: "destructive" });
    } catch (_e) {
      // If it's not a URL, attempt to treat it as a path or form id
      if (result.startsWith("/preview/")) {
        window.location.href = result;
        return;
      }
      if (/^preview\//.test(result)) {
        window.location.href = `/${result}`;
        return;
      }
      toast({ title: "Invalid QR", description: "Could not recognize a valid form URL", variant: "destructive" });
    }
  }, [toast]);

  const handleError = useCallback((_err: unknown) => {
    setCameraAllowed(false);
  }, []);

  const handlePermission = useCallback((status: boolean) => {
    setCameraAllowed(status);
  }, []);

  const openManual = () => {
    if (!manualUrl) return;
    try {
      const url = new URL(manualUrl);
      window.location.href = url.toString();
    } catch (_e) {
      // Try as relative path
      if (manualUrl.startsWith("/preview/")) {
        window.location.href = manualUrl;
      } else {
        toast({ title: "Invalid URL", description: "Please enter a valid URL or /preview/:id path", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <FormInput className="w-6 h-6 text-white" />
            </div>
            <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold">FormFlow AI</div>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" /> Scan Form QR
            </h2>
            <p className="text-muted-foreground mt-2">Point your camera at a form QR code to open the public form.</p>
          </div>

          <div className="rounded-lg overflow-hidden bg-black/5">
            <Scanner
              onScan={(codes) => {
                const first = Array.isArray(codes) && codes.length > 0 ? codes[0] : null;
                const value = (first && (first as any).rawValue) || "";
                if (value) handleDetected(String(value));
              }}
              onError={handleError}
              constraints={{ facingMode: "environment" }}
            />
          </div>

          {cameraAllowed === false && (
            <div className="text-sm text-destructive">Camera access denied. You can still paste the link below.</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="manual">Or open link manually</Label>
            <div className="flex gap-2">
              <Input id="manual" placeholder="https://your-domain/preview/:id or /preview/:id" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} />
              <Button onClick={openManual}>Open</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Scan;
