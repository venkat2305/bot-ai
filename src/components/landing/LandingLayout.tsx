"use client";

import React from "react";

const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-color)]">
      <main className="container mx-auto px-4">{children}</main>
    </div>
  );
};

export default LandingLayout;
