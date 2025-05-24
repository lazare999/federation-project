import React from "react";

import AdminHeader from "@/admin-components/admin-header/AdminHeader";
import AdminSidebar from "@/admin-components/admin-sidebar/AdminSidebar";

import classes from "@/styles/admin/admin-layout/adminLayout.module.css";

export default function AdminLayout({ children }) {
  return (
    <html lang="en">
      <body className={classes.body}>
        <div className={classes.layout}>
          <AdminHeader />
          <div className={classes.mainContent}>
            <AdminSidebar />
            <main className={classes.content}>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
