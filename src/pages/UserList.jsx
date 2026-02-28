

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import './UserList.css'

/* ── API ── */
const api = axios.create({ baseURL: "http://13.210.33.250/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("company_id");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (companyId) config.headers.company_id = companyId;
  config.headers.Accept = "application/json";
  return config;
});

/* ── Toast Component ── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === "success" ? "✓" : "✕"} {message}
    </div>
  );
}

/* ── Confirm Modal ── */
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon">!</div>
        <h3>Are you sure?</h3>
        <p>You won't be able to revert this!</p>
        <div className="modal-actions">
          <button className="modal-confirm" onClick={onConfirm}>Yes, delete it!</button>
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function getRoleName(role) {
  if (!role) return "NIL";
  if (typeof role === "string") return role;
  if (typeof role === "object") return role.name || role.title || "NIL";
  return "NIL";
}

const ITEMS_PER_PAGE = 10;

/* ── Main Component ── */
function UserList() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* ── Fetch users ── */
const fetchUsers = useCallback(async () => {
  setLoading(true);
  try {
    const { data } = await api.get("/user");
    const userList = data.data || [];
    
    //  check what status values look like
    console.log("First user status:", userList[0]?.status);
    console.log("Status type:", typeof userList[0]?.status);
    
    setUsers(userList);
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  /* ── Logout ── */
async function handleLogout() {
  try {
    await api.post("/logout");
  } catch (_) {}
  localStorage.clear();
  window.location.href = "/login"; // ← this redirects to login
}

  /* ── Toggle Status ── */
async function handleToggleStatus(user) {
  //  calculate new status correctly
  const currentlyActive = isActive(user);
  const newStatus = currentlyActive ? 0 : 1;

  console.log(`Toggling user ${user.id}: ${currentlyActive} → ${newStatus}`);

  try {
    await api.post(`/user/${user.id}/status`, { status: newStatus });
    setToast({ message: "Status changed successfully.", type: "success" });
    fetchUsers(); // refresh list
  } catch (err) {
    console.log("Toggle error:", err.response?.data);
    setToast({ message: "Failed to change status.", type: "error" });
  }
}

  /* ── Delete ── */
  async function handleDelete() {
    try {
      await api.delete(`/user/${deleteId}`);
      setToast({ message: "User deleted successfully.", type: "success" });
      setDeleteId(null);
      fetchUsers();
    } catch {
      setToast({ message: "Failed to delete user.", type: "error" });
    }
  }

  const isActive = (user) => {
  const s = user.status;
  return s === 1 || s === "1" || s === "Active" || s === "active" || s === true;
};

  /* ── Filter ── */
  const filteredUsers = users.filter((user) => {
    const text = search.toLowerCase().trim();
    const matchesSearch =
      !text ||
      user.name?.toLowerCase().includes(text) ||
      user.first_name?.toLowerCase().includes(text) ||
      user.email?.toLowerCase().includes(text);
    const userStatus = isActive(user) ? "1" : "0";
    const matchesStatus = statusFilter === "" || userStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="layout">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">LOGO</div>

        <p className="sidebar-section-title">MAIN MENU</p>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <span>⊞</span> Dashboard
          </li>
          <li className="sidebar-item active">
            <span>👤</span> User Management
          </li>
          <li className="sidebar-item">
            <span>👥</span> Team
          </li>
        </ul>

        <p className="sidebar-section-title">SETTINGS</p>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <span>⚙</span> Settings
          </li>
        </ul>

        {/* Logout button at bottom of sidebar */}
        <button className="logout-btn" onClick={handleLogout}>
          ↩ Logout
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content">

        {/* Toast */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* Delete Modal */}
        {deleteId && (
          <ConfirmModal
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        )}

        {/* ── Top Bar ── */}
        <div className="topbar">
          <h2 className="page-title">Jobs Management</h2>
          <div className="topbar-right">
            <span className="notif-icon">🔔</span>
            <div className="avatar">U</div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="filters">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>

          <button className="btn-add" onClick={() => navigate("/users/add")}>
            + Add New User
          </button>
        </div>

        {/* ── Table ── */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>S.L</th>
                <th>Name</th>
                <th>Email</th>
                <th>Initials</th>
                <th>Phone Number</th>
                <th>Role</th>
                <th>Status</th>
                <th>Title</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="table-msg">Loading...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={9} className="table-msg">No users found</td></tr>
              ) : paginatedUsers.map((u, i) => (
                <tr key={u.id}>
                  <td>{(page - 1) * ITEMS_PER_PAGE + i + 1}</td>
                  <td>{u.name || u.first_name || "NIL"}</td>
                  <td>{u.email || "NIL"}</td>
                  <td>{u.initials || "NIL"}</td>
                  <td>{u.phone || "NIL"}</td>
                  <td>{getRoleName(u.role)}</td>
                  <td>
                    {/* Toggle switch */}
                    <div
                      className={`toggle-track ${isActive(u) ? "on" : "off"}`}
                      onClick={() => handleToggleStatus(u)}
                    >
                      <div className="toggle-thumb" />
                    </div>
                  </td>
                  <td>{u.title || "NIL"}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn-edit"
                        onClick={() => navigate(`/users/edit/${u.id}`)}
                        title="Edit"
                      >✏</button>
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteId(u.id)}
                        title="Delete"
                      >🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="pagination-wrapper">
          <span className="pagination-info">
            showing {filteredUsers.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} results
          </span>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={page === i + 1 ? "page-active" : ""}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default UserList;