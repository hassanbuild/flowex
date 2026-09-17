import { lookup } from "dns/promises";
import { isIP } from "net";

function isPublicIPv4(ip: string) {
  const parts = ip.split(".").map(Number);

  if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) {
    return false;
  }

  const [a, b, c] = parts;

  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function parseIPv6(ip: string) {
  let value = ip.toLowerCase().replace(/^\[|\]$/g, "");

  if (value.includes(".")) {
    const separator = value.lastIndexOf(":");
    const ipv4 = value.slice(separator + 1);
    const parts = ipv4.split(".").map(Number);

    if (
      separator < 0 ||
      parts.length !== 4 ||
      parts.some((part) => part < 0 || part > 255)
    ) {
      return null;
    }

    value = `${value.slice(0, separator)}:${(
      (parts[0] << 8) | parts[1]
    ).toString(16)}:${((parts[2] << 8) | parts[3]).toString(16)}`;
  }

  const [left = "", right = ""] = value.split("::");

  if (value.split("::").length > 2) {
    return null;
  }

  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const parts = [...leftParts, ...rightParts];

  if (parts.length > 8) {
    return null;
  }

  const groups = [
    ...leftParts,
    ...Array(Math.max(0, 8 - parts.length)).fill("0"),
    ...rightParts,
  ];

  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    return null;
  }

  return groups.map((group) => group.padStart(4, "0"));
}

function isPublicIPv6(ip: string) {
  const value = parseIPv6(ip);

  if (value === null) {
    return false;
  }

  if (
    value.slice(0, 5).every((group) => group === "0000") &&
    value[5] === "ffff"
  ) {
    const high = Number.parseInt(value[6], 16);
    const low = Number.parseInt(value[7], 16);

    return isPublicIPv4(
      [high >> 8, high & 255, low >> 8, low & 255].join(".")
    );
  }

  const firstGroup = Number.parseInt(value[0], 16);

  return (
    firstGroup >= 0x2000 &&
    firstGroup < 0x4000 &&
    !(value[0] === "2001" && value[1] === "0db8")
  );
}

function isPublicAddress(address: string) {
  const version = isIP(address);

  if (version === 4) {
    return isPublicIPv4(address);
  }

  if (version === 6) {
    return isPublicIPv6(address);
  }

  return false;
}

export async function isSafeExternalUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username ||
    url.password
  ) {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }

  if (isIP(hostname)) {
    return isPublicAddress(hostname);
  }

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every((entry) => isPublicAddress(entry.address));
  } catch {
    return false;
  }
}
