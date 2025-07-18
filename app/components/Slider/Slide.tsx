import Image from 'next/image';
import Link from 'next/link';

export default function Slide({name, img, link}: SliderProps) {
    return (
        <Link href={link} className='select-none flex items-end border xl:hover:scale-105 lg:hover:scale-105 h-[600px] md:h-[300px] md:min-w-[120px]  min-w-[320px] sm:h-[500px] sm:min-w-[280px] rounded-3xl m-3 p-4 sm:cursor-grab sm:active:cursor-grabbing relative overflow-hidden transition ease-in-out duration-300'>
            {name && 
                <>
                    <div className='flex flex-col gap-1'>
                        <p className='md:text-2xl text-4xl font-bold z-[2]'>{name}</p>
                    </div>      
                    {img && 
                        <Image src={img} fill alt={name} style={{objectFit:"cover"}} quality={100} priority className='rounded-3xl select-none pointer-events-none' sizes='35vw'/>
                    }
                </>    
            }  
        </Link>
    )
}

type SliderProps = {
  name: string;
  img: string;
  description: string;
  link: string;
};