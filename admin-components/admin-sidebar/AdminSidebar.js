import React from "react";
import Link from "next/link";
import classes from "@/styles/admin/admin-sidebar/adminSidebar.module.css"

export default function AdminSidebar() {
  return (
    <aside className={classes.sidebar}>
      <nav>
        <ul>
          <li><Link href="/admin/stables">Stables</Link></li>
          <li><Link href="/admin/horse-race">Horse Race</Link></li>
          <li><Link href="/admin/showjumping-events">Showjumping</Link></li>
          <li><Link href="/admin/horses">Horses</Link></li>
          <li><Link href="/admin/tours">Tours</Link></li>
        </ul>
      </nav>
    </aside>
  );
}
