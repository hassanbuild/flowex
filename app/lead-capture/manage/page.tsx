"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SourceType = "flowex" | "external";
type StorageType =
  | "sheets"
  | "airtable"
  | "excel"
  | "notion"
  | "hubspot"
  | "slack"
  | "webhook";

type StorageMode =
  | "create_new"
  | "existing";
type ReplyType = "preset_1" | "preset_2" | "preset_3" | "custom";
type ReplyChannel = "email" | "whatsapp";

type AirtableBaseOption = { id: string; name: string };
type AirtableTableOption = { id: string; name: string };
type AirtableBaseMode = "existing_base" | "create_base";
type ExcelWorkbookOption = { id: string; name: string; webUrl: string };
type NotionPageOption = { id: string; title: string; url: string | null };
type NotionDatabaseOption = {
  id: string;
  title: string;
  databaseId: string;
  url: string | null;
};


const storageProviders: {
  value:
    | StorageType
    | "pipedrive"
    | "zoho"
    | "salesforce"
    | "notion"
    | "monday"
    | "teams"
    | "excel";
  title: string;
  description: string;
  available: boolean;
}[] = [
  {
    value: "sheets",
    title: "Google Sheets",
    description: "Create a new lead sheet or use an existing one.",
    available: true,
  },
  {
    value: "airtable",
    title: "Airtable",
    description: "Store leads in a base.",
    available: true,
  },
  {
    value: "hubspot",
    title: "HubSpot",
    description: "Create or update CRM contacts.",
    available: true,
  },
  {
    value: "slack",
    title: "Slack",
    description: "Send lead alerts to a channel.",
    available: false,
  },
  {
    value: "webhook",
    title: "Webhook",
    description: "Send lead data to your endpoint.",
    available: false,
  },
  {
    value: "pipedrive",
    title: "Pipedrive",
    description: "CRM lead and contact sync.",
    available: false,
  },
  {
    value: "zoho",
    title: "Zoho CRM",
    description: "Send captured leads into Zoho.",
    available: false,
  },
  {
    value: "salesforce",
    title: "Salesforce",
    description: "Enterprise CRM lead sync.",
    available: false,
  },
  {
    value: "notion",
    title: "Notion",
    description: "Create or use a lead database.",
    available: true,
  },
  {
    value: "monday",
    title: "monday.com",
    description: "Send leads into a board.",
    available: false,
  },
  {
    value: "teams",
    title: "Microsoft Teams",
    description: "Send lead alerts to your team.",
    available: false,
  },
  {
    value: "excel",
    title: "Microsoft Excel",
    description: "Store leads in an Excel table.",
    available: true,
  },
];

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
  const {
    plan,
    authReady,
  } = useAppAccount();

  const router = useRouter();

  const [leadFlowId, setLeadFlowId] = useState("");
  const [leadFlowName, setLeadFlowName] = useState("");
  const [leadFlowNameDraft, setLeadFlowNameDraft] = useState("");
  const [isEditingLeadFlowName, setIsEditingLeadFlowName] = useState(false);
  const [isSavingLeadFlowName, setIsSavingLeadFlowName] = useState(false);
  const [flowReady, setFlowReady] = useState(false);

  const [supabase] = useState(() =>
    createClient()
  );

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  useEffect(() => {
    if (
      !authReady ||
      !hasPremiumAccess
    ) {
      return;
    }

    let cancelled = false;

    const loadSelectedFlow = async () => {
      const flowId = new URLSearchParams(window.location.search).get("flowId")?.trim() || "";

      if (!flowId) {
        router.replace("/lead-capture/dashboard");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data, error } = await supabase
        .from("lead_flows")
        .select("id, name")
        .eq("id", flowId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        router.replace("/lead-capture/dashboard");
        return;
      }

      setLeadFlowId(data.id);
      setLeadFlowName(data.name || "Lead Flow");
      setLeadFlowNameDraft(data.name || "Lead Flow");
      setFlowReady(true);
    };

    void loadSelectedFlow();

    return () => {
      cancelled = true;
    };
  }, [
    authReady,
    hasPremiumAccess,
    router,
    supabase,
  ]);

  useEffect(() => {
    if (
      authReady &&
      !hasPremiumAccess
    ) {
      router.replace("/home");
    }
  }, [
    authReady,
    hasPremiumAccess,
    router,
  ]);

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

  const [isRemovingFlowexForm, setIsRemovingFlowexForm] =
    useState(false);

  const [isEditingSourceSetup, setIsEditingSourceSetup] =
    useState(false);

  const [copiedFormLink, setCopiedFormLink] =
    useState(false);

  const [isDeletingLeadFlow, setIsDeletingLeadFlow] =
    useState(false);

  const [storageType, setStorageType] =
    useState<StorageType>("sheets");

  const [storageMode, setStorageMode] =
    useState<StorageMode>("create_new");

  const [storageName, setStorageName] =
    useState("Flowex Leads");

  const [storageDestination, setStorageDestination] =
    useState("");

  const [storageConnected, setStorageConnected] =
    useState(false);

  const [storageError, setStorageError] =
    useState("");

  const [isConnectingStorage, setIsConnectingStorage] =
    useState(false);

  const [disconnectingStorageProvider, setDisconnectingStorageProvider] =
    useState<"sheets" | "airtable" | "excel" | "notion" | "hubspot" | null>(null);

  const [isPreparingStorage, setIsPreparingStorage] =
    useState(false);

  const [googleAccountConnected, setGoogleAccountConnected] =
    useState(false);

  const [googleAccountEmail, setGoogleAccountEmail] =
    useState("");

  const [airtableAccountConnected, setAirtableAccountConnected] =
    useState(false);

  const [airtableAccountEmail, setAirtableAccountEmail] =
    useState("");

  const [microsoftAccountConnected, setMicrosoftAccountConnected] =
    useState(false);

  const [microsoftAccountEmail, setMicrosoftAccountEmail] =
    useState("");

  const [notionAccountConnected, setNotionAccountConnected] =
    useState(false);

  const [notionAccountEmail, setNotionAccountEmail] =
    useState("");

  const [notionWorkspaceName, setNotionWorkspaceName] =
    useState("");

  const [notionPages, setNotionPages] =
    useState<NotionPageOption[]>([]);

  const [notionDatabases, setNotionDatabases] =
    useState<NotionDatabaseOption[]>([]);

  const [notionParentPageId, setNotionParentPageId] =
    useState("");

  const [notionDatabaseId, setNotionDatabaseId] =
    useState("");

  const [notionDataSourceId, setNotionDataSourceId] =
    useState("");

  const [notionDatabaseName, setNotionDatabaseName] =
    useState("");

  const [notionDatabaseUrl, setNotionDatabaseUrl] =
    useState("");

  const [notionExistingVerified, setNotionExistingVerified] =
    useState(false);

  const [notionCreatedByFlowex, setNotionCreatedByFlowex] =
    useState(false);

  const [notionMissingCount, setNotionMissingCount] =
    useState(0);

  const [isLoadingNotion, setIsLoadingNotion] =
    useState(false);

  const [showNotionRemoveDialog, setShowNotionRemoveDialog] =
    useState(false);

  const [notionRemovalMode, setNotionRemovalMode] =
    useState<"unlink" | "trash" | null>(null);

  const [hubSpotAccountConnected, setHubSpotAccountConnected] =
    useState(false);

  const [hubSpotHubId, setHubSpotHubId] =
    useState("");

  const [hubSpotDestinationReady, setHubSpotDestinationReady] =
    useState(false);

  const [hubSpotMissingCount, setHubSpotMissingCount] =
    useState(0);

  const [hubSpotMappedFieldCount, setHubSpotMappedFieldCount] =
    useState(0);

  const [microsoftWorkbooks, setMicrosoftWorkbooks] =
    useState<ExcelWorkbookOption[]>([]);

  const [excelWorkbookId, setExcelWorkbookId] =
    useState("");

  const [excelWorkbookName, setExcelWorkbookName] =
    useState("");

  const [excelWorkbookUrl, setExcelWorkbookUrl] =
    useState("");

  const [excelTableId, setExcelTableId] =
    useState("");

  const [excelTableName, setExcelTableName] =
    useState("");

  const [excelExistingVerified, setExcelExistingVerified] =
    useState(false);

  const [excelCreatedByFlowex, setExcelCreatedByFlowex] =
    useState(false);

  const [showExcelRemoveDialog, setShowExcelRemoveDialog] =
    useState(false);

  const [excelRemovalMode, setExcelRemovalMode] =
    useState<"unlink" | "trash" | null>(null);

  const [isLoadingMicrosoft, setIsLoadingMicrosoft] =
    useState(false);

  const [airtableBases, setAirtableBases] =
    useState<AirtableBaseOption[]>([]);

  const [airtableTables, setAirtableTables] =
    useState<AirtableTableOption[]>([]);

  const [airtableBaseId, setAirtableBaseId] =
    useState("");

  const [airtableTableId, setAirtableTableId] =
    useState("");

  const [airtableTableName, setAirtableTableName] =
    useState("");

  const [airtableBaseMode, setAirtableBaseMode] =
    useState<AirtableBaseMode>("existing_base");

  const [airtableWorkspaceId, setAirtableWorkspaceId] =
    useState("");

  const [airtableBaseName, setAirtableBaseName] =
    useState("Flowex Leads");

  const [airtableCreatedBaseByFlowex, setAirtableCreatedBaseByFlowex] =
    useState(false);

  const [airtableBaseUrl, setAirtableBaseUrl] =
    useState("");

  const [showAirtableRemoveDialog, setShowAirtableRemoveDialog] =
    useState(false);

  const [airtableExistingVerified, setAirtableExistingVerified] =
    useState(false);

  const [isLoadingAirtable, setIsLoadingAirtable] =
    useState(false);

  const [showMoreDestinations, setShowMoreDestinations] =
    useState(false);

  const [storageSpreadsheetUrl, setStorageSpreadsheetUrl] =
    useState("");

  const [createdSheetId, setCreatedSheetId] =
    useState("");

  const [createdSheetUrl, setCreatedSheetUrl] =
    useState("");

  const [existingSheetId, setExistingSheetId] =
    useState("");

  const [existingSheetUrl, setExistingSheetUrl] =
    useState("");

  const [existingSheetVerified, setExistingSheetVerified] =
    useState(false);

  const [savedStorageMode, setSavedStorageMode] =
    useState<StorageMode | null>(null);

  const [savedCreatedSheetId, setSavedCreatedSheetId] =
    useState("");

  const [savedExistingSheetId, setSavedExistingSheetId] =
    useState("");

  const [storagePendingDelete, setStoragePendingDelete] =
    useState(false);

  const [createdSheetRemovalMode, setCreatedSheetRemovalMode] =
    useState<"unlink" | "trash" | null>(null);

  const [showCreatedSheetDeleteDialog, setShowCreatedSheetDeleteDialog] =
    useState(false);

  const [storagePendingUnlink, setStoragePendingUnlink] =
    useState(false);

  const [isEditingCreatedSheet, setIsEditingCreatedSheet] =
    useState(false);

  const [isEditingStorage, setIsEditingStorage] =
    useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false);

  const [dirtySteps, setDirtySteps] =
    useState<Set<string>>(() => new Set());

  const [showUnsavedDialog, setShowUnsavedDialog] =
    useState(false);

  const [pendingNavigation, setPendingNavigation] =
    useState("");

  const [isSavingAutomation, setIsSavingAutomation] =
    useState(false);

  const [replyChannel, setReplyChannel] =
    useState<ReplyChannel>("email");

  const [replyType, setReplyType] =
    useState<ReplyType>("preset_1");

  const [customReply, setCustomReply] = useState(
    "Thanks for reaching out. We’ve received your message and will get back to you shortly."
  );

  const [replySubject, setReplySubject] =
    useState("Thanks for reaching out");

  const [emailSenderConnected, setEmailSenderConnected] =
    useState(false);

  const [emailSenderAddress, setEmailSenderAddress] =
    useState("");

  const [replySettingsError, setReplySettingsError] =
    useState("");

  const [isConnectingReplyEmail, setIsConnectingReplyEmail] =
    useState(false);

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
    if (
      !flowReady ||
      !leadFlowId
    ) {
      return;
    }

    /*
      Each Lead Flow must start with a clean UI state.
      Without this reset, React can keep Flow 1's form/source
      visible while Flow 2 has no source yet.
    */
    setSourceType("flowex");

    setExternalSourceId(null);
    setExternalPublicKey("");
    setExternalUrl("");
    setExternalVerified(false);
    setExternalDetectedFields([]);
    setExternalSourceError("");
    setExternalCaptureConnected(false);
    setCopiedLovableSetup(false);

    setFlowexFormSourceId(null);
    setFlowexFormSlug("");
    setFlowexFormTitle("");
    setFlowexFormFields([]);
    setSelectedFlowexField("");
    setFormCustomizerError("");
    setCopiedFormLink(false);

    setStorageType("sheets");
    setStorageMode("create_new");
    setStorageName("Flowex Leads");
    setStorageDestination("");
    setStorageConnected(false);
    setStorageSpreadsheetUrl("");
    setCreatedSheetId("");
    setCreatedSheetUrl("");
    setExistingSheetId("");
    setExistingSheetUrl("");
    setExistingSheetVerified(false);
    setSavedStorageMode(null);
    setSavedCreatedSheetId("");
    setSavedExistingSheetId("");
    setStoragePendingDelete(false);
    setCreatedSheetRemovalMode(null);
    setShowCreatedSheetDeleteDialog(false);
    setStoragePendingUnlink(false);
    setIsEditingCreatedSheet(false);
    setIsEditingStorage(false);
    setStorageError("");
    setAirtableBases([]);
    setAirtableTables([]);
    setAirtableBaseId("");
    setAirtableTableId("");
    setAirtableTableName("");
    setAirtableBaseMode("existing_base");
    setAirtableWorkspaceId("");
    setAirtableBaseName("Flowex Leads");
    setAirtableCreatedBaseByFlowex(false);
    setAirtableBaseUrl("");
    setShowAirtableRemoveDialog(false);
    setAirtableExistingVerified(false);
    setHasUnsavedChanges(false);
    setDirtySteps(new Set());
    setReplyChannel("email");
    setReplyType("preset_1");
    setCustomReply(
      "Thanks for reaching out. We’ve received your message and will get back to you shortly."
    );
    setReplySubject("Thanks for reaching out");
    setReplySettingsError("");
    setCompanyEmail("");
    setFollowUpEnabled(true);
    setFollowUpDelay("24");
    setFollowUpMessage(
      "Just following up in case you missed our previous message. Let us know if you have any questions."
    );
  }, [
    flowReady,
    leadFlowId,
  ]);

  useEffect(() => {
    if (!flowReady || !leadFlowId) return;

    const saved = localStorage.getItem(
      `flowex-lead-capture:${leadFlowId}`
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
    setStorageMode(
      data.storageMode === "existing"
        ? "existing"
        : "create_new"
    );
    setStorageName(
      data.storageName || "Flowex Leads"
    );
    setStorageDestination(
      data.storageDestination || ""
    );
    setReplyChannel(data.replyChannel === "whatsapp" ? "whatsapp" : "email");
    setReplyType(
      ["preset_1", "preset_2", "preset_3", "custom"].includes(data.replyType)
        ? data.replyType
        : "preset_1"
    );
    setCustomReply(data.customReply || data.replyMessage || "");
    setReplySubject(data.replySubject || "Thanks for reaching out");
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
  }, [flowReady, leadFlowId]);

  useEffect(() => {
    if (!flowReady || !leadFlowId) return;

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
          .eq("lead_flow_id", leadFlowId)
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
  }, [supabase, flowReady, leadFlowId]);

  useEffect(() => {
    if (!flowReady || !leadFlowId) return;

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
          .eq("lead_flow_id", leadFlowId)
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
  }, [supabase, flowReady, leadFlowId]);

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

                leadFlowId,
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

      setExternalCaptureConnected(
        result?.captureConnected === true
      );

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

      setIsEditingSourceSetup(
        result?.captureConnected !== true
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

      setIsEditingSourceSetup(false);
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
            .eq("lead_flow_id", leadFlowId)
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

                lead_flow_id:
                  leadFlowId,

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

      setIsEditingSourceSetup(false);
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

  const removeFlowexForm = async () => {
    if (
      isRemovingFlowexForm ||
      !flowexFormSourceId
    ) {
      return;
    }

    setFormCustomizerError("");
    setIsRemovingFlowexForm(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setFormCustomizerError(
          "Your session could not be verified. Please log in again."
        );
        return;
      }

      const { error } = await supabase
        .from("lead_sources")
        .delete()
        .eq("id", flowexFormSourceId)
        .eq("user_id", user.id)
        .eq("lead_flow_id", leadFlowId);

      if (error) {
        setFormCustomizerError(
          error.message ||
            "Flowex could not remove this form."
        );
        return;
      }

      setFlowexFormSourceId(null);
      setFlowexFormSlug("");
      setFlowexFormTitle("");
      setFlowexFormFields([]);
      setSelectedFlowexField("");
      setCopiedFormLink(false);
      setShowFormCustomizer(false);
      setIsEditingSourceSetup(false);
      setSourceType("flowex");
      setHasUnsavedChanges(true);
    } catch {
      setFormCustomizerError(
        "Flowex could not remove this form."
      );
    } finally {
      setIsRemovingFlowexForm(false);
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


  useEffect(() => {
    if (!flowReady || !leadFlowId) return;
    const airtableStatus = new URL(window.location.href).searchParams.get("airtable");
    if (airtableStatus === "connected") {
      setStorageType("airtable");
      setStorageError("");
    }
  }, [flowReady, leadFlowId]);

  useEffect(() => {
    if (!flowReady || !leadFlowId) return;
    const microsoftStatus =
      new URL(window.location.href).searchParams.get("microsoft");

    if (microsoftStatus === "connected") {
      setStorageType("excel");
      setStorageError("");
    }
  }, [flowReady, leadFlowId]);

  useEffect(() => {
    if (!flowReady || !leadFlowId) return;
    const notionStatus =
      new URL(window.location.href).searchParams.get("notion");

    if (notionStatus === "connected") {
      setStorageType("notion");
      setStorageError("");
    }
  }, [flowReady, leadFlowId]);

  useEffect(() => {
    if (
      !flowReady ||
      !leadFlowId
    ) {
      return;
    }

    let cancelled = false;

    const loadDestination =
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "lead_destinations"
            )
            .select(
              "provider, mode, display_name, config, connected"
            )
            .eq(
              "lead_flow_id",
              leadFlowId
            )
            .maybeSingle();

        if (cancelled) {
          return;
        }

        if (error) {
          setStorageError(
            "Flowex could not load this destination."
          );
          return;
        }

        if (!data) {
          setStorageConnected(
            false
          );

          setSavedStorageMode(
            null
          );

          setCreatedSheetId(
            ""
          );

          setCreatedSheetUrl(
            ""
          );

          setSavedCreatedSheetId(
            ""
          );

          setExistingSheetId(
            ""
          );

          setExistingSheetUrl(
            ""
          );

          setSavedExistingSheetId(
            ""
          );

          setExistingSheetVerified(
            false
          );

          setStorageDestination(
            ""
          );

          setStorageSpreadsheetUrl(
            ""
          );

          setStoragePendingDelete(
            false
          );

          setStoragePendingUnlink(
            false
          );

          setHasUnsavedChanges(
            false
          );

          return;
        }

        const provider =
          data.provider as StorageType;

        if (
          provider ===
            "sheets" ||
          provider ===
            "airtable" ||
          provider ===
            "excel" ||
          provider ===
            "notion" ||
          provider ===
            "hubspot" ||
          provider ===
            "slack" ||
          provider ===
            "webhook"
        ) {
          setStorageType(
            provider
          );
        }

        const savedMode:
          StorageMode =
          data.mode ===
            "existing"
            ? "existing"
            : "create_new";

        setStorageMode(
          savedMode
        );

        setSavedStorageMode(
          savedMode
        );

        setStorageName(
          data.display_name ||
            "Flowex Leads"
        );

        const config =
          data.config as {
            destination?: unknown;
            spreadsheet_id?: unknown;
            spreadsheet_url?: unknown;
            created_by_flowex?: unknown;
            base_id?: unknown;
            base_name?: unknown;
            base_url?: unknown;
            table_id?: unknown;
            table_name?: unknown;
            created_base_by_flowex?: unknown;
            workbook_id?: unknown;
            workbook_name?: unknown;
            workbook_url?: unknown;
            table_name_excel?: unknown;
            table_id_excel?: unknown;
            database_id?: unknown;
            data_source_id?: unknown;
            database_name?: unknown;
            database_url?: unknown;
            parent_page_id?: unknown;
            hub_id?: unknown;
            mapped_field_count?: unknown;
            custom_property_count?: unknown;
          } | null;

        if (provider === "hubspot") {
          const hubId =
            typeof config?.hub_id === "string" ||
            typeof config?.hub_id === "number"
              ? String(config.hub_id)
              : "";

          setHubSpotHubId(hubId);
          setHubSpotMappedFieldCount(
            typeof config?.mapped_field_count === "number"
              ? config.mapped_field_count
              : 0
          );
          setHubSpotMissingCount(0);
          setHubSpotDestinationReady(data.connected === true);
          setStorageConnected(data.connected === true);
          setStoragePendingDelete(false);
          setStoragePendingUnlink(false);
          setHasUnsavedChanges(false);
          return;
        }

        if (provider === "notion") {
          const databaseId =
            typeof config?.database_id === "string"
              ? config.database_id
              : "";

          const dataSourceId =
            typeof config?.data_source_id === "string"
              ? config.data_source_id
              : "";

          const databaseName =
            typeof config?.database_name === "string"
              ? config.database_name
              : data.display_name || "";

          const databaseUrl =
            typeof config?.database_url === "string"
              ? config.database_url
              : databaseId
                ? `https://www.notion.so/${databaseId.replace(/-/g, "")}`
                : "";

          const parentPageId =
            typeof config?.parent_page_id === "string"
              ? config.parent_page_id
              : "";

          setNotionDatabaseId(databaseId);
          setNotionDataSourceId(dataSourceId);
          setNotionDatabaseName(databaseName);
          setNotionDatabaseUrl(databaseUrl);
          setNotionParentPageId(parentPageId);
          setNotionCreatedByFlowex(config?.created_by_flowex === true);
          setNotionExistingVerified(
            savedMode === "existing" && data.connected === true
          );
          setStorageConnected(data.connected === true);
          setStoragePendingDelete(false);
          setStoragePendingUnlink(false);
          setNotionRemovalMode(null);
          setHasUnsavedChanges(false);
          return;
        }

        if (provider === "airtable") {
          const baseId = typeof config?.base_id === "string" ? config.base_id : "";
          const baseName = typeof config?.base_name === "string" ? config.base_name : "";
          const baseUrl = typeof config?.base_url === "string" ? config.base_url : baseId ? `https://airtable.com/${baseId}` : "";
          const tableId = typeof config?.table_id === "string" ? config.table_id : "";
          const tableName = typeof config?.table_name === "string" ? config.table_name : data.display_name || "";
          const createdBaseByFlowex = config?.created_base_by_flowex === true;

          setAirtableBaseId(baseId);
          setAirtableBaseName(baseName || "Flowex Leads");
          setAirtableBaseUrl(baseUrl);
          setAirtableTableId(tableId);
          setAirtableTableName(tableName);
          setAirtableCreatedBaseByFlowex(createdBaseByFlowex);
          setAirtableBaseMode(createdBaseByFlowex ? "create_base" : "existing_base");
          setAirtableExistingVerified(savedMode === "existing" && data.connected === true);
          setStorageConnected(data.connected === true);
          setStoragePendingDelete(false);
          setStoragePendingUnlink(false);
          setHasUnsavedChanges(false);
          return;
        }

        if (provider === "excel") {
          const workbookId =
            typeof config?.workbook_id === "string"
              ? config.workbook_id
              : "";

          const workbookName =
            typeof config?.workbook_name === "string"
              ? config.workbook_name
              : data.display_name || "";

          const workbookUrl =
            typeof config?.workbook_url === "string"
              ? config.workbook_url
              : "";

          const excelTableIdValue =
            typeof config?.table_id_excel === "string"
              ? config.table_id_excel
              : typeof config?.table_id === "string"
                ? config.table_id
                : "";

          const excelTableNameValue =
            typeof config?.table_name_excel === "string"
              ? config.table_name_excel
              : typeof config?.table_name === "string"
                ? config.table_name
                : "";

          setExcelWorkbookId(workbookId);
          setExcelWorkbookName(workbookName);
          setExcelWorkbookUrl(workbookUrl);
          setExcelTableId(excelTableIdValue);
          setExcelTableName(excelTableNameValue);
          setExcelCreatedByFlowex(config?.created_by_flowex === true);
          setExcelExistingVerified(
            savedMode === "existing" &&
            data.connected === true
          );
          setStorageConnected(data.connected === true);
          setStoragePendingDelete(false);
          setStoragePendingUnlink(false);
          setHasUnsavedChanges(false);
          return;
        }

        const spreadsheetId =
          typeof config
            ?.spreadsheet_id ===
            "string"
            ? config.spreadsheet_id
            : "";

        const spreadsheetUrl =
          typeof config
            ?.spreadsheet_url ===
            "string"
            ? config.spreadsheet_url
            : typeof config
                ?.destination ===
                "string"
              ? config.destination
              : "";

        setStorageSpreadsheetUrl(
          spreadsheetUrl
        );

        setStorageConnected(
          data.connected ===
            true
        );

        if (
          savedMode ===
          "create_new"
        ) {
          setCreatedSheetId(
            spreadsheetId
          );

          setCreatedSheetUrl(
            spreadsheetUrl
          );

          setSavedCreatedSheetId(
            spreadsheetId
          );

          setStorageDestination(
            ""
          );
        } else {
          setExistingSheetId(
            spreadsheetId
          );

          setExistingSheetUrl(
            spreadsheetUrl
          );

          setSavedExistingSheetId(
            spreadsheetId
          );

          setExistingSheetVerified(
            data.connected ===
              true
          );

          setStorageDestination(
            spreadsheetUrl
          );
        }

        setStoragePendingDelete(
          false
        );

        setCreatedSheetRemovalMode(
          null
        );

        setShowCreatedSheetDeleteDialog(
          false
        );

        setStoragePendingUnlink(
          false
        );

        setHasUnsavedChanges(
          false
        );
      };

    void loadDestination();

    return () => {
      cancelled = true;
    };
  }, [
    flowReady,
    leadFlowId,
    supabase,
  ]);

  useEffect(() => {
    if (
      !flowReady ||
      !leadFlowId
    ) {
      return;
    }

    let cancelled = false;

    const loadGoogleConnection =
      async () => {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          cancelled ||
          !session
        ) {
          return;
        }

        try {
          const response =
            await fetch(
              "/api/integrations/google/connect",
              {
                method:
                  "GET",

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              }
            );

          const result =
            await response.json();

          if (cancelled) {
            return;
          }

          setGoogleAccountConnected(
            response.ok &&
            result?.connected ===
              true
          );

          setGoogleAccountEmail(
            typeof result?.email ===
              "string"
              ? result.email
              : ""
          );
        } catch {
          if (!cancelled) {
            setGoogleAccountConnected(
              false
            );
          }
        }
      };

    void loadGoogleConnection();

    return () => {
      cancelled = true;
    };
  }, [
    flowReady,
    leadFlowId,
    supabase,
  ]);

  useEffect(() => {
    if (
      !flowReady ||
      !leadFlowId
    ) {
      return;
    }

    let cancelled = false;

    const loadAirtableConnection =
      async () => {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          cancelled ||
          !session
        ) {
          return;
        }

        try {
          const response =
            await fetch(
              "/api/integrations/airtable/connect",
              {
                method:
                  "GET",

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              }
            );

          const result =
            await response.json();

          if (cancelled) {
            return;
          }

          setAirtableAccountConnected(
            response.ok &&
            result?.connected ===
              true
          );

          setAirtableAccountEmail(
            typeof result?.email ===
              "string"
              ? result.email
              : ""
          );
        } catch {
          if (!cancelled) {
            setAirtableAccountConnected(
              false
            );
          }
        }
      };

    void loadAirtableConnection();

    return () => {
      cancelled = true;
    };
  }, [
    flowReady,
    leadFlowId,
    supabase,
  ]);

  useEffect(() => {
    if (
      !flowReady ||
      !leadFlowId
    ) {
      return;
    }

    let cancelled = false;

    const loadMicrosoftConnection =
      async () => {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          cancelled ||
          !session
        ) {
          return;
        }

        try {
          const response =
            await fetch(
              "/api/integrations/microsoft/connect",
              {
                method:
                  "GET",

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              }
            );

          const result =
            await response.json();

          if (cancelled) {
            return;
          }

          setMicrosoftAccountConnected(
            response.ok &&
            result?.connected ===
              true
          );

          setMicrosoftAccountEmail(
            typeof result?.email ===
              "string"
              ? result.email
              : ""
          );
        } catch {
          if (!cancelled) {
            setMicrosoftAccountConnected(
              false
            );
          }
        }
      };

    void loadMicrosoftConnection();

    return () => {
      cancelled = true;
    };
  }, [
    flowReady,
    leadFlowId,
    supabase,
  ]);

  useEffect(() => {
    if (
      !flowReady ||
      !leadFlowId
    ) {
      return;
    }

    let cancelled = false;

    const loadNotionConnection =
      async () => {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          cancelled ||
          !session
        ) {
          return;
        }

        try {
          const response =
            await fetch(
              "/api/integrations/notion/connect",
              {
                method:
                  "GET",

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },
              }
            );

          const result =
            await response.json();

          if (cancelled) {
            return;
          }

          setNotionAccountConnected(
            response.ok &&
            result?.connected ===
              true
          );

          setNotionAccountEmail(
            typeof result?.email ===
              "string"
              ? result.email
              : ""
          );

          setNotionWorkspaceName(
            typeof result?.workspaceName === "string"
              ? result.workspaceName
              : ""
          );
        } catch {
          if (!cancelled) {
            setNotionAccountConnected(
              false
            );
          }
        }
      };

    void loadNotionConnection();

    return () => {
      cancelled = true;
    };
  }, [
    flowReady,
    leadFlowId,
    supabase,
  ]);

  useEffect(() => {
    if (!flowReady || !leadFlowId) {
      return;
    }

    let cancelled = false;

    const loadHubSpotConnection =
      async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled || !session) {
          return;
        }

        try {
          const response = await fetch(
            "/api/integrations/hubspot/connect",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          const result = await response.json();

          if (cancelled) {
            return;
          }

          setHubSpotAccountConnected(
            response.ok && result?.connected === true
          );

          setHubSpotHubId(
            typeof result?.hubId === "string"
              ? result.hubId
              : ""
          );
        } catch {
          if (!cancelled) {
            setHubSpotAccountConnected(false);
          }
        }
      };

    void loadHubSpotConnection();

    return () => {
      cancelled = true;
    };
  }, [flowReady, leadFlowId, supabase]);

  const disconnectStorageAccount =
    async (
      provider:
        | "sheets"
        | "airtable"
        | "excel"
        | "notion"
        | "hubspot"
    ) => {
      if (disconnectingStorageProvider) {
        return;
      }

      const providerLabel =
        provider === "sheets"
          ? "Google"
          : provider === "excel"
            ? "Microsoft"
            : provider === "airtable"
              ? "Airtable"
              : provider === "notion"
                ? "Notion"
                : "HubSpot";

      const confirmed =
        window.confirm(
          `Disconnect ${providerLabel} from Flowex? This will not delete any external data, but destinations using this account will stop receiving leads until you reconnect.`
        );

      if (!confirmed) {
        return;
      }

      setStorageError("");
      setDisconnectingStorageProvider(provider);

      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!session) {
          throw new Error(
            "Your session could not be verified. Please log in again."
          );
        }

        const response =
          await fetch(
            "/api/integrations/disconnect",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify({
                  provider,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              `Flowex could not disconnect ${providerLabel}.`
          );
        }

        if (provider === "sheets") {
          setGoogleAccountConnected(false);
          setGoogleAccountEmail("");
        } else if (provider === "airtable") {
          setAirtableAccountConnected(false);
          setAirtableAccountEmail("");
        } else if (provider === "excel") {
          setMicrosoftAccountConnected(false);
          setMicrosoftAccountEmail("");
        } else if (provider === "notion") {
          setNotionAccountConnected(false);
          setNotionAccountEmail("");
          setNotionWorkspaceName("");
          setNotionPages([]);
          setNotionDatabases([]);
        } else if (provider === "hubspot") {
          setHubSpotAccountConnected(false);
          setHubSpotHubId("");
        }

        if (storageType === provider) {
          // Account disconnect means Flowex forgets the destination too.
          setStorageConnected(false);
          setStorageMode("create_new");
          setSavedStorageMode(null);
          setStorageName("Flowex Leads");
          setStorageDestination("");
          setStorageSpreadsheetUrl("");
          setStoragePendingUnlink(false);
          setStoragePendingDelete(false);
          setIsEditingStorage(false);

          if (provider === "sheets") {
            setCreatedSheetId("");
            setCreatedSheetUrl("");
            setExistingSheetId("");
            setExistingSheetUrl("");
            setExistingSheetVerified(false);
            setSavedCreatedSheetId("");
            setSavedExistingSheetId("");
            setCreatedSheetRemovalMode(null);
            setShowCreatedSheetDeleteDialog(false);
            setIsEditingCreatedSheet(false);
          } else if (provider === "airtable") {
            setAirtableBases([]);
            setAirtableTables([]);
            setAirtableBaseId("");
            setAirtableTableId("");
            setAirtableTableName("");
            setAirtableWorkspaceId("");
            setAirtableBaseName("Flowex Leads");
            setAirtableBaseUrl("");
            setAirtableCreatedBaseByFlowex(false);
            setAirtableExistingVerified(false);
            setShowAirtableRemoveDialog(false);
          } else if (provider === "excel") {
            setMicrosoftWorkbooks([]);
            setExcelWorkbookId("");
            setExcelWorkbookName("");
            setExcelWorkbookUrl("");
            setExcelTableId("");
            setExcelTableName("");
            setExcelExistingVerified(false);
            setExcelCreatedByFlowex(false);
            setShowExcelRemoveDialog(false);
            setExcelRemovalMode(null);
          } else if (provider === "notion") {
            setNotionParentPageId("");
            setNotionDatabaseId("");
            setNotionDataSourceId("");
            setNotionDatabaseName("");
            setNotionDatabaseUrl("");
            setNotionExistingVerified(false);
            setNotionCreatedByFlowex(false);
            setNotionMissingCount(0);
            setShowNotionRemoveDialog(false);
            setNotionRemovalMode(null);
          } else if (provider === "hubspot") {
            setHubSpotDestinationReady(false);
            setHubSpotMissingCount(0);
            setHubSpotMappedFieldCount(0);
          }
        }

        setHasUnsavedChanges(false);
      } catch (error) {
        setStorageError(
          error instanceof Error
            ? error.message
            : `Flowex could not disconnect ${providerLabel}.`
        );
      } finally {
        setDisconnectingStorageProvider(null);
      }
    };

  const connectStorageProvider =
    async () => {
      if (
        !leadFlowId ||
        isConnectingStorage
      ) {
        return;
      }

      setStorageError("");

      if (
        storageType !==
          "sheets" &&
        storageType !==
          "airtable" &&
        storageType !==
          "excel" &&
        storageType !==
          "notion" &&
        storageType !==
          "hubspot"
      ) {
        setStorageError(
          "This destination is coming soon."
        );
        return;
      }

      setIsConnectingStorage(
        true
      );

      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!session) {
          setStorageError(
            "Your session could not be verified. Please log in again."
          );
          return;
        }

        const response =
          await fetch(
            storageType ===
              "airtable"
              ? "/api/integrations/airtable/connect"
              : storageType ===
                  "excel"
                ? "/api/integrations/microsoft/connect"
                : storageType ===
                    "notion"
                  ? "/api/integrations/notion/connect"
                  : storageType ===
                      "hubspot"
                    ? "/api/integrations/hubspot/connect"
                    : "/api/integrations/google/connect",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify({
                  leadFlowId,
                }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          typeof result?.url !==
            "string"
        ) {
          setStorageError(
            result?.error ||
              (storageType ===
                "airtable"
                ? "Flowex could not start Airtable authorization."
                : storageType ===
                    "excel"
                  ? "Flowex could not start Microsoft authorization."
                  : storageType ===
                      "notion"
                    ? "Flowex could not start Notion authorization."
                    : storageType ===
                        "hubspot"
                      ? "Flowex could not start HubSpot authorization."
                      : "Flowex could not start Google authorization.")
          );
          return;
        }

        window.location.href =
          result.url;
      } catch {
        setStorageError(
          storageType ===
            "airtable"
            ? "Flowex could not start Airtable authorization."
            : storageType ===
                "excel"
              ? "Flowex could not start Microsoft authorization."
              : storageType ===
                  "notion"
                ? "Flowex could not start Notion authorization."
                : storageType ===
                    "hubspot"
                  ? "Flowex could not start HubSpot authorization."
                  : "Flowex could not start Google authorization."
        );
      } finally {
        setIsConnectingStorage(
          false
        );
      }
    };

  const callGoogleDestination =
    async (
      payload: Record<
        string,
        unknown
      >
    ) => {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session could not be verified. Please log in again."
        );
      }

      const response =
        await fetch(
          "/api/integrations/google/destination",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                leadFlowId,
                ...payload,
              }),
          }
        );

      const responseText =
        await response.text();

      let result: any = {};

      if (responseText) {
        try {
          result =
            JSON.parse(
              responseText
            );
        } catch {
          throw new Error(
            response.ok
              ? "Flowex received an unexpected response from Google Sheets."
              : "Flowex could not update Google Sheets. The server returned an unexpected response."
          );
        }
      }

      if (
        !response.ok
      ) {
        const error =
          new Error(
            result?.error ||
              "Flowex could not update Google Sheets."
          );

        (
          error as Error & {
            needsGoogleConnection?: boolean;
          }
        ).needsGoogleConnection =
          result?.needsGoogleConnection ===
          true;

        throw error;
      }

      return result;
    };

  const selectStorageMode =
    (
      mode:
        StorageMode
    ) => {
      setStorageMode(
        mode
      );

      setStoragePendingDelete(
        false
      );

      setCreatedSheetRemovalMode(
        null
      );

      setStoragePendingUnlink(
        false
      );

      if (
        mode ===
        "create_new"
      ) {
        setStorageConnected(
          !!createdSheetId
        );

        setStorageSpreadsheetUrl(
          createdSheetUrl
        );
      } else {
        setStorageDestination(
          existingSheetUrl
        );

        setStorageConnected(
          existingSheetVerified
        );

        setStorageSpreadsheetUrl(
          existingSheetUrl
        );
      }

      setStorageError(
        ""
      );

      setHasUnsavedChanges(
        true
      );
    };

  const callNotionDestination =
    async (payload: Record<string, unknown>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session could not be verified. Please log in again."
        );
      }

      const response = await fetch(
        "/api/integrations/notion/destination",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ...payload,
            leadFlowId,
          }),
        }
      );

      const text = await response.text();
      let result: Record<string, any> = {};

      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Flowex received an invalid response from Notion."
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.error || "Flowex could not update Notion."
        );
      }

      return result;
    };

  const loadNotionPages = async () => {
    if (!notionAccountConnected || isLoadingNotion) return;

    setIsLoadingNotion(true);
    setStorageError("");

    try {
      const result = await callNotionDestination({
        action: "list_pages",
      });

      setNotionPages(
        Array.isArray(result?.pages) ? result.pages : []
      );

      if (typeof result?.workspaceName === "string") {
        setNotionWorkspaceName(result.workspaceName);
      }
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Flowex could not load the Notion pages shared with it."
      );
    } finally {
      setIsLoadingNotion(false);
    }
  };

  const loadNotionDatabases = async () => {
    if (!notionAccountConnected || isLoadingNotion) return;

    setIsLoadingNotion(true);
    setStorageError("");

    try {
      const result = await callNotionDestination({
        action: "list_databases",
      });

      setNotionDatabases(
        Array.isArray(result?.databases)
          ? result.databases
          : []
      );
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Flowex could not load the Notion databases shared with it."
      );
    } finally {
      setIsLoadingNotion(false);
    }
  };

  const prepareNotionDestination = async () => {
    if (isPreparingStorage) return;

    setIsPreparingStorage(true);
    setStorageError("");

    try {
      if (storageMode === "create_new") {
        if (!notionParentPageId) {
          setStorageError(
            "Choose the Notion page where Flowex should create the lead database."
          );
          return;
        }

        if (!storageName.trim()) {
          setStorageError("Give the Notion database a name first.");
          return;
        }

        const result = await callNotionDestination({
          action: "create_new",
          parentPageId: notionParentPageId,
          displayName: storageName.trim(),
        });

        setNotionDatabaseId(
          typeof result?.databaseId === "string"
            ? result.databaseId
            : ""
        );
        setNotionDataSourceId(
          typeof result?.dataSourceId === "string"
            ? result.dataSourceId
            : ""
        );
        setNotionDatabaseName(
          typeof result?.databaseName === "string"
            ? result.databaseName
            : storageName.trim()
        );
        setNotionDatabaseUrl(
          typeof result?.databaseUrl === "string"
            ? result.databaseUrl
            : ""
        );
        setNotionCreatedByFlowex(true);
        setNotionExistingVerified(false);
        setNotionMissingCount(0);
        setStorageConnected(false);
      } else {
        if (!notionDataSourceId) {
          setStorageError("Choose a Notion database first.");
          return;
        }

        const result = await callNotionDestination({
          action: "verify_existing",
          dataSourceId: notionDataSourceId,
        });

        setNotionDatabaseId(
          typeof result?.databaseId === "string"
            ? result.databaseId
            : notionDatabaseId
        );
        setNotionDatabaseName(
          typeof result?.databaseName === "string"
            ? result.databaseName
            : notionDatabaseName
        );
        setNotionDatabaseUrl(
          typeof result?.databaseUrl === "string"
            ? result.databaseUrl
            : notionDatabaseUrl
        );
        setNotionMissingCount(
          typeof result?.missingCount === "number"
            ? result.missingCount
            : 0
        );
        setNotionExistingVerified(true);
        setNotionCreatedByFlowex(false);
      }

      setHasUnsavedChanges(true);
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Flowex could not prepare Notion."
      );
    } finally {
      setIsPreparingStorage(false);
    }
  };

  useEffect(() => {
    if (
      storageType === "notion" &&
      notionAccountConnected
    ) {
      if (storageMode === "create_new" && notionPages.length === 0) {
        void loadNotionPages();
      }

      if (storageMode === "existing" && notionDatabases.length === 0) {
        void loadNotionDatabases();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageType, storageMode, notionAccountConnected]);

  const callHubSpotDestination =
    async (payload: Record<string, unknown>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session could not be verified. Please log in again."
        );
      }

      const response = await fetch(
        "/api/integrations/hubspot/destination",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ...payload,
            leadFlowId,
          }),
        }
      );

      const text = await response.text();
      let result: Record<string, any> = {};

      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Flowex received an invalid response from HubSpot."
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.error || "Flowex could not update HubSpot."
        );
      }

      return result;
    };

  const inspectHubSpotDestination =
    async () => {
      if (!hubSpotAccountConnected || isPreparingStorage) {
        return;
      }

      setIsPreparingStorage(true);
      setStorageError("");

      try {
        const result = await callHubSpotDestination({
          action: "inspect",
        });

        setHubSpotMissingCount(
          typeof result?.missingCount === "number"
            ? result.missingCount
            : 0
        );

        setHubSpotMappedFieldCount(
          typeof result?.mappedFieldCount === "number"
            ? result.mappedFieldCount
            : 0
        );

        if (typeof result?.hubId === "string") {
          setHubSpotHubId(result.hubId);
        }

        setStorageError(
          typeof result?.missingCount === "number" && result.missingCount > 0
            ? `${result.missingCount} missing HubSpot ${result.missingCount === 1 ? "property" : "properties"} will be created when you save this step.`
            : "HubSpot Contacts is ready for this Lead Flow."
        );

        setHasUnsavedChanges(true);
      } catch (error) {
        setStorageError(
          error instanceof Error
            ? error.message
            : "Flowex could not prepare HubSpot."
        );
      } finally {
        setIsPreparingStorage(false);
      }
    };

  const callAirtableDestination =
    async (payload: Record<string, unknown>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session could not be verified. Please log in again.");

      const response = await fetch("/api/integrations/airtable/destination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...payload, leadFlowId }),
      });

      const text = await response.text();
      let result: Record<string, any> = {};
      try { result = text ? JSON.parse(text) : {}; } catch {
        throw new Error("Flowex received an invalid response from Airtable.");
      }
      if (!response.ok) throw new Error(result?.error || "Flowex could not update Airtable.");
      return result;
    };

  const loadAirtableBases = async () => {
    if (!airtableAccountConnected || isLoadingAirtable) return;
    setIsLoadingAirtable(true);
    setStorageError("");
    try {
      const result = await callAirtableDestination({ action: "list_bases" });
      setAirtableBases(Array.isArray(result?.bases) ? result.bases : []);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Flowex could not load Airtable bases.");
    } finally {
      setIsLoadingAirtable(false);
    }
  };

  const loadAirtableTables = async (baseId: string) => {
    if (!baseId) { setAirtableTables([]); return; }
    setIsLoadingAirtable(true);
    setStorageError("");
    try {
      const result = await callAirtableDestination({ action: "list_tables", baseId });
      setAirtableTables(Array.isArray(result?.tables) ? result.tables : []);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Flowex could not load Airtable tables.");
    } finally {
      setIsLoadingAirtable(false);
    }
  };

  const prepareAirtableDestination = async () => {
    if (isPreparingStorage) return;

    setIsPreparingStorage(true);
    setStorageError("");

    try {
      if (storageMode === "create_new") {
        if (!airtableBaseId) {
          setStorageError(
            airtableBaseMode === "create_base"
              ? "Create the Airtable base, refresh the list, then choose it first."
              : "Choose an Airtable base first."
          );
          return;
        }

        if (!storageName.trim()) {
          setStorageError("Give the Airtable table a name first.");
          return;
        }

        const result = await callAirtableDestination({
          action: "create_new",
          baseId: airtableBaseId,
          displayName: storageName.trim(),
        });

        setAirtableBaseUrl(
          typeof result?.baseUrl === "string"
            ? result.baseUrl
            : `https://airtable.com/${airtableBaseId}`
        );
        setAirtableTableId(
          typeof result?.tableId === "string" ? result.tableId : ""
        );
        setAirtableTableName(
          typeof result?.tableName === "string"
            ? result.tableName
            : storageName
        );
        setAirtableCreatedBaseByFlowex(
          airtableBaseMode === "create_base"
        );
        setStorageConnected(false);
      } else {
        if (!airtableBaseId) {
          setStorageError("Choose an Airtable base first.");
          return;
        }

        if (!airtableTableId) {
          setStorageError("Choose an Airtable table first.");
          return;
        }

        const result = await callAirtableDestination({
          action: "verify_existing",
          baseId: airtableBaseId,
          tableId: airtableTableId,
        });

        setAirtableExistingVerified(true);
        setAirtableBaseUrl(typeof result?.baseUrl === "string" ? result.baseUrl : `https://airtable.com/${airtableBaseId}`);
        setAirtableTableName(typeof result?.tableName === "string" ? result.tableName : airtableTableName);
        setAirtableCreatedBaseByFlowex(false);
      }

      setHasUnsavedChanges(true);
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Flowex could not prepare Airtable."
      );
    } finally {
      setIsPreparingStorage(false);
    }
  };

  useEffect(() => {
    if (storageType === "airtable" && airtableAccountConnected && airtableBases.length === 0) {
      void loadAirtableBases();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageType, airtableAccountConnected]);

  const callMicrosoftDestination =
    async (
      payload: Record<string, unknown>
    ) => {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your session could not be verified. Please log in again."
        );
      }

      const response =
        await fetch(
          "/api/integrations/microsoft/destination",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              ...payload,
              leadFlowId,
            }),
          }
        );

      const text =
        await response.text();

      let result:
        Record<string, any> = {};

      try {
        result =
          text
            ? JSON.parse(text)
            : {};
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Flowex could not update Microsoft Excel."
        );
      }

      return result;
    };

  const loadMicrosoftWorkbooks =
    async () => {
      if (
        !microsoftAccountConnected ||
        isLoadingMicrosoft
      ) {
        return;
      }

      setIsLoadingMicrosoft(true);
      setStorageError("");

      try {
        const result =
          await callMicrosoftDestination({
            action:
              "list_workbooks",
          });

        setMicrosoftWorkbooks(
          Array.isArray(
            result?.workbooks
          )
            ? result.workbooks
            : []
        );
      } catch (error) {
        setStorageError(
          error instanceof Error
            ? error.message
            : "Flowex could not load Excel workbooks."
        );
      } finally {
        setIsLoadingMicrosoft(false);
      }
    };

  const prepareMicrosoftExcel =
    async () => {
      if (
        isPreparingStorage
      ) {
        return;
      }

      setIsPreparingStorage(true);
      setStorageError("");

      try {
        if (
          storageMode ===
          "create_new"
        ) {
          if (!storageName.trim()) {
            setStorageError(
              "Give the workbook a name first."
            );
            return;
          }

          const result =
            await callMicrosoftDestination({
              action:
                "create_new",
              displayName:
                storageName.trim(),
            });

          setExcelWorkbookId(
            typeof result?.workbookId ===
              "string"
              ? result.workbookId
              : ""
          );

          setExcelWorkbookName(
            typeof result?.workbookName ===
              "string"
              ? result.workbookName
              : storageName
          );

          setExcelWorkbookUrl(
            typeof result?.workbookUrl ===
              "string"
              ? result.workbookUrl
              : ""
          );

          setExcelTableId(
            typeof result?.tableId ===
              "string"
              ? result.tableId
              : ""
          );

          setExcelTableName(
            typeof result?.tableName ===
              "string"
              ? result.tableName
              : ""
          );

          setExcelCreatedByFlowex(
            true
          );

          setStorageConnected(
            false
          );
        } else {
          if (!excelWorkbookId) {
            setStorageError(
              "Choose an Excel workbook first."
            );
            return;
          }

          const result =
            await callMicrosoftDestination({
              action:
                "verify_existing",
              workbookId:
                excelWorkbookId,
            });

          setExcelWorkbookName(
            typeof result?.workbookName ===
              "string"
              ? result.workbookName
              : excelWorkbookName
          );

          setExcelWorkbookUrl(
            typeof result?.workbookUrl ===
              "string"
              ? result.workbookUrl
              : excelWorkbookUrl
          );

          setExcelTableId(
            typeof result?.tableId ===
              "string"
              ? result.tableId
              : ""
          );

          setExcelTableName(
            typeof result?.tableName ===
              "string"
              ? result.tableName
              : ""
          );

          setExcelExistingVerified(
            true
          );

          setExcelCreatedByFlowex(
            false
          );
        }

        setHasUnsavedChanges(
          true
        );
      } catch (error) {
        setStorageError(
          error instanceof Error
            ? error.message
            : "Flowex could not prepare Microsoft Excel."
        );
      } finally {
        setIsPreparingStorage(
          false
        );
      }
    };

  useEffect(() => {
    if (
      storageType === "excel" &&
      microsoftAccountConnected &&
      microsoftWorkbooks.length === 0
    ) {
      void loadMicrosoftWorkbooks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    storageType,
    microsoftAccountConnected,
  ]);

  const prepareGoogleSheet =
    async () => {
      if (
        !leadFlowId ||
        isPreparingStorage
      ) {
        return;
      }

      setStorageError(
        ""
      );

      if (
        !googleAccountConnected
      ) {
        setStorageError(
          "Connect your Google account first."
        );

        return;
      }

      if (
        !storageName.trim()
      ) {
        setStorageError(
          "Give this destination a name first."
        );

        return;
      }

      setIsPreparingStorage(
        true
      );

      try {
        if (
          storageMode ===
          "create_new"
        ) {
          if (
            createdSheetId &&
            !storagePendingDelete
          ) {
            setStorageError(
              "This Lead Flow already has a prepared new sheet. Use Edit or Delete below."
            );

            return;
          }

          const result =
            await callGoogleDestination({
              action:
                "create_new",

              displayName:
                storageName.trim(),
            });

          setCreatedSheetId(
            typeof result
              ?.spreadsheetId ===
              "string"
              ? result.spreadsheetId
              : ""
          );

          setCreatedSheetUrl(
            typeof result
              ?.spreadsheetUrl ===
              "string"
              ? result.spreadsheetUrl
              : ""
          );

          setStorageSpreadsheetUrl(
            typeof result
              ?.spreadsheetUrl ===
              "string"
              ? result.spreadsheetUrl
              : ""
          );

          setStorageConnected(
            true
          );

          setStoragePendingDelete(
            false
          );

          setIsEditingCreatedSheet(
            false
          );

          setStorageError(
            "New Google Sheet prepared. Use the Save changes button in this step to attach it to this Lead Flow."
          );

          setIsEditingStorage(false);
        } else {
          const url =
            storageDestination
              .trim();

          if (!url) {
            setStorageError(
              "Paste the Google Sheet URL you want Flowex to use."
            );

            return;
          }

          const result =
            await callGoogleDestination({
              action:
                "verify_existing",

              destination:
                url,
            });

          setExistingSheetId(
            typeof result
              ?.spreadsheetId ===
              "string"
              ? result.spreadsheetId
              : ""
          );

          setExistingSheetUrl(
            typeof result
              ?.spreadsheetUrl ===
              "string"
              ? result.spreadsheetUrl
              : url
          );

          setStorageDestination(
            typeof result
              ?.spreadsheetUrl ===
              "string"
              ? result.spreadsheetUrl
              : url
          );

          setStorageSpreadsheetUrl(
            typeof result
              ?.spreadsheetUrl ===
              "string"
              ? result.spreadsheetUrl
              : url
          );

          setExistingSheetVerified(
            true
          );

          setStorageConnected(
            true
          );

          setStoragePendingUnlink(
            false
          );

          setStorageError(
            "Existing Google Sheet verified and mapped. Flowex will only reorganize it when you save this step if the sheet needs structure."
          );

          setIsEditingStorage(false);
        }

        setHasUnsavedChanges(
          true
        );
      } catch (
        error
      ) {
        const failure =
          error as Error & {
            needsGoogleConnection?: boolean;
          };

        if (
          failure
            .needsGoogleConnection ===
          true
        ) {
          setGoogleAccountConnected(
            false
          );
        }

        setStorageConnected(
          false
        );

        setStorageError(
          failure.message ||
            "Flowex could not prepare this Google Sheet."
        );
      } finally {
        setIsPreparingStorage(
          false
        );
      }
    };

  const markExistingUnlinked =
    () => {
      if (
        !existingSheetId &&
        !existingSheetUrl
      ) {
        return;
      }

      setStoragePendingUnlink(
        true
      );

      setIsEditingStorage(false);

      setStorageConnected(
        false
      );

      setStorageError(
        "This existing sheet will be unlinked when you save this step."
      );

      setHasUnsavedChanges(
        true
      );
    };

  const undoExistingUnlink =
    () => {
      setStoragePendingUnlink(
        false
      );

      setStorageConnected(
        existingSheetVerified
      );

      setStorageError(
        ""
      );

      setHasUnsavedChanges(
        true
      );
    };

  const markCreatedSheetDeleted =
    () => {
      if (!createdSheetId) {
        return;
      }

      setShowCreatedSheetDeleteDialog(
        true
      );
    };

  const chooseCreatedSheetRemoval =
    (
      mode:
        "unlink" |
        "trash"
    ) => {
      setShowCreatedSheetDeleteDialog(
        false
      );

      setCreatedSheetRemovalMode(
        mode
      );

      setStoragePendingDelete(
        true
      );

      setIsEditingStorage(false);

      setStorageConnected(
        false
      );

      setStorageError(
        mode ===
          "trash"
          ? "This sheet will be removed from the automation and moved to Google Drive Trash when you save this step."
          : "This sheet will be removed from the automation when you save this step. The Google Sheet itself will stay in your Drive."
      );

      setHasUnsavedChanges(
        true
      );
    };


  const undoCreatedSheetDelete =
    () => {
      setStoragePendingDelete(
        false
      );

      setCreatedSheetRemovalMode(
        null
      );

      setStorageConnected(
        !!createdSheetId
      );

      setStorageError(
        ""
      );

      setHasUnsavedChanges(
        true
      );
    };



  const replyTemplates: Record<ReplyType, string> = {
    preset_1:
      "Thanks for reaching out. We’ve received your message and will get back to you shortly.",
    preset_2:
      "Thanks for contacting us. Your inquiry has been received and our team will be in touch soon.",
    preset_3:
      "We’ve received your details. Someone from our team will contact you shortly.",
    custom: customReply,
  };

  const toggleAutomationActive =
    () => {
      setActive(
        (current) =>
          !current
      );

      setHasUnsavedChanges(
        true
      );
      setDirtySteps((current) => {
        const next = new Set(current);
        next.add("status");
        return next;
      });
    };


  const deleteLeadFlow =
    async () => {
      if (
        !leadFlowId ||
        !flowReady ||
        isDeletingLeadFlow
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete this Lead Flow? This will permanently remove its forms, sources, and leads."
        );

      if (!confirmed) {
        return;
      }

      setIsDeletingLeadFlow(
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
          alert(
            "Your session could not be verified."
          );
          return;
        }

        const {
          error,
        } =
          await supabase
            .from("lead_flows")
            .delete()
            .eq(
              "id",
              leadFlowId
            )
            .eq(
              "user_id",
              user.id
            );

        if (error) {
          alert(
            "Flowex could not delete this Lead Flow."
          );
          return;
        }

        localStorage.removeItem(
          `flowex-lead-capture:${leadFlowId}`
        );

        const selectedFlow =
          localStorage.getItem(
            "flowex-selected-lead-flow"
          );

        if (
          selectedFlow ===
          leadFlowId
        ) {
          localStorage.removeItem(
            "flowex-selected-lead-flow"
          );
        }

        router.replace(
          "/lead-capture/dashboard"
        );
      } finally {
        setIsDeletingLeadFlow(
          false
        );
      }
    };

  const saveLeadFlowName = async () => {
    if (!leadFlowId || isSavingLeadFlowName) return;

    const nextName = leadFlowNameDraft.trim();

    if (!nextName) {
      setLeadFlowNameDraft(leadFlowName);
      return;
    }

    if (nextName === leadFlowName) {
      setIsEditingLeadFlowName(false);
      return;
    }

    setIsSavingLeadFlowName(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Your session could not be verified.");
        return;
      }

      const { error } = await supabase
        .from("lead_flows")
        .update({
          name: nextName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadFlowId)
        .eq("user_id", user.id);

      if (error) {
        alert("Flowex could not rename this Lead Flow.");
        return;
      }

      setLeadFlowName(nextName);
      setLeadFlowNameDraft(nextName);
      setIsEditingLeadFlowName(false);
    } finally {
      setIsSavingLeadFlowName(false);
    }
  };

  const saveChanges =
    async (
      showSuccess = true
    ): Promise<boolean> => {
      if (
        !leadFlowId ||
        isSavingAutomation
      ) {
        return false;
      }

      if (
        sourceType ===
          "external" &&
        (
          !externalVerified ||
          !externalCaptureConnected
        )
      ) {
        alert(
          "Finish connecting the Lovable Form to Flowex before using it."
        );

        return false;
      }

      setIsSavingAutomation(
        true
      );

      try {
        const currentReply =
          replyType ===
            "custom"
            ? customReply
            : replyTemplates[
                replyType
              ];

        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          alert(
            "Your session could not be verified."
          );

          return false;
        }

        const {
          error:
            activeSaveError,
        } =
          await supabase
            .from(
              "lead_flows"
            )
            .update({
              active,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              leadFlowId
            )
            .eq(
              "user_id",
              user.id
            );

        if (
          activeSaveError
        ) {
          alert(
            "Flowex could not save the automation status."
          );

          return false;
        }

        if (storageType === "sheets") {
        if (
          !storagePendingDelete &&
          !storagePendingUnlink &&
          savedStorageMode !== null &&
          storageMode !==
            savedStorageMode
        ) {
          if (
            storageMode ===
              "create_new" &&
            !createdSheetId
          ) {
            alert(
              "Create the new Google Sheet first, or switch back to your saved Existing Sheet."
            );

            return false;
          }

          if (
            storageMode ===
              "existing" &&
            (
              !existingSheetId ||
              !existingSheetVerified
            )
          ) {
            alert(
              "Verify the existing Google Sheet first, or switch back to your saved Flowex-created Sheet."
            );

            return false;
          }
        }

        if (
          storagePendingDelete &&
          createdSheetId
        ) {
          try {
            await callGoogleDestination({
              action:
                createdSheetRemovalMode ===
                  "trash"
                  ? "trash_created"
                  : "unlink_destination",

              spreadsheetId:
                createdSheetId,
            });
          } catch (
            error
          ) {
            alert(
              error instanceof
                Error
                ? error.message
                : createdSheetRemovalMode ===
                    "trash"
                  ? "Flowex could not delete this Google Sheet."
                  : "Flowex could not remove this Google Sheet from the automation."
            );

            return false;
          }

          setCreatedSheetId(
            ""
          );

          setCreatedSheetUrl(
            ""
          );

          setSavedCreatedSheetId(
            ""
          );

          setStoragePendingDelete(
            false
          );

          setCreatedSheetRemovalMode(
            null
          );

          setStorageConnected(
            false
          );

          setStorageSpreadsheetUrl(
            ""
          );

          setSavedStorageMode(
            null
          );
        } else if (
          storagePendingUnlink
        ) {
          try {
            await callGoogleDestination({
              action:
                "unlink_existing",
            });
          } catch (
            error
          ) {
            alert(
              error instanceof
                Error
                ? error.message
                : "Flowex could not unlink this Google Sheet."
            );

            return false;
          }

          setExistingSheetId(
            ""
          );

          setExistingSheetUrl(
            ""
          );

          setStorageDestination(
            ""
          );

          setSavedExistingSheetId(
            ""
          );

          setExistingSheetVerified(
            false
          );

          setStoragePendingUnlink(
            false
          );

          setStorageConnected(
            false
          );

          setStorageSpreadsheetUrl(
            ""
          );

          setSavedStorageMode(
            null
          );
        } else {
          const selectedSpreadsheetId =
            storageMode ===
              "create_new"
              ? createdSheetId
              : existingSheetId;

          if (
            selectedSpreadsheetId
          ) {
            let result:
              Record<
                string,
                unknown
              >;

            try {
              result =
                await callGoogleDestination({
                  action:
                    "commit",

                  mode:
                    storageMode,

                  displayName:
                    storageName.trim() ||
                    "Flowex Leads",

                  spreadsheetId:
                    selectedSpreadsheetId,

                  destination:
                    storageMode ===
                      "existing"
                      ? existingSheetUrl ||
                        storageDestination
                      : createdSheetUrl,

                  createdByFlowex:
                    storageMode ===
                    "create_new",
                });
            } catch (
              error
            ) {
              alert(
                error instanceof
                  Error
                  ? error.message
                  : "Flowex could not save the Google Sheets destination."
              );

              return false;
            }

            const savedUrl =
              typeof result
                ?.spreadsheetUrl ===
                "string"
                ? result.spreadsheetUrl
                : storageSpreadsheetUrl;

            setStorageConnected(
              true
            );

            setStorageSpreadsheetUrl(
              savedUrl
            );

            setSavedStorageMode(
              storageMode
            );

            if (
              storageMode ===
              "create_new"
            ) {
              setCreatedSheetUrl(
                savedUrl
              );

              setSavedCreatedSheetId(
                selectedSpreadsheetId
              );

              /*
                If the user prepared a new Flowex sheet while an
                old existing-sheet destination was still saved,
                the commit above replaces the Lead Flow destination.
                The external existing sheet itself is never deleted.
              */
              setSavedExistingSheetId(
                ""
              );
            } else {
              setExistingSheetUrl(
                savedUrl
              );

              setStorageDestination(
                savedUrl
              );

              setSavedExistingSheetId(
                selectedSpreadsheetId
              );

              setExistingSheetVerified(
                true
              );

              /*
                Avoid leaving an unused, newly-created draft Sheet
                behind if the user ultimately saved Existing Sheet.
              */
              if (
                createdSheetId &&
                createdSheetId !==
                  savedCreatedSheetId
              ) {
                try {
                  await callGoogleDestination({
                    action:
                      "trash_created",

                    spreadsheetId:
                      createdSheetId,
                  });

                  setCreatedSheetId(
                    ""
                  );

                  setCreatedSheetUrl(
                    ""
                  );
                } catch {
                  /*
                    Destination save succeeded. An orphan-draft
                    cleanup failure should not roll the automation
                    back.
                  */
                }
              }

              setSavedCreatedSheetId(
                ""
              );
            }
          }
        }

        } else if (storageType === "hubspot") {
          if (storagePendingUnlink) {
            try {
              await callHubSpotDestination({
                action: "unlink_destination",
              });
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Flowex could not unlink HubSpot."
              );
              return false;
            }

            setHubSpotDestinationReady(false);
            setHubSpotMissingCount(0);
            setHubSpotMappedFieldCount(0);
            setStorageConnected(false);
            setStoragePendingUnlink(false);
            setSavedStorageMode(null);
          } else if (hubSpotAccountConnected) {
            try {
              const result = await callHubSpotDestination({
                action: "commit",
              });

              setHubSpotDestinationReady(true);
              setStorageConnected(true);
              setSavedStorageMode("existing");
              setStorageMode("existing");
              setHubSpotMissingCount(0);
              setHubSpotMappedFieldCount(
                typeof result?.mappedFieldCount === "number"
                  ? result.mappedFieldCount
                  : hubSpotMappedFieldCount
              );

              if (typeof result?.hubId === "string") {
                setHubSpotHubId(result.hubId);
              }
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Flowex could not save the HubSpot destination."
              );
              return false;
            }
          } else {
            alert("Connect HubSpot first.");
            return false;
          }
        } else if (storageType === "notion") {
          if (
            storagePendingUnlink ||
            notionRemovalMode === "unlink"
          ) {
            try {
              await callNotionDestination({
                action: "unlink_destination",
              });
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Flowex could not unlink Notion."
              );
              return false;
            }

            setNotionParentPageId("");
            setNotionDatabaseId("");
            setNotionDataSourceId("");
            setNotionDatabaseName("");
            setNotionDatabaseUrl("");
            setNotionExistingVerified(false);
            setNotionCreatedByFlowex(false);
            setNotionMissingCount(0);
            setNotionRemovalMode(null);
            setStorageConnected(false);
            setStoragePendingUnlink(false);
            setSavedStorageMode(null);
          } else if (
            notionRemovalMode === "trash" &&
            notionDatabaseId
          ) {
            try {
              await callNotionDestination({
                action: "trash_created",
                databaseId: notionDatabaseId,
              });
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Flowex could not move this Notion database to trash."
              );
              return false;
            }

            setNotionParentPageId("");
            setNotionDatabaseId("");
            setNotionDataSourceId("");
            setNotionDatabaseName("");
            setNotionDatabaseUrl("");
            setNotionExistingVerified(false);
            setNotionCreatedByFlowex(false);
            setNotionMissingCount(0);
            setNotionRemovalMode(null);
            setStorageConnected(false);
            setSavedStorageMode(null);
          } else if (
            notionDataSourceId &&
            notionDatabaseId &&
            (
              storageMode === "create_new" ||
              notionExistingVerified
            )
          ) {
            try {
              const result = await callNotionDestination({
                action: "commit",
                mode: storageMode,
                dataSourceId: notionDataSourceId,
                databaseId: notionDatabaseId,
                parentPageId: notionParentPageId,
                displayName:
                  storageName.trim() ||
                  notionDatabaseName ||
                  "Flowex Leads",
                createdByFlowex: notionCreatedByFlowex,
              });

              setStorageConnected(true);
              setSavedStorageMode(storageMode);
              setNotionDatabaseName(
                typeof result?.databaseName === "string"
                  ? result.databaseName
                  : notionDatabaseName
              );
              setNotionDatabaseUrl(
                typeof result?.databaseUrl === "string"
                  ? result.databaseUrl
                  : notionDatabaseUrl
              );
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Flowex could not save the Notion destination."
              );
              return false;
            }
          } else if (notionAccountConnected) {
            alert(
              storageMode === "create_new"
                ? "Create the Notion database first."
                : "Choose and verify an existing Notion database first."
            );
            return false;
          }
        } else if (storageType === "excel") {
          if (
            storagePendingUnlink ||
            excelRemovalMode === "unlink"
          ) {
            try {
              await callMicrosoftDestination({
                action:
                  "unlink_destination",
              });
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Flowex could not unlink Microsoft Excel."
              );
              return false;
            }

            setExcelWorkbookId("");
            setExcelWorkbookName("");
            setExcelWorkbookUrl("");
            setExcelTableId("");
            setExcelTableName("");
            setExcelExistingVerified(false);
            setExcelCreatedByFlowex(false);
            setExcelRemovalMode(null);
            setStorageConnected(false);
            setStoragePendingUnlink(false);
            setSavedStorageMode(null);
          } else if (
            excelRemovalMode === "trash" &&
            excelWorkbookId
          ) {
            try {
              await callMicrosoftDestination({
                action:
                  "trash_created",
                workbookId:
                  excelWorkbookId,
              });
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Flowex could not delete the Excel workbook."
              );
              return false;
            }

            setExcelWorkbookId("");
            setExcelWorkbookName("");
            setExcelWorkbookUrl("");
            setExcelTableId("");
            setExcelTableName("");
            setExcelExistingVerified(false);
            setExcelCreatedByFlowex(false);
            setExcelRemovalMode(null);
            setStorageConnected(false);
            setSavedStorageMode(null);
          } else if (
            excelWorkbookId &&
            excelTableId &&
            (
              storageMode === "create_new" ||
              excelExistingVerified
            )
          ) {
            try {
              const result =
                await callMicrosoftDestination({
                  action:
                    "commit",
                  mode:
                    storageMode,
                  workbookId:
                    excelWorkbookId,
                  displayName:
                    storageName.trim() ||
                    excelWorkbookName ||
                    "Flowex Leads",
                  createdByFlowex:
                    excelCreatedByFlowex,
                });

              setStorageConnected(
                true
              );

              setSavedStorageMode(
                storageMode
              );

              setExcelWorkbookName(
                typeof result?.workbookName ===
                  "string"
                  ? result.workbookName
                  : excelWorkbookName
              );

              setExcelWorkbookUrl(
                typeof result?.workbookUrl ===
                  "string"
                  ? result.workbookUrl
                  : excelWorkbookUrl
              );

              setExcelTableId(
                typeof result?.tableId ===
                  "string"
                  ? result.tableId
                  : excelTableId
              );

              setExcelTableName(
                typeof result?.tableName ===
                  "string"
                  ? result.tableName
                  : excelTableName
              );
            } catch (error) {
              alert(
                error instanceof Error
                  ? error.message
                  : "Flowex could not save the Microsoft Excel destination."
              );
              return false;
            }
          } else if (
            microsoftAccountConnected
          ) {
            alert(
              storageMode === "create_new"
                ? "Create the Excel workbook first."
                : "Choose and verify an existing Excel workbook first."
            );
            return false;
          }
        } else if (storageType === "airtable") {
          if (storagePendingUnlink) {
            try {
              await callAirtableDestination({ action: "unlink_destination" });
            } catch (error) {
              alert(error instanceof Error ? error.message : "Flowex could not unlink Airtable.");
              return false;
            }
            setAirtableBaseId("");
            setAirtableTableId("");
            setAirtableTableName("");
            setAirtableBaseMode("existing_base");
            setAirtableWorkspaceId("");
            setAirtableBaseName("Flowex Leads");
            setAirtableCreatedBaseByFlowex(false);
            setAirtableBaseUrl("");
            setAirtableExistingVerified(false);
            setStorageConnected(false);
            setStoragePendingUnlink(false);
            setSavedStorageMode(null);
          } else if (airtableBaseId && airtableTableId && (storageMode === "create_new" || airtableExistingVerified)) {
            try {
              const result = await callAirtableDestination({
                action: "commit",
                mode: storageMode,
                baseId: airtableBaseId,
                tableId: airtableTableId,
                displayName: storageName.trim() || airtableTableName || "Flowex Leads",
                baseName: airtableBaseName,
                createdBaseByFlowex: airtableCreatedBaseByFlowex,
              });
              setStorageConnected(true);
              setSavedStorageMode(storageMode);
              setAirtableTableName(typeof result?.tableName === "string" ? result.tableName : airtableTableName);
            } catch (error) {
              alert(error instanceof Error ? error.message : "Flowex could not save the Airtable destination.");
              return false;
            }
          } else if (airtableAccountConnected) {
            alert(storageMode === "create_new" ? "Create the Airtable table first." : "Choose and verify an existing Airtable table first.");
            return false;
          }
        }

        const automationData = {
          active,
          sourceType,
          flowexFormTitle,
          flowexFormFields,
          storageType,
          storageMode,
          storageName,

          storageDestination:
            storagePendingDelete || storagePendingUnlink
              ? ""
              : storageType === "airtable"
                ? airtableTableId
                : storageType === "notion"
                  ? notionDataSourceId
                  : storageType === "hubspot"
                    ? hubSpotDestinationReady ? "contacts" : ""
                    : storageType === "excel"
                  ? excelWorkbookId
                  : storageMode === "existing"
                  ? existingSheetUrl || storageDestination
                  : createdSheetUrl,

          replyChannel,
          replyType,
          replySubject,

          replyMessage:
            currentReply,

          companyEmail,
          followUpEnabled,
          followUpDelay,
          followUpMessage,
        };

        localStorage.setItem(
          `flowex-lead-capture:${leadFlowId}`,
          JSON.stringify(
            automationData
          )
        );

        setHasUnsavedChanges(
          false
        );

        setIsEditingCreatedSheet(
          false
        );

        if (
          showSuccess
        ) {
          alert(
            "Automation saved successfully!"
          );
        }

        return true;
      } finally {
        setIsSavingAutomation(
          false
        );
      }
    };

  const loadReplySettings = async () => {
    if (!leadFlowId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    try {
      const response = await fetch(
        `/api/integrations/reply?leadFlowId=${encodeURIComponent(leadFlowId)}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Flowex could not load reply settings.");
      }

      setEmailSenderConnected(result.emailConnected === true);
      setEmailSenderAddress(
        typeof result.emailAddress === "string" ? result.emailAddress : ""
      );

      if (result.settings) {
        setReplyChannel(
          result.settings.channel === "whatsapp" ? "whatsapp" : "email"
        );
        setReplyType(
          ["preset_1", "preset_2", "preset_3", "custom"].includes(result.settings.template)
            ? result.settings.template
            : "preset_1"
        );
        setReplySubject(
          typeof result.settings.subject === "string"
            ? result.settings.subject
            : "Thanks for reaching out"
        );
        if (typeof result.settings.message === "string") {
          setCustomReply(result.settings.message);
        }
      }
    } catch (error) {
      setReplySettingsError(
        error instanceof Error ? error.message : "Flowex could not load reply settings."
      );
    }
  };

  useEffect(() => {
    if (flowReady && leadFlowId) {
      void loadReplySettings();
    }
  }, [flowReady, leadFlowId]);

  const connectReplyEmail = async () => {
    if (!leadFlowId) return;

    setIsConnectingReplyEmail(true);
    setReplySettingsError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session could not be verified.");
      }

      const response = await fetch("/api/integrations/reply/google/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leadFlowId }),
      });

      const result = await response.json();

      if (!response.ok || !result?.url) {
        throw new Error(result?.error || "Flowex could not start email connection.");
      }

      window.location.href = result.url;
    } catch (error) {
      setReplySettingsError(
        error instanceof Error ? error.message : "Flowex could not connect this email."
      );
      setIsConnectingReplyEmail(false);
    }
  };

  const saveReplyStep = async () => {
    if (!leadFlowId) return false;

    if (replyChannel === "whatsapp") {
      setReplySettingsError("WhatsApp connection is coming next. Choose Email for now.");
      return false;
    }

    if (!emailSenderConnected || !emailSenderAddress) {
      setReplySettingsError("Connect the email you want replies sent from first.");
      return false;
    }

    const message =
      replyType === "custom"
        ? customReply.trim()
        : replyTemplates[replyType];

    if (!replySubject.trim() || !message) {
      setReplySettingsError("Add an email subject and message.");
      return false;
    }

    setIsSavingAutomation(true);
    setReplySettingsError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session could not be verified.");
      }

      const response = await fetch("/api/integrations/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          leadFlowId,
          channel: replyChannel,
          template: replyType,
          subject: replySubject.trim(),
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Flowex could not save Step 03.");
      }

      setHasUnsavedChanges(false);
      setDirtySteps((current) => {
        const next = new Set(current);
        next.delete("03");
        return next;
      });
      return true;
    } catch (error) {
      setReplySettingsError(
        error instanceof Error ? error.message : "Flowex could not save Step 03."
      );
      return false;
    } finally {
      setIsSavingAutomation(false);
    }
  };

  const saveStep = async (_step: string) => {
    const scrollY = window.scrollY;

    if (_step === "03") {
      const savedReply = await saveReplyStep();
      if (savedReply) {
        window.requestAnimationFrame(() => window.scrollTo(0, scrollY));
      }
      return savedReply;
    }

    const saved = await saveChanges(false);

    if (saved) {
      setDirtySteps(new Set());
      window.requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }

    return saved;
  };

  const handleManageInteraction = (
    event: React.SyntheticEvent<HTMLElement>
  ) => {
    const target = event.target as HTMLElement | null;
    const step = target?.closest<HTMLElement>("[data-flow-step]");
    const stepNumber = step?.dataset.flowStep;

    if (stepNumber && !target?.closest("[data-step-save]")) {
      setDirtySteps((current) => {
        const next = new Set(current);
        next.add(stepNumber);
        return next;
      });
    }

    const scrollY = window.scrollY;
    window.requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - scrollY) > 24) {
        window.scrollTo(0, scrollY);
      }
    });
  };

  const discardUnsavedDraft =
    async () => {
      /*
        Only clean up a newly-created Sheet that was never saved
        as this Lead Flow's destination. Saved Sheets are left intact.
      */
      if (
        createdSheetId &&
        createdSheetId !==
          savedCreatedSheetId
      ) {
        try {
          await callGoogleDestination({
            action:
              "trash_created",

            spreadsheetId:
              createdSheetId,
          });
        } catch {
          // Navigation should not be blocked by draft cleanup failure.
        }
      }

      setHasUnsavedChanges(
        false
      );
    };

  const requestNavigation =
    (
      path:
        string
    ) => {
      if (
        !hasUnsavedChanges
      ) {
        router.push(
          path
        );

        return;
      }

      setPendingNavigation(
        path
      );

      setShowUnsavedDialog(
        true
      );
    };

  useEffect(() => {
    if (
      !hasUnsavedChanges
    ) {
      return;
    }

    window.history.pushState(
      {
        flowexUnsavedGuard:
          true,
      },
      "",
      window.location.href
    );

    const handlePopState =
      () => {
        setPendingNavigation(
          "/lead-capture/dashboard"
        );

        setShowUnsavedDialog(
          true
        );

        window.history.pushState(
          {
            flowexUnsavedGuard:
              true,
          },
          "",
          window.location.href
        );
      };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, [
    hasUnsavedChanges,
  ]);

  useEffect(() => {
    const handleBeforeUnload =
      (
        event:
          BeforeUnloadEvent
      ) => {
        if (
          !hasUnsavedChanges
        ) {
          return;
        }

        event.preventDefault();

        event.returnValue =
          "";
      };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [
    hasUnsavedChanges,
  ]);

  const hasConfiguredStorage =
    !storagePendingDelete &&
    !storagePendingUnlink &&
    (
      storageType === "sheets"
        ? (
            (storageMode === "create_new" && !!createdSheetId) ||
            (storageMode === "existing" && !!existingSheetId && existingSheetVerified)
          )
        : storageType === "airtable"
          ? (
              !!airtableBaseId &&
              !!airtableTableId &&
              (storageMode === "create_new" || airtableExistingVerified)
            )
          : storageType === "excel"
            ? (
                !!excelWorkbookId &&
                !!excelTableId &&
                (storageMode === "create_new" || excelExistingVerified)
              )
            : storageType === "notion"
              ? (
                  !!notionDatabaseId &&
                  !!notionDataSourceId &&
                  (storageMode === "create_new" || notionExistingVerified)
                )
              : storageType === "hubspot"
                ? hubSpotDestinationReady
                : false
    );

  if (
    !authReady ||
    !hasPremiumAccess ||
    !flowReady
  ) {
    return null;
  }

  return (
    <main
      onClickCapture={handleManageInteraction}
      onChangeCapture={handleManageInteraction}
      className="min-h-screen bg-[#f7f9fb] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100"
    >

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              requestNavigation(
                "/dashboard"
              )
            }
            className="cursor-pointer"
          >
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />
          </button>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                requestNavigation(
                  "/lead-capture/dashboard"
                )
              }
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 app-dark:text-slate-300 app-dark:hover:bg-white/10 app-dark:hover:text-white"
            >
              Back
            </button>



          </div>

        </div>

      </header>

      {/* PAGE */}

      <section className="px-4 py-6 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-5xl">

          {/* HEADER */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-xs font-semibold tracking-wide text-emerald-600 app-dark:text-emerald-400">
                LEAD CAPTURE
              </p>

              <div className="mt-1.5 flex min-w-0 items-center gap-2">
                {isEditingLeadFlowName ? (
                  <>
                    <input
                      type="text"
                      value={leadFlowNameDraft}
                      onChange={(event) => setLeadFlowNameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void saveLeadFlowName();
                        if (event.key === "Escape") {
                          setLeadFlowNameDraft(leadFlowName);
                          setIsEditingLeadFlowName(false);
                        }
                      }}
                      autoFocus
                      maxLength={80}
                      className="h-9 min-w-0 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 text-lg font-bold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white"
                      aria-label="Lead Flow name"
                    />
                    <button
                      type="button"
                      onClick={() => void saveLeadFlowName()}
                      disabled={isSavingLeadFlowName}
                      className="h-9 shrink-0 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 app-dark:bg-white app-dark:text-gray-900 app-dark:hover:bg-slate-200"
                    >
                      {isSavingLeadFlowName ? "Saving..." : "Save"}
                    </button>
                  </>
                ) : (
                  <>
                    <h1 className="truncate text-2xl font-black sm:text-3xl app-dark:text-white">
                      {leadFlowName || "Automation Flow"}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setLeadFlowNameDraft(leadFlowName);
                        setIsEditingLeadFlowName(true);
                      }}
                      className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 app-dark:text-slate-500 app-dark:hover:bg-white/10 app-dark:hover:text-slate-200"
                    >
                      Rename
                    </button>
                  </>
                )}
              </div>

              <p className="mt-1.5 max-w-xl text-sm text-gray-500 app-dark:text-slate-400">
                Build your lead workflow from capture to follow-up.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={toggleAutomationActive}
                className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 ${
                  active
                    ? "border border-red-200 bg-white text-red-600 hover:bg-red-50 app-dark:border-red-500/30 app-dark:bg-[#11161d] app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                    : "bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 text-white shadow-md"
                }`}
              >
                {active ? "Pause Automation" : "Resume Automation"}
              </button>

              {dirtySteps.has("status") && (
                <button
                  type="button"
                  data-step-save
                  onClick={() => void saveStep("status")}
                  disabled={isSavingAutomation}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAutomation ? "Saving..." : "Save status"}
                </button>
              )}

              <button
                type="button"
                onClick={deleteLeadFlow}
                disabled={isDeletingLeadFlow}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-red-500/30 app-dark:bg-[#11161d] app-dark:text-red-400 app-dark:hover:bg-red-500/10"
              >
                {isDeletingLeadFlow
                  ? "Deleting..."
                  : "Delete Lead Flow"}
              </button>

            </div>

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
              onSave={() => void saveStep("01")}
              saving={isSavingAutomation}
              dirty={dirtySteps.has("01")}
              title="Capture Lead"
              description="Choose how new leads enter Flowex."
            >

              {flowexFormSourceId || externalSourceId ? (
                <>
                  <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">✓</span>
                        <div className="min-w-0">
                          <p className="font-semibold app-dark:text-white">
                            {flowexFormSourceId ? "Flowex Form" : "Lovable Form"}
                          </p>
                          <p className="truncate text-xs text-gray-500 app-dark:text-slate-400">
                            {flowexFormSourceId
                              ? flowexFormTitle || "Flowex Lead Form"
                              : externalUrl || "Connected Lovable form"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setIsEditingSourceSetup((current) => !current)
                        }
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                      >
                        {isEditingSourceSetup ? "Done" : "Edit"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (flowexFormSourceId) {
                            void removeFlowexForm();
                          } else {
                            void unlinkExternalForm();
                          }
                        }}
                        disabled={isRemovingFlowexForm || isConnectingExternal}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-red-500/30 app-dark:bg-[#11161d] app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                      >
                        {flowexFormSourceId
                          ? isRemovingFlowexForm ? "Removing..." : "Unlink"
                          : isConnectingExternal ? "Unlinking..." : "Unlink"}
                      </button>
                    </div>
                  </div>

                  {isEditingSourceSetup && flowexFormSourceId && (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold app-dark:text-white">Flowex Lead Form</p>
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
                          <p className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">Form Link</p>
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
                              {copiedFormLink ? "Copied" : "Copy"}
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

                  {isEditingSourceSetup && externalSourceId && !flowexFormSourceId && (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                      <p className="font-semibold app-dark:text-white">Lovable Form</p>
                      <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">Connected published Lovable form.</p>

                      <input
                        type="url"
                        value={externalUrl}
                        readOnly
                        className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 outline-none app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300"
                      />

                      <div className="mt-4 border-t border-gray-200 pt-4 app-dark:border-slate-700">
                        <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">✓ Form Verified</p>
                        {externalCaptureConnected ? (
                          <p className="mt-2 text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">✓ Flowex Capture Connected</p>
                        ) : (
                          <>
                            <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-400">One last step: connect this form to Flowex.</p>
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
                            <p className="mt-2 text-xs text-gray-400 app-dark:text-slate-500">Paste the copied instruction into Lovable, let it apply the change, then click Check Connection.</p>
                          </>
                        )}
                      </div>

                      {externalSourceError && (
                        <p className="mt-3 text-sm font-medium text-red-500 app-dark:text-red-400">{externalSourceError}</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Option
                      active={sourceType === "flowex"}
                      onClick={() => {
                        setSourceType("flowex");
                        setHasUnsavedChanges(true);
                      }}
                      title="Flowex Form"
                      description="Create a ready-to-use form."
                    />

                    <Option
                      active={sourceType === "external"}
                      onClick={() => {
                        setSourceType("external");
                        setHasUnsavedChanges(true);
                      }}
                      title="Lovable Form"
                      description="Connect a form built with Lovable."
                    />

                    <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-4 opacity-60 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                      <div className="absolute right-3 top-3 rounded-full bg-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 app-dark:bg-slate-800 app-dark:text-slate-400">Coming Soon</div>
                      <p className="font-semibold app-dark:text-white">Web Hooks</p>
                    </div>
                  </div>

                  {sourceType === "flowex" && (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold app-dark:text-white">Flowex Lead Form</p>
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
                    </div>
                  )}

                  {sourceType === "external" && (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                      <p className="font-semibold app-dark:text-white">Lovable Form</p>
                      <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">Paste the direct URL of your published Lovable form.</p>
                      <div className="mt-4 flex gap-3">
                        <input
                          type="url"
                          value={externalUrl}
                          onChange={(event) => {
                            setExternalUrl(event.target.value);
                            setExternalSourceError("");
                          }}
                          placeholder="https://yourproject.lovable.app/contact"
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                        />
                        <button
                          type="button"
                          onClick={connectExternalForm}
                          disabled={isConnectingExternal}
                          className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isConnectingExternal ? "Verifying..." : "Connect"}
                        </button>
                      </div>
                      {externalSourceError && (
                        <p className="mt-3 text-sm font-medium text-red-500 app-dark:text-red-400">{externalSourceError}</p>
                      )}
                    </div>
                  )}
                </>
              )}

            </FlowStep>

            <Arrow />

            {/* ================= STEP 2 ================= */}

            <FlowStep
              number="02"
              onSave={() => void saveStep("02")}
              saving={isSavingAutomation}
              dirty={dirtySteps.has("02")}
              title="Send Lead"
              description="Choose where this Lead Flow should send every captured lead."
            >

              <div className="grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  className="rounded-2xl border border-emerald-400 bg-emerald-50/60 p-4 text-left ring-4 ring-emerald-100 transition app-dark:border-emerald-500 app-dark:bg-emerald-500/10 app-dark:ring-emerald-500/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold app-dark:text-white">
                        {storageType === "airtable" ? "Airtable" : storageType === "excel" ? "Microsoft Excel" : storageType === "notion" ? "Notion" : storageType === "hubspot" ? "HubSpot" : "Google Sheets"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500 app-dark:text-slate-400">
                        {storageType === "airtable" ? "Store leads in an Airtable base." : storageType === "excel" ? "Store leads in an Excel workbook." : storageType === "notion" ? "Store leads in a Notion database." : storageType === "hubspot" ? "Create or update contacts in HubSpot CRM." : "A structured lead table with mapped columns."}
                      </p>
                    </div>
                    {storageType === "airtable" ? (
                      airtableAccountConnected && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">CONNECTED</span>
                    ) : storageType === "excel" ? (
                      microsoftAccountConnected && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">CONNECTED</span>
                    ) : storageType === "notion" ? (
                      notionAccountConnected && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">CONNECTED</span>
                    ) : storageType === "hubspot" ? (
                      hubSpotAccountConnected && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">CONNECTED</span>
                    ) : (
                      googleAccountConnected && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:ring-emerald-500/10 app-dark:text-emerald-400">CONNECTED</span>
                    )}
                  </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                      setShowMoreDestinations(
                        true
                      )
                    }
                    className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:hover:border-indigo-500/50 app-dark:hover:bg-indigo-500/5"
                  >
                    <p className="font-semibold app-dark:text-white">
                      + More destinations
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500 app-dark:text-slate-400">
                      Use another destination or see more integrations.
                    </p>
                  </button>

              </div>

              {storageType ===
                "sheets" && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="text-sm font-semibold app-dark:text-white">
                        Google Sheets
                      </p>

                      <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                        {googleAccountConnected
                          ? googleAccountEmail
                            ? `Connected as ${googleAccountEmail}`
                            : "Google account connected"
                          : "Connect Google once. All Lead Flows can then use separate sheets."}
                      </p>
                    </div>

                    {googleAccountConnected ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                          Google connected
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            void disconnectStorageAccount("sheets")
                          }
                          disabled={
                            disconnectingStorageProvider !== null
                          }
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                        >
                          {disconnectingStorageProvider === "sheets"
                            ? "Disconnecting..."
                            : "Disconnect account"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          connectStorageProvider
                        }
                        disabled={
                          isConnectingStorage
                        }
                        className="w-fit rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isConnectingStorage
                          ? "Connecting..."
                          : "Connect Google"}
                      </button>
                    )}

                  </div>

                  {googleAccountConnected && (
                    <>
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">

                        <button
                          type="button"
                          onClick={() =>
                            selectStorageMode(
                              "create_new"
                            )
                          }
                          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            storageMode ===
                            "create_new"
                              ? "border-emerald-400 bg-emerald-50 text-emerald-700 app-dark:border-emerald-500 app-dark:bg-emerald-500/10 app-dark:text-emerald-400"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300"
                          }`}
                        >
                          Create new sheet
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            selectStorageMode(
                              "existing"
                            )
                          }
                          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            storageMode ===
                            "existing"
                              ? "border-emerald-400 bg-emerald-50 text-emerald-700 app-dark:border-emerald-500 app-dark:bg-emerald-500/10 app-dark:text-emerald-400"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300"
                          }`}
                        >
                          Use existing sheet
                        </button>

                      </div>

                      {storageMode ===
                        "create_new" && (
                        <div className="mt-5">

                          {!createdSheetId ? (
                            <>
                              <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                                New sheet name
                              </label>

                              <input
                                value={
                                  storageName
                                }
                                onChange={(
                                  event
                                ) => {
                                  setStorageName(
                                    event.target.value
                                  );

                                  setHasUnsavedChanges(
                                    true
                                  );
                                }}
                                maxLength={
                                  80
                                }
                                placeholder="e.g. Website Leads"
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                              />

                              <button
                                type="button"
                                onClick={
                                  prepareGoogleSheet
                                }
                                disabled={
                                  isPreparingStorage
                                }
                                className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-200 app-dark:hover:bg-slate-800"
                              >
                                {isPreparingStorage
                                  ? "Creating..."
                                  : "Create Sheet"}
                              </button>
                            </>
                          ) : storagePendingDelete ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 app-dark:border-red-500/30 app-dark:bg-red-500/10">

                              <p className="text-sm font-semibold text-red-700 app-dark:text-red-300">
                                {createdSheetRemovalMode ===
                                "trash"
                                  ? "Sheet marked for deletion"
                                  : "Sheet marked for removal"}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-red-600 app-dark:text-red-400">
                                {createdSheetRemovalMode ===
                                "trash"
                                  ? "It will be removed from this automation and moved to Google Drive Trash after you save this step."
                                  : "It will be removed from this automation after you save this step, but the Google Sheet will stay in Drive."}
                              </p>

                              <button
                                type="button"
                                onClick={
                                  undoCreatedSheetDelete
                                }
                                className="mt-3 text-xs font-semibold text-red-700 underline app-dark:text-red-300"
                              >
                                Undo delete
                              </button>

                            </div>
                          ) : (
                            <div className="rounded-xl border border-emerald-200 bg-white p-4 app-dark:border-emerald-500/30 app-dark:bg-[#11161d]">

                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                <div>
                                  <p className="text-sm font-semibold app-dark:text-white">
                                    Sheet prepared
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                                    Flowex created a real Google Sheets table from this Lead Flow&apos;s fields.
                                  </p>
                                </div>

                                <span className="w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                                  READY
                                </span>

                              </div>

                              {isEditingCreatedSheet ? (
                                <div className="mt-4">

                                  <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                                    Sheet name only
                                  </label>

                                  <input
                                    value={
                                      storageName
                                    }
                                    onChange={(
                                      event
                                    ) => {
                                      setStorageName(
                                        event.target.value
                                      );

                                      setHasUnsavedChanges(
                                        true
                                      );
                                    }}
                                    maxLength={
                                      80
                                    }
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                                  />

                                  <p className="mt-2 text-xs text-gray-400 app-dark:text-slate-500">
                                    The Google Sheet will be renamed when you save the automation.
                                  </p>

                                </div>
                              ) : null}

                              <div className="mt-4 flex flex-wrap gap-3">

                                {createdSheetUrl && (
                                  <a
                                    href={
                                      createdSheetUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                                  >
                                    Open Sheet ↗
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setIsEditingCreatedSheet(
                                      (
                                        current
                                      ) =>
                                        !current
                                    )
                                  }
                                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                                >
                                  {isEditingCreatedSheet
                                    ? "Done"
                                    : "Rename"}
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    markCreatedSheetDeleted
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 app-dark:border-red-500/30 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                                >
                                  Delete
                                </button>

                              </div>

                            </div>
                          )}

                        </div>
                      )}

                      {storageMode ===
                        "existing" && (
                        <div className="mt-5">

                          {storagePendingUnlink ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 app-dark:border-amber-500/30 app-dark:bg-amber-500/10">

                              <p className="text-sm font-semibold text-amber-800 app-dark:text-amber-300">
                                Existing sheet will be unlinked
                              </p>

                              <p className="mt-1 text-xs leading-5 text-amber-700 app-dark:text-amber-400">
                                Flowex will stop sending this Lead Flow to it after you save this step. The Google Sheet itself will not be deleted.
                              </p>

                              <button
                                type="button"
                                onClick={
                                  undoExistingUnlink
                                }
                                className="mt-3 text-xs font-semibold text-amber-800 underline app-dark:text-amber-300"
                              >
                                Undo unlink
                              </button>

                            </div>
                          ) : (
                            <>
                              <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                                Google Sheet URL
                              </label>

                              <input
                                value={
                                  storageDestination
                                }
                                onChange={(
                                  event
                                ) => {
                                  setStorageDestination(
                                    event.target.value
                                  );

                                  setExistingSheetUrl(
                                    event.target.value
                                  );

                                  setExistingSheetVerified(
                                    false
                                  );

                                  setStorageConnected(
                                    false
                                  );

                                  setHasUnsavedChanges(
                                    true
                                  );
                                }}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                              />

                              <div className="mt-4 flex flex-wrap items-center gap-3">

                                <button
                                  type="button"
                                  onClick={
                                    prepareGoogleSheet
                                  }
                                  disabled={
                                    isPreparingStorage
                                  }
                                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-200 app-dark:hover:bg-slate-800"
                                >
                                  {isPreparingStorage
                                    ? "Verifying..."
                                    : existingSheetVerified
                                      ? "Verify Again"
                                      : "Verify Sheet"}
                                </button>

                                {existingSheetVerified && (
                                  <span className="text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                                    ✓ Verified
                                  </span>
                                )}

                                {existingSheetUrl && (
                                  <a
                                    href={
                                      existingSheetUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-[#4b52f7] hover:underline app-dark:text-[#7c83ff]"
                                  >
                                    Open Sheet ↗
                                  </a>
                                )}

                                {(existingSheetId ||
                                  savedStorageMode ===
                                    "existing") && (
                                  <button
                                    type="button"
                                    onClick={
                                      markExistingUnlinked
                                    }
                                    className="ml-auto text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                                  >
                                    Unlink
                                  </button>
                                )}

                              </div>

                              <p className="mt-3 text-xs leading-5 text-gray-400 app-dark:text-slate-500">
                                Verification only checks access and maps the columns. When you save this step, Flowex preserves a clean existing structure; if the sheet is unstructured or missing required lead columns, Flowex organizes it into the same lead-table style used for new sheets without deleting unrelated columns.
                              </p>
                            </>
                          )}

                        </div>
                      )}

                      {storageError && (
                        <p className={`mt-4 text-xs font-medium ${
                          storageConnected
                            ? "text-emerald-600 app-dark:text-emerald-400"
                            : "text-amber-600 app-dark:text-amber-400"
                        }`}>
                          {storageError}
                        </p>
                      )}

                      <div className="mt-5 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-xs leading-5 text-gray-500 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-400">
                        Nothing in this Lead Flow&apos;s Step 02 becomes the active destination until you click <span className="font-semibold text-gray-700 app-dark:text-slate-200">Save changes</span> in this step.
                      </div>
                    </>
                  )}

                </div>
              )}

              {storageType === "excel" && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold app-dark:text-white">
                        Microsoft Excel
                      </p>

                      <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                        {microsoftAccountConnected
                          ? microsoftAccountEmail
                            ? `Connected as ${microsoftAccountEmail}`
                            : "Microsoft account connected"
                          : "Connect Microsoft once. All Lead Flows can then use separate Excel destinations."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {microsoftAccountConnected ? (
                        <>
                          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                            Microsoft connected
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              void disconnectStorageAccount("excel")
                            }
                            disabled={
                              disconnectingStorageProvider !== null
                            }
                            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                          >
                            {disconnectingStorageProvider === "excel"
                              ? "Disconnecting..."
                              : "Disconnect account"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={connectStorageProvider}
                          disabled={isConnectingStorage}
                          className="w-fit rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isConnectingStorage ? "Connecting..." : "Connect Microsoft"}
                        </button>
                      )}
                    </div>
                  </div>

                  {microsoftAccountConnected && (
                    <>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStorageMode("create_new");
                            setExcelExistingVerified(false);
                            setStorageError("");
                            setHasUnsavedChanges(true);
                          }}
                          className={`rounded-xl border p-4 text-left transition ${
                            storageMode === "create_new"
                              ? "border-emerald-400 bg-emerald-50 app-dark:border-emerald-500 app-dark:bg-emerald-500/10"
                              : "border-gray-200 bg-white app-dark:border-slate-700 app-dark:bg-[#11161d]"
                          }`}
                        >
                          <p className="text-sm font-semibold app-dark:text-white">
                            Create New Workbook
                          </p>
                          <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                            Flowex creates a structured Excel table in OneDrive.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStorageMode("existing");
                            setExcelCreatedByFlowex(false);
                            setStorageError("");
                            setHasUnsavedChanges(true);
                            void loadMicrosoftWorkbooks();
                          }}
                          className={`rounded-xl border p-4 text-left transition ${
                            storageMode === "existing"
                              ? "border-cyan-400 bg-cyan-50 app-dark:border-cyan-500 app-dark:bg-cyan-500/10"
                              : "border-gray-200 bg-white app-dark:border-slate-700 app-dark:bg-[#11161d]"
                          }`}
                        >
                          <p className="text-sm font-semibold app-dark:text-white">
                            Use Existing Workbook
                          </p>
                          <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                            Flowex maps the table and adds missing lead columns when you save this step.
                          </p>
                        </button>
                      </div>

                      {storageMode === "create_new" ? (
                        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 app-dark:border-slate-700 app-dark:bg-[#11161d]">
                          <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                            Workbook name
                          </label>

                          <input
                            value={storageName}
                            onChange={(event) => {
                              setStorageName(event.target.value);
                              setHasUnsavedChanges(true);
                            }}
                            placeholder="Flowex Leads"
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                          />

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={prepareMicrosoftExcel}
                              disabled={isPreparingStorage}
                              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                            >
                              {isPreparingStorage
                                ? "Creating..."
                                : excelWorkbookId
                                  ? "Create Again"
                                  : "Create Workbook"}
                            </button>

                            {excelWorkbookId && (
                              <span className="text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                                ✓ Workbook ready
                              </span>
                            )}

                            {excelWorkbookUrl && (
                              <a
                                href={excelWorkbookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-[#4b52f7] hover:underline app-dark:text-[#7c83ff]"
                              >
                                Open Workbook ↗
                              </a>
                            )}

                            {excelWorkbookId && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowExcelRemoveDialog(true)
                                }
                                className="ml-auto text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 app-dark:border-slate-700 app-dark:bg-[#11161d]">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                              Excel workbook
                            </label>

                            <button
                              type="button"
                              onClick={loadMicrosoftWorkbooks}
                              disabled={isLoadingMicrosoft}
                              className="text-xs font-semibold text-[#4b52f7] hover:underline app-dark:text-[#7c83ff]"
                            >
                              {isLoadingMicrosoft ? "Refreshing..." : "Refresh"}
                            </button>
                          </div>

                          <select
                            value={excelWorkbookId}
                            onChange={(event) => {
                              const value = event.target.value;
                              const workbook =
                                microsoftWorkbooks.find(
                                  (item) => item.id === value
                                );

                              setExcelWorkbookId(value);
                              setExcelWorkbookName(workbook?.name || "");
                              setExcelWorkbookUrl(workbook?.webUrl || "");
                              setExcelTableId("");
                              setExcelTableName("");
                              setExcelExistingVerified(false);
                              setHasUnsavedChanges(true);
                            }}
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                          >
                            <option value="">
                              {isLoadingMicrosoft
                                ? "Loading workbooks..."
                                : "Choose a workbook"}
                            </option>

                            {microsoftWorkbooks.map((workbook) => (
                              <option
                                key={workbook.id}
                                value={workbook.id}
                              >
                                {workbook.name}
                              </option>
                            ))}
                          </select>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={prepareMicrosoftExcel}
                              disabled={
                                !excelWorkbookId ||
                                isPreparingStorage
                              }
                              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-200"
                            >
                              {isPreparingStorage
                                ? "Verifying..."
                                : excelExistingVerified
                                  ? "Verify Again"
                                  : "Verify Workbook"}
                            </button>

                            {excelExistingVerified && (
                              <span className="text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                                ✓ Verified
                              </span>
                            )}

                            {excelWorkbookUrl && (
                              <a
                                href={excelWorkbookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-[#4b52f7] hover:underline app-dark:text-[#7c83ff]"
                              >
                                Open Workbook ↗
                              </a>
                            )}

                            {(excelWorkbookId || savedStorageMode === "existing") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setExcelRemovalMode("unlink");
                                  setStoragePendingUnlink(true);
                                  setHasUnsavedChanges(true);
                                }}
                                className="ml-auto text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                              >
                                Unlink
                              </button>
                            )}
                          </div>

                          <p className="mt-3 text-xs leading-5 text-gray-400 app-dark:text-slate-500">
                            Verification checks access and maps the workbook. Missing Flowex lead columns are added only when this step is saved.
                          </p>
                        </div>
                      )}

                      {storageError && (
                        <p className="mt-4 text-xs font-medium text-amber-600 app-dark:text-amber-400">
                          {storageError}
                        </p>
                      )}

                      <div className="mt-5 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-xs leading-5 text-gray-500 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-400">
                        Nothing in this Lead Flow&apos;s Step 02 becomes the active destination until you click <span className="font-semibold text-gray-700 app-dark:text-slate-200">Save changes</span> in this step.
                      </div>
                    </>
                  )}
                </div>
              )}

              {storageType === "notion" && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold app-dark:text-white">
                        Notion
                      </p>

                      <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                        {notionAccountConnected
                          ? notionWorkspaceName
                            ? `Connected to ${notionWorkspaceName}`
                            : notionAccountEmail
                              ? `Connected as ${notionAccountEmail}`
                              : "Notion workspace connected"
                          : "Connect Notion and choose the pages Flowex is allowed to use."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {notionAccountConnected ? (
                        <>
                          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                            Notion connected
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              void disconnectStorageAccount("notion")
                            }
                            disabled={
                              disconnectingStorageProvider !== null
                            }
                            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                          >
                            {disconnectingStorageProvider === "notion"
                              ? "Disconnecting..."
                              : "Disconnect account"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={connectStorageProvider}
                          disabled={isConnectingStorage}
                          className="w-fit rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isConnectingStorage ? "Connecting..." : "Connect Notion"}
                        </button>
                      )}
                    </div>
                  </div>

                  {notionAccountConnected && (
                    <>
                      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs leading-5 text-indigo-700 app-dark:border-indigo-500/20 app-dark:bg-indigo-500/10 app-dark:text-indigo-300">
                        Notion only gives Flowex access to pages you approve. Choose a shared page below for a new lead database, or use an existing database already shared with Flowex.
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStorageMode("create_new");
                            setNotionExistingVerified(false);
                            setStorageError("");
                            setHasUnsavedChanges(true);
                            void loadNotionPages();
                          }}
                          className={`rounded-xl border p-4 text-left transition ${
                            storageMode === "create_new"
                              ? "border-emerald-400 bg-emerald-50 app-dark:border-emerald-500 app-dark:bg-emerald-500/10"
                              : "border-gray-200 bg-white app-dark:border-slate-700 app-dark:bg-[#11161d]"
                          }`}
                        >
                          <p className="text-sm font-semibold app-dark:text-white">
                            Create New Database
                          </p>
                          <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                            Flowex creates a lead database inside an approved Notion page.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStorageMode("existing");
                            setNotionCreatedByFlowex(false);
                            setStorageError("");
                            setHasUnsavedChanges(true);
                            void loadNotionDatabases();
                          }}
                          className={`rounded-xl border p-4 text-left transition ${
                            storageMode === "existing"
                              ? "border-cyan-400 bg-cyan-50 app-dark:border-cyan-500 app-dark:bg-cyan-500/10"
                              : "border-gray-200 bg-white app-dark:border-slate-700 app-dark:bg-[#11161d]"
                          }`}
                        >
                          <p className="text-sm font-semibold app-dark:text-white">
                            Use Existing Database
                          </p>
                          <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                            Flowex maps it and adds missing form properties when you save this step.
                          </p>
                        </button>
                      </div>

                      {storageMode === "create_new" ? (
                        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 app-dark:border-slate-700 app-dark:bg-[#11161d]">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                              Parent page
                            </label>

                            <button
                              type="button"
                              onClick={loadNotionPages}
                              disabled={isLoadingNotion}
                              className="text-xs font-semibold text-[#4b52f7] hover:underline disabled:opacity-60 app-dark:text-[#7c83ff]"
                            >
                              {isLoadingNotion ? "Refreshing..." : "Refresh pages"}
                            </button>
                          </div>

                          <select
                            value={notionParentPageId}
                            onChange={(event) => {
                              setNotionParentPageId(event.target.value);
                              setHasUnsavedChanges(true);
                            }}
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                          >
                            <option value="">
                              {isLoadingNotion ? "Loading pages..." : "Choose an approved page"}
                            </option>
                            {notionPages.map((page) => (
                              <option key={page.id} value={page.id}>
                                {page.title}
                              </option>
                            ))}
                          </select>

                          <label className="mt-4 block text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                            Database name
                          </label>

                          <input
                            value={storageName}
                            onChange={(event) => {
                              setStorageName(event.target.value);
                              setHasUnsavedChanges(true);
                            }}
                            placeholder="Flowex Leads"
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                          />

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={prepareNotionDestination}
                              disabled={
                                !notionParentPageId ||
                                !storageName.trim() ||
                                isPreparingStorage
                              }
                              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                            >
                              {isPreparingStorage
                                ? "Creating..."
                                : notionDatabaseId
                                  ? "Create Again"
                                  : "Create Database"}
                            </button>

                            {notionDatabaseId && (
                              <span className="text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                                ✓ Database ready
                              </span>
                            )}

                            {notionDatabaseUrl && (
                              <a
                                href={notionDatabaseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-[#4b52f7] hover:underline app-dark:text-[#7c83ff]"
                              >
                                Open Database ↗
                              </a>
                            )}

                            {notionDatabaseId && (
                              <button
                                type="button"
                                onClick={() => setShowNotionRemoveDialog(true)}
                                className="ml-auto text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 app-dark:border-slate-700 app-dark:bg-[#11161d]">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">
                              Notion database
                            </label>

                            <button
                              type="button"
                              onClick={loadNotionDatabases}
                              disabled={isLoadingNotion}
                              className="text-xs font-semibold text-[#4b52f7] hover:underline disabled:opacity-60 app-dark:text-[#7c83ff]"
                            >
                              {isLoadingNotion ? "Refreshing..." : "Refresh"}
                            </button>
                          </div>

                          <select
                            value={notionDataSourceId}
                            onChange={(event) => {
                              const value = event.target.value;
                              const selected = notionDatabases.find(
                                (database) => database.id === value
                              );

                              setNotionDataSourceId(value);
                              setNotionDatabaseId(selected?.databaseId || "");
                              setNotionDatabaseName(selected?.title || "");
                              setNotionDatabaseUrl(selected?.url || "");
                              setNotionExistingVerified(false);
                              setNotionMissingCount(0);
                              setHasUnsavedChanges(true);
                            }}
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                          >
                            <option value="">
                              {isLoadingNotion ? "Loading databases..." : "Choose a shared database"}
                            </option>
                            {notionDatabases.map((database) => (
                              <option key={database.id} value={database.id}>
                                {database.title}
                              </option>
                            ))}
                          </select>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={prepareNotionDestination}
                              disabled={!notionDataSourceId || isPreparingStorage}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-200"
                            >
                              {isPreparingStorage
                                ? "Verifying..."
                                : notionExistingVerified
                                  ? "Verify Again"
                                  : "Verify Database"}
                            </button>

                            {notionExistingVerified && (
                              <span className="text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                                ✓ Verified
                              </span>
                            )}

                            {notionMissingCount > 0 && notionExistingVerified && (
                              <span className="text-xs font-medium text-amber-600 app-dark:text-amber-400">
                                {notionMissingCount} missing {notionMissingCount === 1 ? "property" : "properties"} will be added on Save
                              </span>
                            )}

                            {notionDatabaseUrl && (
                              <a
                                href={notionDatabaseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-[#4b52f7] hover:underline app-dark:text-[#7c83ff]"
                              >
                                Open Database ↗
                              </a>
                            )}

                            {(notionDataSourceId || savedStorageMode === "existing") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNotionRemovalMode("unlink");
                                  setStoragePendingUnlink(true);
                                  setHasUnsavedChanges(true);
                                }}
                                className="ml-auto text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                              >
                                Unlink
                              </button>
                            )}
                          </div>

                          <p className="mt-3 text-xs leading-5 text-gray-400 app-dark:text-slate-500">
                            If a database is missing, add Flowex from that page/database&apos;s Connections menu in Notion, then click Refresh.
                          </p>
                        </div>
                      )}

                      {storageError && (
                        <p className="mt-4 text-xs font-medium text-amber-600 app-dark:text-amber-400">
                          {storageError}
                        </p>
                      )}

                      <div className="mt-5 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-xs leading-5 text-gray-500 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-400">
                        Nothing in this Lead Flow&apos;s Step 02 becomes the active destination until you click <span className="font-semibold text-gray-700 app-dark:text-slate-200">Save changes</span> in this step.
                      </div>
                    </>
                  )}
                </div>
              )}

              {storageType === "hubspot" && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold app-dark:text-white">
                        HubSpot
                      </p>

                      <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                        {hubSpotAccountConnected
                          ? hubSpotHubId
                            ? `Connected to HubSpot account ${hubSpotHubId}`
                            : "HubSpot account connected"
                          : "Connect HubSpot once. Flowex can then send this Lead Flow into HubSpot Contacts."}
                      </p>
                    </div>

                    {hubSpotAccountConnected ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                          HubSpot connected
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            void disconnectStorageAccount("hubspot")
                          }
                          disabled={
                            disconnectingStorageProvider !== null
                          }
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                        >
                          {disconnectingStorageProvider === "hubspot"
                            ? "Disconnecting..."
                            : "Disconnect account"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={connectStorageProvider}
                        disabled={isConnectingStorage}
                        className="w-fit rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isConnectingStorage ? "Connecting..." : "Connect HubSpot"}
                      </button>
                    )}
                  </div>

                  {hubSpotAccountConnected && (
                    <>
                      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 app-dark:border-slate-700 app-dark:bg-[#11161d]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold app-dark:text-white">
                              HubSpot Contacts
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500 app-dark:text-slate-400">
                              Standard fields map automatically. Flowex creates any missing custom contact properties from your form when you save this step.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={inspectHubSpotDestination}
                            disabled={isPreparingStorage}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-200"
                          >
                            {isPreparingStorage ? "Checking..." : "Check Mapping"}
                          </button>
                        </div>

                        {(hubSpotMappedFieldCount > 0 || hubSpotDestinationReady) && (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {hubSpotMappedFieldCount > 0 && (
                              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                                {hubSpotMappedFieldCount} mapped {hubSpotMappedFieldCount === 1 ? "field" : "fields"}
                              </span>
                            )}

                            {hubSpotMissingCount > 0 && (
                              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 app-dark:bg-amber-500/10 app-dark:text-amber-400">
                                {hubSpotMissingCount} custom {hubSpotMissingCount === 1 ? "property" : "properties"} to create
                              </span>
                            )}
                          </div>
                        )}

                        {hubSpotDestinationReady && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setStoragePendingUnlink(true);
                                setHasUnsavedChanges(true);
                              }}
                              className="text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                            >
                              Unlink
                            </button>
                          </div>
                        )}
                      </div>

                      {storagePendingUnlink && hubSpotDestinationReady && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 app-dark:border-amber-500/30 app-dark:bg-amber-500/10">
                          <p className="text-sm font-semibold text-amber-800 app-dark:text-amber-300">
                            HubSpot will be unlinked from this Lead Flow after you save this step.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setStoragePendingUnlink(false);
                              setHasUnsavedChanges(true);
                            }}
                            className="mt-3 text-xs font-semibold text-amber-800 underline app-dark:text-amber-300"
                          >
                            Undo unlink
                          </button>
                        </div>
                      )}

                      {storageError && (
                        <p className={`mt-4 text-xs font-medium ${
                          storageError.includes("ready") || storageError.includes("will be created")
                            ? "text-emerald-600 app-dark:text-emerald-400"
                            : "text-amber-600 app-dark:text-amber-400"
                        }`}>
                          {storageError}
                        </p>
                      )}

                      <div className="mt-5 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-xs leading-5 text-gray-500 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-400">
                        HubSpot becomes this Lead Flow&apos;s active destination only when you click <span className="font-semibold text-gray-700 app-dark:text-slate-200">Save changes</span> in this step.
                      </div>
                    </>
                  )}
                </div>
              )}

              {storageType === "airtable" && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold app-dark:text-white">Airtable</p>
                      <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                        {airtableAccountConnected
                          ? airtableAccountEmail
                            ? `Connected as ${airtableAccountEmail}`
                            : "Airtable account connected"
                          : "Connect Airtable once. All Lead Flows can then use separate Airtable destinations."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {airtableAccountConnected ? (
                        <>
                          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                            Airtable connected
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              void disconnectStorageAccount("airtable")
                            }
                            disabled={
                              disconnectingStorageProvider !== null
                            }
                            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                          >
                            {disconnectingStorageProvider === "airtable"
                              ? "Disconnecting..."
                              : "Disconnect account"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={connectStorageProvider}
                          disabled={isConnectingStorage}
                          className="w-fit rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isConnectingStorage ? "Connecting..." : "Connect Airtable"}
                        </button>
                      )}
                    </div>
                  </div>

                  {storagePendingUnlink ? (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 app-dark:border-amber-500/30 app-dark:bg-amber-500/10">
                      <p className="text-sm font-semibold text-amber-800 app-dark:text-amber-300">
                        Airtable will be unlinked from this Lead Flow after you save this step.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStoragePendingUnlink(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-3 text-xs font-semibold text-amber-800 underline app-dark:text-amber-300"
                      >
                        Undo unlink
                      </button>
                    </div>
                  ) : airtableAccountConnected && (
                    <>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStorageMode("create_new");
                            setAirtableTableId("");
                            setAirtableTableName("");
                            setAirtableExistingVerified(false);
                            setStorageError("");
                            setHasUnsavedChanges(true);
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${storageMode === "create_new" ? "border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100 app-dark:border-emerald-500 app-dark:bg-emerald-500/10 app-dark:ring-emerald-500/10" : "border-gray-200 bg-white hover:border-gray-300 app-dark:border-slate-700 app-dark:bg-[#11161d]"}`}
                        >
                          <p className="font-semibold app-dark:text-white">Create New</p>
                          <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                            Create a new table in an existing base or create a new base.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStorageMode("existing");
                            setAirtableBaseMode("existing_base");
                            setAirtableTableId("");
                            setAirtableTableName("");
                            setAirtableExistingVerified(false);
                            setAirtableCreatedBaseByFlowex(false);
                            setStorageError("");
                            setHasUnsavedChanges(true);
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${storageMode === "existing" ? "border-cyan-400 bg-cyan-50 ring-4 ring-cyan-100 app-dark:border-cyan-500 app-dark:bg-cyan-500/10 app-dark:ring-cyan-500/10" : "border-gray-200 bg-white hover:border-gray-300 app-dark:border-slate-700 app-dark:bg-[#11161d]"}`}
                        >
                          <p className="font-semibold app-dark:text-white">Use Existing</p>
                          <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                            Use an existing Airtable base and table.
                          </p>
                        </button>
                      </div>

                      {storageMode === "create_new" && (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAirtableBaseMode("existing_base");
                              setAirtableBaseId("");
                              setAirtableTableId("");
                              setAirtableCreatedBaseByFlowex(false);
                              setStorageError("");
                              setHasUnsavedChanges(true);
                            }}
                            className={`rounded-xl border p-3 text-left text-sm transition ${airtableBaseMode === "existing_base" ? "border-emerald-400 bg-emerald-50 app-dark:border-emerald-500 app-dark:bg-emerald-500/10" : "border-gray-200 bg-white app-dark:border-slate-700 app-dark:bg-[#11161d]"}`}
                          >
                            <span className="font-semibold app-dark:text-white">Use Existing Base</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAirtableBaseMode("create_base");
                              setAirtableBaseId("");
                              setAirtableTableId("");
                              setAirtableCreatedBaseByFlowex(false);
                              setStorageError("");
                              setHasUnsavedChanges(true);
                            }}
                            className={`rounded-xl border p-3 text-left text-sm transition ${airtableBaseMode === "create_base" ? "border-cyan-400 bg-cyan-50 app-dark:border-cyan-500 app-dark:bg-cyan-500/10" : "border-gray-200 bg-white app-dark:border-slate-700 app-dark:bg-[#11161d]"}`}
                          >
                            <span className="font-semibold app-dark:text-white">Create New Base</span>
                          </button>
                        </div>
                      )}

                      {(storageMode === "existing" || storageMode === "create_new") && (
                        <div className="mt-5">
                          <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">Base</label>
                          <select
                            value={airtableBaseId}
                            onChange={(event) => {
                              const value = event.target.value;
                              setAirtableBaseId(value);
                              setAirtableBaseName(
                                airtableBases.find((base) => base.id === value)?.name ||
                                  ""
                              );
                              setAirtableTableId("");
                              setAirtableTableName("");
                              setAirtableExistingVerified(false);
                              setAirtableCreatedBaseByFlowex(false);
                              setAirtableBaseUrl(value ? `https://airtable.com/${value}` : "");
                              setStorageError("");
                              setHasUnsavedChanges(true);
                              void loadAirtableTables(value);
                            }}
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white"
                          >
                            <option value="">{isLoadingAirtable ? "Loading bases..." : "Choose a base"}</option>
                            {airtableBases.map((base) => (
                              <option key={base.id} value={base.id}>{base.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {storageMode === "create_new" && airtableBaseMode === "create_base" && (
                        <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 app-dark:border-cyan-500/30 app-dark:bg-cyan-500/10">
                          <p className="text-sm font-semibold text-cyan-900 app-dark:text-cyan-200">
                            Create the base in Airtable
                          </p>
                          <p className="mt-1 text-xs leading-5 text-cyan-800/80 app-dark:text-cyan-300/80">
                            Airtable does not expose a standard workspace list to OAuth apps. Create the base in Airtable, then refresh and select it here. Flowex will create and structure the lead table automatically.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <a
                              href="https://airtable.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-cyan-800 shadow-sm transition hover:bg-cyan-50 app-dark:bg-[#11161d] app-dark:text-cyan-300"
                            >
                              Open Airtable ↗
                            </a>
                            <button
                              type="button"
                              onClick={() => void loadAirtableBases()}
                              disabled={isLoadingAirtable}
                              className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-cyan-500/30 app-dark:bg-[#11161d] app-dark:text-cyan-300"
                            >
                              {isLoadingAirtable ? "Refreshing..." : "Refresh Bases"}
                            </button>
                          </div>
                        </div>
                      )}

                      {storageMode === "create_new" ? (
                        <div className="mt-5">
                          <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">Table name</label>
                          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                            <input
                              value={storageName}
                              onChange={(event) => {
                                setStorageName(event.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="Flowex Leads"
                              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={prepareAirtableDestination}
                              disabled={
                                isPreparingStorage ||
                                !!airtableTableId ||
                                !storageName.trim() ||
                                !airtableBaseId
                              }
                              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isPreparingStorage
                                ? "Creating..."
                                : airtableTableId
                                  ? "Created"
                                  : "Create Table"}
                            </button>
                          </div>

                          {airtableTableId && (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <span className="text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                                ✓ {airtableTableName || storageName} is ready. Save this step to use it.
                              </span>
                              {airtableBaseUrl && (
                                <a
                                  href={airtableBaseUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-[#4b52f7] hover:underline app-dark:text-[#7c83ff]"
                                >
                                  Open Airtable ↗
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (airtableCreatedBaseByFlowex) {
                                    setShowAirtableRemoveDialog(true);
                                  } else {
                                    setStoragePendingUnlink(true);
                                    setHasUnsavedChanges(true);
                                  }
                                }}
                                className="ml-auto text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                              >
                                {airtableCreatedBaseByFlowex
                                  ? "Remove"
                                  : "Unlink"}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-5">
                          <label className="text-xs font-semibold text-gray-500 app-dark:text-slate-400">Table</label>
                          <select
                            value={airtableTableId}
                            disabled={!airtableBaseId || isLoadingAirtable}
                            onChange={(event) => {
                              const value = event.target.value;
                              setAirtableTableId(value);
                              setAirtableTableName(airtableTables.find((table) => table.id === value)?.name || "");
                              setAirtableExistingVerified(false);
                              setHasUnsavedChanges(true);
                            }}
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-white"
                          >
                            <option value="">{!airtableBaseId ? "Choose a base first" : isLoadingAirtable ? "Loading tables..." : "Choose a table"}</option>
                            {airtableTables.map((table) => (
                              <option key={table.id} value={table.id}>{table.name}</option>
                            ))}
                          </select>

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={prepareAirtableDestination}
                              disabled={!airtableBaseId || !airtableTableId || isPreparingStorage}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-200"
                            >
                              {isPreparingStorage ? "Verifying..." : airtableExistingVerified ? "Verify Again" : "Verify Table"}
                            </button>

                            {airtableExistingVerified && (
                              <span className="text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">✓ Verified</span>
                            )}

                            {airtableBaseUrl && (
                              <a
                                href={airtableBaseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-[#4b52f7] hover:underline app-dark:text-[#7c83ff]"
                              >
                                Open Airtable ↗
                              </a>
                            )}

                            {(savedStorageMode === "existing" && storageConnected) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setStoragePendingUnlink(true);
                                  setIsEditingStorage(true);
                                  setHasUnsavedChanges(true);
                                }}
                                className="ml-auto text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                              >
                                Unlink
                              </button>
                            )}
                          </div>

                          <p className="mt-3 text-xs leading-5 text-gray-400 app-dark:text-slate-500">
                            Flowex keeps existing Airtable fields and adds any missing fields from this Lead Flow when this step is saved.
                          </p>
                        </div>
                      )}

                      {storageMode === "create_new" && storageConnected && (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (airtableCreatedBaseByFlowex) {
                                setShowAirtableRemoveDialog(true);
                              } else {
                                setStoragePendingUnlink(true);
                                setIsEditingStorage(false);
                                setHasUnsavedChanges(true);
                              }
                            }}
                            className="text-xs font-semibold text-red-600 transition hover:underline app-dark:text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      <div className="mt-5 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-xs leading-5 text-gray-500 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-400">
                        Nothing in this Lead Flow&apos;s Step 02 becomes the active destination until you click <span className="font-semibold text-gray-700 app-dark:text-slate-200">Save changes</span> in this step.
                      </div>
                    </>
                  )}

                  {storageError && (
                    <p className="mt-4 text-xs font-medium text-amber-600 app-dark:text-amber-400">{storageError}</p>
                  )}
                </div>
              )}

              {showNotionRemoveDialog && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4">
                  <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl app-dark:border-slate-700 app-dark:bg-[#11161d]">
                    <h3 className="text-lg font-bold app-dark:text-white">
                      Remove Notion destination?
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
                      Choose whether Flowex should only stop using this database or also move the Flowex-created Notion database to trash.
                    </p>

                    <div className="mt-5 space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNotionRemovalMode("unlink");
                          setStoragePendingUnlink(true);
                          setShowNotionRemoveDialog(false);
                          setIsEditingStorage(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 app-dark:border-slate-700 app-dark:text-slate-200"
                      >
                        Remove from this automation
                      </button>

                      {notionCreatedByFlowex && (
                        <button
                          type="button"
                          onClick={() => {
                            setNotionRemovalMode("trash");
                            setShowNotionRemoveDialog(false);
                            setIsEditingStorage(false);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full rounded-xl border border-red-200 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 app-dark:border-red-500/30 app-dark:text-red-400"
                        >
                          Move Notion database to trash too
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowNotionRemoveDialog(false)}
                        className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 app-dark:text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showExcelRemoveDialog && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4">
                  <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl app-dark:border-slate-700 app-dark:bg-[#11161d]">
                    <h3 className="text-lg font-bold app-dark:text-white">
                      Remove Excel destination?
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
                      Choose whether Flowex should only stop using this workbook or also delete the Flowex-created workbook from OneDrive.
                    </p>

                    <div className="mt-5 space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setExcelRemovalMode("unlink");
                          setStoragePendingUnlink(true);
                          setShowExcelRemoveDialog(false);
                          setIsEditingStorage(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 app-dark:border-slate-700 app-dark:text-slate-200"
                      >
                        Remove from this automation
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExcelRemovalMode("trash");
                          setShowExcelRemoveDialog(false);
                          setIsEditingStorage(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full rounded-xl border border-red-200 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 app-dark:border-red-500/30 app-dark:text-red-400"
                      >
                        Delete from OneDrive too
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowExcelRemoveDialog(false)}
                        className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 app-dark:text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showAirtableRemoveDialog && (
                <div
                  className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
                  onClick={() => setShowAirtableRemoveDialog(false)}
                >
                  <div
                    className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-2xl app-dark:border-slate-700 app-dark:bg-[#11161d]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h3 className="text-lg font-bold app-dark:text-white">Remove Airtable destination?</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
                      Choose what you want to do with this Flowex-created Airtable base.
                    </p>

                    <div className="mt-5 space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStoragePendingUnlink(true);
                          setShowAirtableRemoveDialog(false);
                          setIsEditingStorage(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-200"
                      >
                        Remove from this automation
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStoragePendingUnlink(true);
                          setShowAirtableRemoveDialog(false);
                          setIsEditingStorage(false);
                          setHasUnsavedChanges(true);
                          if (airtableBaseUrl) {
                            window.open(airtableBaseUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                        className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-100 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-300"
                      >
                        Remove & open Airtable to delete base
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAirtableRemoveDialog(false)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 app-dark:text-slate-400 app-dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showMoreDestinations && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
                  onClick={() =>
                    setShowMoreDestinations(
                      false
                    )
                  }
                >
                  <div
                    className="w-full max-w-xl rounded-[26px] border border-gray-200 bg-white p-6 shadow-2xl app-dark:border-slate-700 app-dark:bg-[#11161d]"
                    onClick={(
                      event
                    ) =>
                      event.stopPropagation()
                    }
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h3 className="text-xl font-bold app-dark:text-white">
                          More destinations
                        </h3>

                        <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                          Choose another destination. Its full setup opens immediately. Only the destination you save when you save this step becomes active.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowMoreDestinations(
                            false
                          )
                        }
                        className="rounded-lg px-2 py-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 app-dark:hover:bg-slate-800 app-dark:hover:text-white"
                      >
                        ✕
                      </button>

                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                      {[...storageProviders]
                        .sort((a, b) => Number(b.available) - Number(a.available))
                        .filter(
                          (
                            provider
                          ) =>
                            provider.value !==
                            storageType
                        )
                        .map(
                          (
                            provider
                          ) => (
                            <button
                              key={
                                provider.value
                              }
                              type="button"
                              onClick={() => {
                                if (
                                  provider.available &&
                                  (provider.value ===
                                    "sheets" ||
                                    provider.value ===
                                    "airtable" ||
                                    provider.value ===
                                    "hubspot" ||
                                    provider.value ===
                                    "slack" ||
                                    provider.value ===
                                    "webhook" ||
                                    provider.value ===
                                    "excel" ||
                                    provider.value ===
                                    "notion")
                                ) {
                                  setStorageType(
                                    provider.value
                                  );

                                  setStorageError(
                                    ""
                                  );

                                  setStoragePendingDelete(false);
                                  setStoragePendingUnlink(false);
                                  setIsEditingStorage(false);
                                  setHasUnsavedChanges(true);

                                  setShowMoreDestinations(
                                    false
                                  );
                                }
                              }}
                              disabled={
                                !provider.available
                              }
                              className={`rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left app-dark:border-slate-700 app-dark:bg-[#0b0f14] ${
                                provider.available
                                  ? "transition hover:border-indigo-300 hover:bg-indigo-50/40 app-dark:hover:border-indigo-500/50 app-dark:hover:bg-indigo-500/5"
                                  : "cursor-default"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">

                                <div>
                                  <p className="font-semibold app-dark:text-white">
                                    {provider.title}
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-gray-500 app-dark:text-slate-400">
                                    {provider.description}
                                  </p>
                                </div>

                                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                  provider.available
                                    ? "bg-emerald-100 text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400"
                                    : "bg-gray-200 text-gray-500 app-dark:bg-slate-800 app-dark:text-slate-400"
                                }`}>
                                  {provider.available
                                    ? "AVAILABLE"
                                    : "SOON"}
                                </span>

                              </div>
                            </button>
                          )
                        )}

                    </div>

                  </div>
                </div>
              )}

            </FlowStep>

            <Arrow />

            {/* ================= STEP 3 ================= */}
            <FlowStep
              number="03"
              onSave={() => void saveStep("03")}
              saving={isSavingAutomation}
              dirty={dirtySteps.has("03")}
              title="Reply Automatically"
              description="Choose where the lead receives an immediate reply."
            >
              <p className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                Where do you want to reply?
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Option
                  active={replyChannel === "email"}
                  onClick={() => {
                    setReplyChannel("email");
                    setReplySettingsError("");
                    setHasUnsavedChanges(true);
                  }}
                  title="Email"
                  description="Send from the email account you connect."
                />
                <Option
                  active={replyChannel === "whatsapp"}
                  onClick={() => {
                    setReplyChannel("whatsapp");
                    setReplySettingsError("");
                    setHasUnsavedChanges(true);
                  }}
                  title="WhatsApp"
                  description="Reply from your connected WhatsApp number."
                />
              </div>

              {replyChannel === "email" ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 app-dark:border-slate-700 app-dark:bg-[#11161d]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold app-dark:text-white">
                          Email account
                        </p>
                        <p className="mt-1 text-xs text-gray-500 app-dark:text-slate-400">
                          Connect the email you want automatic replies sent from.
                        </p>
                        {emailSenderConnected && emailSenderAddress && (
                          <p className="mt-2 text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                            ✓ {emailSenderAddress}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void connectReplyEmail()}
                        disabled={isConnectingReplyEmail}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-200"
                      >
                        {isConnectingReplyEmail
                          ? "Connecting..."
                          : emailSenderConnected
                            ? "Change Email"
                            : "Connect Email"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                      Subject
                    </label>
                    <input
                      value={replySubject}
                      onChange={(e) => {
                        setReplySubject(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Thanks for reaching out"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                      Message
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {(["preset_1", "preset_2", "preset_3", "custom"] as ReplyType[]).map(
                        (type, index) => (
                          <Option
                            key={type}
                            active={replyType === type}
                            onClick={() => {
                              setReplyType(type);
                              if (type !== "custom") {
                                setCustomReply(replyTemplates[type]);
                              }
                              setHasUnsavedChanges(true);
                            }}
                            title={type === "custom" ? "Custom" : `Preset ${index + 1}`}
                            description={
                              type === "custom"
                                ? "Write your own message."
                                : replyTemplates[type]
                            }
                          />
                        )
                      )}
                    </div>

                    <textarea
                      rows={5}
                      value={
                        replyType === "custom"
                          ? customReply
                          : replyTemplates[replyType]
                      }
                      onChange={(e) => {
                        setReplyType("custom");
                        setCustomReply(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="mt-4 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5 app-dark:border-slate-700 app-dark:bg-[#11161d]">
                  <p className="text-sm font-semibold app-dark:text-white">
                    WhatsApp
                  </p>
                  <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                    WhatsApp account connection is the next channel. Email is fully available first.
                  </p>
                </div>
              )}

              {replySettingsError && (
                <p className="mt-4 text-xs font-semibold text-amber-600 app-dark:text-amber-400">
                  {replySettingsError}
                </p>
              )}
            </FlowStep>

            <Arrow />

            {/* ================= STEP 4 ================= */}

            <FlowStep
              number="04"
              onSave={() => void saveStep("04")}
              saving={isSavingAutomation}
              dirty={dirtySteps.has("04")}
              title="Notify Your Team"
              description="Send a notification whenever a new lead arrives."
            >

              <label className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                Company Email
              </label>

              <input
                type="email"
                value={companyEmail}
                onChange={(e) => {
                  setCompanyEmail(
                    e.target.value
                  );

                  setHasUnsavedChanges(
                    true
                  );
                }}
                placeholder="team@company.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
              />

            </FlowStep>

            <Arrow />

            {/* ================= STEP 5 ================= */}

            <FlowStep
              number="05"
              onSave={() => void saveStep("05")}
              saving={isSavingAutomation}
              dirty={dirtySteps.has("05")}
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
                  onClick={() => {
                    setFollowUpEnabled(
                      !followUpEnabled
                    );

                    setHasUnsavedChanges(
                      true
                    );
                  }}
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
                      onChange={(e) => {
                        setFollowUpDelay(
                          e.target.value
                        );

                        setHasUnsavedChanges(
                          true
                        );
                      }}
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
                    onChange={(e) => {
                      setFollowUpMessage(
                        e.target.value
                      );

                      setHasUnsavedChanges(
                        true
                      );
                    }}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                  />

                </div>
              )}

            </FlowStep>

          </div>

        </div>

      </section>

      {/* ================= FLOWEX FORM CUSTOMIZER ================= */}

      {showFormCustomizer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">

          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-[#f7f9fb] shadow-2xl app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

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

            <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-5 lg:grid-cols-2">

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

            <div className="sticky bottom-0 z-20 flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] app-dark:border-slate-800 app-dark:bg-[#11161d]">

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



      {showCreatedSheetDeleteDialog && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-[26px] border border-gray-200 bg-white p-6 shadow-2xl app-dark:border-slate-700 app-dark:bg-[#11161d]">

            <h3 className="text-xl font-bold app-dark:text-white">
              Remove this sheet?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
              Choose what should happen to the Flowex-created Google Sheet.
            </p>

            <div className="mt-5 space-y-3">

              <button
                type="button"
                onClick={() =>
                  chooseCreatedSheetRemoval(
                    "unlink"
                  )
                }
                className="w-full rounded-xl border border-gray-200 p-4 text-left transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:hover:bg-slate-800"
              >
                <p className="text-sm font-semibold app-dark:text-white">
                  Remove from this automation
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500 app-dark:text-slate-400">
                  Flowex stops sending this Lead Flow to the sheet. The Google Sheet stays in your Drive.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  chooseCreatedSheetRemoval(
                    "trash"
                  )
                }
                className="w-full rounded-xl border border-red-200 p-4 text-left transition hover:bg-red-50 app-dark:border-red-500/30 app-dark:hover:bg-red-500/10"
              >
                <p className="text-sm font-semibold text-red-600 app-dark:text-red-400">
                  Delete from Google Drive too
                </p>

                <p className="mt-1 text-xs leading-5 text-red-500 app-dark:text-red-400">
                  Flowex removes it from this automation and moves the actual Google Sheet to Drive Trash.
                </p>
              </button>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreatedSheetDeleteDialog(
                  false
                )
              }
              className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {showUnsavedDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-[26px] border border-gray-200 bg-white p-6 shadow-2xl app-dark:border-slate-700 app-dark:bg-[#11161d]">

            <h3 className="text-xl font-bold app-dark:text-white">
              Save your changes?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
              You have changes in this Lead Flow that have not been saved yet.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => {
                  setShowUnsavedDialog(
                    false
                  );

                  setPendingNavigation(
                    ""
                  );
                }}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  const path =
                    pendingNavigation;

                  await discardUnsavedDraft();

                  setShowUnsavedDialog(
                    false
                  );

                  setPendingNavigation(
                    ""
                  );

                  if (path) {
                    router.push(
                      path
                    );
                  }
                }}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 app-dark:border-red-500/30 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
              >
                Discard changes
              </button>

              <button
                type="button"
                disabled={
                  isSavingAutomation
                }
                onClick={async () => {
                  const saved =
                    await saveChanges(
                      false
                    );

                  if (!saved) {
                    return;
                  }

                  const path =
                    pendingNavigation;

                  setShowUnsavedDialog(
                    false
                  );

                  setPendingNavigation(
                    ""
                  );

                  if (path) {
                    router.push(
                      path
                    );
                  }
                }}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingAutomation
                  ? "Saving..."
                  : "Save & leave"}
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
            >{phoneCountryCodes.map(
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
  onSave,
  saving,
  dirty,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  return (
    <div data-flow-step={number} className="relative flex gap-3 sm:gap-4">

      <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-400 to-indigo-600 text-xs font-black text-white shadow-sm sm:h-12 sm:w-12">
        {number}
      </div>

      <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 sm:p-5 app-dark:border-slate-800 app-dark:bg-[#11161d]">

        <h2 className="text-lg font-bold app-dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
          {description}
        </p>

        <div className="mt-4">
          {children}
        </div>

        <div className="mt-5 flex justify-end border-t border-gray-100 pt-4 app-dark:border-slate-800">
          <button
            type="button"
            data-step-save
            onClick={onSave}
            disabled={saving || !dirty}
            className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
          </button>
        </div>

      </div>

    </div>
  );
}

function Option({
  active,
  disabled = false,
  onClick,
  title,
  description,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-cyan-400 bg-cyan-50/60 shadow-sm ring-2 ring-cyan-100 app-dark:border-cyan-500 app-dark:bg-cyan-500/10 app-dark:ring-cyan-500/10"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:bg-white app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:hover:border-slate-600 app-dark:hover:bg-slate-900 app-dark:disabled:hover:border-slate-700 app-dark:disabled:hover:bg-[#0b0f14]"
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