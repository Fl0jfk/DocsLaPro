'use client';

import { useForm } from 'react-hook-form';
import { sendEmailDir } from '@/app/utils/sendEmailDir';

export type FormData = {
  name: string;
  email: string;
  message: string;
  director: string;
};

function FormContact() {
  const { register, handleSubmit, reset } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    try {
      await sendEmailDir(data);
      reset();
    } catch (error) {
      console.error('Erreur lors de l’envoi du message:', error);
    }
  }

  return (
    <section className="flex items-center justify-center w-full max-w-[600px] mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} name="form email" className="w-full">
        <div className="mb-5 w-full">
          <label htmlFor="name" className="mb-3 block text-base font-medium">Votre nom et prénom</label>
          <input
            autoComplete="name"
            id="name"
            type="text"
            placeholder="Nom et prénom"
            className="w-full rounded-full border border-gray-300 bg-white py-3 px-6 text-base font-medium text-gray-700 outline-none focus:border-black-500 focus:shadow-md text-black"
            {...register('name', { required: true })}
          />
        </div>
        <div className="mb-5">
          <label htmlFor="email" className="mb-3 block text-base font-medium">Votre adresse mail</label>
          <input
            type="email"
            id="email"
            autoComplete="email"
            placeholder="exemple@domaine.fr"
            className="w-full rounded-full border border-gray-300 bg-white py-3 px-6 text-base font-medium text-gray-700 outline-none focus:border-black-500 focus:shadow-md text-black"
            {...register('email', { required: true })}
          />
        </div>
        <div className="mb-5">
          <label htmlFor="message" className="mb-3 block text-base font-medium">Message</label>
          <textarea
            rows={4}
            id="message"
            placeholder="Écrivez votre message ici ..."
            className="w-full resize-none rounded-xl border border-gray-300 bg-white py-3 px-6 text-base font-medium text-gray-700 outline-none focus:border-black-500 focus:shadow-md text-black"
            {...register('message', { required: true })}
          />
        </div>
        <div className="mb-5">
          <label htmlFor="director" className="mb-3 block text-base font-medium">Choisissez la directrice que vous souhaitez rencontrer</label>
          <select
            id="director"
            className="w-full rounded-full border border-gray-300 bg-white py-3 px-6 text-base font-medium text-gray-700 outline-none focus:border-black-500 focus:shadow-md text-black"
            {...register('director', { required: true })}
          >
            <option value="">Sélectionnez une directrice</option>
            <option value="lycee">Mme Dona - Directrice du lycée</option>
            <option value="college">Mme Dumouchel - Directrice du collège</option>
            <option value="ecole">Mme Vallet - Directrice de l&apos;école</option>
          </select>
        </div>
        <div>
          <button
            type="submit"
            className="hover:shadow-form rounded-full border-[1px] border-[#000] font-thin py-3 px-8 text-base uppercase outline-none transition duration-300 ease-in-out hover:bg-white text-black"
          >
            Envoyer
          </button>
        </div>
      </form>
    </section>
  );
}

export default FormContact;
