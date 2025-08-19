import { useState } from "react";
import { FaList } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { MdGridView } from "react-icons/md";
import { useParams } from "react-router-dom";
import { tasks } from "../assets/data.js";
import BoardView from "../components/BoardView.jsx";
import Button from "../components/Button.jsx";
import Loading from "../components/Loader";
import Tabs from "../components/Tabs.jsx";
import AddTask from "../components/task/AddTask.jsx";
import Table from "../components/task/Table.jsx";
import TaskTitle from "../components/TaskTitle.jsx";
import Title from "../components/Title.jsx";
import { useGetAllTaskQuery } from "../redux/slices/api/taskApiSlice.js";

const TABS = [
  { title: "Board View", icon: <MdGridView /> },
  { title: "List View", icon: <FaList /> },
];

const TASK_TYPE = {
  todo: "bg-blue-600",
  "in progress": "bg-yellow-600",
  completed: "bg-green-600",
};

const Tasks = () => {
  const params = useParams();

  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);

  const status = params?.status || "";

  const { data, isLoading } = useGetAllTaskQuery({
    strQuery: status,
    isTrashed: "",
    search: "",
  });

  return isLoading ? (
    <div className="py-10">
      <Loading />
    </div>
  ) : (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <Title title={status ? `${status} Tasks` : "Tasks"} />

        {!status && (
          <Button
            onClick={() => setOpen(true)}
            label="Create Task"
            icon={<IoMdAdd className="text-lg" />}
            className="flex flex-row-reverse gap-1 items-center bg-gradient-to-r from-teal-700 via-blue-600 to-sky-400 text-white rounded py-1.5 2xl:py-2.5 text-sm font-medium"
          />
        )}
      </div>

      <Tabs tabs={TABS} setSelected={setSelected}>
        {!status && (
          <div className="w-full flex justify-between gap-4 md:gap-x-12 py-4">
            <TaskTitle label="To Do" className={TASK_TYPE.todo} />
            <TaskTitle
              label="In Progress"
              className={TASK_TYPE["in progress"]}
            />
            <TaskTitle label="Completed" className={TASK_TYPE.completed} />
          </div>
        )}

        {selected !== 1 ? (
          <BoardView tasks={data?.tasks} />
        ) : (
          <div className="w-full">
            <Table tasks={data?.tasks} />
          </div>
        )}
      </Tabs>

      <AddTask open={open} setOpen={setOpen} />
    </div>
  );
};

export default Tasks;
