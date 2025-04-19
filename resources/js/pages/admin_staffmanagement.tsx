import React, { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";

export default function AdminStaffManagement() {


  return (
    <AppLayout breadcrumbs={[{ title: "Staff Management", href: "/admin/staffmanagement" }]}>
      <Head title="Staff Management" />
      <div className="flex flex-col gap-4 rounded-xl p-4">
        <div className="p-4 bg-gray-800 rounded-xl w-full overflow-x-auto max-w-5xl">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span>Staff Management</span>
          </h3>
          </div>
        </div>
    </AppLayout>
  );
}
