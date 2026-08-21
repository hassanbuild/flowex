"use client";

import {
  FormEvent,
  useState,
} from "react";

type FieldType =
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

export type PublicFlowexField = {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options: string[];
  countryCode?: string;
  allowCountryCodeSelection?: boolean;
};

type PublicFlowexFormProps = {
  publicKey: string;
  title: string;
  fields: PublicFlowexField[];
};

const phoneCountryCodes = [
  "+1","+7","+20","+27","+30","+31","+32","+33","+34","+36","+39","+40","+41","+43","+44","+45","+46","+47","+48","+49",
  "+51","+52","+53","+54","+55","+56","+57","+58","+60","+61","+62","+63","+64","+65","+66","+81","+82","+84","+86","+90",
  "+91","+92","+93","+94","+95","+98","+211","+212","+213","+216","+218","+220","+221","+222","+223","+224","+225","+226",
  "+227","+228","+229","+230","+231","+232","+233","+234","+235","+236","+237","+238","+240","+241","+242","+243","+244",
  "+245","+248","+249","+250","+251","+252","+253","+254","+255","+256","+257","+258","+260","+261","+263","+264","+265",
  "+266","+267","+268","+269","+291","+297","+298","+299","+350","+351","+352","+353","+354","+355","+356","+357","+358",
  "+359","+370","+371","+372","+373","+374","+375","+376","+377","+378","+380","+381","+382","+383","+385","+386","+387",
  "+389","+420","+421","+423","+500","+501","+502","+503","+504","+505","+506","+507","+508","+509","+590","+591","+592",
  "+593","+594","+595","+596","+597","+598","+599","+670","+672","+673","+674","+675","+676","+677","+678","+679","+680",
  "+681","+682","+683","+685","+686","+687","+688","+689","+690","+691","+692","+850","+852","+853","+855","+856","+880",
  "+886","+960","+961","+962","+963","+964","+965","+966","+967","+968","+970","+971","+972","+973","+974","+975","+976",
  "+977","+992","+993","+994","+995","+996","+998",
];

export default function PublicFlowexForm({
  publicKey,
  title,
  fields,
}: PublicFlowexFormProps) {
  const [submitMessage, setSubmitMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitSucceeded, setSubmitSucceeded] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const form =
      event.currentTarget;

    if (
      !form.reportValidity() ||
      isSubmitting
    ) {
      return;
    }

    if (!publicKey) {
      setSubmitSucceeded(false);
      setSubmitMessage(
        "This form is not connected to Flowex."
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitSucceeded(false);
    setSubmitMessage("");

    try {
      const formData =
        new FormData(form);

      const payload:
        Record<string, string> = {};

      for (
        const field of fields
      ) {
        const value =
          formData.get(field.id);

        if (
          typeof value !==
          "string"
        ) {
          continue;
        }

        if (
          field.type ===
          "phone"
        ) {
          const codeValue =
            formData.get(
              `${field.id}_country_code`
            );

          const code =
            typeof codeValue ===
              "string"
              ? codeValue.trim()
              : "";

          const number =
            value
              .replace(/\D/g, "")
              .trim();

          if (number) {
            payload[field.id] =
              `${code}${number}`;
          }

          continue;
        }

        const cleaned =
          value.trim();

        if (cleaned) {
          payload[field.id] =
            cleaned;
        }
      }

      const response =
        await fetch(
          `/api/intake/${encodeURIComponent(
            publicKey
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const result =
        await response.json()
          .catch(() => null);

      if (
        !response.ok ||
        result?.success !== true
      ) {
        setSubmitSucceeded(
          false
        );

        setSubmitMessage(
          result?.error ||
            "Flowex could not submit this form. Please try again."
        );

        return;
      }

      setSubmitSucceeded(true);
      setSubmitMessage(
        "Thanks — your response has been received."
      );

      form.reset();
    } catch {
      setSubmitSucceeded(false);
      setSubmitMessage(
        "Flowex could not submit this form. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-10 text-gray-900">
      <div className="mx-auto w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

        <h1 className="text-center text-2xl font-semibold">
          {title}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >
          {fields.map(
            (field) => (
              <PublicField
                key={field.id}
                field={field}
              />
            )
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit"}
          </button>
        </form>

        {submitMessage && (
          <p
            className={`mt-4 text-center text-sm ${
              submitSucceeded
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {submitMessage}
          </p>
        )}

      </div>
    </main>
  );
}

function PublicField({
  field,
}: {
  field: PublicFlowexField;
}) {
  const label = (
    <label
      htmlFor={field.id}
      className="mb-1.5 block text-sm font-medium text-gray-800"
    >
      {field.label}

      {field.required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>
  );

  const commonClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-100";

  if (
    field.type === "long_text"
  ) {
    return (
      <div>
        {label}

        <textarea
          id={field.id}
          name={field.id}
          rows={4}
          required={field.required}
          maxLength={2000}
          className={`${commonClass} resize-y`}
        />
      </div>
    );
  }

  if (
    field.type === "dropdown"
  ) {
    return (
      <div>
        {label}

        <select
          id={field.id}
          name={field.id}
          required={field.required}
          defaultValue=""
          className={commonClass}
        >
          <option
            value=""
            disabled
          >
            Select
          </option>

          {field.options
            .filter(
              (option) =>
                option.trim()
            )
            .map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
        </select>
      </div>
    );
  }

  if (
    field.type === "phone"
  ) {
    const allowCountryCodeSelection =
      field.allowCountryCodeSelection ??
      true;

    const defaultCode =
      field.countryCode ||
      "+92";

    return (
      <div>
        {label}

        <div className="flex gap-2">

          {allowCountryCodeSelection ? (
            <select
              name={`${field.id}_country_code`}
              defaultValue={defaultCode}
              className="w-[92px] rounded-lg border border-gray-300 bg-white px-2 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
            >
              {phoneCountryCodes.map(
                (code) => (
                  <option
                    key={code}
                    value={code}
                  >
                    {code}
                  </option>
                )
              )}
            </select>
          ) : (
            <>
              <div className="flex w-[92px] items-center justify-center rounded-lg border border-gray-300 bg-gray-50 px-2 text-sm font-medium text-gray-700">
                {defaultCode}
              </div>

              <input
                type="hidden"
                name={`${field.id}_country_code`}
                value={defaultCode}
              />
            </>
          )}

          <input
            id={field.id}
            name={field.id}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{7,15}"
            minLength={7}
            maxLength={15}
            required={field.required}
            placeholder="3001234567"
            onInput={(
              event
            ) => {
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
      {label}

      <input
        id={field.id}
        name={field.id}
        type={inputType}
        inputMode={
          field.type ===
          "number"
            ? "decimal"
            : undefined
        }
        step={
          field.type ===
          "number"
            ? "any"
            : undefined
        }
        pattern={
          field.type ===
          "website"
            ? "https?://.+"
            : undefined
        }
        required={field.required}
        maxLength={
          field.type ===
            "short_text"
            ? 300
            : undefined
        }
        placeholder={
          field.type ===
          "website"
            ? "https://example.com"
            : undefined
        }
        className={commonClass}
      />
    </div>
  );
}