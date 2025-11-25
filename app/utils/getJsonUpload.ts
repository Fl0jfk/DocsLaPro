export default async function getJSONUpload<T = any>(
  store: { setUserUpload: (data: T) => void },
  closingFunction: () => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json';

    file.onchange = async (e: Event) => {
      try {
        const targetFile = (e.target as HTMLInputElement).files?.[0];
        if (!targetFile) {
          throw new Error('No file selected');
        }

        const text = await targetFile.text();
        const json: T = JSON.parse(text);
        store.setUserUpload(json);
        closingFunction();
        resolve(json);
      } catch (error) {
        console.error('Error processing file:', error);
        reject(error);
      } finally {
        file.remove();
        closingFunction();
      }
    };

    document.body.append(file);
    file.click();
  });
}
