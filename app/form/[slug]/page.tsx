"use client";

import {
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";

import PublicFlowexForm, {
  type PublicFlowexField,
} from "@/components/PublicFlowexForm";

import { createClient } from "@/lib/supabase/client";

type FlowexFormConfig = {
  title?: unknown;
  fields?: unknown;
};

export default function PublicFlowexFormPage() {
  const params =
    useParams<{
      slug: string;
    }>();

  const [supabase] =
    useState(() =>
      createClient()
    );

  const [title, setTitle] =
    useState("");

  const [fields, setFields] =
    useState<
      PublicFlowexField[]
    >([]);

  const [publicKey, setPublicKey] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadForm = async () => {
      setLoading(true);
      setNotFound(false);

      const slug =
        params?.slug;

      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "lead_sources"
          )
          .select(
            "public_key, enabled, source_type, config"
          )
          .eq(
            "slug",
            slug
          )
          .eq(
            "source_type",
            "flowex_form"
          )
          .eq(
            "enabled",
            true
          )
          .maybeSingle();

      if (
        cancelled
      ) {
        return;
      }

      if (
        error ||
        !data
      ) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const config =
        data.config as
          FlowexFormConfig;

      const savedTitle =
        typeof config?.title ===
          "string"
          ? config.title.trim()
          : "";

      const savedFields =
        Array.isArray(
          config?.fields
        )
          ? config.fields as PublicFlowexField[]
          : [];

      if (
        !savedTitle ||
        savedFields.length < 3 ||
        savedFields.length > 5
      ) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTitle(
        savedTitle
      );

      setFields(
        savedFields
      );

      setPublicKey(
        data.public_key || ""
      );

      setLoading(false);
    };

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [
    params?.slug,
    supabase,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]" />
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4 text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            Form not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            This form is unavailable.
          </p>
        </div>
      </main>
    );
  }

  return (
    <PublicFlowexForm
      publicKey={
        publicKey
      }
      title={title}
      fields={fields}
    />
  );
}
