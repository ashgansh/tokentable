import Header from '@/components/Header'
import Link from 'next/link'

const RocketLaunchIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
</svg>

const QueueList = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
</svg>


const NavList = [
  {
    name: 'I want to start tracking my vesting schedules',
    role: 'For employees/investors',
    icon: QueueList,
    link: '/'

  },
  {
    name: 'I want to create a new vesting schedule',
    role: 'For startup operators',
    link: '/contracts/create',
    icon: RocketLaunchIcon,
  }
  // More people...
]

export default function Example() {
  return (
    <div className='max-w-5xl m-auto'>
      <Header />
      <div className="m-auto">
        <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8 lg:py-24">
          <div className="space-y-12">
            <div className="space-y-5 sm:space-y-4 md:max-w-xl lg:max-w-3xl xl:max-w-none">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome</h2>
              <p className="text-xl text-gray-500">
                What do you want to do?
              </p>
            </div>
            <ul
              role="list"
              className="space-y-12 flex justify-between sm:gap-x-6 sm:gap-y-12 sm:space-y-0 lg:gap-x-8 "
            >
              {NavList.map((navItem) => (
                <Link href={navItem.link} key={navItem.name}>
                  <li className="cursor-pointer rounded-md border  bg-white px-4 py-5 sm:px-6 bg-white shadow sm:rounded-lg">
                    <div className="space-y-4">
                      <div className="aspect-w-3 aspect-h-2 flex justify-center">
                        <navItem.icon className="w-16 h-16 stroke-gray-300 stroke-1" />
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1 text-lg font-medium leading-6 ">
                          <h3>{navItem.role}</h3>
                          <p className="text-tokenops-primary-600 text-xs">{navItem.name}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          </div>
          {/* <div className="space-y-5 sm:space-y-4 md:max-w-xl lg:max-w-3xl xl:max-w-none mt-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-4xl">My Vestings</h2>
         </div> */}
        </div>
      </div>
    </div>
  )
}
