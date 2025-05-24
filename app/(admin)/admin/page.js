import React from "react";
import Link from "next/link";
import classes from "@/styles/admin/admin-dashboard/adminDashboard.module.css";

export default function AdminPage() {
  return (
    <div className={classes.container}>
      <h1 className={classes.heading}>Admin Dashboard</h1>

      <div className={classes.cardGrid}>
        <AdminCard title="Events" href="/admin/events" />
        <AdminCard title="Horse Race Events" href="/admin/horse-race" />
        <AdminCard title="Showjumping Events" href="/admin/showjumping-events" />
        <AdminCard title="Horses" href="/admin/horses" />
        <AdminCard title="Tours" href="/admin/tours" />
      </div>
    </div>
  );
}

function AdminCard({ title, href }) {
  return (
    <div className={classes.card}>
      <h2>{title}</h2>
      <p>Manage {title.toLowerCase()}.</p>
      <Link href={href} className={classes.link}>
        Go to {title}
      </Link>
    </div>
  );
}
