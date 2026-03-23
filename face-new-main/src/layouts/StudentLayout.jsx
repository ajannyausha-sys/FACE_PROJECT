import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../context/AppStateContext";
import "../styles/student.css";

export default function StudentLayout() {
  const { logout, currentUser, notifications } = useAppState();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const visibleNotifications = notifications.filter(
    (item) =>
      (!item.targetRole || item.targetRole === "student") &&
      (!item.targetUserId || item.targetUserId === currentUser?.id)
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="student-container">
      <nav className="student-navbar">
        <div className="logo-wrapper">
          <div className="logo-short">F.A.C.E</div>
          <div className="logo-long">Facial Attendance Control Engine</div>
        </div>

        <ul className="student-nav-links">
          <li>
            <NavLink to="/student/home">Home</NavLink>
          </li>
          <li>
            <NavLink to="/student/attendance">Attendance</NavLink>
          </li>
          <li>
            <NavLink to="/student/absence">Absence Details</NavLink>
          </li>
          <li>
            <NavLink to="/student/leave">Request Duty Leave</NavLink>
          </li>
        </ul>

        <div className="navbar-actions">
          <div className="notifications-wrapper">
            <div
              className="notification-icon"
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              🔔
            </div>
            {visibleNotifications.length > 0 && <span className="notification-badge" />}

            {notificationsOpen && (
              <div className="notifications-menu">
                <p className="menu-title">Notifications</p>
                {visibleNotifications.length === 0 ? (
                  <p className="notification-empty">No notifications.</p>
                ) : (
                  visibleNotifications.slice(0, 8).map((item) => (
                    <p key={item.id} className="notification-item">
                      {item.message}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="profile-wrapper">
          <div className="profile-icon" onClick={() => setOpen((prev) => !prev)}>
            👤
          </div>

          {open && (
            <div className="profile-menu">
              <p>{currentUser?.name}</p>
              <p>{currentUser?.email}</p>
              <p className="logout" onClick={handleLogout}>
                Logout
              </p>
            </div>
          )}
        </div>
        </div>
      </nav>

      <div className="student-page-content">
        <Outlet />
      </div>
    </div>
  );
}
