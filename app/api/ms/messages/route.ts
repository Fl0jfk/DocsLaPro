/*import { getSession } from "next-auth/react";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.accessToken) return res.status(401).json({ error: "Non autorisé" });

  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ error: "chatId requis" });

  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/chats/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const data = await response.json();
    res.json(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
*/