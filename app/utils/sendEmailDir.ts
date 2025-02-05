export function sendEmailDir(data: FormData) {
    const apiEndpoint = '/api/emailDir';
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
  
  type FormData = {
    name: string;
    email: string;
    message: string;
    director: string;
  };