import Image from 'next/image';
import Link from 'next/link';

export default function Slide({name, img, link}: SliderProps) {
    return (
        <div className='select-none flex xl:hover:scale-105 lg:hover:scale-105 h-[600px] min-w-[320px] sm:h-[500px] sm:min-w-[280px] rounded-3xl m-3 p-6 cursor-grab active:cursor-grabbing relative overflow-hidden transition ease-in-out duration-300'>
            {name && 
                <Link href={link}>
                    <div className='flex flex-col gap-1'>
                        <p className='text-4xl z-[2]'>{name}</p>
                    </div>       
                    {img && 
                        <Image src={img} fill alt={name} style={{objectFit:"cover"}} className='rounded-3xl select-none pointer-events-none' quality={100} sizes='35vw'/>
                    }
                </Link>  
            }  
        </div> 
    )
}

type SliderProps = {
  name: string;
  img: string;
  description: string;
  link: string;
};