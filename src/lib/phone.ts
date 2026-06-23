// ============================================================
// Normalizacao de telefone (Brasil)
// Aceita qualquer formato: "49 99999-9999", "4999999999",
// "(49) 99999-9999", "+55 49 99999-9999", "55 49 99999 9999"...
// e devolve os digitos no padrao que a Z-API espera (com o 55).
// ============================================================

export function normalizePhoneBR(raw: string): string {
  let d = (raw || "").replace(/\D/g, ""); // so digitos
  d = d.replace(/^0+/, ""); // remove zeros a esquerda (ex: 0 49 ...)
  if (!d) return "";
  // 10 ou 11 digitos = DDD + numero, sem codigo do pais -> adiciona 55
  if (d.length === 10 || d.length === 11) {
    d = "55" + d;
  }
  // 12 ou 13 digitos ja com 55 no inicio: mantem como esta
  return d;
}

// Versao bonita para exibir na tela
export function prettyPhoneBR(raw: string): string {
  const d = normalizePhoneBR(raw);
  if (d.length < 12) return raw || ""; // nao deu pra normalizar, mostra original
  const cc = d.slice(0, 2);
  const ddd = d.slice(2, 4);
  const rest = d.slice(4);
  if (rest.length === 9) return `+${cc} (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  if (rest.length === 8) return `+${cc} (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `+${cc} ${ddd} ${rest}`;
}
