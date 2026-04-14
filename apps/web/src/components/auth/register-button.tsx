"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RegisterFormProps {
  variant?: string;
}

export function RegisterForm({ variant }: RegisterFormProps) {
  if (variant === "button") {
    return (
      <Link href="/auth/register">
        <Button className="bg-[#87A96B] hover:bg-[#7A9E7E] text-white">
          Cadastre-se
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/auth/register" className="text-sm font-medium hover:underline">
      Cadastre-se
    </Link>
  );
}
