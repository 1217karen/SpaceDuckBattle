// account-storage-key.js

import { getCurrentAccount } from "./storage-service.js";

export function normalizeAccountEno(value) {
  const eno = Number(value || 0);
  return Number.isInteger(eno) && eno > 0 ? eno : null;
}

export function getCurrentAccountEno() {
  return normalizeAccountEno(getCurrentAccount()?.eno);
}

export function makeAccountStorageKey(prefix, eno = getCurrentAccountEno()) {
  const normalizedEno = normalizeAccountEno(eno);
  return normalizedEno ? `${prefix}:${normalizedEno}` : null;
}
