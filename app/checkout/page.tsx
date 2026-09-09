"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppAccount } from "@/components/AppAccountProvider";
import { createClient } from "@/lib/supabase/client";

type BillingInterval = "monthly" | "annual";

const COUNTRIES = [{"name":"Afghanistan","iso":"AF","dial":"+93"},{"name":"Åland Islands","iso":"AX","dial":"+358"},{"name":"Albania","iso":"AL","dial":"+355"},{"name":"Algeria","iso":"DZ","dial":"+213"},{"name":"American Samoa","iso":"AS","dial":"+1684"},{"name":"Angola","iso":"AO","dial":"+244"},{"name":"Anguilla","iso":"AI","dial":"+1264"},{"name":"Antigua and Barbuda","iso":"AG","dial":"+1268"},{"name":"Argentina","iso":"AR","dial":"+54"},{"name":"Armenia","iso":"AM","dial":"+374"},{"name":"Aruba","iso":"AW","dial":"+297"},{"name":"Australia","iso":"AU","dial":"+61"},{"name":"Austria","iso":"AT","dial":"+43"},{"name":"Azerbaijan","iso":"AZ","dial":"+994"},{"name":"Bahrain","iso":"BH","dial":"+973"},{"name":"Bangladesh","iso":"BD","dial":"+880"},{"name":"Barbados","iso":"BB","dial":"+1246"},{"name":"Belarus","iso":"BY","dial":"+375"},{"name":"Belgium","iso":"BE","dial":"+32"},{"name":"Belize","iso":"BZ","dial":"+501"},{"name":"Benin","iso":"BJ","dial":"+229"},{"name":"Bermuda","iso":"BM","dial":"+1441"},{"name":"Bhutan","iso":"BT","dial":"+975"},{"name":"Bolivia","iso":"BO","dial":"+591"},{"name":"Bosnia and Herzegovina","iso":"BA","dial":"+387"},{"name":"Botswana","iso":"BW","dial":"+267"},{"name":"Brazil","iso":"BR","dial":"+55"},{"name":"British Indian Ocean Territory","iso":"IO","dial":"+246"},{"name":"Brunei","iso":"BN","dial":"+673"},{"name":"Bulgaria","iso":"BG","dial":"+359"},{"name":"Burkina Faso","iso":"BF","dial":"+226"},{"name":"Burundi","iso":"BI","dial":"+257"},{"name":"Cambodia","iso":"KH","dial":"+855"},{"name":"Cameroon","iso":"CM","dial":"+237"},{"name":"Canada","iso":"CA","dial":"+1"},{"name":"Cape Verde","iso":"CV","dial":"+238"},{"name":"Cayman Islands","iso":"KY","dial":"+1345"},{"name":"Central African Republic","iso":"CF","dial":"+236"},{"name":"Chad","iso":"TD","dial":"+235"},{"name":"Chile","iso":"CL","dial":"+56"},{"name":"China","iso":"CN","dial":"+86"},{"name":"Christmas Island","iso":"CX","dial":"+61"},{"name":"Cocos (Keeling) Islands","iso":"CC","dial":"+61"},{"name":"Colombia","iso":"CO","dial":"+57"},{"name":"Comoros","iso":"KM","dial":"+269"},{"name":"Cook Islands","iso":"CK","dial":"+682"},{"name":"Costa Rica","iso":"CR","dial":"+506"},{"name":"Croatia","iso":"HR","dial":"+385"},{"name":"Curaçao","iso":"CW","dial":"+599"},{"name":"Cuba","iso":"CU","dial":"+53"},{"name":"Cyprus","iso":"CY","dial":"+357"},{"name":"Czech Republic","iso":"CZ","dial":"+420"},{"name":"Democratic Republic of the Congo","iso":"CD","dial":"+243"},{"name":"Denmark","iso":"DK","dial":"+45"},{"name":"Djibouti","iso":"DJ","dial":"+253"},{"name":"Dominica","iso":"DM","dial":"+1767"},{"name":"Dominican Republic","iso":"DO","dial":"+1809"},{"name":"East Timor","iso":"TL","dial":"+670"},{"name":"Ecuador","iso":"EC","dial":"+593"},{"name":"Egypt","iso":"EG","dial":"+20"},{"name":"El Salvador","iso":"SV","dial":"+503"},{"name":"Equatorial Guinea","iso":"GQ","dial":"+240"},{"name":"Eritrea","iso":"ER","dial":"+291"},{"name":"Estonia","iso":"EE","dial":"+372"},{"name":"Ethiopia","iso":"ET","dial":"+251"},{"name":"Falkland Islands","iso":"FK","dial":"+500"},{"name":"Faroe Islands","iso":"FO","dial":"+298"},{"name":"Federated States of Micronesia","iso":"FM","dial":"+691"},{"name":"Fiji","iso":"FJ","dial":"+679"},{"name":"Finland","iso":"FI","dial":"+358"},{"name":"France","iso":"FR","dial":"+33"},{"name":"French Guiana","iso":"GF","dial":"+594"},{"name":"French Polynesia","iso":"PF","dial":"+689"},{"name":"Gabon","iso":"GA","dial":"+241"},{"name":"Georgia","iso":"GE","dial":"+995"},{"name":"Germany","iso":"DE","dial":"+49"},{"name":"Ghana","iso":"GH","dial":"+233"},{"name":"Gibraltar","iso":"GI","dial":"+350"},{"name":"Greece","iso":"GR","dial":"+30"},{"name":"Greenland","iso":"GL","dial":"+299"},{"name":"Grenada","iso":"GD","dial":"+1473"},{"name":"Guadeloupe","iso":"GP","dial":"+590"},{"name":"Guam","iso":"GU","dial":"+1671"},{"name":"Guatemala","iso":"GT","dial":"+502"},{"name":"Guernsey","iso":"GG","dial":"+44"},{"name":"Guinea","iso":"GN","dial":"+224"},{"name":"Guinea-Bissau","iso":"GW","dial":"+245"},{"name":"Guyana","iso":"GY","dial":"+592"},{"name":"Haiti","iso":"HT","dial":"+509"},{"name":"Honduras","iso":"HN","dial":"+504"},{"name":"Hong Kong","iso":"HK","dial":"+852"},{"name":"Hungary","iso":"HU","dial":"+36"},{"name":"Iceland","iso":"IS","dial":"+354"},{"name":"India","iso":"IN","dial":"+91"},{"name":"Indonesia","iso":"ID","dial":"+62"},{"name":"Iran","iso":"IR","dial":"+98"},{"name":"Iraq","iso":"IQ","dial":"+964"},{"name":"Ireland","iso":"IE","dial":"+353"},{"name":"Isle of Man","iso":"IM","dial":"+44"},{"name":"Israel","iso":"IL","dial":"+972"},{"name":"Italy","iso":"IT","dial":"+39"},{"name":"Ivory Coast","iso":"CI","dial":"+225"},{"name":"Jamaica","iso":"JM","dial":"+1876"},{"name":"Japan","iso":"JP","dial":"+81"},{"name":"Jersey","iso":"JE","dial":"+44"},{"name":"Jordan","iso":"JO","dial":"+962"},{"name":"Kazakhstan","iso":"KZ","dial":"+7"},{"name":"Kenya","iso":"KE","dial":"+254"},{"name":"Kiribati","iso":"KI","dial":"+686"},{"name":"Kosovo","iso":"XK","dial":"+383"},{"name":"Kuwait","iso":"KW","dial":"+965"},{"name":"Kyrgyzstan","iso":"KG","dial":"+996"},{"name":"Laos","iso":"LA","dial":"+856"},{"name":"Latvia","iso":"LV","dial":"+371"},{"name":"Lebanon","iso":"LB","dial":"+961"},{"name":"Lesotho","iso":"LS","dial":"+266"},{"name":"Liberia","iso":"LR","dial":"+231"},{"name":"Libya","iso":"LY","dial":"+218"},{"name":"Liechtenstein","iso":"LI","dial":"+423"},{"name":"Lithuania","iso":"LT","dial":"+370"},{"name":"Luxembourg","iso":"LU","dial":"+352"},{"name":"Macau","iso":"MO","dial":"+853"},{"name":"Madagascar","iso":"MG","dial":"+261"},{"name":"Malawi","iso":"MW","dial":"+265"},{"name":"Malaysia","iso":"MY","dial":"+60"},{"name":"Maldives","iso":"MV","dial":"+960"},{"name":"Mali","iso":"ML","dial":"+223"},{"name":"Malta","iso":"MT","dial":"+356"},{"name":"Marshall Islands","iso":"MH","dial":"+692"},{"name":"Martinique","iso":"MQ","dial":"+596"},{"name":"Mauritania","iso":"MR","dial":"+222"},{"name":"Mauritius","iso":"MU","dial":"+230"},{"name":"Mayotte","iso":"YT","dial":"+262"},{"name":"Mexico","iso":"MX","dial":"+52"},{"name":"Moldova","iso":"MD","dial":"+373"},{"name":"Monaco","iso":"MC","dial":"+377"},{"name":"Mongolia","iso":"MN","dial":"+976"},{"name":"Montserrat","iso":"MS","dial":"+1664"},{"name":"Morocco","iso":"MA","dial":"+212"},{"name":"Mozambique","iso":"MZ","dial":"+258"},{"name":"Myanmar","iso":"MM","dial":"+95"},{"name":"Namibia","iso":"NA","dial":"+264"},{"name":"Nauru","iso":"NR","dial":"+674"},{"name":"Nepal","iso":"NP","dial":"+977"},{"name":"Netherlands","iso":"NL","dial":"+31"},{"name":"New Caledonia","iso":"NC","dial":"+687"},{"name":"New Zealand","iso":"NZ","dial":"+64"},{"name":"Nicaragua","iso":"NI","dial":"+505"},{"name":"Niger","iso":"NE","dial":"+227"},{"name":"Nigeria","iso":"NG","dial":"+234"},{"name":"Niue","iso":"NU","dial":"+683"},{"name":"Norfolk Island","iso":"NF","dial":"+672"},{"name":"North Korea","iso":"KP","dial":"+850"},{"name":"Northern Mariana Islands","iso":"MP","dial":"+1670"},{"name":"Norway","iso":"NO","dial":"+47"},{"name":"Oman","iso":"OM","dial":"+968"},{"name":"Pakistan","iso":"PK","dial":"+92"},{"name":"Palau","iso":"PW","dial":"+680"},{"name":"Palestine","iso":"PS","dial":"+970"},{"name":"Panama","iso":"PA","dial":"+507"},{"name":"Papua New Guinea","iso":"PG","dial":"+675"},{"name":"Paraguay","iso":"PY","dial":"+595"},{"name":"Peru","iso":"PE","dial":"+51"},{"name":"Philippines","iso":"PH","dial":"+63"},{"name":"Pitcairn Islands","iso":"PN","dial":"+64"},{"name":"Poland","iso":"PL","dial":"+48"},{"name":"Portugal","iso":"PT","dial":"+351"},{"name":"Puerto Rico","iso":"PR","dial":"+1787"},{"name":"Qatar","iso":"QA","dial":"+974"},{"name":"Republic of Macedonia","iso":"MK","dial":"+389"},{"name":"Republic of the Congo","iso":"CG","dial":"+242"},{"name":"Romania","iso":"RO","dial":"+40"},{"name":"Russia","iso":"RU","dial":"+7"},{"name":"Rwanda","iso":"RW","dial":"+250"},{"name":"Réunion","iso":"RE","dial":"+262"},{"name":"Saint Barthélemy","iso":"BL","dial":"+590"},{"name":"Saint Helena","iso":"SH","dial":"+290"},{"name":"Saint Kitts and Nevis","iso":"KN","dial":"+1869"},{"name":"Saint Lucia","iso":"LC","dial":"+1758"},{"name":"Saint Martin","iso":"MF","dial":"+590"},{"name":"Saint Pierre and Miquelon","iso":"PM","dial":"+508"},{"name":"Saint Vincent and the Grenadines","iso":"VC","dial":"+1784"},{"name":"Samoa","iso":"WS","dial":"+685"},{"name":"San Marino","iso":"SM","dial":"+378"},{"name":"Saudi Arabia","iso":"SA","dial":"+966"},{"name":"Senegal","iso":"SN","dial":"+221"},{"name":"Serbia","iso":"RS","dial":"+381"},{"name":"Seychelles","iso":"SC","dial":"+248"},{"name":"Sierra Leone","iso":"SL","dial":"+232"},{"name":"Singapore","iso":"SG","dial":"+65"},{"name":"Sint Maarten","iso":"SX","dial":"+1721"},{"name":"Slovakia","iso":"SK","dial":"+421"},{"name":"Slovenia","iso":"SI","dial":"+386"},{"name":"Solomon Islands","iso":"SB","dial":"+677"},{"name":"Somalia","iso":"SO","dial":"+252"},{"name":"South Africa","iso":"ZA","dial":"+27"},{"name":"South Georgia","iso":"GS","dial":"+500"},{"name":"South Korea","iso":"KR","dial":"+82"},{"name":"South Sudan","iso":"SS","dial":"+211"},{"name":"Spain","iso":"ES","dial":"+34"},{"name":"Sri Lanka","iso":"LK","dial":"+94"},{"name":"Sudan","iso":"SD","dial":"+249"},{"name":"Suriname","iso":"SR","dial":"+597"},{"name":"Svalbard and Jan Mayen","iso":"SJ","dial":"+47"},{"name":"Swaziland","iso":"SZ","dial":"+268"},{"name":"Sweden","iso":"SE","dial":"+46"},{"name":"Switzerland","iso":"CH","dial":"+41"},{"name":"Syria","iso":"SY","dial":"+963"},{"name":"São Tomé and Príncipe","iso":"ST","dial":"+239"},{"name":"Taiwan","iso":"TW","dial":"+886"},{"name":"Tajikistan","iso":"TJ","dial":"+992"},{"name":"Tanzania","iso":"TZ","dial":"+255"},{"name":"Thailand","iso":"TH","dial":"+66"},{"name":"The Bahamas","iso":"BS","dial":"+1242"},{"name":"The Gambia","iso":"GM","dial":"+220"},{"name":"Togo","iso":"TG","dial":"+228"},{"name":"Tokelau","iso":"TK","dial":"+690"},{"name":"Tonga","iso":"TO","dial":"+676"},{"name":"Trinidad and Tobago","iso":"TT","dial":"+1868"},{"name":"Tunisia","iso":"TN","dial":"+216"},{"name":"Turkey","iso":"TR","dial":"+90"},{"name":"Turkmenistan","iso":"TM","dial":"+993"},{"name":"Turks and Caicos Islands","iso":"TC","dial":"+1649"},{"name":"Tuvalu","iso":"TV","dial":"+688"},{"name":"U.S. Virgin Islands","iso":"VI","dial":"+1340"},{"name":"Uganda","iso":"UG","dial":"+256"},{"name":"Ukraine","iso":"UA","dial":"+380"},{"name":"United Arab Emirates","iso":"AE","dial":"+971"},{"name":"United Kingdom","iso":"GB","dial":"+44"},{"name":"United States","iso":"US","dial":"+1"},{"name":"Uruguay","iso":"UY","dial":"+598"},{"name":"Uzbekistan","iso":"UZ","dial":"+998"},{"name":"Vatican City","iso":"VA","dial":"+39"},{"name":"Vanuatu","iso":"VU","dial":"+678"},{"name":"Venezuela","iso":"VE","dial":"+58"},{"name":"Vietnam","iso":"VN","dial":"+84"},{"name":"Wallis and Futuna","iso":"WF","dial":"+681"},{"name":"Western Sahara","iso":"EH","dial":"+212"},{"name":"Yemen","iso":"YE","dial":"+967"},{"name":"Zambia","iso":"ZM","dial":"+260"},{"name":"Zimbabwe","iso":"ZW","dial":"+263"}] as const;

type CheckoutDraft = {
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  country: string;
  company: string;
  acceptedTerms: boolean;
};

const CHECKOUT_DRAFT_KEY =
  "flowex-checkout-draft";

const AUTH_RETURN_KEY =
  "flowex-auth-return-to";

export default function CheckoutPage() {
  const router = useRouter();

  const {
    isLoggedIn,
    authReady,
    plan,
    name,
    email: accountEmail,
  } = useAppAccount();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [phoneCountry, setPhoneCountry] =
    useState("PK");

  const [country, setCountry] =
    useState("");

  const [company, setCompany] =
    useState("");

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [draftLoaded, setDraftLoaded] =
    useState(false);

  const [showAuthChoice, setShowAuthChoice] =
    useState(false);

  const [checkoutError, setCheckoutError] =
    useState("");

  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  const [isRedirecting, setIsRedirecting] =
    useState(false);

  const isTrial =
    plan === "trial";

  const isPro =
    plan === "pro";

  /*
    ================= LOAD CHECKOUT DRAFT =================

    Guest users may fill checkout before creating
    or logging into their Flowex account.

    We restore everything except payment-card data.
  */

  useEffect(() => {
    if (!authReady) return;

    const savedDraft =
      sessionStorage.getItem(
        CHECKOUT_DRAFT_KEY
      );

    if (savedDraft) {
      try {
        const draft =
          JSON.parse(
            savedDraft
          ) as CheckoutDraft;

        setFullName(
          draft.fullName || ""
        );

        setEmail(
          isLoggedIn
            ? accountEmail
            : draft.email || ""
        );

        setPhone(
          draft.phone || ""
        );

        setPhoneCountry(
          draft.phoneCountry || draft.country || "PK"
        );

        setCountry(
          draft.country || ""
        );

        setCompany(
          draft.company || ""
        );

        setAcceptedTerms(
          draft.acceptedTerms || false
        );
      } catch {
        sessionStorage.removeItem(
          CHECKOUT_DRAFT_KEY
        );
      }
    } else if (isLoggedIn) {
      setFullName(name || "");
      setEmail(accountEmail || "");
    }

    setDraftLoaded(true);
  }, [
    authReady,
    isLoggedIn,
    name,
    accountEmail,
  ]);

  /*
    If authentication happened after a guest
    prepared checkout, always use the authenticated
    Flowex email address.
  */

  useEffect(() => {
    if (
      authReady &&
      isLoggedIn &&
      accountEmail
    ) {
      setEmail(accountEmail);
    }
  }, [
    authReady,
    isLoggedIn,
    accountEmail,
  ]);

  /*
    ================= CLEAR AUTH RETURN =================

    Once Checkout has finished loading in this tab,
    the temporary auth return destination is no longer
    needed.

    Keep the checkout draft itself until the order is
    actually completed or intentionally abandoned.
  */

  useEffect(() => {
    if (
      !authReady ||
      !draftLoaded
    ) {
      return;
    }

    sessionStorage.removeItem(
      AUTH_RETURN_KEY
    );
  }, [
    authReady,
    draftLoaded,
  ]);

  const saveDraft = () => {
    const draft: CheckoutDraft = {
      fullName,
      email,
      phone,
      phoneCountry,
      country,
      company,
      acceptedTerms,
    };

    sessionStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      JSON.stringify(draft)
    );
  };

  const continueToAuth = (
    route: "login" | "signup"
  ) => {
    saveDraft();

    sessionStorage.setItem(
      AUTH_RETURN_KEY,
      "/checkout"
    );

    router.push(
      `/${route}?returnTo=${encodeURIComponent(
        "/checkout"
      )}`
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setCheckoutError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !phoneCountry ||
      !country.trim()
    ) {
      setCheckoutError(
        "Please complete the required billing information."
      );
      return;
    }

    if (!acceptedTerms) {
      setCheckoutError(
        "Please accept the subscription terms before continuing."
      );
      return;
    }

    if (!isLoggedIn) {
      saveDraft();
      setShowAuthChoice(true);
      return;
    }

    if (isTrial || isPro) {
      router.push("/billing");
      return;
    }

    try {
      setIsRedirecting(true);

      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setCheckoutError(
          "Your session could not be verified. Please log in again."
        );
        setIsRedirecting(false);
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          interval: billingInterval,
          fullName: fullName.trim(),
          phone: `${COUNTRIES.find((item) => item.iso === phoneCountry)?.dial || ""}${phone.trim()}`.replace(/\s+/g, ""),
          country,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.url) {
        setCheckoutError(
          result?.error ||
            "Could not start secure checkout. Please try again."
        );
        setIsRedirecting(false);
        return;
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("Flowex checkout error:", error);

      setCheckoutError(
        "Could not start secure checkout. Please try again."
      );
      setIsRedirecting(false);
    }
  };

  /*
    Avoid rendering checkout before Supabase has
    resolved the user's authentication state.
  */

  if (
    !authReady ||
    !draftLoaded
  ) {
    return (
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f14] app-dark:bg-[#0b0f14]" />
    );
  }

  const darkMain =
    isLoggedIn
      ? "app-dark:bg-[#0b0f14] app-dark:text-slate-100"
      : "dark:bg-[#0b0f14] dark:text-slate-100";

  const darkHeader =
    isLoggedIn
      ? "app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
      : "dark:border-slate-800/80 dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]";

  const darkCard =
    isLoggedIn
      ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
      : "dark:border-slate-800 dark:bg-[#11161d]";

  const darkInput =
    isLoggedIn
      ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500"
      : "dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white dark:placeholder:text-slate-500";

  const darkMuted =
    isLoggedIn
      ? "app-dark:text-slate-400"
      : "dark:text-slate-400";

  const darkTitle =
    isLoggedIn
      ? "app-dark:text-white"
      : "dark:text-white";

  const backPath =
    !isLoggedIn
      ? "/"
      : plan === "free"
        ? "/home"
        : "/dashboard";

  return (
    <main
      className={`min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 ${darkMain}`}
    >

      {/* ================= HEADER ================= */}

      <header
        className={`border-b border-gray-200/70 bg-white/90 backdrop-blur-xl ${darkHeader}`}
      >

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link href={backPath}>

            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />

          </Link>

          <div className="flex items-center gap-4">

            <div
              className={`hidden items-center gap-2 text-sm font-medium text-gray-500 sm:flex ${darkMuted}`}
            >
              <span>
                🔒
              </span>

              Secure Checkout
            </div>

            <Link
              href={backPath}
              className={`rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 ${
                isLoggedIn
                  ? "app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                  : "dark:border-slate-700 dark:bg-[#11161d] dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Back
            </Link>

          </div>

        </div>

      </header>

      {/* ================= CHECKOUT ================= */}

      <section className="px-4 py-6 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="mb-5">

            <p className="text-sm font-semibold text-emerald-600">
              CHECKOUT
            </p>

            <h1
              className={`mt-1 text-3xl font-black sm:text-[34px] ${darkTitle}`}
            >
              Complete your order.
            </h1>

            <p
              className={`mt-1.5 text-sm text-gray-500 ${darkMuted}`}
            >
              Start your Flowex Pro trial and automate your lead workflow.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid items-start gap-5 lg:grid-cols-[1.32fr_0.68fr]"
          >

            {/* ================= LEFT ================= */}

            <div className="space-y-4">

              {/* PLAN */}

              <div
                className={`rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${darkCard}`}
              >

                <div>

                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    Step 1
                  </p>

                  <h2
                    className={`mt-1.5 text-lg font-bold ${darkTitle}`}
                  >
                    Choose your plan
                  </h2>

                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setBillingInterval("monthly")}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      billingInterval === "monthly"
                        ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 app-dark:bg-emerald-500/5"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-[#11161d] app-dark:border-slate-700 app-dark:bg-[#11161d]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-lg font-bold ${darkTitle}`}>
                            Monthly
                          </h3>
                          <span className="rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 px-3 py-1 text-[11px] font-bold text-white">
                            LAUNCH
                          </span>
                        </div>
                        <p className={`mt-1 text-xs text-gray-500 ${darkMuted}`}>
                          Flowex Pro · 7-day free trial
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm text-gray-400 line-through">$25</p>
                        <p className={`text-2xl font-black ${darkTitle}`}>$15</p>
                        <p className={`text-xs text-gray-500 ${darkMuted}`}>/month</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingInterval("annual")}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      billingInterval === "annual"
                        ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 app-dark:bg-emerald-500/5"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-[#11161d] app-dark:border-slate-700 app-dark:bg-[#11161d]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-lg font-bold ${darkTitle}`}>
                            Annual
                          </h3>
                          <span className="rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 px-3 py-1 text-[11px] font-bold text-white">
                            BEST VALUE
                          </span>
                        </div>
                        <p className={`mt-1 text-xs text-gray-500 ${darkMuted}`}>
                          $120 billed annually · 7-day free trial
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm text-gray-400 line-through">$25</p>
                        <p className={`text-2xl font-black ${darkTitle}`}>$10</p>
                        <p className={`text-xs text-gray-500 ${darkMuted}`}>/month</p>
                      </div>
                    </div>
                  </button>
                </div>

              </div>

              {/* INFORMATION */}

              <div
                className={`rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${darkCard}`}
              >

                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  Step 2
                </p>

                <h2
                  className={`mt-1.5 text-lg font-bold ${darkTitle}`}
                >
                  Your information
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <div>

                    <label htmlFor="checkout-full-name" className="text-sm font-semibold">
                      Full name
                    </label>

                    <input
                      id="checkout-full-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      placeholder="Your name"
                      required
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${darkInput}`}
                    />

                  </div>

                  <div>

                    <label htmlFor="checkout-email" className="text-sm font-semibold">
                      Email
                    </label>

                    <input
                      id="checkout-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      readOnly={isLoggedIn}
                      placeholder="you@company.com"
                      required
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 read-only:cursor-default read-only:opacity-70 ${darkInput}`}
                    />

                  </div>

                  <div>

                    <label htmlFor="checkout-phone" className="text-sm font-semibold">
                      Phone
                    </label>

                    <div className="mt-1.5 flex overflow-hidden rounded-xl border border-gray-200 bg-white transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
                      <select
                        id="checkout-phone-country"
                        name="phoneCountry"
                        aria-label="Phone country code"
                        value={phoneCountry}
                        onChange={(event) => setPhoneCountry(event.target.value)}
                        required
                        className={`max-w-[145px] border-0 border-r border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ${darkInput}`}
                      >
                        {COUNTRIES.map((item) => (
                          <option key={item.iso} value={item.iso}>
                            {item.iso} {item.dial}
                          </option>
                        ))}
                      </select>

                      <input
                        id="checkout-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(event) =>
                          setPhone(event.target.value.replace(/[^0-9 ()-]/g, ""))
                        }
                        placeholder="300 1234567"
                        required
                        className={`min-w-0 flex-1 border-0 bg-white px-4 py-2.5 text-sm outline-none ${darkInput}`}
                      />
                    </div>

                  </div>

                  <div>

                    <label htmlFor="checkout-country" className="text-sm font-semibold">
                      Country / region
                    </label>

                    <select
                      id="checkout-country"
                      name="country"
                      autoComplete="country"
                      value={country}
                      onChange={(event) => {
                        const nextCountry = event.target.value;
                        setCountry(nextCountry);
                        setPhoneCountry(nextCountry);
                      }}
                      required
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${darkInput}`}
                    >
                      <option value="" disabled>Select country / region</option>
                      {COUNTRIES.map((item) => (
                        <option key={item.iso} value={item.iso}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                  </div>

                </div>

                <div className="mt-4">

                  <label htmlFor="checkout-company" className="text-sm font-semibold">
                    Company
                    <span className="ml-1 font-normal text-gray-400">
                      optional
                    </span>
                  </label>

                  <input
                    id="checkout-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={company}
                    onChange={(event) =>
                      setCompany(
                        event.target.value
                      )
                    }
                    placeholder="Company name"
                    className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${darkInput}`}
                  />

                </div>

              </div>

              {/* PAYMENT */}

              <div
                className={`rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${darkCard}`}
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      Step 3
                    </p>

                    <h2
                      className={`mt-1.5 text-lg font-bold ${darkTitle}`}
                    >
                      Payment method
                    </h2>

                  </div>

                  <div
                    className={`rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 ${
                      isLoggedIn
                        ? "app-dark:border-slate-700 app-dark:text-slate-400"
                        : "dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    🔒 Secure
                  </div>

                </div>

                <div className="mt-4 rounded-2xl border-2 border-emerald-400 p-4">

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-500">

                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                      </div>

                      <div>

                        <p
                          className={`font-semibold ${darkTitle}`}
                        >
                          Credit or Debit Card
                        </p>

                        <p
                          className={`mt-1 text-xs text-gray-400 ${darkMuted}`}
                        >
                          Visa, Mastercard and supported cards
                        </p>

                      </div>

                    </div>

                    <span className="text-xl">
                      💳
                    </span>

                  </div>

                </div>

                {/* LEMON SQUEEZY HOSTED CHECKOUT */}

                <div
                  className={`mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 ${
                    isLoggedIn
                      ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14]"
                      : "dark:border-slate-700 dark:bg-[#0b0f14]"
                  }`}
                >
                  <p className={`text-sm font-semibold ${darkTitle}`}>
                    Payment details are entered securely on Lemon Squeezy.
                  </p>
                  <p className={`mt-1.5 text-xs leading-5 text-gray-400 ${darkMuted}`}>
                    After you continue, you&apos;ll be redirected to the secure checkout to add your card. Flowex does not store raw card details.
                  </p>
                </div>

              </div>

              {/* TERMS */}

              <div
                className={`rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${darkCard}`}
              >

                <label className="flex cursor-pointer items-start gap-2.5">

                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) =>
                      setAcceptedTerms(
                        event.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 cursor-pointer accent-[#4b52f7]"
                  />

                  <span
                    className={`text-xs leading-5 text-gray-500 ${darkMuted}`}
                  >
                    I agree to the{" "}

                    <Link
                      href="/terms"
                      target="_blank"
                      className="font-semibold text-[#4b52f7] hover:underline"
                    >
                      Terms of Service
                    </Link>

                    ,{" "}

                    <Link
                      href="/privacy"
                      target="_blank"
                      className="font-semibold text-[#4b52f7] hover:underline"
                    >
                      Privacy Policy
                    </Link>

                    , and authorize Flowex to charge{" "}
                    {billingInterval === "monthly"
                      ? "$15/month"
                      : "$120/year"}{" "}
                    after my 7-day free trial unless I cancel beforehand.
                  </span>

                </label>

                {checkoutError && (

                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400">
                    {checkoutError}
                  </div>

                )}

              </div>

            </div>

            {/* ================= SUMMARY ================= */}

            <aside className="lg:sticky lg:top-4">

              <div
                className={`rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-6 ${darkCard}`}
              >

                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  Order Summary
                </p>

                <div className="mt-4 flex items-start justify-between gap-4">

                  <div>

                    <h2
                      className={`text-lg font-black ${darkTitle}`}
                    >
                      Flowex Pro
                    </h2>

                    <p
                      className={`mt-1 text-xs leading-5 text-gray-500 ${darkMuted}`}
                    >
                      {billingInterval === "monthly"
                        ? "Monthly subscription"
                        : "Annual subscription"}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-sm text-gray-400 line-through">
                      $25
                    </p>

                    <p
                      className={`text-2xl font-black ${darkTitle}`}
                    >
                      {billingInterval === "monthly" ? "$15" : "$10"}
                    </p>

                    <p
                      className={`text-xs text-gray-400 ${darkMuted}`}
                    >
                      /month
                    </p>

                  </div>

                </div>

                <div
                  className={`my-4 h-px bg-gray-100 ${
                    isLoggedIn
                      ? "app-dark:bg-slate-800"
                      : "dark:bg-slate-800"
                  }`}
                />

                <div className="space-y-2.5 text-sm">

                  <div className="flex items-center justify-between">

                    <span
                      className={`text-gray-500 ${darkMuted}`}
                    >
                      7-Day Free Trial
                    </span>

                    <span className="font-semibold text-emerald-600">
                      Included
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span
                      className={`text-gray-500 ${darkMuted}`}
                    >
                      Due today
                    </span>

                    <span
                      className={`font-bold ${darkTitle}`}
                    >
                      $0.00
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span
                      className={`text-gray-500 ${darkMuted}`}
                    >
                      After trial
                    </span>

                    <span
                      className={`font-bold ${darkTitle}`}
                    >
                      {billingInterval === "monthly"
                        ? "$15/month"
                        : "$120/year"}
                    </span>

                  </div>

                </div>

                <div
                  className={`my-4 h-px bg-gray-100 ${
                    isLoggedIn
                      ? "app-dark:bg-slate-800"
                      : "dark:bg-slate-800"
                  }`}
                />

                <div
                  className={`grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-1 ${darkMuted}`}
                >

                  <p>
                    ✓ Unlimited Leads
                  </p>

                  <p>
                    ✓ Instant Customer Replies
                  </p>

                  <p>
                    ✓ Lead Storage & Integrations
                  </p>

                  <p>
                    ✓ Team Notifications
                  </p>

                  <p>
                    ✓ Automatic Follow-Ups
                  </p>

                  <p>
                    ✓ Live Dashboard
                  </p>

                </div>

                <div
                  className={`my-4 h-px bg-gray-100 ${
                    isLoggedIn
                      ? "app-dark:bg-slate-800"
                      : "dark:bg-slate-800"
                  }`}
                />

                {isTrial ? (

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-500 transition dark:bg-slate-800 dark:text-slate-300 app-dark:bg-slate-800 app-dark:text-slate-300"
                  >
                    Trial Already Active
                  </button>

                ) : isPro ? (

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-500 transition dark:bg-slate-800 dark:text-slate-300 app-dark:bg-slate-800 app-dark:text-slate-300"
                  >
                    Manage Current Plan
                  </button>

                ) : (

                  <button
                    type="submit"
                    disabled={isRedirecting}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRedirecting
                      ? "Opening Secure Checkout..."
                      : isLoggedIn
                        ? "Start 7-Day Free Trial"
                        : "Proceed"}
                  </button>

                )}

                <p
                  className={`mt-3 text-center text-xs leading-5 text-gray-400 ${darkMuted}`}
                >
                  You won&apos;t be charged today.
                  Cancel anytime before your trial ends.
                </p>

                <div
                  className={`mt-3 rounded-xl bg-gray-50 p-2.5 text-center text-xs text-gray-400 ${
                    isLoggedIn
                      ? "app-dark:bg-[#0b0f14] app-dark:text-slate-500"
                      : "dark:bg-[#0b0f14] dark:text-slate-500"
                  }`}
                >
                  🔒 Secure checkout
                </div>

              </div>

            </aside>

          </form>

        </div>

      </section>

      {/* ================= AUTH CHOICE ================= */}

      {showAuthChoice && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">

          <div
            className={`w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 text-center shadow-2xl ${darkCard}`}
          >

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 text-xl text-white">
              🔒
            </div>

            <h2
              className={`mt-4 text-2xl font-black ${darkTitle}`}
            >
              Continue with Flowex
            </h2>

            <p
              className={`mt-2 text-sm leading-6 text-gray-500 ${darkMuted}`}
            >
              Your checkout details are saved. Log in or create an account to continue your order.
            </p>

            <div className="mt-5 grid gap-3">

              <button
                type="button"
                onClick={() =>
                  continueToAuth("login")
                }
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3 text-sm font-bold text-white shadow-md"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() =>
                  continueToAuth("signup")
                }
                className={`w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 ${
                  isLoggedIn
                    ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                    : "dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white"
                }`}
              >
                Create Account
              </button>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowAuthChoice(false)
              }
              className={`mt-5 text-sm font-semibold text-gray-400 transition hover:text-gray-700 ${darkMuted}`}
            >
              Continue editing checkout
            </button>

          </div>

        </div>

      )}

    </main>
  );
}