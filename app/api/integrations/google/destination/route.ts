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
  type: string;
};

type SheetColumn = {
  header: string;
  key: string;
  columnType:
    | "DATE"
    | "TEXT";
};

type DestinationConfig = {
  destination?: unknown;
  spreadsheet_id?: unknown;
  spreadsheet_url?: unknown;
  sheet_title?: unknown;
  table_id?: unknown;
  headers?: unknown;
  column_keys?: unknown;
  google_email?: unknown;
  created_by_flowex?: unknown;
};

const PROVIDER =
  "google_sheets";

function cleanTableName(
  value: string
) {
  const cleaned =
    value
      .replace(
        /[^a-zA-Z0-9_]/g,
        "_"
      )
      .replace(
        /_+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      )
      .slice(
        0,
        60
      );

  return (
    cleaned ||
    "FlowexLeads"
  );
}

function normalizeFieldType(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    );
}

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
            type: string;
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
              "string" &&
            typeof (
              field as {
                type?: unknown;
              }
            ).type ===
              "string"
        )
        .map(
          (
            field
          ) => ({
            key:
              field.id,

            label:
              field.label
                .trim() ||
              field.id,

            type:
              normalizeFieldType(
                field.type
              ),
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
          type: string;
        } =>
          !!field &&
          typeof field ===
            "object" &&
          typeof (
            field as {
              key?: unknown;
            }
          ).key ===
            "string" &&
          typeof (
            field as {
              type?: unknown;
            }
          ).type ===
            "string"
      )
      .map(
        (
          field
        ) => ({
          key:
            field.key,

          label:
            field.key,

          type:
            normalizeFieldType(
              field.type
            ),
        })
      );
  }

  return [];
}

function canonicalHeader(
  field: SourceField
) {
  const type =
    field.type;

  if (
    type === "full_name" ||
    type === "name"
  ) {
    return "Name";
  }

  if (
    type === "email" ||
    type.includes(
      "email"
    )
  ) {
    return "Email";
  }

  if (
    type === "phone" ||
    type === "tel" ||
    type.includes(
      "phone"
    ) ||
    type.includes(
      "mobile"
    ) ||
    type.includes(
      "contact"
    )
  ) {
    return "Contact";
  }

  if (
    type === "company" ||
    type.includes(
      "company"
    ) ||
    type.includes(
      "business"
    )
  ) {
    return "Company";
  }

  if (
    type === "website" ||
    type === "url"
  ) {
    return "Website";
  }

  return (
    field.label
      .trim() ||
    "Field"
  );
}

function columnKey(
  field: SourceField
) {
  const type =
    field.type;

  if (
    type === "email" ||
    type.includes(
      "email"
    )
  ) {
    return "__email";
  }

  if (
    type === "phone" ||
    type === "tel" ||
    type.includes(
      "phone"
    ) ||
    type.includes(
      "mobile"
    ) ||
    type.includes(
      "contact"
    )
  ) {
    return "__phone";
  }

  return field.key;
}

function buildDesiredColumns(
  sourceFields: SourceField[]
): SheetColumn[] {
  const priority = [
    "full_name",
    "name",
    "email",
    "phone",
    "tel",
    "company",
    "website",
  ];

  const ordered = [
    ...priority.flatMap(
      (
        type
      ) =>
        sourceFields.filter(
          (
            field
          ) =>
            field.type ===
            type
        )
    ),

    ...sourceFields.filter(
      (
        field
      ) =>
        !priority.includes(
          field.type
        )
    ),
  ];

  const columns:
    SheetColumn[] = [
      {
        header:
          "Lead Date",

        key:
          "__lead_date",

        columnType:
          "DATE",
      },
    ];

  const usedHeaders =
    new Set<string>([
      normalizeSheetHeader(
        "Lead Date"
      ),
    ]);

  for (
    const field of
    ordered
  ) {
    const header =
      canonicalHeader(
        field
      );

    const normalized =
      normalizeSheetHeader(
        header
      );

    if (
      !normalized ||
      usedHeaders.has(
        normalized
      )
    ) {
      continue;
    }

    usedHeaders.add(
      normalized
    );

    columns.push({
      header,
      key:
        columnKey(
          field
        ),
      columnType:
        "TEXT",
    });
  }

  return columns;
}

function headerAliases(
  column: SheetColumn
) {
  const normalized =
    normalizeSheetHeader(
      column.header
    );

  const aliases =
    new Set<string>([
      normalized,
    ]);

  if (
    column.key ===
    "__lead_date"
  ) {
    [
      "lead date",
      "date",
      "created at",
      "captured at",
      "submitted at",
      "submission date",
    ].forEach(
      (
        value
      ) =>
        aliases.add(
          normalizeSheetHeader(
            value
          )
        )
    );
  }

  if (
    column.header ===
    "Name"
  ) {
    [
      "name",
      "full name",
      "lead name",
      "customer name",
      "contact name",
    ].forEach(
      (
        value
      ) =>
        aliases.add(
          normalizeSheetHeader(
            value
          )
        )
    );
  }

  if (
    column.key ===
    "__email"
  ) {
    [
      "email",
      "email address",
      "e mail",
    ].forEach(
      (
        value
      ) =>
        aliases.add(
          normalizeSheetHeader(
            value
          )
        )
    );
  }

  if (
    column.key ===
    "__phone"
  ) {
    [
      "contact",
      "phone",
      "phone number",
      "mobile",
      "mobile number",
      "telephone",
      "whatsapp",
    ].forEach(
      (
        value
      ) =>
        aliases.add(
          normalizeSheetHeader(
            value
          )
        )
    );
  }

  if (
    column.header ===
    "Company"
  ) {
    [
      "company",
      "company name",
      "business",
      "business name",
    ].forEach(
      (
        value
      ) =>
        aliases.add(
          normalizeSheetHeader(
            value
          )
        )
    );
  }

  return aliases;
}

function mapExistingColumns(
  existingHeaders: string[],
  desiredColumns: SheetColumn[]
) {
  const headers =
    existingHeaders.map(
      (
        value
      ) =>
        String(
          value
        ).trim()
    );

  const columnKeys =
    headers.map(
      () =>
        ""
    );

  const columnTypes:
    (
      | "DATE"
      | "TEXT"
    )[] =
    headers.map(
      () =>
        "TEXT"
    );

  const usedDesired =
    new Set<number>();

  for (
    let index = 0;
    index <
    headers.length;
    index += 1
  ) {
    const existing =
      normalizeSheetHeader(
        headers[
          index
        ]
      );

    if (!existing) {
      continue;
    }

    const matchIndex =
      desiredColumns.findIndex(
        (
          column,
          desiredIndex
        ) =>
          !usedDesired.has(
            desiredIndex
          ) &&
          headerAliases(
            column
          ).has(
            existing
          )
      );

    if (
      matchIndex !==
      -1
    ) {
      columnKeys[
        index
      ] =
        desiredColumns[
          matchIndex
        ].key;

      columnTypes[
        index
      ] =
        desiredColumns[
          matchIndex
        ].columnType;

      usedDesired.add(
        matchIndex
      );
    }
  }

  desiredColumns.forEach(
    (
      column,
      index
    ) => {
      if (
        usedDesired.has(
          index
        )
      ) {
        return;
      }

      headers.push(
        column.header
      );

      columnKeys.push(
        column.key
      );

      columnTypes.push(
        column.columnType
      );
    }
  );

  return {
    headers,
    columnKeys,
    columnTypes,
  };
}

async function getGoogleConnection(
  supabase: ReturnType<
    typeof createAdminClient
  >,
  userId: string
) {
  const {
    data,
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
        userId
      )
      .eq(
        "provider",
        PROVIDER
      )
      .maybeSingle();

  return data;
}

async function getSourceColumns(
  supabase: ReturnType<
    typeof createAdminClient
  >,
  userId: string,
  leadFlowId: string
) {
  const {
    data:
      source,
  } =
    await supabase
      .from(
        "lead_sources"
      )
      .select(
        "source_type, config, detected_fields"
      )
      .eq(
        "lead_flow_id",
        leadFlowId
      )
      .eq(
        "user_id",
        userId
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
      .limit(
        1
      )
      .maybeSingle();

  const sourceFields =
    source
      ? getSourceFields(
          source.source_type,
          source.config,
          source.detected_fields
        )
      : [];

  return buildDesiredColumns(
    sourceFields
  );
}

async function getFirstSheetMeta(
  sheets: ReturnType<
    typeof google.sheets
  >,
  spreadsheetId: string
) {
  const result =
    await sheets.spreadsheets.get({
      spreadsheetId,

      fields:
        "properties.title,sheets(properties(sheetId,title),tables(tableId,name,range,columnProperties))",
    });

  const firstSheet =
    result.data
      .sheets?.[0];

  const sheetId =
    firstSheet
      ?.properties
      ?.sheetId;

  const sheetTitle =
    firstSheet
      ?.properties
      ?.title ||
    "Sheet1";

  if (
    typeof sheetId !==
    "number"
  ) {
    throw new Error(
      "SHEET_NOT_FOUND"
    );
  }

  return {
    sheetId,
    sheetTitle,
    table:
      firstSheet
        ?.tables?.[0] ||
      null,
  };
}

async function usedRowCount(
  sheets: ReturnType<
    typeof google.sheets
  >,
  spreadsheetId: string,
  sheetTitle: string
) {
  const safeTitle =
    sheetTitle.replace(
      /'/g,
      "''"
    );

  const result =
    await sheets.spreadsheets.values.get({
      spreadsheetId,

      range:
        `'${safeTitle}'!A:ZZ`,
  });

  return Math.max(
    result.data
      .values?.length ||
      0,
    1
  );
}

function tableColumns(
  headers: string[],
  columnTypes: (
    | "DATE"
    | "TEXT"
  )[]
) {
  return headers.map(
    (
      header,
      index
    ) => ({
      columnIndex:
        index,

      columnName:
        header,

      columnType:
        columnTypes[
          index
        ] ||
        "TEXT",
    })
  );
}

async function createOrUpdateTable(
  sheets: ReturnType<
    typeof google.sheets
  >,
  spreadsheetId: string,
  sheetId: number,
  tableId: string | null,
  tableName: string,
  headers: string[],
  columnTypes: (
    | "DATE"
    | "TEXT"
  )[],
  rowCount: number
) {
  const range = {
    sheetId,
    startRowIndex:
      0,
    endRowIndex:
      Math.max(
        rowCount,
        2
      ),
    startColumnIndex:
      0,
    endColumnIndex:
      Math.max(
        headers.length,
        1
      ),
  };

  const table = {
    ...(tableId
      ? {
          tableId,
        }
      : {}),

    name:
      cleanTableName(
        tableName
      ),

    range,

    rowsProperties: {
      headerColorStyle: {
        rgbColor: {
          red:
            0.20,
          green:
            0.43,
          blue:
            0.36,
        },
      },

      firstBandColorStyle: {
        rgbColor: {
          red:
            1,
          green:
            1,
          blue:
            1,
        },
      },

      secondBandColorStyle: {
        rgbColor: {
          red:
            0.96,
          green:
            0.98,
          blue:
            0.97,
        },
      },
    },

    columnProperties:
      tableColumns(
        headers,
        columnTypes
      ),
  };

  if (tableId) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,

      requestBody: {
        requests: [
          {
            updateTable: {
              table,
              fields:
                "name,range,rowsProperties,columnProperties",
            },
          } as any,
        ],
      },
    });

    return tableId;
  }

  const result =
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,

      requestBody: {
        requests: [
          {
            addTable: {
              table,
            },
          } as any,
        ],
      },
    });

  const reply =
    (
      result.data
        .replies?.[0] as any
    )?.addTable
      ?.table;

  return (
    typeof reply
      ?.tableId ===
      "string"
      ? reply.tableId
      : null
  );
}

async function polishSheet(
  sheets: ReturnType<
    typeof google.sheets
  >,
  spreadsheetId: string,
  sheetId: number,
  headers: string[],
  columnKeys: string[]
) {
  const requests:
    any[] = [
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
                headers.length,
                1
              ),
          },

          cell: {
            userEnteredFormat: {
              textFormat: {
                bold:
                  true,
                foregroundColor: {
                  red:
                    1,
                  green:
                    1,
                  blue:
                    1,
                },
              },

              verticalAlignment:
                "MIDDLE",

              wrapStrategy:
                "WRAP",
            },
          },

          fields:
            "userEnteredFormat(textFormat,verticalAlignment,wrapStrategy)",
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
              38,
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
                headers.length,
                1
              ),
          },
        },
      },
    ];

  columnKeys.forEach(
    (
      key,
      index
    ) => {
      if (
        key !==
        "__phone"
      ) {
        return;
      }

      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex:
              1,
            startColumnIndex:
              index,
            endColumnIndex:
              index +
              1,
          },

          cell: {
            userEnteredFormat: {
              numberFormat: {
                type:
                  "TEXT",
                pattern:
                  "@",
              },
            },
          },

          fields:
            "userEnteredFormat.numberFormat",
        },
      });
    }
  );

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,

    requestBody: {
      requests,
    },
  });
}

async function writeHeaders(
  sheets: ReturnType<
    typeof google.sheets
  >,
  spreadsheetId: string,
  sheetTitle: string,
  headers: string[]
) {
  const safeTitle =
    sheetTitle.replace(
      /'/g,
      "''"
    );

  await sheets.spreadsheets.values.update({
    spreadsheetId,

    range:
      `'${safeTitle}'!A1`,

    valueInputOption:
      "RAW",

    requestBody: {
      values: [
        headers,
      ],
    },
  });
}

async function prepareExisting(
  sheets: ReturnType<
    typeof google.sheets
  >,
  spreadsheetId: string,
  desiredColumns: SheetColumn[]
) {
  const meta =
    await getFirstSheetMeta(
      sheets,
      spreadsheetId
    );

  const safeTitle =
    meta.sheetTitle.replace(
      /'/g,
      "''"
    );

  const result =
    await sheets.spreadsheets.values.get({
      spreadsheetId,

      range:
        `'${safeTitle}'!1:1`,
  });

  const existingHeaders =
    (
      result.data
        .values?.[0] ||
      []
    ).map(
      (
        value
      ) =>
        String(
          value
        ).trim()
    );

  const mapped =
    existingHeaders.length
      ? mapExistingColumns(
          existingHeaders,
          desiredColumns
        )
      : {
          headers:
            desiredColumns.map(
              (
                column
              ) =>
                column.header
            ),

          columnKeys:
            desiredColumns.map(
              (
                column
              ) =>
                column.key
            ),

          columnTypes:
            desiredColumns.map(
              (
                column
              ) =>
                column.columnType
            ),
        };

  return {
    ...meta,
    ...mapped,
  };
}

async function authenticate(
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
          .slice(
            7
          )
          .trim()
      : "";

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

  let body: {
    action?: unknown;
    leadFlowId?: unknown;
    mode?: unknown;
    displayName?: unknown;
    destination?: unknown;
    spreadsheetId?: unknown;
    spreadsheetUrl?: unknown;
    createdByFlowex?: unknown;
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

  const action =
    typeof body.action ===
      "string"
      ? body.action
      : "";

  const leadFlowId =
    typeof body.leadFlowId ===
      "string"
      ? body.leadFlowId
          .trim()
      : "";

  if (!leadFlowId) {
    return NextResponse.json(
      {
        error:
          "Select a Lead Flow first.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: flow,
  } =
    await auth.supabase
      .from(
        "lead_flows"
      )
      .select(
        "id"
      )
      .eq(
        "id",
        leadFlowId
      )
      .eq(
        "user_id",
        auth.user.id
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

  const connection =
    await getGoogleConnection(
      auth.supabase,
      auth.user.id
    );

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

      await auth.supabase
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
          auth.user.id
        )
        .eq(
          "provider",
          PROVIDER
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

  const drive =
    google.drive({
      version:
        "v3",
      auth:
        oauth2Client,
    });

  const desiredColumns =
    await getSourceColumns(
      auth.supabase,
      auth.user.id,
      leadFlowId
    );

  if (
    desiredColumns.length <=
    1
  ) {
    return NextResponse.json(
      {
        error:
          "Create or connect the lead form first so Flowex knows which columns to build.",
      },
      {
        status: 422,
      }
    );
  }

  if (
    action ===
    "create_new"
  ) {
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

    if (!displayName) {
      return NextResponse.json(
        {
          error:
            "Give the sheet a name first.",
        },
        {
          status: 400,
        }
      );
    }

    const created =
      await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title:
              displayName,
          },
        },
      });

    const spreadsheetId =
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

    await drive.files.update({
      fileId:
        spreadsheetId,

      requestBody: {
        appProperties: {
          flowexCreated:
            "true",

          flowexUserId:
            auth.user.id,
        },
      },
    });

    const meta =
      await getFirstSheetMeta(
        sheets,
        spreadsheetId
      );

    const headers =
      desiredColumns.map(
        (
          column
        ) =>
          column.header
      );

    const columnKeys =
      desiredColumns.map(
        (
          column
        ) =>
          column.key
      );

    const columnTypes =
      desiredColumns.map(
        (
          column
        ) =>
          column.columnType
      );

    await writeHeaders(
      sheets,
      spreadsheetId,
      meta.sheetTitle,
      headers
    );

    const tableId =
      await createOrUpdateTable(
        sheets,
        spreadsheetId,
        meta.sheetId,
        null,
        `Flowex_${displayName}`,
        headers,
        columnTypes,
        2
      );

    await polishSheet(
      sheets,
      spreadsheetId,
      meta.sheetId,
      headers,
      columnKeys
    );

    return NextResponse.json({
      ready:
        true,

      mode:
        "create_new",

      createdByFlowex:
        true,

      spreadsheetId,

      spreadsheetUrl:
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,

      sheetTitle:
        meta.sheetTitle,

      tableId,

      headers,

      columnKeys,
    });
  }

  if (
    action ===
    "verify_existing"
  ) {
    const destination =
      typeof body.destination ===
        "string"
        ? body.destination
            .trim()
        : "";

    const spreadsheetId =
      extractSpreadsheetId(
        destination
      ) ||
      "";

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
          "spreadsheetId",
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

    const prepared =
      await prepareExisting(
        sheets,
        spreadsheetId,
        desiredColumns
      );

    return NextResponse.json({
      ready:
        true,

      mode:
        "existing",

      createdByFlowex:
        false,

      spreadsheetId,

      spreadsheetUrl:
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,

      sheetTitle:
        prepared.sheetTitle,

      tableId:
        prepared.table
          ?.tableId ||
        null,

      headers:
        prepared.headers,

      columnKeys:
        prepared.columnKeys,

      additions:
        Math.max(
          prepared.headers.length -
            (
              prepared.table
                ?.columnProperties
                ?.length ||
              0
            ),
          0
        ),
    });
  }

  if (
    action ===
    "trash_created"
  ) {
    const spreadsheetId =
      typeof body.spreadsheetId ===
        "string"
        ? body.spreadsheetId
            .trim()
        : "";

    if (!spreadsheetId) {
      return NextResponse.json(
        {
          error:
            "The created sheet could not be identified.",
        },
        {
          status: 400,
        }
      );
    }

    const file =
      await drive.files.get({
        fileId:
          spreadsheetId,

        fields:
          "id,appProperties",
      });

    const appProperties =
      file.data
        .appProperties ||
      {};

    if (
      appProperties
        .flowexCreated !==
        "true" ||
      appProperties
        .flowexUserId !==
        auth.user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Flowex will not delete a Google Sheet it did not create.",
        },
        {
          status: 403,
        }
      );
    }

    await drive.files.update({
      fileId:
        spreadsheetId,

      requestBody: {
        trashed:
          true,
      },
    });

    const {
      data:
        currentDestination,
    } =
      await auth.supabase
        .from(
          "lead_destinations"
        )
        .select(
          "config"
        )
        .eq(
          "lead_flow_id",
          leadFlowId
        )
        .eq(
          "user_id",
          auth.user.id
        )
        .maybeSingle();

    const config =
      currentDestination
        ?.config as DestinationConfig | null;

    if (
      config &&
      config
        .spreadsheet_id ===
        spreadsheetId
    ) {
      await auth.supabase
        .from(
          "lead_destinations"
        )
        .delete()
        .eq(
          "lead_flow_id",
          leadFlowId
        )
        .eq(
          "user_id",
          auth.user.id
        );
    }

    return NextResponse.json({
      deleted:
        true,
    });
  }

  if (
    action ===
    "unlink_existing"
  ) {
    await auth.supabase
      .from(
        "lead_destinations"
      )
      .delete()
      .eq(
        "lead_flow_id",
        leadFlowId
      )
      .eq(
        "user_id",
        auth.user.id
      );

    return NextResponse.json({
      unlinked:
        true,
    });
  }

  if (
    action ===
    "commit"
  ) {
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

    const spreadsheetId =
      typeof body.spreadsheetId ===
        "string"
        ? body.spreadsheetId
            .trim()
        : "";

    if (
      !displayName ||
      !spreadsheetId
    ) {
      return NextResponse.json(
        {
          error:
            "Finish preparing the Google Sheets destination first.",
        },
        {
          status: 400,
        }
      );
    }

    let sheetTitle =
      "Sheet1";

    let tableId:
      string | null =
      null;

    let headers:
      string[] =
      [];

    let columnKeys:
      string[] =
      [];

    let columnTypes:
      (
        | "DATE"
        | "TEXT"
      )[] =
      [];

    if (
      mode ===
      "create_new"
    ) {
      const file =
        await drive.files.get({
          fileId:
            spreadsheetId,

          fields:
            "id,appProperties",
        });

      const appProperties =
        file.data
          .appProperties ||
        {};

      if (
        appProperties
          .flowexCreated !==
          "true" ||
        appProperties
          .flowexUserId !==
          auth.user.id
      ) {
        return NextResponse.json(
          {
            error:
              "Flowex could not verify this created sheet.",
          },
          {
            status: 403,
          }
        );
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,

        requestBody: {
          requests: [
            {
              updateSpreadsheetProperties: {
                properties: {
                  title:
                    displayName,
                },

                fields:
                  "title",
              },
            },
          ],
        },
      });

      const meta =
        await getFirstSheetMeta(
          sheets,
          spreadsheetId
        );

      sheetTitle =
        meta.sheetTitle;

      headers =
        desiredColumns.map(
          (
            column
          ) =>
            column.header
        );

      columnKeys =
        desiredColumns.map(
          (
            column
          ) =>
            column.key
        );

      columnTypes =
        desiredColumns.map(
          (
            column
          ) =>
            column.columnType
        );

      await writeHeaders(
        sheets,
        spreadsheetId,
        sheetTitle,
        headers
      );

      const rows =
        await usedRowCount(
          sheets,
          spreadsheetId,
          sheetTitle
        );

      tableId =
        await createOrUpdateTable(
          sheets,
          spreadsheetId,
          meta.sheetId,
          meta.table
            ?.tableId ||
            null,
          `Flowex_${displayName}`,
          headers,
          columnTypes,
          rows
        );

      await polishSheet(
        sheets,
        spreadsheetId,
        meta.sheetId,
        headers,
        columnKeys
      );
    } else {
      const prepared =
        await prepareExisting(
          sheets,
          spreadsheetId,
          desiredColumns
        );

      sheetTitle =
        prepared.sheetTitle;

      headers =
        prepared.headers;

      columnKeys =
        prepared.columnKeys;

      columnTypes =
        prepared.columnTypes;

      await writeHeaders(
        sheets,
        spreadsheetId,
        sheetTitle,
        headers
      );

      const rows =
        await usedRowCount(
          sheets,
          spreadsheetId,
          sheetTitle
        );

      tableId =
        await createOrUpdateTable(
          sheets,
          spreadsheetId,
          prepared.sheetId,
          prepared.table
            ?.tableId ||
            null,
          prepared.table
            ?.name ||
            `Flowex_${displayName}`,
          headers,
          columnTypes,
          rows
        );

      await polishSheet(
        sheets,
        spreadsheetId,
        prepared.sheetId,
        headers,
        columnKeys
      );
    }

    const spreadsheetUrl =
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    const {
      error:
        destinationError,
    } =
      await auth.supabase
        .from(
          "lead_destinations"
        )
        .upsert(
          {
            user_id:
              auth.user.id,

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
                spreadsheetUrl,

              spreadsheet_id:
                spreadsheetId,

              spreadsheet_url:
                spreadsheetUrl,

              sheet_title:
                sheetTitle,

              table_id:
                tableId,

              headers,

              column_keys:
                columnKeys,

              google_email:
                connection
                  .provider_account_email ||
                null,

              created_by_flowex:
                mode ===
                "create_new",
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
            "The sheet is ready, but Flowex could not save this destination.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      saved:
        true,

      mode,

      spreadsheetId,

      spreadsheetUrl,

      tableId,

      sheetTitle,

      headers,

      columnKeys,
    });
  }

  return NextResponse.json(
    {
      error:
        "Unsupported Google Sheets action.",
    },
    {
      status: 400,
    }
  );
}