import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiEdit2,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiLogOut,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import {
  FALLBACK_IMAGE,
  createRental,
  deleteRental,
  fetchAllRentals,
  formatPrice,
  framingStyle,
  framingToColumns,
  getFraming,
  isMissingFramingColumns,
  removeRentalImage,
  saveRentalOrder,
  updateRental,
  uploadRentalImage,
  withoutFramingColumns,
} from "../../lib/rentals";
import RentalForm from "./RentalForm";

const errorText = (error) => {
  const message = error?.message || "";
  if (/image_(fit|zoom|pos_[xy])/.test(message)) {
    return "The database needs the image-framing update. Run supabase/002_image_framing.sql in the Supabase SQL Editor, then try again.";
  }
  return message || "Something went wrong. Please try again.";
};

const AdminDashboard = ({ userEmail, onSignOut }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | row
  const [busyId, setBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const load = useCallback(async () => {
    try {
      const rows = await fetchAllRentals();
      setRentals(rows);
      setLoadError(null);
    } catch (error) {
      setLoadError(errorText(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch; state is only updated once the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    load();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rentals.filter((r) => r.name.toLowerCase().includes(q)) : rentals;
  }, [rentals, query]);

  const liveCount = rentals.filter((r) => r.is_active).length;

  /* ------------------------------ actions ----------------------------- */

  const handleSave = async ({ values, file, imageMode, framing }) => {
    const isNew = editing === "new";
    const previous = isNew ? null : editing;

    let uploaded = null;
    let image_url = values.image_url.trim();
    let image_path = imageMode === "upload" ? values.image_path : null;

    if (imageMode === "upload" && file) {
      uploaded = await uploadRentalImage(file);
      image_url = uploaded.url;
      image_path = uploaded.path;
    }

    const payload = {
      name: values.name.trim(),
      price_amount: Number(values.price_amount),
      price_unit: values.price_unit,
      whatsapp: values.whatsapp,
      is_active: values.is_active,
      image_url: image_url || null,
      image_path: image_path || null,
      ...framingToColumns(framing),
    };

    const nextOrder = rentals.reduce((max, r) => Math.max(max, r.sort_order || 0), 0) + 1;
    const save = (data) =>
      isNew ? createRental({ ...data, sort_order: nextOrder }) : updateRental(previous.id, data);

    try {
      // If the image-framing columns haven't been added to the database yet,
      // still save everything else instead of failing the whole save.
      let saved;
      let framingSkipped = false;
      try {
        saved = await save(payload);
      } catch (error) {
        if (!isMissingFramingColumns(error)) throw error;
        saved = await save(withoutFramingColumns(payload));
        framingSkipped = true;
      }

      if (isNew) {
        setRentals((rows) => [...rows, saved]);
        toast.success(`“${saved.name}” added`);
      } else {
        setRentals((rows) => rows.map((r) => (r.id === saved.id ? saved : r)));
        if (previous.image_path && previous.image_path !== saved.image_path) {
          removeRentalImage(previous.image_path);
        }
        toast.success(`“${saved.name}” updated`);
      }
      if (framingSkipped) {
        toast(
          "Saved, but the photo framing (fit / zoom / position) wasn’t stored. Run supabase/002_image_framing.sql in the Supabase SQL Editor to enable it.",
          { icon: <FiAlertTriangle color="#b45309" />, duration: 10000 },
        );
      }
      setEditing(null);
    } catch (error) {
      if (uploaded) removeRentalImage(uploaded.path);
      throw new Error(errorText(error), { cause: error });
    }
  };

  const toggleVisibility = async (row) => {
    setBusyId(row.id);
    try {
      const updated = await updateRental(row.id, { is_active: !row.is_active });
      setRentals((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(updated.is_active ? "Now showing on the website" : "Hidden from the website");
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusyId(null);
    }
  };

  const move = async (row, direction) => {
    const index = rentals.findIndex((r) => r.id === row.id);
    const target = index + direction;
    if (target < 0 || target >= rentals.length) return;

    const reordered = [...rentals];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const previous = rentals;
    setRentals(reordered);
    setBusyId(row.id);
    try {
      setRentals(await saveRentalOrder(reordered));
    } catch (error) {
      setRentals(previous);
      toast.error(errorText(error));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    setBusyId(row.id);
    try {
      await deleteRental(row);
      setRentals((rows) => rows.filter((r) => r.id !== row.id));
      toast.success(`“${row.name}” deleted`);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  /* ------------------------------- render ----------------------------- */

  const canReorder = !query.trim();

  return (
    <div className="cms-layout">
      <header className="cms-topbar">
        <div className="cms-topbar-brand">
          <img src="/logo/vlxlogo.png" alt="VLX" />
          <div>
            <p className="cms-topbar-title">Rentals CMS</p>
            <p className="cms-topbar-sub">{userEmail}</p>
          </div>
        </div>
        <div className="cms-topbar-actions">
          <a href="/" target="_blank" rel="noreferrer" className="cms-btn cms-btn-ghost">
            <FiExternalLink aria-hidden="true" /> <span>View site</span>
          </a>
          <button type="button" className="cms-btn cms-btn-ghost" onClick={onSignOut}>
            <FiLogOut aria-hidden="true" /> <span>Sign out</span>
          </button>
        </div>
      </header>

      <main className="cms-main">
        <div className="cms-page-head">
          <div>
            <h1 className="cms-h1">Featured Rentals</h1>
            <p className="cms-muted">
              Products here appear in the “Featured Rentals” section of the homepage, in this order.
            </p>
          </div>
          <button type="button" className="cms-btn cms-btn-primary" onClick={() => setEditing("new")}>
            <FiPlus aria-hidden="true" /> Add product
          </button>
        </div>

        <div className="cms-stats">
          <div className="cms-stat">
            <span className="cms-stat-value">{rentals.length}</span>
            <span className="cms-stat-label">Total products</span>
          </div>
          <div className="cms-stat">
            <span className="cms-stat-value cms-text-live">{liveCount}</span>
            <span className="cms-stat-label">Live on site</span>
          </div>
          <div className="cms-stat">
            <span className="cms-stat-value cms-text-hidden">{rentals.length - liveCount}</span>
            <span className="cms-stat-label">Hidden</span>
          </div>
        </div>

        <div className="cms-toolbar">
          <label className="cms-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </label>
          <button type="button" className="cms-btn cms-btn-ghost" onClick={refresh} disabled={loading}>
            <FiRefreshCw aria-hidden="true" className={loading ? "cms-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {loadError && (
          <div className="cms-alert" role="alert">
            Couldn’t load products: {loadError}{" "}
            <button type="button" className="cms-link" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        {loading && rentals.length === 0 ? (
          <div className="cms-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="cms-item cms-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 && !loadError ? (
          <div className="cms-empty">
            {query ? (
              <p>No products match “{query}”.</p>
            ) : (
              <>
                <p className="cms-empty-title">No products yet</p>
                <p className="cms-muted">Add your first rental and it will show on the homepage.</p>
                <button type="button" className="cms-btn cms-btn-primary" onClick={() => setEditing("new")}>
                  <FiPlus aria-hidden="true" /> Add product
                </button>
              </>
            )}
          </div>
        ) : (
          <ul className="cms-grid">
            {filtered.map((row) => {
              const index = rentals.findIndex((r) => r.id === row.id);
              const busy = busyId === row.id;
              return (
                <li key={row.id} className={`cms-item ${row.is_active ? "" : "is-hidden"}`}>
                  <div className="cms-item-media">
                    <img
                      src={row.image_url || FALLBACK_IMAGE}
                      alt=""
                      loading="lazy"
                      style={row.image_url ? framingStyle(getFraming(row)) : undefined}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    <span className={`cms-badge ${row.is_active ? "is-live" : "is-off"}`}>
                      {row.is_active ? "Live" : "Hidden"}
                    </span>
                  </div>

                  <div className="cms-item-body">
                    <h3 className="cms-item-title">{row.name}</h3>
                    <p className="cms-item-price">{formatPrice(row.price_amount, row.price_unit)}</p>
                  </div>

                  {confirmDeleteId === row.id ? (
                    <div className="cms-item-confirm">
                      <span>Delete this product?</span>
                      <div>
                        <button
                          type="button"
                          className="cms-btn cms-btn-danger cms-btn-sm"
                          onClick={() => remove(row)}
                          disabled={busy}
                        >
                          {busy ? "Deleting…" : "Delete"}
                        </button>
                        <button
                          type="button"
                          className="cms-btn cms-btn-ghost cms-btn-sm"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={busy}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="cms-item-actions">
                      <button
                        type="button"
                        className="cms-icon-btn"
                        onClick={() => setEditing(row)}
                        title="Edit"
                        aria-label={`Edit ${row.name}`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="cms-icon-btn"
                        onClick={() => toggleVisibility(row)}
                        disabled={busy}
                        title={row.is_active ? "Hide from website" : "Show on website"}
                        aria-label={row.is_active ? `Hide ${row.name}` : `Show ${row.name}`}
                      >
                        {row.is_active ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button
                        type="button"
                        className="cms-icon-btn"
                        onClick={() => move(row, -1)}
                        disabled={!canReorder || busy || index === 0}
                        title={canReorder ? "Move earlier" : "Clear search to reorder"}
                        aria-label={`Move ${row.name} earlier`}
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        type="button"
                        className="cms-icon-btn"
                        onClick={() => move(row, 1)}
                        disabled={!canReorder || busy || index === rentals.length - 1}
                        title={canReorder ? "Move later" : "Clear search to reorder"}
                        aria-label={`Move ${row.name} later`}
                      >
                        <FiArrowDown />
                      </button>
                      <button
                        type="button"
                        className="cms-icon-btn cms-icon-btn-danger"
                        onClick={() => setConfirmDeleteId(row.id)}
                        disabled={busy}
                        title="Delete"
                        aria-label={`Delete ${row.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {editing && (
        <RentalForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
