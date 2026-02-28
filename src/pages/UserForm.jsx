import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import api from "../api";
import "./UserForm.css";

function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    title: "", initials: "", role: "",
    responsibilities: [],
  });


  const [roles, setRoles] = useState([]);
  const [responsibilities, setResponsibilities] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value);
    return [];
  }

useEffect(() => {
  async function loadDropdowns() {
    try {
      const rolesRes = await api.post("/role/dropdown", { type: "0", id: "" });
      console.log("Roles from API:", rolesRes.data);

      const rolesPayload = rolesRes.data?.data || rolesRes.data || {};

      //  API returns object like { admin: 'id1', Developer: 'id2' }
      // convert it to array like [{ id: 'id1', name: 'admin' }]
      let rolesArray = [];

      if (Array.isArray(rolesPayload)) {
        // already an array — use as is
        rolesArray = rolesPayload;
      } else if (typeof rolesPayload === "object") {
        // convert object to array
        // key = role name, value = role id
        rolesArray = Object.entries(rolesPayload).map(([name, id]) => ({
          id: id,
          name: name,
        }));
      }

      console.log("Converted roles:", rolesArray); // check result
      setRoles(rolesArray);

      // responsibilities
      const respRes = await api.get("/user/dropdown-responsibility");
      const respData = respRes.data?.data || respRes.data || [];
      setResponsibilities(Array.isArray(respData) ? respData : []);

    } catch (err) {
      console.log("Dropdown error:", err.response?.data);
    }
  }
  loadDropdowns();
}, []);

useEffect(() => {
  if (!isEdit) { setPageLoading(false); return; }

  async function fetchUser() {
    try {
      const { data } = await api.get(`/user/${id}`);
      const user = data.data || data;

      //  console.log to see exact API response shape
      console.log("User data from API:", user);

      setForm({
        
        name:     user.name || user.first_name || "",
        email:    user.email    || "",
        phone:    user.phone    || "",
        title:    user.title    || "",
        initials: user.initials || "",

        // try all possible role field names
        role: user.role_id || user.role?.id || user.role || "",

        //  try all possible responsibility shapes
        responsibilities: toArray(user.responsibilities).map(
          (r) => r.id ?? r
        ),
      });

      setExistingImage(user.profile_image_url || user.avatar || null);

    } catch (err) {
      console.error("Failed to fetch user", err);
    } finally {
      setPageLoading(false);
    }
  }

  fetchUser();
}, [id, isEdit]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function handlePhoneChange(e) {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setForm({ ...form, phone: value });
      setErrors({ ...errors, phone: "" });
    } else {
      setErrors({ ...errors, phone: "Phone number must contain only digits." });
    }
  }

  function toggleResponsibility(respId) {
    const updated = form.responsibilities.includes(respId)
      ? form.responsibilities.filter((r) => r !== respId)
      : [...form.responsibilities, respId];
    setForm({ ...form, responsibilities: updated });
    if (updated.length > 0) setErrors({ ...errors, responsibilities: "" });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleRemoveImage() {
    if (isEdit && existingImage) {
      try { await api.delete(`/user/${id}/image`); } catch (_) {}
    }
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())  errs.name  = "Name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
    if (form.phone && !/^\d{10,15}$/.test(form.phone)) errs.phone = "Phone must be 10-15 digits.";
    if (!form.role) errs.role = "Role is required.";
    if (form.responsibilities.length === 0) errs.responsibilities = "Select at least one.";
    return errs;
  }

async function handleSave() {
  const errs = validate();
  if (Object.keys(errs).length > 0) { setErrors(errs); return; }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("name",     form.name);
    formData.append("email",    form.email);
    formData.append("phone",    form.phone);
    formData.append("title",    form.title);
    formData.append("initials", form.initials);
    formData.append("role",     form.role);

    //  try sending as JSON string instead of multiple appends
    formData.append("responsibilities", JSON.stringify(form.responsibilities));

    if (imageFile) formData.append("user_picture", imageFile);

    // log what we send
    for (let [key, value] of formData.entries()) {
      console.log(key, ":", value);
    }

    await api.post("/user", formData);
    navigate("/users");

  } catch (err) {
    console.log("Error response:", err.response?.data);
    setErrors({ api: err.response?.data?.message || "Failed to save user." });
  } finally {
    setLoading(false);
  }
}

  if (pageLoading) return <p className="loading-text">Loading...</p>;

  const currentImage = imagePreview || existingImage;

  return (
    <div className="form-page-bg">
      <div className="form-modal">

        {/* ── Header ── */}
        <div className="form-modal-header">
          <h2>{isEdit ? "Edit User" : "Add New User"}</h2>
          <button className="close-btn" onClick={() => navigate("/users")}>✕</button>
        </div>

        {/* ── API Error ── */}
        {errors.api && <p className="error-msg">{errors.api}</p>}

        {/* ── Profile Image ── */}
        <div className="image-section">
          <div className="image-circle">
            {currentImage
              ? <img src={currentImage} alt="profile" />
              : <span className="avatar-placeholder">👤</span>
            }
            {/* Camera icon overlay */}
            <button
              type="button"
              className="camera-btn"
              onClick={() => fileRef.current.click()}
            >📷</button>

            {/* Trash icon — only in edit mode when image exists */}
            {currentImage && (
              <button
                type="button"
                className="trash-btn"
                onClick={handleRemoveImage}
              >🗑</button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        {/* ── Form Grid ── */}
        <div className="form-grid">

          <div className="form-group">
            <label>Name<span className="required">*</span></label>
            <input
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email<span className="required">*</span></label>
            <input
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              name="phone"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handlePhoneChange}
              className={errors.phone ? "input-error" : ""}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label>Title</label>
            <input
              name="title"
              placeholder="Enter your title"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Initials</label>
            <input
              name="initials"
              placeholder="Enter your initials"
              value={form.initials}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Role<span className="required">*</span></label>
<select
  name="role"
  value={form.role}
  onChange={handleChange}
  className={errors.role ? "input-error" : ""}
>
  <option value="">Select your role</option>
  {roles.map((r) => (
    //  use r.id as value, show r.name or r.title
    <option key={r.id} value={r.id}>
      {r.name || r.title}
    </option>
  ))}
</select>
            {errors.role && <span className="field-error">{errors.role}</span>}
          </div>

        </div>

        {/* ── Designation / Responsibilities ── */}
        <div className="form-group">
          <label>Designation</label>
          <div className="checkbox-group">
            {responsibilities.map((resp) => (
              <label key={resp.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.responsibilities.includes(resp.id)}
                  onChange={() => toggleResponsibility(resp.id)}
                />
                {resp.title || resp.name}
              </label>
            ))}
          </div>
          {errors.responsibilities && (
            <span className="field-error">{errors.responsibilities}</span>
          )}
        </div>

        {/* ── Save Button ── */}
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : isEdit ? "Save" : "Add New User"}
        </button>

      </div>
    </div>
  );
}

export default UserForm;