import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Phone,
  MessageCircle,
  Truck,
  User,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  Loader2,
  X,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { bookingsApi } from "@/lib/api/bookings.api";
import type { BookingListItem, AgentDriverDetails } from "@/lib/api/types";

interface AgentDriverModalProps {
  booking: BookingListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
}

export function AgentDriverModal({
  booking,
  open,
  onOpenChange,
  onAssigned,
}: AgentDriverModalProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  if (!booking || !booking.agentDriverDetails) {
    return null;
  }

  const details: AgentDriverDetails = booking.agentDriverDetails;
  const { agent, driver, truck, terms } = details;

  const handleAssignDriver = async () => {
    try {
      setIsAssigning(true);
      await bookingsApi.assignAgentDriver(booking.id, details.quoteId);
      toast.success(`Driver ${driver.name} assigned to booking ${booking.bookingNumber} successfully!`);
      if (onAssigned) {
        onAssigned();
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to assign agent driver");
    } finally {
      setIsAssigning(false);
    }
  };

  const getCleanPhone = (phone: string) => {
    return phone.replace(/\D/g, "").slice(-10);
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = getCleanPhone(phone);
    if (!clean) return;
    const msg = encodeURIComponent(
      `Hello ${name}, this is from GoMyTruck Operations regarding Booking #${booking.bookingNumber} (${truck.vehicleRegNo}).`
    );
    window.open(`https://wa.me/91${clean}?text=${msg}`, "_blank");
  };

  const callPhone = (phone: string) => {
    const clean = getCleanPhone(phone);
    if (!clean) return;
    window.open(`tel:+91${clean}`, "_self");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-b border-amber-500/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm shadow-amber-500/30">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    Agent Provided Driver & Truck
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    Booking #{booking.bookingNumber}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="capitalize text-xs bg-muted"
                  >
                    Status: {booking.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold mt-2 text-foreground flex items-center gap-2">
                  <span>Driver & Vehicle Dossier</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    — submitted by {agent.name}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Verified agent has supplied a confirmed driver & vehicle ready to fulfill this order.
                </DialogDescription>
              </div>

              {/* Quick Fare Comparison */}
              <div className="bg-background/90 backdrop-blur rounded-xl p-3 border shadow-sm text-right min-w-[180px]">
                <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Commercials
                </div>
                <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground">Driver Rate:</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    ₹{Number(terms.negotiatedAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Customer Booking: ₹{Number(booking.totalFare || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 3 Grid Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Agent Profile */}
              <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-500" />
                    <span className="font-semibold text-sm">Transport Agent</span>
                  </div>
                  {agent.isKycVerified ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                      <ShieldCheck className="h-3 w-3" /> KYC Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-500 text-[10px]">
                      KYC Pending
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Agent Name</div>
                    <div className="font-semibold text-foreground">{agent.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Phone Number</div>
                    <div className="font-mono text-xs font-medium">{agent.phone}</div>
                  </div>
                  {agent.primaryCity && (
                    <div>
                      <div className="text-xs text-muted-foreground">Operating City</div>
                      <div className="text-xs font-medium">{agent.primaryCity}</div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs gap-1.5 h-8 text-emerald-600 hover:text-emerald-700"
                    onClick={() => openWhatsApp(agent.phone, agent.name)}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs gap-1.5 h-8"
                    onClick={() => callPhone(agent.phone)}
                  >
                    <Phone className="h-3.5 w-3.5" /> Call Agent
                  </Button>
                </div>
              </div>

              {/* Card 2: Driver Details */}
              <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Confirmed Driver</span>
                  </div>
                  {driver.isOwnerDriver ? (
                    <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                      Owner-Driver
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Hired Driver
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Driver Name</div>
                    <div className="font-semibold text-foreground">{driver.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Primary Mobile</div>
                    <div className="font-mono text-xs font-semibold">{driver.phone}</div>
                  </div>
                  {driver.altPhone && (
                    <div>
                      <div className="text-xs text-muted-foreground">Alternate Mobile</div>
                      <div className="font-mono text-xs text-muted-foreground">{driver.altPhone}</div>
                    </div>
                  )}
                  {driver.licenseNo && (
                    <div>
                      <div className="text-xs text-muted-foreground">Driving License (DL)</div>
                      <div className="font-mono text-xs font-medium uppercase">{driver.licenseNo}</div>
                    </div>
                  )}
                  {driver.aadhaarNo && (
                    <div>
                      <div className="text-xs text-muted-foreground">Aadhaar Card</div>
                      <div className="font-mono text-xs font-medium">•••• •••• {driver.aadhaarNo.slice(-4)}</div>
                    </div>
                  )}
                  {!driver.isOwnerDriver && driver.ownerName && (
                    <div className="pt-1 border-t text-xs">
                      <span className="text-muted-foreground">Truck Owner: </span>
                      <span className="font-medium">{driver.ownerName}</span>
                      {driver.ownerPhone && (
                        <span className="text-muted-foreground ml-1">({driver.ownerPhone})</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs gap-1.5 h-8 text-emerald-600 hover:text-emerald-700"
                    onClick={() => openWhatsApp(driver.phone, driver.name)}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs gap-1.5 h-8"
                    onClick={() => callPhone(driver.phone)}
                  >
                    <Phone className="h-3.5 w-3.5" /> Call Driver
                  </Button>
                </div>
              </div>

              {/* Card 3: Truck Details */}
              <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-sm">Vehicle & RC</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {truck.vehicleType?.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Registration Plate</div>
                    <div className="inline-block mt-0.5 px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-mono font-bold tracking-wider text-xs border border-amber-300 dark:border-amber-800">
                      {truck.vehicleRegNo}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Body & Cargo Type</div>
                    <div className="text-xs font-medium capitalize">{truck.vehicleBodyType || "Standard Body"}</div>
                  </div>
                  {truck.permitType && (
                    <div>
                      <div className="text-xs text-muted-foreground">Commercial Permit</div>
                      <div className="text-xs font-medium">{truck.permitType}</div>
                    </div>
                  )}
                  {(truck.fitnessValidTill || truck.insuranceValidTill) && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      {truck.fitnessValidTill && (
                        <div>
                          <div className="text-[10px] text-muted-foreground">Fitness Valid:</div>
                          <div className="font-mono text-[11px]">{new Date(truck.fitnessValidTill).toLocaleDateString("en-IN")}</div>
                        </div>
                      )}
                      {truck.insuranceValidTill && (
                        <div>
                          <div className="text-[10px] text-muted-foreground">Insurance Valid:</div>
                          <div className="font-mono text-[11px]">{new Date(truck.insuranceValidTill).toLocaleDateString("en-IN")}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Verification Gallery */}
            <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Submitted Documents & Photos</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Click on any thumbnail to preview full resolution
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* RC Document */}
                <div className="group relative rounded-lg border bg-background overflow-hidden p-2 text-center hover:border-primary transition-all">
                  <div className="text-xs font-semibold mb-1 text-muted-foreground flex items-center justify-center gap-1">
                    <span>Vehicle RC Book</span>
                  </div>
                  {truck.vehicleRcPhotoUrl ? (
                    <div
                      className="relative h-28 w-full bg-muted rounded overflow-hidden cursor-pointer"
                      onClick={() => setPreviewImage({ url: truck.vehicleRcPhotoUrl, title: `Vehicle RC (${truck.vehicleRegNo})` })}
                    >
                      <img
                        src={truck.vehicleRcPhotoUrl}
                        alt="Vehicle RC"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 flex items-center justify-center text-xs text-muted-foreground bg-muted/40 rounded">
                      Not uploaded
                    </div>
                  )}
                </div>

                {/* Truck Photo */}
                <div className="group relative rounded-lg border bg-background overflow-hidden p-2 text-center hover:border-primary transition-all">
                  <div className="text-xs font-semibold mb-1 text-muted-foreground flex items-center justify-center gap-1">
                    <span>Truck Live Photo</span>
                  </div>
                  {truck.vehiclePhotoUrl ? (
                    <div
                      className="relative h-28 w-full bg-muted rounded overflow-hidden cursor-pointer"
                      onClick={() => setPreviewImage({ url: truck.vehiclePhotoUrl!, title: `Truck Photo (${truck.vehicleRegNo})` })}
                    >
                      <img
                        src={truck.vehiclePhotoUrl}
                        alt="Truck Live"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 flex items-center justify-center text-xs text-muted-foreground bg-muted/40 rounded">
                      Not uploaded
                    </div>
                  )}
                </div>

                {/* Driver License */}
                <div className="group relative rounded-lg border bg-background overflow-hidden p-2 text-center hover:border-primary transition-all">
                  <div className="text-xs font-semibold mb-1 text-muted-foreground flex items-center justify-center gap-1">
                    <span>Driving License (DL)</span>
                  </div>
                  {driver.licensePhotoUrl ? (
                    <div
                      className="relative h-28 w-full bg-muted rounded overflow-hidden cursor-pointer"
                      onClick={() => setPreviewImage({ url: driver.licensePhotoUrl!, title: `Driver License (${driver.name})` })}
                    >
                      <img
                        src={driver.licensePhotoUrl}
                        alt="Driving License"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 flex items-center justify-center text-xs text-muted-foreground bg-muted/40 rounded">
                      Not uploaded
                    </div>
                  )}
                </div>

                {/* Driver Aadhaar */}
                <div className="group relative rounded-lg border bg-background overflow-hidden p-2 text-center hover:border-primary transition-all">
                  <div className="text-xs font-semibold mb-1 text-muted-foreground flex items-center justify-center gap-1">
                    <span>Aadhaar Card</span>
                  </div>
                  {driver.aadhaarPhotoUrl ? (
                    <div
                      className="relative h-28 w-full bg-muted rounded overflow-hidden cursor-pointer"
                      onClick={() => setPreviewImage({ url: driver.aadhaarPhotoUrl!, title: `Driver Aadhaar (${driver.name})` })}
                    >
                      <img
                        src={driver.aadhaarPhotoUrl}
                        alt="Aadhaar Card"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 flex items-center justify-center text-xs text-muted-foreground bg-muted/40 rounded">
                      Not uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agreed Terms & Notes */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Loading Readiness & Operational Terms</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Ready to Load: <strong>{terms.readyToLoadAt || "Immediate"}</strong>
                  </span>
                  <span>
                    Advance at Loading: <strong>₹{Number(terms.advanceRequired || 0).toLocaleString("en-IN")}</strong>
                  </span>
                  <span>
                    Agent Bounty: <strong>₹{Number(details.flatFeeBounty || 100).toLocaleString("en-IN")}</strong>
                  </span>
                </div>
                {terms.agentNotes && (
                  <p className="text-xs italic text-foreground/80 mt-1">
                    "{terms.agentNotes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  disabled={isAssigning || booking.status === "DRIVER_ASSIGNED" || booking.status === "IN_TRANSIT" || booking.status === "COMPLETED"}
                  onClick={handleAssignDriver}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-md shadow-emerald-600/20 gap-2"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning Driver…
                    </>
                  ) : booking.status === "DRIVER_ASSIGNED" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Driver Already Assigned
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Assign & Confirm Driver to Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold">
                  {previewImage.title}
                </DialogTitle>
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open original
                </a>
              </div>
            </DialogHeader>
            <div className="mt-2 max-h-[75vh] overflow-auto flex items-center justify-center bg-black/5 dark:bg-black/30 rounded-lg p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
