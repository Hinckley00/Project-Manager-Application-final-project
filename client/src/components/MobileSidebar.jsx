import React, { Fragment, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOpenSidebar } from "../redux/slices/authSlice";
import { Transition } from "@headlessui/react";
// import clsx from "clsx";
import Sidebar from "./Sidebar";
import { IoClose } from "react-icons/io5";

const MobileSidebar = () => {
  const { isSidebarOpen } = useSelector((state) => state.auth);
  const mobileMenuRef = useRef(null);
  const dispatch = useDispatch();

  const closeSidebar = () => {
    dispatch(setOpenSidebar(false));
  };

  return (
    <Transition
      show={isSidebarOpen}
      as={Fragment}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 z-50 md:hidden flex">
        {/* Sidebar */}
        <div className="h-full w-3/4 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 relative">
          <div className="flex flex-col h-full">
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                onClick={closeSidebar}
                className="text-gray-500 hover:text-gray-700"
              >
                <IoClose size={25} />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};

export default MobileSidebar;
