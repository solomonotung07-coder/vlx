import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiImage, FiLink, FiUploadCloud, FiX } from "react-icons/fi";
import {
  DEFAULT_FRAMING,
  DEFAULT_WHATSAPP,
  FALLBACK_IMAGE,
  MAX_IMAGE_BYTES,
  PRICE_UNITS,
  formatPrice,
  framingStyle,
  getFraming,
  normalizeWhatsapp,
} from "../../lib/rentals";
import ImageFramer from "./ImageFramer";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
// Phones often produce big photos; they are compressed before upload,
// so allow a larger original than the 5 MB storage limit.
const MAX_ORIGINAL_BYTES = MAX_IMAGE_BYTES * 4;

const toFormValues = (row) => ({
  name: row?.name ?? "",
  price_amount: row?.price_amount ?? "",
  price_unit: row?.price_unit ?? "day",
  whatsapp: row?.whatsapp ?? DEFAULT_WHATSAPP,
  is_active: row?.is_active ?? true,
  image_url: row?.image_url ?? "",
  image_path: row?.image_path ?? null,
});

const validate = (values, { imageMode, file }) => {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter the product name.";
  else if (values.name.trim().length > 120) errors.name = "Keep the name under 120 characters.";

  const amount = Number(values.price_amount);
  if (values.price_amount === "" || !Number.isFinite(amount)) errors.price_amount = "Enter a price.";
  else if (amount <= 0) errors.price_amount = "Price must be more than 0.";

  const phone = normalizeWhatsapp(values.whatsapp);
  if (phone.length < 10 || phone.length > 15) {
    errors.whatsapp = "Enter a WhatsApp number with country code, e.g. 2349051376816.";
  }

  if (imageMode === "upload" && !file && !values.image_path) {
    errors.image = "Upload a product image.";
  }
  if (imageMode === "url") {
    const url = values.image_url.trim();
    if (!url) errors.image = "Paste an image URL.";
    else if (!/^https?:\/\/\S+$/i.test(url) && !url.startsWith("/")) {
      errors.image = "The image URL should start with https://";
    }
  }
  return errors;
};

const RentalForm = ({ initial, onCancel, onSubmit }) => {
  const isNew = !initial;
  const [values, setValues] = useState(() => toFormValues(initial));
  const [imageMode, setImageMode] = useState(
    initial?.image_url && !initial?.image_path ? "url" : "upload",
  );
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [framing, setFraming] = useState(() => getFraming(initial));
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const firstFieldRef = useRef(null);
  const formRef = useRef(null);

  // Revoke object URLs when replaced or on close.
  useEffect(() => () => filePreview && URL.revokeObjectURL(filePreview), [filePreview]);

  // Keep the latest close handler without re-running the setup effect.
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current = () => !saving && onCancel();
  }, [onCancel, saving]);

  // Esc to close, lock page scroll, focus first field (once, on open).
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current?.();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  const set = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const pickFile = (picked) => {
    if (!picked) return;
    if (!ACCEPTED_TYPES.includes(picked.type)) {
      setErrors((e) => ({ ...e, image: "Use a JPG, PNG, WebP, GIF or AVIF image." }));
      return;
    }
    if (picked.size > MAX_ORIGINAL_BYTES) {
      setErrors((e) => ({ ...e, image: "That image is too large (max 20 MB)." }));
      return;
    }
    setFile(picked);
    setFilePreview(URL.createObjectURL(picked));
    setFraming({ ...DEFAULT_FRAMING });
    setErrors((e) => ({ ...e, image: undefined }));
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview("");
    setValues((v) => ({ ...v, image_path: null, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const previewImage =
    imageMode === "url"
      ? values.image_url.trim()
      : filePreview || (values.image_path ? values.image_url : "");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values, { imageMode, file });
    setErrors(found);
    setSubmitError("");
    const firstInvalid = ["image", "name", "price_amount", "whatsapp"].find((key) => found[key]);
    if (firstInvalid) {
      // The form scrolls, so bring the problem into view instead of failing silently.
      const field = formRef.current?.querySelector(`[data-field="${firstInvalid}"]`);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.querySelector("input, select, button")?.focus({ preventScroll: true });
      toast.error(found[firstInvalid]);
      return;
    }

    setSaving(true);
    setSubmitError("");
    try {
      await onSubmit({
        values: { ...values, whatsapp: normalizeWhatsapp(values.whatsapp) },
        file,
        imageMode,
        framing,
      });
    } catch (error) {
      setSubmitError(error?.message || "Could not save. Please try again.");
      setSaving(false);
    }
  };

  const pricePreview = formatPrice(values.price_amount, values.price_unit) || "₦0/day";

  return (
    <div
      className="cms-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onCancel()}
    >
      <div className="cms-modal" role="dialog" aria-modal="true" aria-labelledby="cms-form-title">
        <div className="cms-modal-head">
          <h2 id="cms-form-title">{isNew ? "Add product" : "Edit product"}</h2>
          <button
            type="button"
            className="cms-icon-btn"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form ref={formRef} className="cms-modal-body" onSubmit={handleSubmit} noValidate>
          <div className="cms-form-grid">
            <div className="cms-form-fields">
              {/* ---------- Image ---------- */}
              <div className="cms-field" data-field="image">
                <div className="cms-label-row">
                  <span className="cms-label">Product image</span>
                  <div className="cms-segmented" role="tablist" aria-label="Image source">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={imageMode === "upload"}
                      className={imageMode === "upload" ? "is-active" : ""}
                      onClick={() => {
                        setImageMode("upload");
                        setErrors((e) => ({ ...e, image: undefined }));
                      }}
                    >
                      <FiUploadCloud aria-hidden="true" /> Upload
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={imageMode === "url"}
                      className={imageMode === "url" ? "is-active" : ""}
                      onClick={() => {
                        setImageMode("url");
                        setErrors((e) => ({ ...e, image: undefined }));
                      }}
                    >
                      <FiLink aria-hidden="true" /> URL
                    </button>
                  </div>
                </div>

                {imageMode === "upload" ? (
                  <div
                    className={`cms-dropzone ${dragging ? "is-dragging" : ""} ${
                      errors.image ? "has-error" : ""
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      pickFile(e.dataTransfer.files?.[0]);
                    }}
                  >
                    {previewImage ? (
                      <div className="cms-dropzone-preview">
                        <ImageFramer
                          key={previewImage}
                          src={previewImage}
                          framing={framing}
                          onChange={setFraming}
                        />
                        <div className="cms-dropzone-preview-actions">
                          <button
                            type="button"
                            className="cms-btn cms-btn-ghost cms-btn-sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Replace photo
                          </button>
                          <button
                            type="button"
                            className="cms-btn cms-btn-ghost cms-btn-sm"
                            onClick={clearFile}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="cms-dropzone-empty"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FiImage aria-hidden="true" />
                        <strong>Click to upload</strong> or drag an image here
                        <span className="cms-hint">JPG, PNG or WebP · resized automatically</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES.join(",")}
                      hidden
                      onChange={(e) => pickFile(e.target.files?.[0])}
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="url"
                      className={`cms-input ${errors.image ? "has-error" : ""}`}
                      placeholder="https://…"
                      value={values.image_url}
                      onChange={set("image_url")}
                    />
                    {/^https?:\/\/\S+$|^\//i.test(previewImage) && (
                      <ImageFramer
                        key={previewImage}
                        src={previewImage}
                        framing={framing}
                        onChange={setFraming}
                      />
                    )}
                  </>
                )}
                {errors.image && <p className="cms-error">{errors.image}</p>}
              </div>

              {/* ---------- Name ---------- */}
              <label className="cms-field" data-field="name">
                <span className="cms-label">Product name</span>
                <input
                  ref={firstFieldRef}
                  type="text"
                  className={`cms-input ${errors.name ? "has-error" : ""}`}
                  placeholder="e.g. Sony FX3 Cinema Camera"
                  value={values.name}
                  onChange={set("name")}
                  maxLength={120}
                />
                {errors.name && <p className="cms-error">{errors.name}</p>}
              </label>

              {/* ---------- Price ---------- */}
              <div className="cms-field" data-field="price_amount">
                <span className="cms-label">Rental price</span>
                <div className="cms-price-row">
                  <div className={`cms-input-prefix ${errors.price_amount ? "has-error" : ""}`}>
                    <span>₦</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      placeholder="180000"
                      value={values.price_amount}
                      onChange={set("price_amount")}
                      aria-label="Price amount in naira"
                    />
                  </div>
                  <select
                    className="cms-input"
                    value={values.price_unit}
                    onChange={set("price_unit")}
                    aria-label="Price period"
                  >
                    {PRICE_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.price_amount && <p className="cms-error">{errors.price_amount}</p>}
              </div>

              {/* ---------- WhatsApp ---------- */}
              <label className="cms-field" data-field="whatsapp">
                <span className="cms-label">WhatsApp number for “Rent Now”</span>
                <input
                  type="tel"
                  className={`cms-input ${errors.whatsapp ? "has-error" : ""}`}
                  value={values.whatsapp}
                  onChange={set("whatsapp")}
                  placeholder="2349051376816"
                />
                {errors.whatsapp ? (
                  <p className="cms-error">{errors.whatsapp}</p>
                ) : (
                  <span className="cms-hint">Include the country code. 0905… is converted to 234905….</span>
                )}
              </label>

              {/* ---------- Visibility ---------- */}
              <label className="cms-switch">
                <input type="checkbox" checked={values.is_active} onChange={set("is_active")} />
                <span className="cms-switch-track" aria-hidden="true" />
                <span>
                  <strong>Show on website</strong>
                  <span className="cms-hint">Turn off to save as hidden (draft).</span>
                </span>
              </label>
            </div>

            {/* ---------- Live preview (uses the homepage card styles) ---------- */}
            <aside className="cms-preview">
              <span className="cms-label">Preview</span>
              <div className="card-spotlight custom-spotlight-card cms-preview-card">
                <div className="rental-card-inner">
                  <div className="rental-card-media">
                    <img
                      src={previewImage || FALLBACK_IMAGE}
                      alt=""
                      className="rental-card-image"
                      style={previewImage ? framingStyle(framing) : undefined}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <h3 className="rental-card-title">{values.name.trim() || "Product name"}</h3>
                  <p className="rental-card-price">{pricePreview}</p>
                  <span className="rental-card-button">Rent Now</span>
                </div>
              </div>

              {previewImage && (
                <div className="cms-preview-wide">
                  <span className="cms-hint">On wider cards (tablet)</span>
                  <div className="cms-preview-wide-box">
                    <img src={previewImage} alt="" style={framingStyle(framing)} />
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className="cms-modal-foot">
            {submitError && (
              <p className="cms-foot-error" role="alert">
                {submitError}
              </p>
            )}
            <button type="button" className="cms-btn cms-btn-ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="cms-btn cms-btn-primary" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Add product" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalForm;
