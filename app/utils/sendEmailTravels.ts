export async function sendEmailTravels(formData: FormData) {
  try {
    const response = await fetch('/api/emailTravels', {
      method: 'POST',
      body: formData, // On envoie le formData et non un JSON
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Erreur inconnue');
    }
    alert(result.message);
  } catch (err) {
    console.error('Erreur lors de l’envoi du message:', err);
    alert('Une erreur est survenue lors de l’envoi de l’email.');
  }
}

  
  type TravelEmailData = {
    name: string;          // Nom du professeur
    email: string;         // Email du professeur
    travelId: number;      // ID du voyage
    travelName: string;    // Nom du voyage
    file: File | null;     // Fichier (ici un PDF)
  };