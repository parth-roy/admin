import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Camera,
  FileCheck,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface FileUploadDropzoneProps {
  id?: string;
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: "profile" | "documents" | "uploads" | "bookings";
  accept?: string;
  mode?: "avatar" | "document";
  maxSizeMb?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUploadDropzone({
  id = "file-upload",
  label,
  description,
  value,
  onChange,
  folder = "documents",
  accept = "image/jpeg,image/png,image/webp,image/jpg,application/pdf",
  mode = "document",
  maxSizeMb = 10,
  required = false,
  disabled = false,
  className,
}: FileUploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasImgError, setHasImgError] = useState(false);
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (urlOrType?: string | null) => {
    if (!urlOrType) return false;
    // In avatar mode, any selected or uploaded file is treated as an image
    if (mode === "avatar") return true;
    const lower = urlOrType.toLowerCase();
    // Blob preview URLs and data URLs
    if (lower.startsWith("blob:") || lower.startsWith("data:image")) return true;
    // Strip query parameters and hash fragments (e.g. S3 presigned URLs)
    const cleanUrl = lower.split("?")[0].split("#")[0];
    if (
      cleanUrl.endsWith(".png") ||
      cleanUrl.endsWith(".jpg") ||
      cleanUrl.endsWith(".jpeg") ||
      cleanUrl.endsWith(".webp") ||
      cleanUrl.endsWith(".gif") ||
      cleanUrl.endsWith(".svg") ||
      cleanUrl.endsWith(".bmp") ||
      cleanUrl.endsWith(".avif")
    ) {
      return true;
    }
    // Substring fallback
    return (
      cleanUrl.includes(".png") ||
      cleanUrl.includes(".jpg") ||
      cleanUrl.includes(".jpeg") ||
      cleanUrl.includes(".webp") ||
      lower.includes("image/") ||
      lower.includes("image")
    );
  };

  const isPdf = (urlOrType?: string | null) => {
    if (!urlOrType) return false;
    const lower = urlOrType.toLowerCase();
    const cleanUrl = lower.split("?")[0].split("#")[0];
    return (
      cleanUrl.endsWith(".pdf") ||
      lower.includes("application/pdf") ||
      lower.includes(".pdf?") ||
      lower.includes(".pdf#")
    );
  };

  const displayUrl = localPreview || value;

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setHasImgError(false);

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      const err = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed ${maxSizeMb} MB limit.`;
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setFileName(file.name);

    // Create instant local preview
    if (file.type.startsWith("image/") || mode === "avatar") {
      const previewUrl = URL.createObjectURL(file);
      setLocalPreview(previewUrl);
    } else {
      setLocalPreview(null);
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      setUploadProgress(45);

      const res = await apiClient.post("/upload/single", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(pct, 90));
          }
        },
      });

      setUploadProgress(100);

      const uploadedUrl = res.data?.data?.url;
      if (!uploadedUrl) {
        throw new Error(res.data?.message || "Server did not return a valid file URL.");
      }

      onChange(uploadedUrl);
      toast.success(`${label} uploaded successfully!`);
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Upload failed. Please check your network and try again.";
      setErrorMessage(msg);
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setLocalPreview(null);
    setFileName(null);
    setErrorMessage(null);
    setHasImgError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info(`${label} removed`);
  };

  // Avatar / Profile Photo Layout Mode
  if (mode === "avatar") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-xs font-semibold">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          {displayUrl && (
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Photo Attached
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="flex items-center gap-4 p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card transition-colors">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative h-20 w-20 rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-all shadow-xs group",
              displayUrl
                ? "border-emerald-500/50 bg-muted"
                : "border-dashed border-border hover:border-emerald-500 bg-muted/40 hover:bg-muted/70"
            )}
            title={displayUrl ? "Click to change photo" : "Click to upload photo"}
          >
            {displayUrl && !hasImgError ? (
              <img
                src={displayUrl}
                alt="Profile Preview"
                className="h-full w-full object-cover"
                onError={() => {
                  if (!localPreview) {
                    setHasImgError(true);
                  }
                }}
              />
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground group-hover:text-emerald-500 group-hover:scale-110 transition-transform" />
            )}

            {/* Hover overlay hint */}
            {displayUrl && !isUploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="h-8 text-xs font-medium cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Uploading...
                  </>
                ) : displayUrl ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Change Photo
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                    Upload Photo
                  </>
                )}
              </Button>

              {displayUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground truncate">
              {description || "JPEG, PNG, or WEBP up to 5MB. Auto-saved to cloud storage."}
            </p>

            {errorMessage && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Document Layout Mode (Aadhaar, PAN, RC, etc.)
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-semibold">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {displayUrl && (
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Auto-Saved
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {displayUrl ? (
        // Preview State: When document is already uploaded or URL exists
        <div className="relative rounded-xl border border-border/80 bg-card p-3 shadow-xs hover:border-border transition-colors">
          <div className="flex items-center gap-3">
            {/* Visual Thumbnail */}
            {/* Visual Thumbnail */}
            <div
              onClick={() => isImage(displayUrl) && setIsLightBoxOpen(true)}
              className={cn(
                "h-14 w-14 rounded-lg border border-border/60 bg-muted/40 shrink-0 overflow-hidden flex items-center justify-center relative group",
                isImage(displayUrl) && "cursor-pointer hover:border-emerald-500/50"
              )}
            >
              {isImage(displayUrl) && !hasImgError ? (
                <>
                  <img
                    src={displayUrl}
                    alt={label}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={() => {
                      if (!localPreview) {
                        setHasImgError(true);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="h-4 w-4" />
                  </div>
                </>
              ) : isPdf(displayUrl) ? (
                <div className="flex flex-col items-center justify-center text-red-500">
                  <FileText className="h-7 w-7" />
                  <span className="text-[9px] font-bold mt-0.5 tracking-tight">PDF</span>
                </div>
              ) : (
                <FileCheck className="h-7 w-7 text-emerald-500" />
              )}
            </div>

            {/* Document Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground truncate">
                  {fileName || `${label} Document`}
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Saved
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                {displayUrl}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {isImage(displayUrl) && (
                <button
                  type="button"
                  onClick={() => setIsLightBoxOpen(true)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Preview image"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}

              <a
                href={displayUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="View full document in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Replace document"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 rounded-xl backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-medium text-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              <span>Uploading updated document...</span>
            </div>
          )}
        </div>
      ) : (
        // Empty Upload Dropzone State
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center",
            dragOver
              ? "border-emerald-500 bg-emerald-500/5 scale-[1.005]"
              : "border-border/80 hover:border-emerald-500/60 bg-muted/20 hover:bg-muted/40",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          {isUploading ? (
            <div className="py-2 flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
              <div className="text-xs font-semibold text-foreground">
                Uploading {fileName || "file"} to cloud storage...
              </div>
              <div className="w-36 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="py-1 flex flex-col items-center gap-1.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground">
                  Click to upload or drag & drop
                </span>
                <span className="text-xs text-muted-foreground"> {label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {description || "PNG, JPG, WEBP or PDF up to 10MB"}
              </p>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] text-red-500 flex items-center gap-1 font-medium mt-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {errorMessage}
        </p>
      )}

      {/* Lightbox Preview Modal */}
      {isLightBoxOpen && displayUrl && (
        <Dialog open={isLightBoxOpen} onOpenChange={setIsLightBoxOpen}>
          <DialogContent className="max-w-3xl p-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center justify-between">
                <span>{label} Preview</span>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 rounded-lg overflow-hidden bg-black/5 dark:bg-black/40 flex items-center justify-center max-h-[75vh]">
              <img
                src={displayUrl}
                alt={label}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-md shadow-md"
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span className="truncate max-w-md font-mono">{displayUrl}</span>
              <a
                href={displayUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open Full Resolution
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
