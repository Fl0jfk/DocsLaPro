import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (data.website) {  return new Response("Bot detected", { status: 400 })}
    const { responsableNom, responsablePrenom, email, telephone, enfantNom, enfantPrenom, etablissement, classe, horaire, preinscription,} = data;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: `"Portes ouvertes" <${process.env.SMTP_USER}>`,
      to: "florian.hacqueville-mathi@ac-normandie.fr",
      replyTo: email,
      subject: "Nouvelle inscription – Portes ouvertes",
      html: `
        <h2>Nouvelle demande d’inscription aux portes ouvertes</h2>
        <p><strong>Établissement :</strong> ${etablissement}</p>
        <p><strong>Classe de l’enfant :</strong> ${classe}</p>
        <p><strong>Horaire choisi :</strong> ${horaire}</p>
        <p><strong>Pré-inscription déjà faite :</strong> ${preinscription}</p>
        <hr />
        <p><strong>Responsable :</strong> ${responsablePrenom} ${responsableNom}</p>
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