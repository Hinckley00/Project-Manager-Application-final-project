import clsx from "clsx";
import React, { useState } from "react";
import {
  MdAttachFile,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { BiMessageAltDetail } from "react-icons/bi";
import { useSelector } from "react-redux";
import { BGS, formatDate, PRIORITYSTYLES, TASK_TYPE } from "../utils";
import TaskDialog from "./task/TaskDialog";
import { FaList } from "react-icons/fa";
import UserInfo from "./UserInfo";
import { IoMdAdd } from "react-icons/io";
import AddSubTask from "./task/AddSubTask";

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const TaskCard = ({ task }) => {
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="w-full h-fit bg-white shadow-md p-4 rounded-lg">
        <div className="w-full flex justify-between">
          <div
            className={clsx(
              "flex flex-1 gap-1 items-center text-sm font-medium",
              PRIORITYSTYLES[task?.priority]
            )}
          >
            <span className="text-lg">{ICONS[task?.priority]}</span>
            <span className="uppercase">{task?.priority} Priority</span>
          </div>
          {user?.isAdmin && <TaskDialog task={task} />}
        </div>
        <>
          <div className="flex items-center gap-2">
            <div className={clsx("w-4 h-4 rounded-full", TASK_TYPE[task.stage])} />
            <h4 className="line-clamp-1 text-black">{task?.title}</h4>
          </div>
          <span className="text-sm text-gray-600">{formatDate(new Date(task?.date))}</span>
        </>
        <div className="w-full border-t border-gray-200 my-2 py-1" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 items-center text-sm text-gray-600">
              <BiMessageAltDetail />
              <span>{task?.activities?.length || 0}</span>
            </div>
            <div className="flex gap-1 items-center text-sm text-gray-600">
              <MdAttachFile />
              <span>{task?.assets?.length || 0}</span>
            </div>
            <div className="flex gap-1 items-center text-sm text-gray-600">
              <FaList />
              <span>{task?.subTasks?.length || 0}</span>
            </div>
          </div>
          <div className="flex flex-row-reverse pb-1.5">
            {task?.team?.map((m, index) => (
              <div
                key={index}
                className={clsx(
                  "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
                  BGS[index % BGS?.length]
                )}
              >
                <UserInfo user={m} />
              </div>
            ))}
          </div>
        </div>
        {/* {Sub tasks} */}
        {task?.subTasks?.length > 0 ? (
          <div className="py-4 border-t border-gray-200">
            <h5 className="text-base line-clamp-1 text-black">{task?.subTasks[0].title}</h5>
            <div className="p-4 space-x-8">
              <span className="text-sm text-gray-600">{formatDate(new Date(task?.subTasks[0]?.date))}</span>
              <span className="bg-blue-600/10 px-3 py-1 rounded-full text-blue-700 font-medium">
                {task?.subTasks[0].tag}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="pt-6 pb-4 border-t border-gray-200">
              <span className="text-gray-500">No Sub Task</span>
            </div>
          </>
        )}
        
        {/* {Assets} */}
        {task?.assets?.length > 0 && (
          <div className="py-4 border-t border-gray-200">
            <h5 className="text-base text-black mb-2">Attachments</h5>
            <div className="space-y-2">
              {task.assets.map((asset, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <MdAttachFile className="text-gray-600" />
                  <span className="text-sm text-gray-700">{asset.name}</span>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = asset.link;
                      link.download = asset.name;
                      link.click();
                    }}
                    className="ml-auto text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* {Image Assets} */}
        {task?.assets?.length > 0 && (
          <div className="py-4 border-t border-gray-200">
            <h5 className="text-base text-black mb-2">Images</h5>
            <div className="grid grid-cols-2 gap-2">
              {task.assets
                .filter(asset => asset.link && asset.link.startsWith('data:image'))
                .map((asset, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={asset.link}
                      alt={asset.name}
                      className="w-full h-24 object-cover rounded border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = asset.link;
                          link.download = asset.name;
                          link.click();
                        }}
                        className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-all duration-200"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        <div className="w-full pb-2">
          <button
            onClick={() => setOpen(true)}
            disabled={user?.isAdmin ? false : true}
            className="w-full flex gap-4 items-center text-sm text-gray-500 font-semibold disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <IoMdAdd className="text-lg" />
            <span>ADD SUBTASK</span>
          </button>
        </div>
      </div>
      <AddSubTask open={open} setOpen={setOpen} id={task._id} />
    </>
  );
};

export default TaskCard;
