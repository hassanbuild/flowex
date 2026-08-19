import { notFound } from "next/navigation";

import PublicFlowexForm, {
  type PublicFlowexField,
} from "@/components/PublicFlowexForm";

import { createAdminClient } from "@/lib/supabase/admin";

type FlowexFormConfig = {
  title?: unknown;
  fields?: unknown;
};

export default async function PublicFlowexFormPage({
  params,
}: {
  params: Promise<{
    publicKey: string;
  }>;
}) {
  const {
    publicKey,
  } =
    await params;

  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("lead_sources")
      .select(
        "public_key, enabled, source_type, config"
      )
      .eq(
        "public_key",
        publicKey
      )
      .eq(
        "source_type",
        "flowex_form"
      )
      .maybeSingle();

  if (
    error ||
    !data ||
    !data.enabled
  ) {
    notFound();
  }

  const config =
    data.config as FlowexFormConfig;

  const title =
    typeof config?.title ===
      "string" &&
    config.title.trim()
      ? config.title.trim()
      : "Contact Us";

  const fields =
    Array.isArray(
      config?.fields
    )
      ? config.fields as PublicFlowexField[]
      : [];

  if (
    fields.length < 3 ||
    fields.length > 5
  ) {
    notFound();
  }

  return (
    <PublicFlowexForm
      publicKey={
        data.public_key
      }
      title={title}
      fields={fields}
    />
  );
}