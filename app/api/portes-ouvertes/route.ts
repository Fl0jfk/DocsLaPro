import {
  createTenantTransporter,
  getTenantSmtpConfig,
} from "@/app/lib/tenant-mail";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { last_name, first_name, email, telephone, enfantNom, enfantPrenom, etablissement, classe, horaire, preinscription,} = data;
    const smtp = await getTenantSmtpConfig();
    if (!smtp) {
      return new Response("SMTP non configuré", { status: 503 });
    }
    const transporter = await createTenantTransporter();
    if (!transporter) {
      return new Response("SMTP non configuré", { status: 503 });
    }
    await transporter.sendMail({
      from: `"Portes ouvertes" <${smtp.user}>`,
      to: "accueil.laprovidence.nb@gmail.com",
      replyTo: email,
      subject: "Nouvelle inscription – Portes ouvertes",
      html: `
        <h2>Nouvelle demande d’inscription aux portes ouvertes</h2>
        <p><strong>Établissement qui intéresse la famille :</strong> ${etablissement}</p>
        <p><strong>Classe qui intéresse la famille :</strong> ${classe}</p>
        <p><strong>Horaire choisi :</strong> ${horaire}</p>
        <p><strong>Pré-inscription déjà faite :</strong> ${preinscription}</p>
        <hr />
        <p><strong>Responsable :</strong> ${last_name} ${first_name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${telephone}</p>
        <hr />
        <p><strong>Enfant :</strong> ${enfantPrenom} ${enfantNom}</p>
      `,
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Mail error:", error);
    return new Response("Erreur lors de l’envoi", { status: 500 });
  }
}
