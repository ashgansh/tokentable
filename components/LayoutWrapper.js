import { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar';
import Header from './Header';
import Head from 'next/head';

export const LayoutWrapper = ({ children }) => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleOpenMobileSidebar = () => setShowMobileSidebar(true);
  const handleCloseMobileSidebar = () => setShowMobileSidebar(false);

  return (
    <>
      <Head>
        {/* <title>TokenOps</title> */}
      </Head>
      <div className='max-w-6xl m-auto'>
        <Header />
        <div className='h-full m-auto'>
          {/* <Sidebar showMobileSidebar={showMobileSidebar} onClose={handleCloseMobileSidebar} /> */}
          <div className="flex flex-1 flex-col ">
            <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
              <button
                type="button"
                className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-tokenops-primary-500"
                onClick={handleOpenMobileSidebar}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <main className="flex-1">
              <div className="py-6">
                {children}
              </div>
            </main>
          </div>
        </div >
      </div>
    </>
  );
};