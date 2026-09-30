import { supabase } from "./supabase";

export const RENTALS_TABLE = "rentals";
export const RENTALS_BUCKET = "rental-images";
export const DEFAULT_WHATSAPP = "2349051376816";
export const FALLBACK_IMAGE = "/logo/vlxlogo.png";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const PRICE_UNITS = [
  { value: "hour", label: "Per hour" },
  { value: "day", label: "Per day" },
  { value: "week", label: "Per week" },
  { value: "month", label: "Per month" },
  { value: "event", label: "Per event" },
];

/* ---------------------------- image framing --------------------------- */
// How a product photo sits inside the card's image box. Stored per product
// (image_fit / image_zoom / image_pos_x / image_pos_y) and applied with CSS,
// so the original file is never altered and it adapts to every card size.

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

export const DEFAULT_FRAMING = { fit: "cover", zoom: 1, x: 50, y: 50 };

const clampNumber = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Row (or form values) → { fit, zoom, x, y } with safe defaults. */
export const getFraming = (row) => ({
  fit: row?.image_fit === "contain" ? "contain" : "cover",
  zoom: clampNumber(row?.image_zoom, MIN_ZOOM, MAX_ZOOM, DEFAULT_FRAMING.zoom),
  x: clampNumber(row?.image_pos_x, 0, 100, DEFAULT_FRAMING.x),
  y: clampNumber(row?.image_pos_y, 0, 100, DEFAULT_FRAMING.y),
});

const FRAMING_COLUMNS = ["image_fit", "image_zoom", "image_pos_x", "image_pos_y"];

/** True when the database hasn't had supabase/002_image_framing.sql run yet. */
export const isMissingFramingColumns = (error) =>
  /image_(fit|zoom|pos_[xy])/.test(error?.message || "");

export const withoutFramingColumns = (values) =>
  Object.fromEntries(Object.entries(values).filter(([key]) => !FRAMING_COLUMNS.includes(key)));

/** { fit, zoom, x, y } → database columns. */
export const framingToColumns = (framing) => ({
  image_fit: framing.fit,
  image_zoom: Math.round(framing.zoom * 100) / 100,
  image_pos_x: Math.round(framing.x * 10) / 10,
  image_pos_y: Math.round(framing.y * 10) / 10,
});

/**
 * Inline style for the <img>. "x% of the image sits at x% of the box", and
 * zoom scales around that same point, so framing looks the same on wide
 * (phone) and narrower (desktop) cards.
 */
export const framingStyle = (framing) => {
  const f = framing ?? DEFAULT_FRAMING;
  const position = `${f.x}% ${f.y}%`;
  return {
    objectFit: f.fit,
    objectPosition: position,
    transformOrigin: position,
    transform: f.zoom !== 1 ? `scale(${f.zoom})` : undefined,
  };
};

/* ----------------------------- formatting ----------------------------- */

export const formatPrice = (amount, unit) => {
  const value = Number(amount);
  if (amount === "" || amount === null || !Number.isFinite(value)) return "";
  const money = `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
  return unit ? `${money}/${unit}` : money;
};

/** "0905 137 6816" → "2349051376816", "+234 905…" → "234905…" */
export const normalizeWhatsapp = (input) => {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
};

/** Database row → the shape the homepage cards use. */
export const toPublicRental = (row) => ({
  id: row.id,
  name: row.name,
  price: formatPrice(row.price_amount, row.price_unit),
  image: row.image_url || FALLBACK_IMAGE,
  imageStyle: row.image_url ? framingStyle(getFraming(row)) : undefined,
  whatsapp: `https://wa.me/${normalizeWhatsapp(row.whatsapp) || DEFAULT_WHATSAPP}`,
});

/* ------------------------------- helpers ------------------------------ */

const db = () => {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.",
    );
  }
  return supabase;
};

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const randomId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/* ------------------------------- queries ------------------------------ */

export const fetchPublishedRentals = async () =>
  unwrap(
    await db()
      .from(RENTALS_TABLE)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  );

export const fetchAllRentals = async () =>
  unwrap(
    await db()
      .from(RENTALS_TABLE)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  );

export const createRental = async (values) =>
  unwrap(await db().from(RENTALS_TABLE).insert(values).select().single());

export const updateRental = async (id, values) =>
  unwrap(
    await db().from(RENTALS_TABLE).update(values).eq("id", id).select().single(),
  );

export const deleteRental = async (row) => {
  unwrap(await db().from(RENTALS_TABLE).delete().eq("id", row.id));
  await removeRentalImage(row.image_path);
};

/** Persist a new order. Only rows whose position changed are written. */
export const saveRentalOrder = async (orderedRows) => {
  const changed = orderedRows
    .map((row, index) => ({ row, sort_order: index + 1 }))
    .filter(({ row, sort_order }) => row.sort_order !== sort_order);

  await Promise.all(
    changed.map(({ row, sort_order }) =>
      db()
        .from(RENTALS_TABLE)
        .update({ sort_order })
        .eq("id", row.id)
        .then(unwrap),
    ),
  );

  return orderedRows.map((row, index) => ({ ...row, sort_order: index + 1 }));
};

export const checkIsAdmin = async () =>
  Boolean(unwrap(await db().rpc("is_admin")));

/* -------------------------------- images ------------------------------ */

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Shrinks large photos before upload (max 1600px, WebP/JPEG) so the
 * homepage stays fast. Falls back to the original file on any problem.
 */
export const compressImage = async (file, maxSize = 1600, quality = 0.85) => {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    let blob = await canvasToBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
};

export const uploadRentalImage = async (file) => {
  const prepared = await compressImage(file);
  if (prepared.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is larger than 5 MB. Please choose a smaller file.");
  }
  const ext = (prepared.name.split(".").pop() || "jpg").toLowerCase();
  const path = `products/${randomId()}.${ext}`;

  const storage = db().storage.from(RENTALS_BUCKET);
  unwrap(
    await storage.upload(path, prepared, {
      contentType: prepared.type,
      cacheControl: "31536000",
      upsert: false,
    }),
  );

  const { data } = storage.getPublicUrl(path);
  return { path, url: data.publicUrl };
};

export const removeRentalImage = async (path) => {
  if (!path || !supabase) return;
  const { error } = await supabase.storage.from(RENTALS_BUCKET).remove([path]);
  if (error) console.warn("Could not remove old image:", error.message);
};
