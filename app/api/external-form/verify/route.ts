import { lookup } from "dns/promises";
import { isIP } from "net";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

type VerifyBody = {
  url?: unknown;
  sourceId?: unknown;
  leadFlowId?: unknown;
};

type DetectedField = {
  key: string;
  type:
    | "email"
    | "phone"
    | "number"
    | "url"
    | "date"
    | "select"
    | "text";
};

type BrowserField = {
  tag: string;
  inputType: string;
  name: string;
  id: string;
  placeholder: string;
  ariaLabel: string;
  label: string;
  required: boolean;
};

const safeHostCache =
  new Map<string, boolean>();

function isPrivateIPv4(ip: string) {
  const parts =
    ip.split(".").map(Number);

  if (parts.length !== 4) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateIPv6(ip: string) {
  const value =
    ip.toLowerCase();

  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb")
  );
}

function isPrivateIP(ip: string) {
  const version =
    isIP(ip);

  if (version === 4) {
    return isPrivateIPv4(ip);
  }

  if (version === 6) {
    return isPrivateIPv6(ip);
  }

  return true;
}

async function isSafePublicUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (
    url.protocol !== "https:" &&
    url.protocol !== "http:"
  ) {
    return false;
  }

  if (url.username || url.password) {
    return false;
  }

  const hostname =
    url.hostname
      .toLowerCase()
      .replace(/\.$/, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }

  if (safeHostCache.has(hostname)) {
    return safeHostCache.get(hostname) === true;
  }

  if (isIP(hostname)) {
    const safe = !isPrivateIP(hostname);
    safeHostCache.set(hostname, safe);
    return safe;
  }

  try {
    const addresses =
      await lookup(
        hostname,
        {
          all: true,
          verbatim: true,
        }
      );

    const safe =
      addresses.length > 0 &&
      addresses.every(
        (entry) =>
          !isPrivateIP(entry.address)
      );

    safeHostCache.set(hostname, safe);
    return safe;
  } catch {
    safeHostCache.set(hostname, false);
    return false;
  }
}

function cleanKey(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function inferFieldType(
  field: BrowserField
): DetectedField["type"] | null {
  const tag =
    field.tag.toLowerCase();

  const inputType =
    field.inputType.toLowerCase();

  if (
    [
      "hidden",
      "submit",
      "button",
      "reset",
      "image",
      "file",
      "password",
    ].includes(inputType)
  ) {
    return null;
  }

  if (tag === "select") {
    return "select";
  }

  if (tag === "textarea") {
    return "text";
  }

  if (inputType === "email") {
    return "email";
  }

  if (inputType === "tel") {
    return "phone";
  }

  if (
    inputType === "number" ||
    inputType === "range"
  ) {
    return "number";
  }

  if (inputType === "url") {
    return "url";
  }

  if (
    inputType === "date" ||
    inputType === "datetime-local" ||
    inputType === "month" ||
    inputType === "week"
  ) {
    return "date";
  }

  const semanticText =
    [
      field.name,
      field.id,
      field.placeholder,
      field.ariaLabel,
      field.label,
    ]
      .join(" ")
      .toLowerCase();

  if (
    semanticText.includes("email") ||
    semanticText.includes("e-mail")
  ) {
    return "email";
  }

  if (
    semanticText.includes("phone") ||
    semanticText.includes("mobile") ||
    semanticText.includes("telephone") ||
    semanticText.includes("whatsapp") ||
    /\btel\b/.test(semanticText)
  ) {
    return "phone";
  }

  if (
    semanticText.includes("website") ||
    semanticText.includes("url")
  ) {
    return "url";
  }

  if (
    semanticText.includes("income") ||
    semanticText.includes("budget") ||
    semanticText.includes("amount") ||
    semanticText.includes("salary")
  ) {
    return (
      tag === "select"
        ? "select"
        : "number"
    );
  }

  if (
    inputType === "checkbox" ||
    inputType === "radio"
  ) {
    return "select";
  }

  return "text";
}

function getFieldKey(
  field: BrowserField,
  index: number
) {
  const candidates = [
    field.name,
    field.id,
    field.label,
    field.placeholder,
    field.ariaLabel,
  ];

  for (const candidate of candidates) {
    const cleaned =
      cleanKey(candidate);

    if (cleaned) {
      return cleaned;
    }
  }

  return `field_${index + 1}`;
}

async function inspectRenderedForm(
  sourceUrl: string
) {
  if (
    !(await isSafePublicUrl(sourceUrl))
  ) {
    throw new Error("UNSAFE_URL");
  }

  /*
    Browser packages are imported only when POST verification
    actually needs them. DELETE / unlink therefore never loads
    Chromium.
  */
  const [
    { default: puppeteer },
    { default: chromium },
  ] =
    await Promise.all([
      import("puppeteer-core"),
      import("@sparticuz/chromium-min"),
    ]);

  const chromiumPackUrl =
    process.env.CHROMIUM_REMOTE_EXEC_PATH ||
    "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

  const executablePath =
    await chromium.executablePath(
      chromiumPackUrl
    );

  const browser =
    await puppeteer.launch({
      args:
        await puppeteer.defaultArgs({
          args: chromium.args,
          headless: "shell",
        }),

      executablePath,

      headless: "shell",

      defaultViewport: {
        width: 1280,
        height: 900,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: false,
      },
    });

  try {
    const page =
      await browser.newPage();

    await page.setUserAgent(
      "Flowex-Form-Verifier/1.0"
    );

    /*
      Keep the same protection against the browser being used
      to reach localhost/private/internal network addresses.
    */
    await page.setRequestInterception(
      true
    );

    page.on(
      "request",
      async (request) => {
        const requestUrl =
          request.url();

        if (
          requestUrl.startsWith("data:") ||
          requestUrl.startsWith("blob:")
        ) {
          await request.continue();
          return;
        }

        const safe =
          await isSafePublicUrl(
            requestUrl
          );

        if (!safe) {
          await request.abort(
            "blockedbyclient"
          );
          return;
        }

        await request.continue();
      }
    );

    await page.goto(
      sourceUrl,
      {
        waitUntil:
          "domcontentloaded",

        timeout:
          15000,
      }
    );

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          1800
        )
    );

    const finalUrl =
      page.url();

    if (
      !(await isSafePublicUrl(finalUrl))
    ) {
      throw new Error(
        "UNSAFE_URL"
      );
    }

    const rawFields =
      await page.$$eval(
        "input, textarea, select",
        (elements) =>
          elements
            .filter(
              (element) => {
                const htmlElement =
                  element as HTMLElement;

                const style =
                  window.getComputedStyle(
                    htmlElement
                  );

                const rect =
                  htmlElement.getBoundingClientRect();

                return (
                  style.display !== "none" &&
                  style.visibility !== "hidden" &&
                  Number(style.opacity) !== 0 &&
                  rect.width > 0 &&
                  rect.height > 0 &&
                  !(
                    element as HTMLInputElement
                  ).disabled
                );
              }
            )
            .map(
              (element) => {
                const input =
                  element as
                    | HTMLInputElement
                    | HTMLTextAreaElement
                    | HTMLSelectElement;

                const id =
                  input.id || "";

                let label = "";

                if (id) {
                  const explicit =
                    document.querySelector(
                      `label[for="${CSS.escape(
                        id
                      )}"]`
                    );

                  if (explicit) {
                    label =
                      explicit.textContent ||
                      "";
                  }
                }

                if (!label) {
                  const parentLabel =
                    input.closest(
                      "label"
                    );

                  if (
                    parentLabel
                  ) {
                    label =
                      parentLabel.textContent ||
                      "";
                  }
                }

                return {
                  tag:
                    input.tagName.toLowerCase(),

                  inputType:
                    input instanceof HTMLInputElement
                      ? input.type || "text"
                      : "",

                  name:
                    input.getAttribute(
                      "name"
                    ) || "",

                  id,

                  placeholder:
                    input.getAttribute(
                      "placeholder"
                    ) || "",

                  ariaLabel:
                    input.getAttribute(
                      "aria-label"
                    ) || "",

                  label:
                    label
                      .replace(
                        /\s+/g,
                        " "
                      )
                      .trim(),

                  required:
                    input.hasAttribute(
                      "required"
                    ) ||
                    input.getAttribute(
                      "aria-required"
                    ) === "true",
                };
              }
            )
      ) as BrowserField[];

    const detected:
      DetectedField[] = [];

    rawFields.forEach(
      (
        field,
        index
      ) => {
        const type =
          inferFieldType(
            field
          );

        if (!type) {
          return;
        }

        detected.push({
          key:
            getFieldKey(
              field,
              index
            ),

          type,
        });
      }
    );

    const unique =
      new Map<
        string,
        DetectedField
      >();

    for (
      const field of detected
    ) {
      unique.set(
        `${field.key.toLowerCase()}:${field.type}`,
        field
      );
    }

    const captureKeys =
      await page.$$eval(
        "script[data-flowex-key]",
        (scripts) =>
          scripts
            .filter((script) =>
              (script.getAttribute("src") || "").includes(
                "/flowex-capture.js"
              )
            )
            .map(
              (script) =>
                script.getAttribute(
                  "data-flowex-key"
                ) || ""
            )
            .filter(Boolean)
      );

    return {
      finalUrl,

      fields:
        [
          ...unique.values(),
        ].slice(
          0,
          50
        ),

      captureKeys,
    };
  } finally {
    await browser.close();
  }
}

async function getAuthenticatedUser(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    return null;
  }

  const supabase =
    createAdminClient();

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser(
      token
    );

  if (
    error ||
    !user
  ) {
    return null;
  }

  return {
    user,
    supabase,
  };
}

export async function POST(
  request: Request
) {
  const auth =
    await getAuthenticatedUser(
      request
    );

  if (!auth) {
    return NextResponse.json(
      {
        verified: false,

        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  let body:
    VerifyBody;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        verified: false,

        error:
          "Invalid request.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    typeof body.url !==
      "string" ||
    !body.url.trim()
  ) {
    return NextResponse.json(
      {
        verified: false,

        error:
          "Paste your form URL first.",
      },
      {
        status: 400,
      }
    );
  }

  let inspected:
    {
      finalUrl: string;
      fields: DetectedField[];
      captureKeys: string[];
    };

  try {
    inspected =
      await inspectRenderedForm(
        body.url.trim()
      );
  } catch (error) {
    console.error(
      "Flowex external form inspection error:",
      error
    );

    return NextResponse.json(
      {
        verified: false,

        error:
          "Not compatible. Flowex could not inspect this form URL.",
      },
      {
        status: 422,
      }
    );
  }

  const detectedFields =
    inspected.fields;

  const hasContactField =
    detectedFields.some(
      (field) =>
        field.type === "email" ||
        field.type === "phone"
    );

  if (
    detectedFields.length === 0 ||
    !hasContactField
  ) {
    return NextResponse.json(
      {
        verified: false,

        detectedFields,

        error:
          "Not compatible. Flowex could not detect a usable lead form with an email or phone input at this URL.",
      },
      {
        status: 422,
      }
    );
  }

  const {
    user,
    supabase,
  } =
    auth;

  const sourceId =
    typeof body.sourceId === "string" &&
    body.sourceId.trim()
      ? body.sourceId.trim()
      : null;

  const leadFlowId =
    typeof body.leadFlowId === "string" &&
    body.leadFlowId.trim()
      ? body.leadFlowId.trim()
      : null;

  if (!leadFlowId) {
    return NextResponse.json(
      {
        verified: false,
        error:
          "A Lead Flow must be selected before connecting this form.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: leadFlow,
    error: leadFlowError,
  } =
    await supabase
      .from("lead_flows")
      .select("id")
      .eq("id", leadFlowId)
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    leadFlowError ||
    !leadFlow
  ) {
    return NextResponse.json(
      {
        verified: false,
        error:
          "The selected Lead Flow could not be verified.",
      },
      {
        status: 404,
      }
    );
  }

  /*
    Keep one source/public_key for the same Lovable form.

    We first try the sourceId supplied by the UI. If that is not
    available (for example after Unlink), we look for an existing
    source owned by this user whose URL matches this form OR whose
    public_key is already installed on the rendered page.
  */
  let existing:
    | {
        id: string;
        public_key: string;
        config: unknown;
      }
    | null = null;

  if (sourceId) {
    const {
      data: existingById,
    } =
      await supabase
        .from("lead_sources")
        .select(
          "id, public_key, config, lead_flow_id"
        )
        .eq(
          "id",
          sourceId
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "lead_flow_id",
          leadFlowId
        )
        .eq(
          "source_type",
          "external_form"
        )
        .maybeSingle();

    existing =
      existingById || null;
  }

  if (!existing) {
    const {
      data: candidates,
    } =
      await supabase
        .from("lead_sources")
        .select(
          "id, public_key, config, lead_flow_id"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "lead_flow_id",
          leadFlowId
        )
        .eq(
          "source_type",
          "external_form"
        );

    existing =
      candidates?.find(
        (candidate) => {
          const candidateConfig =
            candidate.config as {
              source_url?: unknown;
            } | null;

          const sameUrl =
            typeof candidateConfig?.source_url ===
              "string" &&
            candidateConfig.source_url ===
              inspected.finalUrl;

          const keyAlreadyInstalled =
            inspected.captureKeys.includes(
              candidate.public_key
            );

          return (
            sameUrl ||
            keyAlreadyInstalled
          );
        }
      ) || null;
  }

  const captureConnected =
    !!existing &&
    inspected.captureKeys.includes(
      existing.public_key
    );

  const config = {
    ...(
      existing?.config &&
      typeof existing.config ===
        "object"
        ? existing.config
        : {}
    ),

    source_url:
      inspected.finalUrl,

    capture_connected:
      captureConnected,
  };

  if (existing) {
    const {
      data,
      error,
    } =
      await supabase
        .from("lead_sources")
        .update({
          lead_flow_id:
            leadFlowId,

          name:
            "External Form",

          source_type:
            "external_form",

          config,

          enabled:
            true,

          verified:
            true,

          detected_fields:
            detectedFields,

          last_test_payload:
            null,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          existing.id
        )
        .eq(
          "user_id",
          user.id
        )
        .select(
          "id, public_key"
        )
        .single();

    if (
      error ||
      !data
    ) {
      return NextResponse.json(
        {
          verified: false,

          error:
            "Flowex could not save this connection.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        verified: true,

        sourceId:
          data.id,

        publicKey:
          data.public_key,

        url:
          inspected.finalUrl,

        detectedFields,

        captureConnected,
      }
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("lead_sources")
      .insert({
        user_id:
          user.id,

        lead_flow_id:
          leadFlowId,

        name:
          "External Form",

        source_type:
          "external_form",

        config,

        enabled:
          true,

        verified:
          true,

        detected_fields:
          detectedFields,

        last_test_payload:
          null,
      })
      .select(
        "id, public_key"
      )
      .single();

  if (
    error ||
    !data
  ) {
    return NextResponse.json(
      {
        verified: false,

        error:
          "Flowex could not save this connection.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      verified: true,

      sourceId:
        data.id,

      publicKey:
        data.public_key,

      url:
        inspected.finalUrl,

      detectedFields,

      captureConnected: false,
    }
  );
}

export async function DELETE(
  request: Request
) {
  const auth =
    await getAuthenticatedUser(
      request
    );

  if (!auth) {
    return NextResponse.json(
      {
        success: false,

        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  let body:
    VerifyBody;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,

        error:
          "Invalid request.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    typeof body.sourceId !==
      "string" ||
    !body.sourceId.trim()
  ) {
    return NextResponse.json(
      {
        success: false,

        error:
          "External Form connection was not found.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    user,
    supabase,
  } =
    auth;

  const {
    error,
  } =
    await supabase
      .from("lead_sources")
      .update({
        enabled:
          false,

        verified:
          false,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        body.sourceId.trim()
      )
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "source_type",
        "external_form"
      );

  if (error) {
    return NextResponse.json(
      {
        success: false,

        error:
          "Flowex could not unlink this form.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
    }
  );
}