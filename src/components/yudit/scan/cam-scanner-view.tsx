// src/components/yudit/scan/cam-scanner-view.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  X,
  Check,
  RotateCw,
  RotateCcw,
  Crop,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Upload,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Wand2,
  AlertCircle,
  Save,
  ScanLine,
  Zap,
  Crop as CropIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  createScanSession,
  uploadScanPage,
  processScanSession,
  updateScanPage,
  deleteScanPage,
  reorderScanPages,
  type ScanPage,
  type ScanSession,
  type OutputFormat,
  type FilterType,
} from "@/lib/api/scan";
import { useYudit } from "@/lib/yudit/store";
import { cn } from "@/lib/utils";

// =====================================================
// TYPES
// =====================================================
type Step = "capture" | "edit" | "process";

interface LocalPage {
  id: string;
  blob: Blob;
  url: string;
  serverPage?: ScanPage;
  rotation: number;
  filter: FilterType;
  crop: { x: number; y: number; w: number; h: number } | null;
  uploading: boolean;
  uploadProgress: number;
}

// =====================================================
// MAIN
// =====================================================
export function CamScannerView() {
  const router = useRouter();
  const fetchFiles = useYudit((s) => s.fetchFiles);

  const [step, setStep] = useState<Step>("capture");
  const [session, setSession] = useState<ScanSession | null>(null);
  const [pages, setPages] = useState<LocalPage[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Settings
  const [title, setTitle] = useState("Untitled Scan");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pdf");
  const [pageSize, setPageSize] = useState<"A4" | "A3" | "Letter" | "Legal" | "auto">("A4");
  const [quality, setQuality] = useState(90);
  const [useILovePDF, setUseILovePDF] = useState(false);

  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">(
    "environment",
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // =====================================================
  // INIT CAMERA
  // =====================================================
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraActive(false);
      const msg =
        err?.name === "NotAllowedError"
          ? "Izin kamera ditolak. Berikan izin di browser."
          : err?.name === "NotFoundError"
            ? "Tidak ada kamera ditemukan."
            : err?.message || "Gagal membuka kamera";
      setCameraError(msg);
      toast.error(msg);
    }
  }, [cameraFacing]);

  const stopCamera = useCallback(() => {
    const v = videoRef.current;
    if (v && v.srcObject) {
      const stream = v.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // =====================================================
  // CAPTURE FROM VIDEO
  // =====================================================
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState < 2) {
      toast.error("Kamera belum siap. Coba lagi.");
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const localPage: LocalPage = {
          id: crypto.randomUUID(),
          blob,
          url,
          rotation: 0,
          filter: "none",
          crop: null,
          uploading: false,
          uploadProgress: 0,
        };
        setPages((prev) => [...prev, localPage]);
        toast.success(`Halaman ${pages.length + 1} ditangkap`);
      },
      "image/jpeg",
      0.92,
    );
  }, [pages.length]);

  // =====================================================
  // IMPORT FROM FILE
  // =====================================================
  const handleFileImport = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} bukan gambar`);
        return;
      }
      const url = URL.createObjectURL(file);
      const localPage: LocalPage = {
        id: crypto.randomUUID(),
        blob: file,
        url,
        rotation: 0,
        filter: "none",
        crop: null,
        uploading: false,
        uploadProgress: 0,
      };
      setPages((prev) => [...prev, localPage]);
    });
    toast.success(`${files.length} gambar diimpor`);
  };

  // =====================================================
  // PAGE EDIT
  // =====================================================
  const updatePageLocal = (id: string, patch: Partial<LocalPage>) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  };

  const rotatePage = (id: string, dir: 1 | -1) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;
    const newRotation = (page.rotation + dir * 90) % 360;
    updatePageLocal(id, { rotation: newRotation });
  };

  const applyFilter = (id: string, filter: FilterType) => {
    updatePageLocal(id, { filter });
  };

  const removePage = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (page?.serverPage) {
      deleteScanPage(page.serverPage.session_id, page.serverPage.id).catch(
        () => toast.error("Gagal hapus di server"),
      );
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (activeIdx >= pages.length - 1) setActiveIdx(Math.max(0, pages.length - 2));
  };

  const movePage = (id: string, dir: -1 | 1) => {
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  // =====================================================
  // GO TO EDIT STEP
  // =====================================================
  const goToEdit = async () => {
    if (pages.length === 0) {
      toast.error("Belum ada halaman");
      return;
    }
    setStep("edit");

    // Create session if not yet
    if (!session) {
      try {
        const s = await createScanSession({
          title: title.trim() || "Untitled Scan",
          output_format: outputFormat,
          page_size: pageSize,
          quality,
        });
        setSession(s);
        toast.success("Sesi scan dibuat");
        // Upload all pages
        await uploadAllPages(s.id);
      } catch (err: any) {
        toast.error(err?.detail || "Gagal buat sesi scan");
        setStep("capture");
      }
    }
  };

  const uploadAllPages = async (sessionId: string) => {
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      if (p.serverPage) continue;
      updatePageLocal(p.id, { uploading: true, uploadProgress: 0 });
      try {
        const serverPage = await uploadScanPage(
          sessionId,
          p.blob,
          i,
          (pct) => updatePageLocal(p.id, { uploadProgress: pct }),
        );
        updatePageLocal(p.id, {
          uploading: false,
          uploadProgress: 100,
          serverPage,
        });
      } catch (err: any) {
        updatePageLocal(p.id, { uploading: false });
        toast.error(err?.detail || `Gagal upload halaman ${i + 1}`);
      }
    }
  };

  // =====================================================
  // SYNC EDITS TO SERVER
  // =====================================================
  const syncEditsToServer = async () => {
    if (!session) return;
    for (const p of pages) {
      if (!p.serverPage) continue;
      const ops: Array<Record<string, unknown>> = [];
      if (p.rotation !== 0) ops.push({ op: "rotate", degrees: p.rotation });
      if (p.crop)
        ops.push({
          op: "crop",
          x: p.crop.x,
          y: p.crop.y,
          w: p.crop.w,
          h: p.crop.h,
        });

      const currentOps = JSON.stringify(p.serverPage.edit_operations || []);
      const newOps = JSON.stringify(ops);
      const currentFilter = p.serverPage.filter_applied || "none";
      const newFilter = p.filter === "none" ? null : p.filter;

      if (currentOps !== newOps || currentFilter !== newFilter) {
        try {
          const updated = await updateScanPage(session.id, p.serverPage.id, {
            edit_operations: ops,
            filter_applied: newFilter,
          });
          updatePageLocal(p.id, { serverPage: updated });
        } catch (err: any) {
          toast.error(err?.detail || `Gagal simpan edit halaman`);
        }
      }
    }
    // Reorder kalau urutan berbeda
    const serverOrderIds = pages
      .filter((p) => p.serverPage)
      .map((p) => p.serverPage!.id);
    try {
      await reorderScanPages(session.id, serverOrderIds);
    } catch {
      // silent — mungkin sudah benar
    }
  };

  // =====================================================
  // PROCESS
  // =====================================================
  const handleProcess = async () => {
    if (!session) {
      toast.error("Sesi scan belum dibuat");
      return;
    }
    if (pages.length === 0) {
      toast.error("Belum ada halaman");
      return;
    }

    setProcessing(true);
    try {
      await syncEditsToServer();
      const res = await processScanSession(session.id, {
        output_format: outputFormat,
        page_size: pageSize,
        quality,
        use_ilovepdf: useILovePDF,
      });
      toast.success(
        `Scan berhasil! Disimpan ke ${res.drive_email} (${res.folder_name})`,
        { duration: 6000 },
      );
      await fetchFiles().catch(() => {});
      router.push("/?view=files");
    } catch (err: any) {
      toast.error(err?.detail || "Gagal memproses scan");
    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // CLEANUP
  // =====================================================
  const handleClose = () => {
    pages.forEach((p) => URL.revokeObjectURL(p.url));
    stopCamera();
    router.push("/?view=files");
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="yudit-ambient flex min-h-screen flex-col">
      {/* HEADER */}
      <header className="y-glass sticky top-0 z-30 border-b border-[var(--y-border)]">
        <div className="y-container flex h-14 items-center gap-3">
          <button
            onClick={handleClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-[var(--y-primary)]" />
            <h1 className="text-sm font-bold text-[var(--y-text)]">
              Cam Scanner
            </h1>
          </div>

          {/* Step indicator */}
          <div className="ml-4 flex items-center gap-1.5 text-[11px] font-semibold">
            <StepBadge active={step === "capture"} done={step !== "capture"}>
              1. Capture
            </StepBadge>
            <ChevronDown size={12} className="-rotate-90 text-[var(--y-text-mute)]" />
            <StepBadge active={step === "edit"} done={step === "process"}>
              2. Edit
            </StepBadge>
            <ChevronDown size={12} className="-rotate-90 text-[var(--y-text-mute)]" />
            <StepBadge active={step === "process"}>3. Save</StepBadge>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-[var(--y-text-mute)]">
              {pages.length} halaman
            </span>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="y-container py-5">
          {step === "capture" && (
            <CaptureStep
              videoRef={videoRef}
              canvasRef={canvasRef}
              cameraActive={cameraActive}
              cameraError={cameraError}
              cameraFacing={cameraFacing}
              pages={pages}
              startCamera={startCamera}
              stopCamera={stopCamera}
              capturePhoto={capturePhoto}
              onImport={() => fileInputRef.current?.click()}
              onSwitchCamera={() => {
                stopCamera();
                setCameraFacing((f) =>
                  f === "environment" ? "user" : "environment",
                );
                setTimeout(startCamera, 200);
              }}
              onRemovePage={removePage}
              onNext={goToEdit}
            />
          )}

          {step === "edit" && (
            <EditStep
              pages={pages}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
              onRotate={rotatePage}
              onFilter={applyFilter}
              onMove={movePage}
              onRemove={removePage}
              onNext={() => setStep("process")}
              onBack={() => setStep("capture")}
            />
          )}

          {step === "process" && (
            <ProcessStep
              session={session}
              pages={pages}
              title={title}
              setTitle={setTitle}
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
              pageSize={pageSize}
              setPageSize={setPageSize}
              quality={quality}
              setQuality={setQuality}
              useILovePDF={useILovePDF}
              setUseILovePDF={setUseILovePDF}
              processing={processing}
              onBack={() => setStep("edit")}
              onProcess={handleProcess}
            />
          )}
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleImportChange(e, handleFileImport)}
      />
    </div>
  );
}

function handleImportChange(
  e: React.ChangeEvent<HTMLInputElement>,
  cb: (files: FileList | null) => void,
) {
  cb(e.target.files);
  e.target.value = "";
}

// =====================================================
// STEP BADGE
// =====================================================
function StepBadge({
  children,
  active,
  done,
}: {
  children: React.ReactNode;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1",
        active
          ? "bg-[var(--y-primary)] text-white"
          : done
            ? "bg-[rgba(16,185,129,0.15)] text-[var(--y-success)]"
            : "text-[var(--y-text-mute)]",
      )}
    >
      {children}
    </span>
  );
}

// =====================================================
// CAPTURE STEP
// =====================================================
function CaptureStep({
  videoRef,
  canvasRef,
  cameraActive,
  cameraError,
  cameraFacing,
  pages,
  startCamera,
  stopCamera,
  capturePhoto,
  onImport,
  onSwitchCamera,
  onRemovePage,
  onNext,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraActive: boolean;
  cameraError: string | null;
  cameraFacing: "environment" | "user";
  pages: LocalPage[];
  startCamera: () => void;
  stopCamera: () => void;
  capturePhoto: () => void;
  onImport: () => void;
  onSwitchCamera: () => void;
  onRemovePage: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* CAMERA / PREVIEW */}
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--y-border)] bg-black">
          <div className="relative aspect-[4/3] w-full sm:aspect-video">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                {cameraError ? (
                  <>
                    <AlertCircle size={48} className="mb-3 text-[var(--y-danger)]" />
                    <div className="text-sm font-semibold text-[var(--y-text)]">
                      Kamera Error
                    </div>
                    <div className="mt-1 max-w-sm text-xs text-[var(--y-text-dim)]">
                      {cameraError}
                    </div>
                    <button
                      onClick={startCamera}
                      className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-xs font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
                    >
                      <RefreshCw size={13} />
                      Coba Lagi
                    </button>
                  </>
                ) : (
                  <>
                    <Camera size={56} className="mb-3 text-[var(--y-text-mute)]" />
                    <div className="text-sm font-semibold text-[var(--y-text)]">
                      Kamera Belum Aktif
                    </div>
                    <div className="mt-1 max-w-sm text-xs text-[var(--y-text-dim)]">
                      Klik tombol di bawah untuk mulai memindai dokumen
                    </div>
                    <button
                      onClick={startCamera}
                      className="y-gradient-brand y-glow-primary mt-4 inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                    >
                      <Camera size={16} />
                      Aktifkan Kamera
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Camera controls */}
          {cameraActive && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
              <button
                onClick={onImport}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                title="Impor dari galeri"
              >
                <Upload size={16} />
              </button>
              <button
                onClick={capturePhoto}
                className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-white/90 shadow-xl transition-transform hover:scale-105 active:scale-95"
                title="Ambil foto"
              >
                <Camera size={26} className="text-black" />
              </button>
              <button
                onClick={onSwitchCamera}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                title={`Ganti ke ${cameraFacing === "environment" ? "depan" : "belakang"}`}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Non-camera actions */}
        {!cameraActive && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startCamera}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-4 text-sm font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
            >
              <Camera size={15} />
              Kamera
            </button>
            <button
              onClick={onImport}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-4 text-sm font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
            >
              <Upload size={15} />
              Impor dari galeri
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* PAGES SIDEBAR */}
      <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-[var(--y-text-mute)]">
            Hasil Capture ({pages.length})
          </span>
          {pages.length > 0 && (
            <button
              onClick={onNext}
              className="y-gradient-brand inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold text-white"
            >
              <Check size={12} />
              Lanjut Edit
            </button>
          )}
        </div>

        {pages.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-[var(--y-border)] py-10 text-center">
            <Camera size={28} className="mb-2 text-[var(--y-text-mute)]" />
            <div className="text-[11.5px] text-[var(--y-text-mute)]">
              Belum ada halaman
            </div>
          </div>
        ) : (
          <div className="grid max-h-[500px] grid-cols-2 gap-2 overflow-y-auto">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-[var(--y-border)] bg-black"
              >
                <img
                  src={p.url}
                  alt={`Page ${idx + 1}`}
                  className="h-full w-full object-cover"
                  style={{
                    transform: `rotate(${p.rotation}deg)`,
                    filter: filterToCss(p.filter),
                  }}
                />
                <div className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {idx + 1}
                </div>
                <button
                  onClick={() => onRemovePage(p.id)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded bg-red-500/90 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  title="Hapus"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// EDIT STEP
// =====================================================
function EditStep({
  pages,
  activeIdx,
  setActiveIdx,
  onRotate,
  onFilter,
  onMove,
  onRemove,
  onNext,
  onBack,
}: {
  pages: LocalPage[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onRotate: (id: string, dir: 1 | -1) => void;
  onFilter: (id: string, f: FilterType) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const active = pages[activeIdx];
  if (!active) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <ImageIcon size={48} className="mb-3 text-[var(--y-text-mute)]" />
        <div className="text-sm text-[var(--y-text-dim)]">
          Tidak ada halaman untuk diedit
        </div>
        <button
          onClick={onBack}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-xs font-semibold text-[var(--y-text)]"
        >
          <ArrowLeft size={13} /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* PREVIEW */}
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--y-border)] bg-black">
          <div className="grid place-items-center bg-black/60 p-4">
            <img
              src={active.url}
              alt={`Page ${activeIdx + 1}`}
              className="max-h-[70vh] max-w-full object-contain transition-all"
              style={{
                transform: `rotate(${active.rotation}deg)`,
                filter: filterToCss(active.filter),
              }}
            />
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-2">
          <ToolBtn label="Rotate kiri" onClick={() => onRotate(active.id, -1)}>
            <RotateCcw size={15} />
          </ToolBtn>
          <ToolBtn label="Rotate kanan" onClick={() => onRotate(active.id, 1)}>
            <RotateCw size={15} />
          </ToolBtn>
          <div className="mx-1 h-6 w-px bg-[var(--y-border)]" />
          <FilterBtn
            active={active.filter === "none"}
            onClick={() => onFilter(active.id, "none")}
          >
            Asli
          </FilterBtn>
          <FilterBtn
            active={active.filter === "enhance"}
            onClick={() => onFilter(active.id, "enhance")}
            icon={<Sparkles size={12} />}
          >
            Enhance
          </FilterBtn>
          <FilterBtn
            active={active.filter === "bw"}
            onClick={() => onFilter(active.id, "bw")}
          >
            B&W
          </FilterBtn>
          <FilterBtn
            active={active.filter === "grayscale"}
            onClick={() => onFilter(active.id, "grayscale")}
          >
            Gray
          </FilterBtn>
          <FilterBtn
            active={active.filter === "magic"}
            onClick={() => onFilter(active.id, "magic")}
            icon={<Wand2 size={12} />}
          >
            Magic
          </FilterBtn>
          <div className="mx-1 h-6 w-px bg-[var(--y-border)]" />
          <ToolBtn
            label="Pindah ke kiri"
            onClick={() => onMove(active.id, -1)}
          >
            <ArrowLeft size={15} />
          </ToolBtn>
          <ToolBtn
            label="Pindah ke kanan"
            onClick={() => onMove(active.id, 1)}
          >
            <ArrowRight size={15} />
          </ToolBtn>
          <div className="mx-1 h-6 w-px bg-[var(--y-border)]" />
          <ToolBtn
            label="Hapus halaman"
            danger
            onClick={() => onRemove(active.id)}
          >
            <Trash2 size={15} />
          </ToolBtn>
        </div>
      </div>

      {/* PAGE LIST + ACTIONS */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-3">
          <div className="mb-2 text-xs font-bold uppercase text-[var(--y-text-mute)]">
            Halaman ({pages.length})
          </div>
          <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto">
            {pages.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "group relative aspect-[3/4] overflow-hidden rounded-lg border-2 bg-black transition-all",
                  idx === activeIdx
                    ? "border-[var(--y-primary)] shadow-lg"
                    : "border-transparent hover:border-[var(--y-border)]",
                )}
              >
                <img
                  src={p.url}
                  alt={`Page ${idx + 1}`}
                  className="h-full w-full object-cover"
                  style={{
                    transform: `rotate(${p.rotation}deg)`,
                    filter: filterToCss(p.filter),
                  }}
                />
                <div className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {idx + 1}
                </div>
                {p.uploading && (
                  <div className="absolute inset-0 grid place-items-center bg-black/50">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] text-sm font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          <button
            onClick={onNext}
            className="y-gradient-brand inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white"
          >
            Lanjut
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
        danger && "hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)]",
      )}
    >
      {children}
    </button>
  );
}

function FilterBtn({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[11px] font-semibold transition-colors",
        active
          ? "bg-[var(--y-primary)] text-white"
          : "text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// =====================================================
// PROCESS STEP
// =====================================================
function ProcessStep({
  session,
  pages,
  title,
  setTitle,
  outputFormat,
  setOutputFormat,
  pageSize,
  setPageSize,
  quality,
  setQuality,
  useILovePDF,
  setUseILovePDF,
  processing,
  onBack,
  onProcess,
}: {
  session: ScanSession | null;
  pages: LocalPage[];
  title: string;
  setTitle: (s: string) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (f: OutputFormat) => void;
  pageSize: "A4" | "A3" | "Letter" | "Legal" | "auto";
  setPageSize: (p: any) => void;
  quality: number;
  setQuality: (n: number) => void;
  useILovePDF: boolean;
  setUseILovePDF: (b: boolean) => void;
  processing: boolean;
  onBack: () => void;
  onProcess: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5">
        <h2 className="mb-4 text-base font-bold text-[var(--y-text)]">
          Simpan Hasil Scan
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-[var(--y-text-mute)]">
              Nama Dokumen
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Notulen Rapat"
              className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm text-[var(--y-text)] outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase text-[var(--y-text-mute)]">
                Format Output
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm text-[var(--y-text)] outline-none"
              >
                <option value="pdf">PDF (recommended)</option>
                <option value="docx">DOCX (Word)</option>
                <option value="jpg">JPG (multi → ZIP)</option>
                <option value="png">PNG (multi → ZIP)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase text-[var(--y-text-mute)]">
                Ukuran Halaman
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm text-[var(--y-text)] outline-none"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
                <option value="auto">Auto (sesuai gambar)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase text-[var(--y-text-mute)]">
              <span>Kualitas JPEG</span>
              <span className="text-[var(--y-primary)]">{quality}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-[var(--y-primary)]"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-3">
            <input
              type="checkbox"
              checked={useILovePDF}
              onChange={(e) => setUseILovePDF(e.target.checked)}
              className="h-4 w-4 accent-[var(--y-primary)]"
            />
            <div className="text-xs">
              <div className="font-semibold text-[var(--y-text)]">
                Gunakan iLovePDF (quality tinggi)
              </div>
              <div className="text-[10.5px] text-[var(--y-text-mute)]">
                Menggunakan API iLovePDF untuk render PDF. Lebih lambat tapi
                hasil lebih rapi. Kosongkan untuk render lokal (gratis & cepat).
              </div>
            </div>
          </label>

          <div className="rounded-lg border border-[var(--y-border-soft)] bg-[rgba(99,102,241,0.05)] p-3 text-xs">
            <div className="mb-1 font-semibold text-[var(--y-text)]">
              Ringkasan
            </div>
            <div className="text-[var(--y-text-dim)]">
              • {pages.length} halaman akan digabung jadi 1 file{" "}
              {outputFormat.toUpperCase()}
              <br />• File akan disimpan ke Google Drive workspace
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={processing}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] text-sm font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)] disabled:opacity-60"
        >
          <ArrowLeft size={15} />
          Kembali
        </button>
        <button
          onClick={onProcess}
          disabled={processing || pages.length === 0}
          className="y-gradient-brand y-glow-primary inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {processing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Memproses…
            </>
          ) : (
            <>
              <Save size={16} />
              Simpan ke Drive
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// =====================================================
// HELPERS
// =====================================================
function filterToCss(filter: FilterType): string {
  switch (filter) {
    case "enhance":
      return "contrast(1.15) saturate(1.2) brightness(1.05)";
    case "bw":
      return "grayscale(1) contrast(1.5)";
    case "grayscale":
      return "grayscale(1)";
    case "magic":
      return "contrast(1.25) brightness(1.1) saturate(0.9)";
    default:
      return "none";
  }
}