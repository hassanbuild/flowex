import { google } from "googleapis";
import { NextResponse } from "next/server";

import {
  createGoogleOAuthClient,
  extractSpreadsheetId,
  normalizeSheetHeader,
} from "@/lib/integrations/google";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SourceField = {
  key: string;
  label: string;
};

function getSourceFields(
  sourceType: string,
  config: unknown,
  detectedFields: unknown
): SourceField[] {
  if (
    sourceType ===
      "flowex_form" &&
    config &&
    typeof config ===
      "object"
  ) {
    const fields =
      (
        config as {
          fields?: unknown;
        }
      ).fields;

    if (
      Array.isArray(
        fields
      )
    ) {
      return fields
        .filter(
          (
            field
          ): field is {
            id: string;
            label: string;
          } =>
            !!field &&
            typeof field ===
              "object" &&
            typeof (
              field as {
                id?: unknown;
              }
            ).id ===
              "string" &&
            typeof (
              field as {
                label?: unknown;
              }
            ).label ===
              "string"
        )
        .map(
          (field) => ({
            key:
              field.id,

            label:
              field.label
                .trim() ||
              field.id,
          })
        );
    }
  }

  if (
    Array.isArray(
      detectedFields
    )
  ) {
    return detectedFields
      .filter(
        (
          field
        ): field is {
          key: string;
        } =>
          !!field &&
          typeof field ===
            "object" &&
          typeof (
            field as {
              key?: unknown;
            }
          ).key ===
            "string"
      )
      .map(
        (field) => ({
          key:
            field.key,

          label:
            field.key,
        })
      );
  }

  return [];
}

async function formatLeadSheet(
  sheets: ReturnType<
    typeof google.sheets
  >,
  spreadsheetId: string,
  columnCount: number
) {
  const spreadsheet =
    await sheets.spreadsheets.get({
      spreadsheetId,
      fields:
        "sheets(properties(sheetId,title))",
    });

  const firstSheet =
    spreadsheet.data.sheets?.[0];

  const sheetId =
    firstSheet?.properties
      ?.sheetId;

  if (
    typeof sheetId !==
    "number"
  ) {
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,

    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,

              gridProperties: {
                frozenRowCount:
                  1,
              },
            },

            fields:
              "gridProperties.frozenRowCount",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex:
                0,
              endRowIndex:
                1,
              startColumnIndex:
                0,
              endColumnIndex:
                Math.max(
                  columnCount,
                  1
                ),
            },

            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red:
                    0.92,
                  green:
                    0.97,
                  blue:
                    0.95,
                },

                textFormat: {
                  bold:
                    true,
                },

                horizontalAlignment:
                  "CENTER",

                verticalAlignment:
                  "MIDDLE",
              },
            },

            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension:
                "ROWS",
              startIndex:
                0,
              endIndex:
                1,
            },

            properties: {
              pixelSize:
                34,
            },

            fields:
              "pixelSize",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId,
              dimension:
                "COLUMNS",
              startIndex:
                0,
              endIndex:
                Math.max(
                  columnCount,
                  1
                ),
            },
          },
        },
        {
          setBasicFilter: {
            filter: {
              range: {
                sheetId,
                startRowIndex:
                  0,
                startColumnIndex:
                  0,
                endColumnIndex:
                  Math.max(
                    columnCount,
                    1
                  ),
              },
            },
          },
        },
      ],
    },
  });
}

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
    error:
      userError,
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
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  let body: {
    leadFlowId?: unknown;
    mode?: unknown;
    displayName?: unknown;
    destination?: unknown;
  };

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request.",
      },
      {
        status: 400,
      }
    );
  }

  const leadFlowId =
    typeof body.leadFlowId ===
      "string"
      ? body.leadFlowId.trim()
      : "";

  const mode =
    body.mode ===
      "existing"
      ? "existing"
      : "create_new";

  const displayName =
    typeof body.displayName ===
      "string"
      ? body.displayName
          .trim()
          .slice(
            0,
            80
          )
      : "";

  const destination =
    typeof body.destination ===
      "string"
      ? body.destination.trim()
      : "";

  if (
    !leadFlowId ||
    !displayName
  ) {
    return NextResponse.json(
      {
        error:
          "Lead Flow and destination name are required.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: flow,
  } =
    await supabase
      .from("lead_flows")
      .select("id")
      .eq(
        "id",
        leadFlowId
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

  if (!flow) {
    return NextResponse.json(
      {
        error:
          "The selected Lead Flow could not be verified.",
      },
      {
        status: 404,
      }
    );
  }

  const {
    data: connection,
  } =
    await supabase
      .from(
        "integration_connections"
      )
      .select(
        "credentials, provider_account_email"
      )
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "provider",
        "google_sheets"
      )
      .maybeSingle();

  if (
    !connection ||
    !connection.credentials ||
    typeof connection
      .credentials !==
      "object"
  ) {
    return NextResponse.json(
      {
        error:
          "Connect your Google account first.",
        needsGoogleConnection:
          true,
      },
      {
        status: 409,
      }
    );
  }

  const oauth2Client =
    createGoogleOAuthClient();

  oauth2Client.setCredentials(
    connection.credentials
  );

  oauth2Client.on(
    "tokens",
    async (
      tokens
    ) => {
      if (
        !tokens.access_token &&
        !tokens.refresh_token
      ) {
        return;
      }

      const current =
        connection.credentials as Record<
          string,
          unknown
        >;

      await supabase
        .from(
          "integration_connections"
        )
        .update({
          credentials: {
            ...current,
            ...tokens,

            refresh_token:
              tokens.refresh_token ||
              current.refresh_token,
          },

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "provider",
          "google_sheets"
        );
    }
  );

  const sheets =
    google.sheets({
      version:
        "v4",
      auth:
        oauth2Client,
    });

  const {
    data: source,
  } =
    await supabase
      .from("lead_sources")
      .select(
        "source_type, config, detected_fields"
      )
      .eq(
        "lead_flow_id",
        leadFlowId
      )
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "enabled",
        true
      )
      .order(
        "updated_at",
        {
          ascending:
            false,
        }
      )
      .limit(1)
      .maybeSingle();

  const sourceFields =
    source
      ? getSourceFields(
          source.source_type,
          source.config,
          source.detected_fields
        )
      : [];

  const desiredHeaders = [
    "Captured At",
    ...sourceFields.map(
      (field) =>
        field.label
    ),
  ];

  let spreadsheetId =
    "";

  let finalHeaders:
    string[] =
    [];

  if (
    mode ===
    "existing"
  ) {
    spreadsheetId =
      extractSpreadsheetId(
        destination
      ) || "";

    if (!spreadsheetId) {
      return NextResponse.json(
        {
          error:
            "Paste a valid Google Sheets URL.",
        },
        {
          status: 400,
        }
      );
    }

    try {
      await sheets.spreadsheets.get({
        spreadsheetId,
        fields:
          "spreadsheetId,properties.title",
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "Flowex cannot access that Google Sheet. Make sure the connected Google account has edit access.",
        },
        {
          status: 422,
        }
      );
    }

    const headerResult =
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range:
          "1:1",
      });

    finalHeaders =
      (
        headerResult.data
          .values?.[0] ||
        []
      ).map(
        (value) =>
          String(
            value
          ).trim()
      );

    if (
      finalHeaders.length ===
      0
    ) {
      finalHeaders =
        desiredHeaders;
    } else {
      const normalized =
        new Set(
          finalHeaders.map(
            normalizeSheetHeader
          )
        );

      for (
        const header of
        desiredHeaders
      ) {
        const key =
          normalizeSheetHeader(
            header
          );

        if (
          !normalized.has(
            key
          )
        ) {
          finalHeaders.push(
            header
          );

          normalized.add(
            key
          );
        }
      }
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range:
        "A1",
      valueInputOption:
        "RAW",
      requestBody: {
        values: [
          finalHeaders,
        ],
      },
    });
  } else {
    const created =
      await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title:
              displayName,
          },
        },
      });

    spreadsheetId =
      created.data
        .spreadsheetId ||
      "";

    if (!spreadsheetId) {
      return NextResponse.json(
        {
          error:
            "Google could not create the spreadsheet.",
        },
        {
          status: 500,
        }
      );
    }

    finalHeaders =
      desiredHeaders;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range:
        "A1",
      valueInputOption:
        "RAW",
      requestBody: {
        values: [
          finalHeaders,
        ],
      },
    });
  }

  const fieldKeys =
    finalHeaders.map(
      (header) => {
        if (
          normalizeSheetHeader(
            header
          ) ===
          normalizeSheetHeader(
            "Captured At"
          )
        ) {
          return "__captured_at";
        }

        const matching =
          sourceFields.find(
            (field) =>
              normalizeSheetHeader(
                field.label
              ) ===
              normalizeSheetHeader(
                header
              )
          );

        return (
          matching?.key ||
          ""
        );
      }
    );

  await formatLeadSheet(
    sheets,
    spreadsheetId,
    finalHeaders.length
  );

  const sheetUrl =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  const {
    error:
      destinationError,
  } =
    await supabase
      .from(
        "lead_destinations"
      )
      .upsert(
        {
          user_id:
            user.id,

          lead_flow_id:
            leadFlowId,

          provider:
            "sheets",

          mode,

          display_name:
            displayName,

          connected:
            true,

          config: {
            destination:
              mode ===
              "existing"
                ? destination
                : sheetUrl,

            spreadsheet_id:
              spreadsheetId,

            spreadsheet_url:
              sheetUrl,

            headers:
              finalHeaders,

            field_keys:
              fieldKeys,

            google_email:
              connection
                .provider_account_email ||
              null,
          },

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "lead_flow_id",
        }
      );

  if (
    destinationError
  ) {
    return NextResponse.json(
      {
        error:
          "Google Sheets is ready, but Flowex could not save this destination.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    connected: true,
    spreadsheetId,
    spreadsheetUrl:
      sheetUrl,
    headers:
      finalHeaders,
    googleEmail:
      connection
        .provider_account_email ||
      null,
  });
}