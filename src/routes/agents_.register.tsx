import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus, ArrowLeft, Building2, MapPin, CreditCard,
  FileText, ShieldCheck, Check, Loader2, Sparkles, User,
  Phone, Mail, Calendar, GraduationCap, Home, Shield
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { GoogleCityAutocomplete } from "@/components/admin/GoogleCityAutocomplete";
import { FileUploadDropzone } from "@/components/admin/FileUploadDropzone";

export const Route = createFileRoute("/agents_/register")({
  head: () => ({ meta: [{ title: "Manual Agent Registration — SUPER ADMIN" }] }),
  component: ManualAgentRegistrationPage,
});

function ManualAgentRegistrationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [formData, setFormData] = useState({
    // Basic & Contact
    name: "",
    phone: "",
    email: "",

    // Territories
    primaryCity: "",
    primaryState: "",
    operatingCitiesInput: "",

    // Demographics (New Admin Fields)
    age: "",
    gender: "",
    educationLevel: "",
    fullAddress: "",
    profilePhotoUrl: "",

    // Identity & Compliance Documents (New Admin Fields)
    aadhaarNumber: "",
    aadhaarDocUrl: "",
    panNumber: "",
    panDocUrl: "",

    // Banking & Payouts (New Admin Fields)
    bankAccountNumber: "",
    bankIfsc: "",
    bankName: "",
    bankAccountHolderName: "",
    bankUpiId: "",

    // Admin Verification Flags
    isKycVerified: false,
    isActive: true,
    adminNotes: "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const createAgentMutation = useMutation({
    mutationFn: async () => {
      // Basic validation
      if (!formData.name.trim()) throw new Error("Agent full name is required");
      if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
        throw new Error("Must be a valid 10-digit Indian mobile number");
      }
      if (!formData.primaryCity.trim()) throw new Error("Primary city is required");

      const operatingCities = formData.operatingCitiesInput
        ? formData.operatingCitiesInput.split(",").map((s) => s.trim()).filter(Boolean)
        : [formData.primaryCity.trim()];

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        primaryCity: formData.primaryCity.trim(),
        primaryState: formData.primaryState.trim() || undefined,
        operatingCities,

        // Demographics
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender || undefined,
        educationLevel: formData.educationLevel || undefined,
        fullAddress: formData.fullAddress.trim() || undefined,
        profilePhotoUrl: formData.profilePhotoUrl.trim() || undefined,

        // Documents
        aadhaarNumber: formData.aadhaarNumber.trim() || undefined,
        aadhaarDocUrl: formData.aadhaarDocUrl.trim() || undefined,
        panNumber: formData.panNumber.trim().toUpperCase() || undefined,
        panDocUrl: formData.panDocUrl.trim() || undefined,

        // Banking
        bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
        bankIfsc: formData.bankIfsc.trim().toUpperCase() || undefined,
        bankName: formData.bankName.trim() || undefined,
        bankAccountHolderName: formData.bankAccountHolderName.trim() || undefined,
        bankUpiId: formData.bankUpiId.trim() || undefined,

        // Flags
        isKycVerified: Boolean(formData.isKycVerified),
        isActive: Boolean(formData.isActive),
        adminNotes: formData.adminNotes.trim() || undefined,
      };

      const res = await apiClient.post("/broker/admin/agents", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Transport Agent registered successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      navigate({ to: "/agents" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Failed to register agent");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAgentMutation.mutate();
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/agents">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Agents
              </Link>
            </Button>
          </div>
          <PageHeader
            title="Manual Agent Registration"
            description="Register an authorized Transport Agent directly from the Admin Panel with extended identity documents and banking credentials."
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: IDENTITY & CONTACT */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">1. Basic & Contact Information</CardTitle>
                <CardDescription className="text-xs">
                  Agent personal details used for mobile app login and system notifications.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Ramesh Kumar Sharma"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Mobile Number (10 Digits) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">+91</span>
                <Input
                  id="phone"
                  placeholder="9876543210"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ramesh.logistics@gmail.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <FileUploadDropzone
                id="profilePhoto"
                label="Agent Profile Photo"
                description="Upload clear passport/portrait photo (JPEG, PNG, WEBP max 5MB). Automatically stored in cloud storage."
                value={formData.profilePhotoUrl}
                onChange={(url) => handleChange("profilePhotoUrl", url)}
                folder="profile"
                mode="avatar"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                maxSizeMb={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: OPERATING TERRITORIES */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">2. Operating Territory & City Hubs</CardTitle>
                <CardDescription className="text-xs">
                  Dictates which regional loads and sourcing notifications this agent will receive.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="primaryCity" className="text-xs font-semibold">
                Primary Operating City <span className="text-red-500">*</span>
              </Label>
              <GoogleCityAutocomplete
                id="primaryCity"
                placeholder="e.g. Kolkata, Raipur, Mumbai, Jaipur"
                value={formData.primaryCity}
                onChange={(city) => handleChange("primaryCity", city)}
                onCitySelect={(details) => {
                  handleChange("primaryCity", details.city);
                  if (details.state) {
                    handleChange("primaryState", details.state);
                  }
                }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primaryState" className="text-xs font-semibold">
                Primary State (Optional)
              </Label>
              <Input
                id="primaryState"
                placeholder="e.g. West Bengal, Chhattisgarh, Maharashtra"
                value={formData.primaryState}
                onChange={(e) => handleChange("primaryState", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <Label htmlFor="operatingCitiesInput" className="text-xs font-semibold">
                Additional Operating Cities / Freight Corridors (Comma Separated)
              </Label>
              <Input
                id="operatingCitiesInput"
                placeholder="e.g. Howrah, Durgapur, Asansol, Haldia"
                value={formData.operatingCitiesInput}
                onChange={(e) => handleChange("operatingCitiesInput", e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Leave empty to default exclusively to the primary city.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: PERSONAL DEMOGRAPHICS (ADMIN EXTRA FIELDS) */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">3. Demographics & Background (Admin Fields)</CardTitle>
                <CardDescription className="text-xs">
                  Age, gender, and education qualification for verified corporate compliance records.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="age" className="text-xs font-semibold">
                Age (Years)
              </Label>
              <Input
                id="age"
                type="number"
                min={18}
                max={99}
                placeholder="e.g. 35"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-xs font-semibold">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(val) => handleChange("gender", val)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="educationLevel" className="text-xs font-semibold">
                Education Qualification
              </Label>
              <Select
                value={formData.educationLevel}
                onValueChange={(val) => handleChange("educationLevel", val)}
              >
                <SelectTrigger id="educationLevel">
                  <SelectValue placeholder="Select Education" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BELOW_10TH">Below 10th Standard</SelectItem>
                  <SelectItem value="10TH_PASS">10th Standard (Matric)</SelectItem>
                  <SelectItem value="12TH_PASS">12th Standard (Higher Secondary)</SelectItem>
                  <SelectItem value="GRADUATE">Graduate / Bachelor's Degree</SelectItem>
                  <SelectItem value="POST_GRADUATE">Post Graduate / Master's</SelectItem>
                  <SelectItem value="DIPLOMA_VOCATIONAL">Diploma / Technical Certificate</SelectItem>
                  <SelectItem value="OTHER">Other / Self-Employed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 md:col-span-3 space-y-1.5">
              <Label htmlFor="fullAddress" className="text-xs font-semibold">
                Full Residential / Office Address
              </Label>
              <Textarea
                id="fullAddress"
                rows={2}
                placeholder="Shop No. 12, Transport Nagar, Near IOCL Petrol Pump, Kolkata - 700015"
                value={formData.fullAddress}
                onChange={(e) => handleChange("fullAddress", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: IDENTITY & COMPLIANCE DOCUMENTS */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">4. Identity & Compliance Documents</CardTitle>
                <CardDescription className="text-xs">
                  Government ID proofs for anti-fraud validation and physical load authorization.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="aadhaarNumber" className="text-xs font-semibold">
                Aadhaar Number (12 Digits)
              </Label>
              <Input
                id="aadhaarNumber"
                placeholder="xxxx xxxx 4589"
                maxLength={12}
                value={formData.aadhaarNumber}
                onChange={(e) => handleChange("aadhaarNumber", e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="space-y-1.5">
              <FileUploadDropzone
                id="aadhaarDoc"
                label="Aadhaar Card Document"
                description="Upload Aadhaar card image or PDF (Max 10MB). Auto-saved to cloud storage."
                value={formData.aadhaarDocUrl}
                onChange={(url) => handleChange("aadhaarDocUrl", url)}
                folder="documents"
                mode="document"
                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="panNumber" className="text-xs font-semibold">
                PAN Number (10 Characters)
              </Label>
              <Input
                id="panNumber"
                placeholder="ABCDE1234F"
                maxLength={10}
                value={formData.panNumber}
                onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-1.5">
              <FileUploadDropzone
                id="panDoc"
                label="PAN Card Document"
                description="Upload PAN card image or PDF (Max 10MB). Auto-saved to cloud storage."
                value={formData.panDocUrl}
                onChange={(url) => handleChange("panDocUrl", url)}
                folder="documents"
                mode="document"
                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5: BANKING & PAYOUT DETAILS */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">5. Bank Account & Settlement Details</CardTitle>
                <CardDescription className="text-xs">
                  Required by Ops for manual bank transfers / IMPS of confirmed trip bounties.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bankAccountHolderName" className="text-xs font-semibold">
                Account Holder Name
              </Label>
              <Input
                id="bankAccountHolderName"
                placeholder="As per bank passbook"
                value={formData.bankAccountHolderName}
                onChange={(e) => handleChange("bankAccountHolderName", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankName" className="text-xs font-semibold">
                Bank Name
              </Label>
              <Input
                id="bankName"
                placeholder="e.g. State Bank of India, HDFC Bank"
                value={formData.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankAccountNumber" className="text-xs font-semibold">
                Bank Account Number
              </Label>
              <Input
                id="bankAccountNumber"
                placeholder="e.g. 50100234567890"
                value={formData.bankAccountNumber}
                onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankIfsc" className="text-xs font-semibold">
                IFSC Code (11 Characters)
              </Label>
              <Input
                id="bankIfsc"
                placeholder="SBIN0001234"
                maxLength={11}
                value={formData.bankIfsc}
                onChange={(e) => handleChange("bankIfsc", e.target.value.toUpperCase())}
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <Label htmlFor="bankUpiId" className="text-xs font-semibold">
                UPI ID / VPA (Optional)
              </Label>
              <Input
                id="bankUpiId"
                placeholder="9876543210@paytm / transport@okaxis"
                value={formData.bankUpiId}
                onChange={(e) => handleChange("bankUpiId", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 6: ADMINISTRATIVE CONTROLS */}
        <Card className="border border-border shadow-xs bg-muted/10">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">6. Administrative Controls & Status</CardTitle>
                <CardDescription className="text-xs">
                  Authorization gates and internal operational notes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-border/60 bg-background">
              <div>
                <div className="font-semibold text-sm">Mark KYC Verified Immediately?</div>
                <div className="text-xs text-muted-foreground">
                  If enabled, this agent can immediately start quoting on open loads without waiting for verification.
                </div>
              </div>
              <Switch
                checked={formData.isKycVerified}
                onCheckedChange={(val) => handleChange("isKycVerified", val)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-border/60 bg-background">
              <div>
                <div className="font-semibold text-sm">Account Active Status</div>
                <div className="text-xs text-muted-foreground">
                  Active agents can log in, view regional loads, and submit quotes.
                </div>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(val) => handleChange("isActive", val)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminNotes" className="text-xs font-semibold">
                Internal Ops Notes (Admin Only)
              </Label>
              <Textarea
                id="adminNotes"
                rows={2}
                placeholder="e.g. Verified via direct phone interview. Experienced 10+ years in Kolkata-Raipur corridor."
                value={formData.adminNotes}
                onChange={(e) => handleChange("adminNotes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SUBMIT BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/agents" })}
            disabled={createAgentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createAgentMutation.isPending}
            className="px-6 gap-2"
          >
            {createAgentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering Agent...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Submit & Register Agent
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
