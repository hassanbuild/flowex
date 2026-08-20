import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  const token =
    authorization.startsWith(
      "Bearer "
    )
      ? authorization
          .slice(7)
          .trim()
      : "";

  if (!token) {
    return NextResponse.json(
      {
        connected: false,

        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  const supabase =
    createAdminClient();

  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser(
      token
    );

  if (
    userError ||
    !user
  ) {
    return NextResponse.json(
      {
        connected: false,

        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  let body:
    {
      sourceId?: unknown;
    };

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        connected: false,

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
        connected: false,

        error:
          "External Form connection was not found.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: source,
    error: sourceError,
  } =
    await supabase
      .from("lead_sources")
      .select(
        "id, public_key, config"
      )
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
      )
      .maybeSingle();

  if (
    sourceError ||
    !source
  ) {
    return NextResponse.json(
      {
        connected: false,

        error:
          "External Form connection was not found.",
      },
      {
        status: 404,
      }
    );
  }

  const config =
    source.config as {
      source_url?: unknown;
    } | null;

  if (
    typeof config?.source_url !==
    "string"
  ) {
    return NextResponse.json(
      {
        connected: false,

        error:
          "The connected form URL is unavailable.",
      },
      {
        status: 422,
      }
    );
  }

  let connected = false;

  /*
    Load browser dependencies only for the actual connection check.
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

  let browser:
    Awaited<
      ReturnType<
        typeof puppeteer.launch
      >
    > | null =
    null;

  try {
    const executablePath =
      await chromium.executablePath(
        chromiumPackUrl
      );

    browser =
      await puppeteer.launch({
        args:
          await puppeteer.defaultArgs({
            args: chromium.args,
            headless: "shell",
          }),

        executablePath,

        headless:
          "shell",

        defaultViewport: {
          width: 1280,
          height: 900,
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          isLandscape: false,
        },
      });

    const page =
      await browser.newPage();

    await page.goto(
      config.source_url,
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
          1500
        )
    );

    connected =
      await page.evaluate(
        (publicKey) => {
          return Array.from(
            document.querySelectorAll(
              "script[data-flowex-key]"
            )
          ).some(
            (script) => {
              const src =
                script.getAttribute(
                  "src"
                ) || "";

              const key =
                script.getAttribute(
                  "data-flowex-key"
                ) || "";

              return (
                key ===
                  publicKey &&
                src.includes(
                  "/flowex-capture.js"
                )
              );
            }
          );
        },
        source.public_key
      );
  } catch (error) {
    console.error(
      "Flowex connection check browser error:",
      error
    );

    connected = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  if (!connected) {
    return NextResponse.json(
      {
        connected: false,

        error:
          "Flowex Capture is not installed on this form yet.",
      },
      {
        status: 422,
      }
    );
  }

  const nextConfig = {
    ...(
      source.config &&
      typeof source.config ===
        "object"
        ? source.config
        : {}
    ),

    capture_connected:
      true,
  };

  const {
    error: updateError,
  } =
    await supabase
      .from("lead_sources")
      .update({
        config:
          nextConfig,

        enabled:
          true,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        source.id
      )
      .eq(
        "user_id",
        user.id
      );

  if (updateError) {
    return NextResponse.json(
      {
        connected: false,

        error:
          "Flowex found the capture script but could not save the connection.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      connected: true,
    }
  );
}