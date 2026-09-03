import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type DestinationProvider =
  | "sheets"
  | "airtable"
  | "excel"
  | "notion"
  | "hubspot";

const providerMap: Record<
  DestinationProvider,
  {
    connectionProvider: string;
    destinationProvider: string;
    oauthProvider: string;
  }
> = {
  sheets: {
    connectionProvider: "google_sheets",
    destinationProvider: "sheets",
    oauthProvider: "google_sheets",
  },

  airtable: {
    connectionProvider: "airtable",
    destinationProvider: "airtable",
    oauthProvider: "airtable",
  },

  excel: {
    connectionProvider: "microsoft_excel",
    destinationProvider: "excel",
    oauthProvider: "microsoft_excel",
  },

  notion: {
    connectionProvider: "notion",
    destinationProvider: "notion",
    oauthProvider: "notion",
  },

  hubspot: {
    connectionProvider: "hubspot",
    destinationProvider: "hubspot",
    oauthProvider: "hubspot",
  },
};

async function authenticate(
  request: Request
) {
  const authorization =
    request.headers.get("authorization") || "";

  if (
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  const token =
    authorization.slice(7).trim();

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
    await authenticate(
      request
    );

  if (!auth) {
    return NextResponse.json(
      {
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  const body =
    (await request
      .json()
      .catch(
        () => null
      )) as {
      provider?: unknown;
    } | null;

  const provider =
    typeof body
      ?.provider ===
      "string"
      ? body.provider
      : "";

  if (
    provider !== "sheets" &&
    provider !== "airtable" &&
    provider !== "excel" &&
    provider !== "notion" &&
    provider !== "hubspot"
  ) {
    return NextResponse.json(
      {
        error:
          "Unsupported integration provider.",
      },
      {
        status: 400,
      }
    );
  }

  const config =
    providerMap[
      provider
    ];

  /*
    1. Delete every Flowex destination belonging
       to this provider for this user.

    This removes stored:
    - resource IDs
    - URLs
    - mappings
    - table/database/workbook/sheet references
    - provider metadata

    External provider data itself is NOT deleted.
  */
  const {
    error:
      destinationError,
  } =
    await auth.supabase
      .from(
        "lead_destinations"
      )
      .delete()
      .eq(
        "user_id",
        auth.user.id
      )
      .eq(
        "provider",
        config.destinationProvider
      );

  if (
    destinationError
  ) {
    console.error(
      "Flowex destination cleanup error:",
      destinationError
    );

    return NextResponse.json(
      {
        error:
          "Flowex could not remove the stored destinations for this account.",
      },
      {
        status: 500,
      }
    );
  }

  /*
    2. Delete pending OAuth states belonging
       to this provider.
  */
  const {
    error:
      oauthStateError,
  } =
    await auth.supabase
      .from(
        "oauth_states"
      )
      .delete()
      .eq(
        "user_id",
        auth.user.id
      )
      .eq(
        "provider",
        config.oauthProvider
      );

  if (
    oauthStateError
  ) {
    console.error(
      "Flowex OAuth-state cleanup error:",
      oauthStateError
    );
  }

  /*
    3. Delete the account-level connection.

    This removes:
    - access token
    - refresh token
    - provider account email
    - provider IDs
    - stored OAuth credentials
    - connection metadata
  */
  const {
    error:
      connectionError,
  } =
    await auth.supabase
      .from(
        "integration_connections"
      )
      .delete()
      .eq(
        "user_id",
        auth.user.id
      )
      .eq(
        "provider",
        config.connectionProvider
      );

  if (
    connectionError
  ) {
    console.error(
      "Flowex integration cleanup error:",
      connectionError
    );

    return NextResponse.json(
      {
        error:
          "Flowex removed the destinations but could not completely remove the account connection.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    success:
      true,

    disconnected:
      true,

    provider,

    forgotten:
      true,
  });
}