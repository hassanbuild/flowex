"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SourceType = "flowex" | "external";
type StorageType = "sheets" | "airtable" | "slack";
type ReplyType = "instant" | "friendly" | "custom";

type FlowexFieldType =
  | "full_name"
  | "email"
  | "phone"
  | "company"
  | "short_text"
  | "long_text"
  | "number"
  | "dropdown"
  | "date"
  | "website";

type FlowexFormField = {
  id: string;
  type: FlowexFieldType;
  label: string;
  required: boolean;
  options: string[];
  countryCode?: string;
  allowCountryCodeSelection?: boolean;
};

const flowexFieldOptions: {
  value: FlowexFieldType;
  label: string;
}[] = [
  { value: "full_name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "website", label: "Website" },
];

const phoneCountryCodes = [
  { code: "+93", country: "Afghanistan" },
  { code: "+355", country: "Albania" },
  { code: "+213", country: "Algeria" },
  { code: "+376", country: "Andorra" },
  { code: "+244", country: "Angola" },
  { code: "+54", country: "Argentina" },
  { code: "+374", country: "Armenia" },
  { code: "+61", country: "Australia" },
  { code: "+43", country: "Austria" },
  { code: "+994", country: "Azerbaijan" },
  { code: "+973", country: "Bahrain" },
  { code: "+880", country: "Bangladesh" },
  { code: "+375", country: "Belarus" },
  { code: "+32", country: "Belgium" },
  { code: "+501", country: "Belize" },
  { code: "+229", country: "Benin" },
  { code: "+975", country: "Bhutan" },
  { code: "+591", country: "Bolivia" },
  { code: "+387", country: "Bosnia & Herzegovina" },
  { code: "+267", country: "Botswana" },
  { code: "+55", country: "Brazil" },
  { code: "+673", country: "Brunei" },
  { code: "+359", country: "Bulgaria" },
  { code: "+226", country: "Burkina Faso" },
  { code: "+257", country: "Burundi" },
  { code: "+855", country: "Cambodia" },
  { code: "+237", country: "Cameroon" },
  { code: "+1", country: "Canada / United States" },
  { code: "+238", country: "Cape Verde" },
  { code: "+236", country: "Central African Republic" },
  { code: "+235", country: "Chad" },
  { code: "+56", country: "Chile" },
  { code: "+86", country: "China" },
  { code: "+57", country: "Colombia" },
  { code: "+269", country: "Comoros" },
  { code: "+242", country: "Congo" },
  { code: "+243", country: "Congo (DRC)" },
  { code: "+506", country: "Costa Rica" },
  { code: "+385", country: "Croatia" },
  { code: "+53", country: "Cuba" },
  { code: "+357", country: "Cyprus" },
  { code: "+420", country: "Czech Republic" },
  { code: "+45", country: "Denmark" },
  { code: "+253", country: "Djibouti" },
  { code: "+1", country: "Dominican Republic" },
  { code: "+593", country: "Ecuador" },
  { code: "+20", country: "Egypt" },
  { code: "+503", country: "El Salvador" },
  { code: "+240", country: "Equatorial Guinea" },
  { code: "+291", country: "Eritrea" },
  { code: "+372", country: "Estonia" },
  { code: "+268", country: "Eswatini" },
  { code: "+251", country: "Ethiopia" },
  { code: "+679", country: "Fiji" },
  { code: "+358", country: "Finland" },
  { code: "+33", country: "France" },
  { code: "+241", country: "Gabon" },
  { code: "+220", country: "Gambia" },
  { code: "+995", country: "Georgia" },
  { code: "+49", country: "Germany" },
  { code: "+233", country: "Ghana" },
  { code: "+30", country: "Greece" },
  { code: "+502", country: "Guatemala" },
  { code: "+224", country: "Guinea" },
  { code: "+245", country: "Guinea-Bissau" },
  { code: "+592", country: "Guyana" },
  { code: "+509", country: "Haiti" },
  { code: "+504", country: "Honduras" },
  { code: "+852", country: "Hong Kong" },
  { code: "+36", country: "Hungary" },
  { code: "+354", country: "Iceland" },
  { code: "+91", country: "India" },
  { code: "+62", country: "Indonesia" },
  { code: "+98", country: "Iran" },
  { code: "+964", country: "Iraq" },
  { code: "+353", country: "Ireland" },
  { code: "+972", country: "Israel" },
  { code: "+39", country: "Italy" },
  { code: "+225", country: "Ivory Coast" },
  { code: "+81", country: "Japan" },
  { code: "+962", country: "Jordan" },
  { code: "+7", country: "Kazakhstan" },
  { code: "+254", country: "Kenya" },
  { code: "+965", country: "Kuwait" },
  { code: "+996", country: "Kyrgyzstan" },
  { code: "+856", country: "Laos" },
  { code: "+371", country: "Latvia" },
  { code: "+961", country: "Lebanon" },
  { code: "+266", country: "Lesotho" },
  { code: "+231", country: "Liberia" },
  { code: "+218", country: "Libya" },
  { code: "+423", country: "Liechtenstein" },
  { code: "+370", country: "Lithuania" },
  { code: "+352", country: "Luxembourg" },
  { code: "+853", country: "Macau" },
  { code: "+261", country: "Madagascar" },
  { code: "+265", country: "Malawi" },
  { code: "+60", country: "Malaysia" },
  { code: "+960", country: "Maldives" },
  { code: "+223", country: "Mali" },
  { code: "+356", country: "Malta" },
  { code: "+222", country: "Mauritania" },
  { code: "+230", country: "Mauritius" },
  { code: "+52", country: "Mexico" },
  { code: "+373", country: "Moldova" },
  { code: "+377", country: "Monaco" },
  { code: "+976", country: "Mongolia" },
  { code: "+382", country: "Montenegro" },
  { code: "+212", country: "Morocco" },
  { code: "+258", country: "Mozambique" },
  { code: "+95", country: "Myanmar" },
  { code: "+264", country: "Namibia" },
  { code: "+977", country: "Nepal" },
  { code: "+31", country: "Netherlands" },
  { code: "+64", country: "New Zealand" },
  { code: "+505", country: "Nicaragua" },
  { code: "+227", country: "Niger" },
  { code: "+234", country: "Nigeria" },
  { code: "+850", country: "North Korea" },
  { code: "+389", country: "North Macedonia" },
  { code: "+47", country: "Norway" },
  { code: "+968", country: "Oman" },
  { code: "+92", country: "Pakistan" },
  { code: "+970", country: "Palestine" },
  { code: "+507", country: "Panama" },
  { code: "+675", country: "Papua New Guinea" },
  { code: "+595", country: "Paraguay" },
  { code: "+51", country: "Peru" },
  { code: "+63", country: "Philippines" },
  { code: "+48", country: "Poland" },
  { code: "+351", country: "Portugal" },
  { code: "+974", country: "Qatar" },
  { code: "+40", country: "Romania" },
  { code: "+7", country: "Russia" },
  { code: "+250", country: "Rwanda" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+221", country: "Senegal" },
  { code: "+381", country: "Serbia" },
  { code: "+248", country: "Seychelles" },
  { code: "+232", country: "Sierra Leone" },
  { code: "+65", country: "Singapore" },
  { code: "+421", country: "Slovakia" },
  { code: "+386", country: "Slovenia" },
  { code: "+252", country: "Somalia" },
  { code: "+27", country: "South Africa" },
  { code: "+82", country: "South Korea" },
  { code: "+211", country: "South Sudan" },
  { code: "+34", country: "Spain" },
  { code: "+94", country: "Sri Lanka" },
  { code: "+249", country: "Sudan" },
  { code: "+597", country: "Suriname" },
  { code: "+46", country: "Sweden" },
  { code: "+41", country: "Switzerland" },
  { code: "+963", country: "Syria" },
  { code: "+886", country: "Taiwan" },
  { code: "+992", country: "Tajikistan" },
  { code: "+255", country: "Tanzania" },
  { code: "+66", country: "Thailand" },
  { code: "+228", country: "Togo" },
  { code: "+216", country: "Tunisia" },
  { code: "+90", country: "Turkey" },
  { code: "+993", country: "Turkmenistan" },
  { code: "+256", country: "Uganda" },
  { code: "+380", country: "Ukraine" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+44", country: "United Kingdom" },
  { code: "+598", country: "Uruguay" },
  { code: "+998", country: "Uzbekistan" },
  { code: "+58", country: "Venezuela" },
  { code: "+84", country: "Vietnam" },
  { code: "+967", country: "Yemen" },
  { code: "+260", country: "Zambia" },
  { code: "+263", country: "Zimbabwe" }
];

const isEditableFieldLabel = (
  type: FlowexFieldType
) =>
  type === "short_text" ||
  type === "long_text" ||
  type === "number";

const getDefaultFieldLabel = (
  type: FlowexFieldType
) =>
  flowexFieldOptions.find(
    (option) => option.value === type
  )?.label || "Field";

function buildFormSlug(
  title: string
) {
  const base =
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join("")
      .slice(0, 50);

  return base || "FlowexForm";
}

function shortSlugSuffix() {
  return Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();
}

export default function ManageLeadCapturePage() {
  const { plan } = useAppAccount();
  const router = useRouter();

  const [supabase] = useState(() =>
    createClient()
  );

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  useEffect(() => {
    if (!hasPremiumAccess) {
      router.replace("/home");
    }
  }, [hasPremiumAccess, router]);

  const [active, setActive] = useState(true);

  const [sourceType, setSourceType] = useState<SourceType>("flowex");

  const [externalSourceId, setExternalSourceId] =
    useState<string | null>(null);

  const [externalPublicKey, setExternalPublicKey] =
    useState("");

  const [externalUrl, setExternalUrl] =
    useState("");

  const [externalVerified, setExternalVerified] =
    useState(false);

  const [externalDetectedFields, setExternalDetectedFields] =
    useState<
      {
        key: string;
        type: string;
      }[]
    >([]);

  const [isConnectingExternal, setIsConnectingExternal] =
    useState(false);

  const [externalSourceError, setExternalSourceError] =
    useState("");

  const [externalCaptureConnected, setExternalCaptureConnected] =
    useState(false);

  const [isCheckingExternalConnection, setIsCheckingExternalConnection] =
    useState(false);

  const [copiedLovableSetup, setCopiedLovableSetup] =
    useState(false);

  const [showFormCustomizer, setShowFormCustomizer] =
    useState(false);

  const [flowexFormTitle, setFlowexFormTitle] =
    useState("");

  const [flowexFormFields, setFlowexFormFields] =
    useState<FlowexFormField[]>([]);

  const [selectedFlowexField, setSelectedFlowexField] =
    useState("");

  const [formCustomizerError, setFormCustomizerError] =
    useState("");

  const [flowexFormSourceId, setFlowexFormSourceId] =
    useState<string | null>(null);

  const [flowexFormSlug, setFlowexFormSlug] =
    useState("");

  const [isSavingFlowexForm, setIsSavingFlowexForm] =
    useState(false);

  const [copiedFormLink, setCopiedFormLink] =
    useState(false);

  const [storageType, setStorageType] =
    useState<StorageType>("sheets");

  const [storageDestination, setStorageDestination] =
    useState("");

  const [replyType, setReplyType] =
    useState<ReplyType>("instant");

  const [customReply, setCustomReply] = useState(
    "Thanks for reaching out. We’ve received your message and will get back to you shortly."
  );

  const [companyEmail, setCompanyEmail] = useState("");

  const [followUpEnabled, setFollowUpEnabled] =
    useState(true);

  const [followUpDelay, setFollowUpDelay] =
    useState("24");

  const [followUpMessage, setFollowUpMessage] =
    useState(
      "Just following up in case you missed our previous message. Let us know if you have any questions."
    );

  useEffect(() => {
    const saved = localStorage.getItem(
      "flowex-lead-capture"
    );

    if (!saved) return;

    const data = JSON.parse(saved);

    setActive(data.active ?? true);
    setSourceType(
      data.sourceType === "external"
        ? "external"
        : "flowex"
    );
    setStorageType(data.storageType || "sheets");
    setStorageDestination(
      data.storageDestination || ""
    );
    setReplyType(data.replyType || "instant");
    setCustomReply(data.customReply || "");
    setCompanyEmail(data.companyEmail || "");
    setFollowUpEnabled(
      data.followUpEnabled ?? true
    );
    setFollowUpDelay(
      data.followUpDelay || "24"
    );
    setFollowUpMessage(
      data.followUpMessage || ""
    );

    if (data.flowexFormTitle) {
      setFlowexFormTitle(
        data.flowexFormTitle
      );
    }

    if (
      Array.isArray(
        data.flowexFormFields
      )
    ) {
      setFlowexFormFields(
        data.flowexFormFields
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSavedFlowexForm = async () => {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (
        !user ||
        cancelled
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("lead_sources")
          .select(
            "id, slug, config"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "source_type",
            "flowex_form"
          )
          .order(
            "updated_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (
        error ||
        !data ||
        cancelled
      ) {
        return;
      }

      setFlowexFormSourceId(
        data.id
      );

      setFlowexFormSlug(
        data.slug || ""
      );

      const config =
        data.config as {
          title?: unknown;
          fields?: unknown;
        } | null;

      if (
        typeof config?.title ===
        "string"
      ) {
        setFlowexFormTitle(
          config.title
        );
      }

      if (
        Array.isArray(
          config?.fields
        )
      ) {
        setFlowexFormFields(
          config.fields as FlowexFormField[]
        );
      }
    };

    void loadSavedFlowexForm();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    const loadExternalSource = async () => {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (
        !user ||
        cancelled
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("lead_sources")
          .select(
            "id, public_key, verified, detected_fields, config"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "source_type",
            "external_form"
          )
          .order(
            "updated_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (
        error ||
        !data ||
        cancelled
      ) {
        return;
      }

      setExternalSourceId(
        data.id
      );

      setExternalPublicKey(
        data.public_key || ""
      );

      setExternalVerified(
        data.verified === true
      );

      setExternalDetectedFields(
        Array.isArray(
          data.detected_fields
        )
          ? data.detected_fields
          : []
      );

      const config =
        data.config as {
          source_url?: unknown;
          capture_connected?: unknown;
        } | null;

      setExternalCaptureConnected(
        config?.capture_connected === true
      );

      if (
        typeof config?.source_url ===
        "string"
      ) {
        setExternalUrl(
          config.source_url
        );
      }
    };

    void loadExternalSource();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const connectExternalForm = async () => {
    if (
      isConnectingExternal
    ) {
      return;
    }

    setExternalSourceError("");

    if (!externalUrl.trim()) {
      setExternalSourceError(
        "Paste your form URL first."
      );
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl =
        new URL(
          externalUrl.trim()
        );

      if (
        parsedUrl.protocol !==
          "https:" &&
        parsedUrl.protocol !==
          "http:"
      ) {
        throw new Error();
      }
    } catch {
      setExternalSourceError(
        "Enter a valid form URL."
      );
      return;
    }

    setIsConnectingExternal(
      true
    );

    try {
      const {
        data: {
          session,
        },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !session
      ) {
        setExternalSourceError(
          "Your session could not be verified. Please log in again."
        );
        return;
      }

      const response =
        await fetch(
          "/api/external-form/verify",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                url:
                  parsedUrl.toString(),

                sourceId:
                  externalSourceId,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        result?.verified !== true
      ) {
        setExternalVerified(
          false
        );

        setExternalSourceError(
          result?.error ||
            "Not compatible. Use the direct URL of your form or data-capture page."
        );

        return;
      }

      setExternalSourceId(
        result.sourceId
      );

      setExternalPublicKey(
        result.publicKey || ""
      );

      setExternalCaptureConnected(false);

      setExternalUrl(
        result.url
      );

      setExternalVerified(
        true
      );

      setExternalDetectedFields(
        Array.isArray(
          result.detectedFields
        )
          ? result.detectedFields
          : []
      );

      setExternalSourceError(
        ""
      );
    } catch {
      setExternalVerified(
        false
      );

      setExternalSourceError(
        "Flowex could not verify this URL. Please try again."
      );
    } finally {
      setIsConnectingExternal(
        false
      );
    }
  };

  const unlinkExternalForm = async () => {
    if (
      isConnectingExternal ||
      !externalSourceId
    ) {
      return;
    }

    setExternalSourceError("");
    setIsConnectingExternal(
      true
    );

    try {
      const {
        data: {
          session,
        },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !session
      ) {
        setExternalSourceError(
          "Your session could not be verified. Please log in again."
        );
        return;
      }

      const response =
        await fetch(
          "/api/external-form/verify",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                sourceId:
                  externalSourceId,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setExternalSourceError(
          result?.error ||
            "Flowex could not unlink this form."
        );
        return;
      }

      setExternalVerified(
        false
      );

      setExternalDetectedFields(
        []
      );

      setExternalSourceId(
        null
      );

      setExternalPublicKey(
        ""
      );

      setExternalCaptureConnected(false);
      setCopiedLovableSetup(false);

      setExternalUrl(
        ""
      );
    } catch {
      setExternalSourceError(
        "Flowex could not unlink this form."
      );
    } finally {
      setIsConnectingExternal(
        false
      );
    }
  };

  const copyLovableSetupInstruction = async () => {
    if (!externalPublicKey) return;

    const origin = window.location.origin;
    const instruction = `Add this script to this page, preferably just before the closing </body> tag. Do not change the design or behavior and publish it. Script: <script src="${origin}/flowex-capture.js" data-flowex-key="${externalPublicKey}"></script>`;

    await navigator.clipboard.writeText(instruction);
    setCopiedLovableSetup(true);
    window.setTimeout(() => setCopiedLovableSetup(false), 1500);
  };

  const checkExternalConnection = async () => {
    if (!externalSourceId || isCheckingExternalConnection) return;

    setExternalSourceError("");
    setIsCheckingExternalConnection(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setExternalSourceError("Your session could not be verified. Please log in again.");
        return;
      }

      const response = await fetch("/api/external-form/check-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sourceId: externalSourceId }),
      });

      const result = await response.json();

      if (!response.ok || result?.connected !== true) {
        setExternalCaptureConnected(false);
        setExternalSourceError(result?.error || "Flowex Capture is not installed on this form yet.");
        return;
      }

      setExternalCaptureConnected(true);
      setExternalSourceError("");
    } catch {
      setExternalSourceError("Flowex could not check the connection. Please try again.");
    } finally {
      setIsCheckingExternalConnection(false);
    }
  };

  const addFlowexField = (
    value: string
  ) => {
    if (!value) {
      return;
    }

    if (
      flowexFormFields.length >= 5
    ) {
      setFormCustomizerError(
        "A Flowex form can have a maximum of 5 fields."
      );
      setSelectedFlowexField("");
      return;
    }

    const type =
      value as FlowexFieldType;

    setFlowexFormFields(
      (current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type,
          label:
            getDefaultFieldLabel(
              type
            ),
          required: false,
          options:
            type === "dropdown"
              ? [
                  "Option 1",
                  "Option 2",
                ]
              : [],
          countryCode:
            type === "phone"
              ? "+92"
              : undefined,
          allowCountryCodeSelection:
            type === "phone"
              ? true
              : undefined,
        },
      ]
    );

    setSelectedFlowexField("");
    setFormCustomizerError("");
  };

  const updateFlowexField = (
    id: string,
    patch: Partial<FlowexFormField>
  ) => {
    setFlowexFormFields(
      (current) =>
        current.map((field) =>
          field.id === id
            ? {
                ...field,
                ...patch,
              }
            : field
        )
    );
  };

  const removeFlowexField = (
    id: string
  ) => {
    setFlowexFormFields(
      (current) =>
        current.filter(
          (field) =>
            field.id !== id
        )
    );

    setFormCustomizerError("");
  };

  const addDropdownOption = (
    fieldId: string
  ) => {
    setFlowexFormFields(
      (current) =>
        current.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                options: [
                  ...field.options,
                  `Option ${field.options.length + 1}`,
                ],
              }
            : field
        )
    );
  };

  const updateDropdownOption = (
    fieldId: string,
    optionIndex: number,
    value: string
  ) => {
    setFlowexFormFields(
      (current) =>
        current.map((field) => {
          if (field.id !== fieldId) {
            return field;
          }

          const options = [...field.options];
          options[optionIndex] = value;

          return {
            ...field,
            options,
          };
        })
    );
  };

  const removeDropdownOption = (
    fieldId: string,
    optionIndex: number
  ) => {
    setFlowexFormFields(
      (current) =>
        current.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                options:
                  field.options.filter(
                    (_option, index) =>
                      index !== optionIndex
                  ),
              }
            : field
        )
    );
  };

  const saveFormCustomization = async () => {
    if (
      isSavingFlowexForm
    ) {
      return;
    }

    if (!flowexFormTitle.trim()) {
      setFormCustomizerError(
        "Enter a form title."
      );
      return;
    }

    if (
      flowexFormFields.length < 3
    ) {
      setFormCustomizerError(
        "Add at least 3 fields."
      );
      return;
    }

    if (
      flowexFormTitle.trim().length > 60
    ) {
      setFormCustomizerError(
        "Form title must be 60 characters or fewer."
      );
      return;
    }

    if (
      flowexFormFields.some(
        (field) =>
          !field.label.trim()
      )
    ) {
      setFormCustomizerError(
        "Every field needs a name."
      );
      return;
    }

    if (
      flowexFormFields.some(
        (field) =>
          isEditableFieldLabel(
            field.type
          ) &&
          field.label.trim().length > 40
      )
    ) {
      setFormCustomizerError(
        "Custom field names must be 40 characters or fewer."
      );
      return;
    }

    if (
      flowexFormFields.some(
        (field) =>
          field.type ===
            "dropdown" &&
          field.options.filter(
            (option) =>
              option.trim()
          ).length < 2
      )
    ) {
      setFormCustomizerError(
        "Dropdown fields need at least 2 options."
      );
      return;
    }

    setFormCustomizerError("");
    setIsSavingFlowexForm(
      true
    );

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setFormCustomizerError(
          "Your session could not be verified. Please log in again."
        );
        return;
      }

      const config = {
        title:
          flowexFormTitle.trim(),

        fields:
          flowexFormFields.map(
            (field) => ({
              id:
                field.id,

              type:
                field.type,

              label:
                field.label.trim(),

              required:
                field.required,

              options:
                field.type ===
                "dropdown"
                  ? field.options
                      .map(
                        (option) =>
                          option.trim()
                      )
                      .filter(Boolean)
                  : [],

              countryCode:
                field.type ===
                "phone"
                  ? field.countryCode ||
                    "+92"
                  : undefined,

              allowCountryCodeSelection:
                field.type ===
                "phone"
                  ? field.allowCountryCodeSelection ??
                    true
                  : undefined,
            })
          ),
      };

      let sourceId =
        flowexFormSourceId;

      let slug =
        flowexFormSlug;

      if (!slug) {
        slug =
          buildFormSlug(
            flowexFormTitle
          );
      }

      if (sourceId) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "lead_sources"
            )
            .update({
              name:
                flowexFormTitle.trim(),

              slug,

              config,

              enabled:
                true,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              sourceId
            )
            .eq(
              "user_id",
              user.id
            )
            .select(
              "id, slug"
            )
            .single();

        if (
          error?.code ===
          "23505"
        ) {
          slug =
            `${buildFormSlug(
              flowexFormTitle
            )}${shortSlugSuffix()}`;

          const retry =
            await supabase
              .from(
                "lead_sources"
              )
              .update({
                name:
                  flowexFormTitle.trim(),

                slug,

                config,

                enabled:
                  true,

                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                "id",
                sourceId
              )
              .eq(
                "user_id",
                user.id
              )
              .select(
                "id, slug"
              )
              .single();

          if (
            retry.error ||
            !retry.data
          ) {
            setFormCustomizerError(
              retry.error?.message ||
                "Flowex could not save this form."
            );
            return;
          }

          setFlowexFormSlug(
            retry.data.slug || slug
          );
        } else if (
          error ||
          !data
        ) {
          setFormCustomizerError(
            error?.message ||
              "Flowex could not save this form."
          );
          return;
        } else {
          setFlowexFormSlug(
            data.slug || slug
          );
        }
      } else {
        const insertForm =
          async (
            nextSlug: string
          ) =>
            supabase
              .from(
                "lead_sources"
              )
              .insert({
                user_id:
                  user.id,

                name:
                  flowexFormTitle.trim(),

                source_type:
                  "flowex_form",

                slug:
                  nextSlug,

                config,

                enabled:
                  true,
              })
              .select(
                "id, slug"
              )
              .single();

        let result =
          await insertForm(
            slug
          );

        if (
          result.error?.code ===
          "23505"
        ) {
          slug =
            `${buildFormSlug(
              flowexFormTitle
            )}${shortSlugSuffix()}`;

          result =
            await insertForm(
              slug
            );
        }

        if (
          result.error ||
          !result.data
        ) {
          setFormCustomizerError(
            result.error?.message ||
              "Flowex could not save this form."
          );
          return;
        }

        sourceId =
          result.data.id;

        setFlowexFormSourceId(
          sourceId
        );

        setFlowexFormSlug(
          result.data.slug ||
            slug
        );
      }

      setCopiedFormLink(
        false
      );

      setShowFormCustomizer(
        false
      );
    } catch {
      setFormCustomizerError(
        "Something went wrong while saving the form."
      );
    } finally {
      setIsSavingFlowexForm(
        false
      );
    }
  };

  const copyFlowexFormLink = async () => {
    if (
      !flowexFormSlug
    ) {
      return;
    }

    const url =
      `${window.location.origin}/form/${flowexFormSlug}`;

    await navigator.clipboard.writeText(
      url
    );

    setCopiedFormLink(
      true
    );

    window.setTimeout(
      () =>
        setCopiedFormLink(
          false
        ),
      1500
    );
  };


  const replyTemplates = {
    instant:
      "Thanks for reaching out. We’ve received your message and will get back to you shortly.",

    friendly:
      "Hey! Thanks for contacting us. Your message is in, and someone from our team will be with you soon.",

    custom: customReply,
  };

  const saveChanges = () => {
    if (
      sourceType === "external" &&
      (
        !externalVerified ||
        !externalCaptureConnected
      )
    ) {
      alert(
        "Finish connecting the Lovable Form to Flowex before using it."
      );
      return;
    }

    const currentReply =
      replyType === "custom"
        ? customReply
        : replyTemplates[replyType];

    const automationData = {
      active,
      sourceType,
      flowexFormTitle,
      flowexFormFields,
      storageType,
      storageDestination,
      replyType,
      replyMessage: currentReply,
      companyEmail,
      followUpEnabled,
      followUpDelay,
      followUpMessage,
    };

    localStorage.setItem(
      "flowex-lead-capture",
      JSON.stringify(automationData)
    );

    alert("Automation saved successfully!");
  };

  if (!hasPremiumAccess) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link href="/dashboard">
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/lead-capture/dashboard"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 app-dark:text-slate-300 app-dark:hover:bg-white/10 app-dark:hover:text-white"
            >
              Back
            </Link>

            <button
              onClick={saveChanges}
              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            >
              Save Automation
            </button>

          </div>

        </div>

      </header>

      {/* PAGE */}

      <section className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-4xl">

          {/* HEADER */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                LEAD CAPTURE
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
                Automation Flow
              </h1>

              <p className="mt-2 max-w-xl text-gray-500 app-dark:text-slate-400">
                Build your lead workflow from capture to follow-up.
              </p>

            </div>

            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 ${
                active
                  ? "border border-red-200 bg-white text-red-600 hover:bg-red-50 app-dark:border-red-500/30 app-dark:bg-[#11161d] app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                  : "bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 text-white shadow-md"
              }`}
            >
              {active ? "Pause Automation" : "Resume Automation"}
            </button>

          </div>

          {/* PAUSED BANNER */}

          {!active && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 app-dark:border-amber-500/30 app-dark:bg-amber-500/10 app-dark:text-amber-300">
              Automation is paused. New leads will not be processed until you resume it.
            </div>
          )}

          {/* FLOW */}

          <div className="relative mt-10">

            {/* vertical connector */}

            <div className="absolute bottom-20 left-[31px] top-20 w-px bg-gradient-to-b from-emerald-300 via-cyan-300 to-indigo-300 sm:left-[39px]" />

            {/* ================= STEP 1 ================= */}

            <FlowStep
              number="01"
              title="Capture Lead"
              description="Choose how new leads enter Flowex."
            >

              <div className="grid gap-3 sm:grid-cols-3">

                <Option
                  active={
                    sourceType === "flowex"
                  }
                  onClick={() =>
                    setSourceType("flowex")
                  }
                  title="Flowex Form"
                  description="Create a ready-to-use form."
                />

                <Option
                  active={
                    sourceType === "external"
                  }
                  onClick={() =>
                    setSourceType("external")
                  }
                  title="Lovable Form"
                  description="Connect a form built with Lovable."
                />

                <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-4 opacity-60 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                  <div className="absolute right-3 top-3 rounded-full bg-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 app-dark:bg-slate-800 app-dark:text-slate-400">
                    Coming Soon
                  </div>

                  <p className="font-semibold app-dark:text-white">
                    Web Hooks
                  </p>
                  
                </div>

              </div>

              {sourceType === "flowex" && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="font-semibold app-dark:text-white">
                        Flowex Lead Form
                      </p>

                      <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                        {flowexFormFields.length > 0
                          ? `${flowexFormFields.length} custom field${flowexFormFields.length === 1 ? "" : "s"} configured.`
                          : "Build a simple form with up to 5 fields."}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormCustomizerError("");
                        setShowFormCustomizer(true);
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                    >
                      Customize
                    </button>

                  </div>

                  {flowexFormSlug && (
                    <div className="mt-4 border-t border-gray-200 pt-4 app-dark:border-slate-700">

                      <p className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                        Form Link
                      </p>

                      <div className="mt-2 flex gap-2">

                        <input
                          type="text"
                          readOnly
                          value={`/form/${flowexFormSlug}`}
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300"
                        />

                        <button
                          type="button"
                          onClick={copyFlowexFormLink}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                        >
                          {copiedFormLink
                            ? "Copied"
                            : "Copy"}
                        </button>

                        <Link
                          href={`/form/${flowexFormSlug}`}
                          target="_blank"
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                        >
                          Open
                        </Link>

                      </div>

                    </div>
                  )}

                </div>
              )}

              {sourceType === "external" && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

                  <p className="font-semibold app-dark:text-white">
                    Lovable Form
                  </p>

                  <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                    Paste the direct URL of your published Lovable form.
                  </p>

                  <div className="mt-4 flex gap-3">

                    <input
                      type="url"
                      value={externalUrl}
                      disabled={externalVerified}
                      onChange={(event) => {
                        setExternalUrl(
                          event.target.value
                        );

                        setExternalSourceError(
                          ""
                        );
                      }}
                      placeholder="https://yourproject.lovable.app/contact"
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10 app-dark:disabled:bg-slate-900 app-dark:disabled:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={
                        externalVerified
                          ? unlinkExternalForm
                          : connectExternalForm
                      }
                      disabled={isConnectingExternal}
                      className={`shrink-0 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        externalVerified
                          ? "border border-red-200 bg-white text-red-600 hover:bg-red-50 app-dark:border-red-500/30 app-dark:bg-[#11161d] app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                          : "bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 text-white shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      {isConnectingExternal
                        ? externalVerified
                          ? "Unlinking..."
                          : "Verifying..."
                        : externalVerified
                          ? "Unlink"
                          : "Connect"}
                    </button>

                  </div>

                  {externalVerified && (
                    <div className="mt-4 border-t border-gray-200 pt-4 app-dark:border-slate-700">
                      <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                        ✓ Form Verified
                      </p>

                      {externalCaptureConnected ? (
                        <p className="mt-2 text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                          ✓ Flowex Capture Connected
                        </p>
                      ) : (
                        <>
                          <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-400">
                            One last step: connect this form to Flowex.
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={copyLovableSetupInstruction}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                            >
                              {copiedLovableSetup ? "Copied" : "Copy Lovable Setup"}
                            </button>

                            <button
                              type="button"
                              onClick={checkExternalConnection}
                              disabled={isCheckingExternalConnection}
                              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isCheckingExternalConnection ? "Checking..." : "Check Connection"}
                            </button>
                          </div>

                          <p className="mt-2 text-xs text-gray-400 app-dark:text-slate-500">
                            Paste the copied instruction into Lovable, let it apply the change, then click Check Connection.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {externalSourceError && (
                    <p className="mt-3 text-sm font-medium text-red-500 app-dark:text-red-400">
                      {externalSourceError}
                    </p>
                  )}

                </div>
              )}

            </FlowStep>

            <Arrow />

            {/* ================= STEP 2 ================= */}

            <FlowStep
              number="02"
              title="Store Lead"
              description="Choose where captured lead data should be sent."
            >

              <div className="grid gap-3 sm:grid-cols-3">

                <Option
                  active={
                    storageType === "sheets"
                  }
                  onClick={() =>
                    setStorageType("sheets")
                  }
                  title="Google Sheets"
                  description="Add each lead as a new row."
                />

                <Option
                  active={
                    storageType ===
                    "airtable"
                  }
                  onClick={() =>
                    setStorageType(
                      "airtable"
                    )
                  }
                  title="Airtable"
                  description="Store leads in your base."
                />

                <Option
                  active={
                    storageType === "slack"
                  }
                  onClick={() =>
                    setStorageType("slack")
                  }
                  title="Slack"
                  description="Send leads to a channel."
                />

              </div>

              <div className="mt-5">

                <input
                  value={storageDestination}
                  onChange={(e) =>
                    setStorageDestination(
                      e.target.value
                    )
                  }
                  placeholder={
                    storageType === "sheets"
                      ? "Google Sheet URL"
                      : storageType ===
                        "airtable"
                      ? "Airtable base URL"
                      : "Slack channel or workspace"
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                />

                <p className="mt-2 text-xs text-gray-400 app-dark:text-slate-500">
                  Flowex will map detected form fields to matching columns automatically.
                </p>

              </div>

            </FlowStep>

            <Arrow />

            {/* ================= STEP 3 ================= */}

            <FlowStep
              number="03"
              title="Reply Automatically"
              description="Choose what your lead receives immediately."
            >

              <div className="grid gap-3 sm:grid-cols-3">

                <Option
                  active={
                    replyType === "instant"
                  }
                  onClick={() => {
                    setReplyType("instant");
                    setCustomReply(
                      replyTemplates.instant
                    );
                  }}
                  title="Professional"
                  description="Short and business-focused."
                />

                <Option
                  active={
                    replyType === "friendly"
                  }
                  onClick={() => {
                    setReplyType("friendly");
                    setCustomReply(
                      replyTemplates.friendly
                    );
                  }}
                  title="Friendly"
                  description="More casual and welcoming."
                />

                <Option
                  active={
                    replyType === "custom"
                  }
                  onClick={() =>
                    setReplyType("custom")
                  }
                  title="Custom"
                  description="Write your own response."
                />

              </div>

              <textarea
                rows={4}
                value={
                  replyType === "custom"
                    ? customReply
                    : replyTemplates[
                        replyType
                      ]
                }
                onChange={(e) => {
                  setReplyType("custom");
                  setCustomReply(
                    e.target.value
                  );
                }}
                className="mt-5 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
              />

            </FlowStep>

            <Arrow />

            {/* ================= STEP 4 ================= */}

            <FlowStep
              number="04"
              title="Notify Your Team"
              description="Send a notification whenever a new lead arrives."
            >

              <label className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                Company Email
              </label>

              <input
                type="email"
                value={companyEmail}
                onChange={(e) =>
                  setCompanyEmail(
                    e.target.value
                  )
                }
                placeholder="team@company.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
              />

            </FlowStep>

            <Arrow />

            {/* ================= STEP 5 ================= */}

            <FlowStep
              number="05"
              title="Follow Up"
              description="Automatically follow up when a lead hasn't replied."
            >

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

                <div>

                  <p className="font-semibold app-dark:text-white">
                    Automated Follow-up
                  </p>

                  <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                    Send another message after a set delay.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFollowUpEnabled(
                      !followUpEnabled
                    )
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    followUpEnabled
                      ? "bg-emerald-500"
                      : "bg-gray-300 app-dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      followUpEnabled
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

              {followUpEnabled && (
                <div className="mt-5 space-y-4">

                  <div>

                    <label className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                      Send after
                    </label>

                    <select
                      value={followUpDelay}
                      onChange={(e) =>
                        setFollowUpDelay(
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                    >
                      <option value="1">
                        1 hour
                      </option>

                      <option value="6">
                        6 hours
                      </option>

                      <option value="12">
                        12 hours
                      </option>

                      <option value="24">
                        24 hours
                      </option>

                      <option value="48">
                        48 hours
                      </option>

                    </select>

                  </div>

                  <textarea
                    rows={3}
                    value={followUpMessage}
                    onChange={(e) =>
                      setFollowUpMessage(
                        e.target.value
                      )
                    }
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                  />

                </div>
              )}

            </FlowStep>

          </div>

          {/* BOTTOM SAVE */}

          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 app-dark:border-slate-800">

            <p className="text-sm text-gray-400 app-dark:text-slate-500">
              Changes only apply after saving.
            </p>

            <button
              onClick={saveChanges}
              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Save Automation
            </button>

          </div>

        </div>

      </section>

      {/* ================= FLOWEX FORM CUSTOMIZER ================= */}

      {showFormCustomizer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-gray-200 bg-[#f7f9fb] shadow-2xl app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <div>
                <h2 className="text-lg font-bold app-dark:text-white">
                  Customize Form
                </h2>

                <p className="mt-0.5 text-xs text-gray-400 app-dark:text-slate-500">
                  Maximum 5 fields.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close form customizer"
                onClick={() => {
                  setShowFormCustomizer(false);
                  setFormCustomizerError("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 app-dark:hover:bg-slate-800 app-dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-2">

              {/* ================= FORM SETUP ================= */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                  Form Title
                </label>

                <input
                  type="text"
                  value={flowexFormTitle}
                  onChange={(event) =>
                    setFlowexFormTitle(
                      event.target.value
                    )
                  }
                  placeholder="Contact Us"
                  maxLength={60}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                />

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                    Fields
                  </label>

                  <select
                    value={selectedFlowexField}
                    disabled={
                      flowexFormFields.length >= 5
                    }
                    onChange={(event) =>
                      addFlowexField(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white"
                  >
                    <option value="">
                      {flowexFormFields.length >= 5
                        ? "Maximum 5 fields reached"
                        : "Select a field"}
                    </option>

                    {flowexFieldOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>

                </div>

                {formCustomizerError && (
                  <p className="mt-3 text-sm font-medium text-red-500 app-dark:text-red-400">
                    {formCustomizerError}
                  </p>
                )}

                <div className="mt-5 max-h-[48vh] space-y-3 overflow-y-auto pr-1">

                  {flowexFormFields.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-7 text-center text-sm text-gray-400 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-500">
                      Select at least 3 fields. Maximum 5.
                    </div>
                  ) : (
                    flowexFormFields.map(
                      (field) => (
                        <div
                          key={field.id}
                          className="rounded-xl border border-gray-200 bg-white p-3 app-dark:border-slate-700 app-dark:bg-[#11161d]"
                        >

                          <div className="flex items-center gap-3">

                            {isEditableFieldLabel(
                              field.type
                            ) ? (
                              <input
                                type="text"
                                value={field.label}
                                maxLength={40}
                                onChange={(event) =>
                                  updateFlowexField(
                                    field.id,
                                    {
                                      label:
                                        event.target.value,
                                    }
                                  )
                                }
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                              />
                            ) : (
                              <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-200">
                                {field.label}
                              </div>
                            )}

                            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold text-gray-500 app-dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(event) =>
                                  updateFlowexField(
                                    field.id,
                                    {
                                      required:
                                        event.target.checked,
                                    }
                                  )
                                }
                                className="h-4 w-4 accent-red-500"
                              />
                              Required
                            </label>

                            <button
                              type="button"
                              aria-label="Remove field"
                              onClick={() =>
                                removeFlowexField(
                                  field.id
                                )
                              }
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 app-dark:hover:bg-red-500/10 app-dark:hover:text-red-400"
                            >
                              ×
                            </button>

                          </div>

                          <p className="mt-2 text-xs capitalize text-gray-400 app-dark:text-slate-500">
                            {field.type.replaceAll(
                              "_",
                              " "
                            )}
                          </p>

                          {field.type === "phone" && (
                            <div className="mt-3 space-y-3">

                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                                  Default country
                                </label>

                                <select
                                  value={field.countryCode || "+92"}
                                  onChange={(event) =>
                                    updateFlowexField(
                                      field.id,
                                      {
                                        countryCode:
                                          event.target.value,
                                      }
                                    )
                                  }
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                                >
                                  {phoneCountryCodes.map(
                                    (country, index) => (
                                      <option
                                        key={`${country.country}-${country.code}-${index}`}
                                        value={country.code}
                                      >
                                        {country.country}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>

                              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-500 app-dark:text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={
                                    field.allowCountryCodeSelection ??
                                    true
                                  }
                                  onChange={(event) =>
                                    updateFlowexField(
                                      field.id,
                                      {
                                        allowCountryCodeSelection:
                                          event.target.checked,
                                      }
                                    )
                                  }
                                  className="h-4 w-4 accent-cyan-500"
                                />
                                Let submitter choose country code
                              </label>

                              {!(
                                field.allowCountryCodeSelection ??
                                true
                              ) && (
                                <p className="text-xs text-gray-400 app-dark:text-slate-500">
                                  Fixed code: {field.countryCode || "+92"}
                                </p>
                              )}

                            </div>
                          )}

                          {field.type === "dropdown" && (
                            <div className="mt-3">

                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                                  Dropdown options
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    addDropdownOption(
                                      field.id
                                    )
                                  }
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-300 app-dark:hover:bg-slate-900"
                                >
                                  + Add option
                                </button>
                              </div>

                              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                                {field.options.map(
                                  (
                                    option,
                                    optionIndex
                                  ) => (
                                    <div
                                      key={`${field.id}-${optionIndex}`}
                                      className="flex gap-2"
                                    >
                                      <input
                                        type="text"
                                        value={option}
                                        maxLength={40}
                                        onChange={(event) =>
                                          updateDropdownOption(
                                            field.id,
                                            optionIndex,
                                            event.target.value
                                          )
                                        }
                                        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                                      />

                                      <button
                                        type="button"
                                        disabled={
                                          field.options.length <= 2
                                        }
                                        onClick={() =>
                                          removeDropdownOption(
                                            field.id,
                                            optionIndex
                                          )
                                        }
                                        className="rounded-lg px-3 text-sm text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>

                              <p className="mt-1.5 text-xs text-gray-400 app-dark:text-slate-500">
                                Minimum 2 options.
                              </p>

                            </div>
                          )}

                        </div>
                      )
                    )
                  )}

                </div>

              </div>

              {/* ================= LIVE PREVIEW ================= */}

              <div>

                <p className="mb-2 text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                  Live Preview
                </p>

                <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm app-dark:border-slate-700">

                  <h3 className="text-center text-2xl font-semibold text-gray-900">
                    {flowexFormTitle.trim() ||
                      "Form Title"}
                  </h3>

                  <form
                    className="mt-6 space-y-5"
                    onSubmit={(event) =>
                      event.preventDefault()
                    }
                  >

                    {flowexFormFields.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        Your selected fields will appear here.
                      </p>
                    ) : (
                      flowexFormFields.map(
                        (field) => (
                          <PreviewFlowexField
                            key={field.id}
                            field={field}
                          />
                        )
                      )
                    )}

                    <button
                      type="submit"
                      disabled={
                        flowexFormFields.length === 0
                      }
                      className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      Submit
                    </button>

                  </form>

                </div>

              </div>

            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <button
                type="button"
                onClick={() => {
                  setShowFormCustomizer(false);
                  setFormCustomizerError("");
                }}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-300 app-dark:hover:bg-slate-900"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveFormCustomization}
                disabled={isSavingFlowexForm}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSavingFlowexForm
                  ? "Saving..."
                  : "Save Form"}
              </button>

            </div>

          </div>

        </div>
      )}


    </main>
  );
}


function PreviewFlowexField({
  field,
}: {
  field: FlowexFormField;
}) {
  const commonClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400";

  if (field.type === "long_text") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-800">
          {field.label}
          {field.required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </label>

        <textarea
          rows={4}
          required={field.required}
          placeholder={field.label}
          className={`${commonClass} resize-none`}
        />

      </div>
    );
  }

  if (field.type === "dropdown") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-800">
          {field.label}
          {field.required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </label>

        <select
          required={field.required}
          defaultValue=""
          className={commonClass}
        >
          <option value="" disabled>
            Select
          </option>

          {field.options
            .filter(
              (option) =>
                option.trim()
            )
            .map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
        </select>

      </div>
    );
  }

  if (field.type === "phone") {
    const allowCodeSelection =
      field.allowCountryCodeSelection ??
      true;

    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-800">
          {field.label}
          {field.required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>

        <div className="flex gap-2">
          {allowCodeSelection ? (
            <select
              defaultValue={field.countryCode || "+92"}
              className="w-[92px] rounded-lg border border-gray-300 bg-white px-2 py-2.5 text-sm text-gray-900 outline-none"
            >
              {phoneCountryCodes.map(
                (country, index) => (
                  <option
                    key={`${country.country}-${country.code}-${index}`}
                    value={country.code}
                  >
                    {country.code}
                  </option>
                )
              )}
            </select>
          ) : (
            <div className="flex w-[92px] items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-2 text-sm font-medium text-gray-700">
              {field.countryCode || "+92"}
            </div>
          )}

          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{7,15}"
            minLength={7}
            maxLength={15}
            required={field.required}
            placeholder="3001234567"
            onInput={(event) => {
              event.currentTarget.value =
                event.currentTarget.value.replace(
                  /\D/g,
                  ""
                );
            }}
            className={`${commonClass} min-w-0 flex-1`}
          />
        </div>
      </div>
    );
  }

  const inputType =
    field.type === "email"
      ? "email"
      : field.type === "number"
        ? "number"
        : field.type === "date"
          ? "date"
          : field.type === "website"
            ? "url"
            : "text";

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-800">
        {field.label}
      </label>

      <input
        type={inputType}
        inputMode={
          field.type === "number"
            ? "decimal"
            : undefined
        }
        step={
          field.type === "number"
            ? "any"
            : undefined
        }
        pattern={
          field.type === "website"
            ? "https?://.+"
            : undefined
        }
        required={field.required}
        placeholder={
          field.type === "website"
            ? "https://example.com"
            : field.label
        }
        className={commonClass}
      />

    </div>
  );
}

function FlowStep({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-4 sm:gap-6">

      <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-400 to-indigo-600 text-sm font-black text-white shadow-md sm:h-20 sm:w-20">
        {number}
      </div>

      <div className="min-w-0 flex-1 rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 sm:p-7 app-dark:border-slate-800 app-dark:bg-[#11161d]">

        <h2 className="text-xl font-bold app-dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
          {description}
        </p>

        <div className="mt-6">
          {children}
        </div>

      </div>

    </div>
  );
}

function Option({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-cyan-400 bg-cyan-50/60 shadow-sm ring-2 ring-cyan-100 app-dark:border-cyan-500 app-dark:bg-cyan-500/10 app-dark:ring-cyan-500/10"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:hover:border-slate-600 app-dark:hover:bg-slate-900"
      }`}
    >

      <p className="text-sm font-bold app-dark:text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500 app-dark:text-slate-400">
        {description}
      </p>

    </button>
  );
}

function Arrow() {
  return (
    <div className="relative flex h-12 items-center pl-[24px] sm:pl-[32px]">

       <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-sm text-gray-400 shadow-sm app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-400">
        ↓
      </div>

    </div>
  );
}