// ============================================================
// Integracao de cobranca / Pix (Asaas)
//
// Sem ASAAS_API_KEY, gera um Pix "copia e cola" simulado pra voce
// testar o fluxo. Com a chave, cria uma cobranca real no Asaas e
// retorna o link/QR de pagamento.
//
// Alternativas: Pagar.me, Efi (Gerencianet), Mercado Pago.
// ============================================================

interface PixCharge {
  id: string;
  amount: number;
  pixCopyPaste: string;
  paymentLink: string;
  mode: "asaas" | "simulado";
}

export async function createPixCharge(
  amount: number,
  description: string
): Promise<PixCharge> {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3";

  if (!apiKey) {
    const fakeId = "sim_" + Math.random().toString(36).slice(2, 10);
    return {
      id: fakeId,
      amount,
      pixCopyPaste: `00020126580014BR.GOV.BCB.PIX0136${fakeId}520400005303986540${amount.toFixed(2)}5802BR5913RECUPERAI DEMO6009SAO PAULO62070503***6304ABCD`,
      paymentLink: `https://exemplo.recuperai.app/pagar/${fakeId}`,
      mode: "simulado",
    };
  }

  // Em producao: criar cobranca real no Asaas.
  // 1) garantir/criar customer  2) criar payment billingType=PIX
  // 3) buscar QR code em /payments/{id}/pixQrCode
  try {
    const res = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
      body: JSON.stringify({
        billingType: "PIX",
        value: amount,
        description,
        dueDate: new Date().toISOString().slice(0, 10),
      }),
    });
    const data = await res.json();
    return {
      id: data.id,
      amount,
      pixCopyPaste: data.pixCopyPaste || "",
      paymentLink: data.invoiceUrl || "",
      mode: "asaas",
    };
  } catch (err) {
    console.error("Falha Asaas, gerando Pix simulado:", err);
    const fakeId = "sim_" + Math.random().toString(36).slice(2, 10);
    return {
      id: fakeId,
      amount,
      pixCopyPaste: `PIX-SIMULADO-${fakeId}`,
      paymentLink: `https://exemplo.recuperai.app/pagar/${fakeId}`,
      mode: "simulado",
    };
  }
}
