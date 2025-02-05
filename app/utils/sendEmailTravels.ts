export function sendEmailTravels(data: TravelEmailData) {
    const apiEndpoint = '/api/emailTravels';
    fetch(apiEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((response) => {
        alert(response.message);
      })
      .catch((err) => {
        alert(err);
      });
  }
  
  type TravelEmailData = {
    name: string;          // Nom du professeur
    email: string;         // Email du professeur
    travelId: number;      // ID du voyage
    travelName: string;    // Nom du voyage
    file: File | null;     // Fichier (ici un PDF)
  };