import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BiImages } from "react-icons/bi";
import { toast } from "sonner";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../redux/slices/api/taskApiSlice";
import { dateFormatter } from "../../utils";
import Button from "../Button";
import Loading from "../Loader";
import ModalWrapper from "../ModalWrapper";
import SelectList from "../SelectList";
import Textbox from "../Textbox";
import UserList from "./UserList";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

// Utility function to check if file is an image
const isImageFile = (file) => {
  return file.type.startsWith("image/");
};

// Utility function to validate file size (5MB limit)
const validateFileSize = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSize;
};

const AddTask = ({ open, setOpen, task }) => {
  const defaultValues = {
    title: task?.title || "",
    date: dateFormatter(task?.date || new Date()),
    team: [],
    stage: "",
    priority: "",
    assets: [],
    description: "",
    links: "",
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  const [stage, setStage] = useState(task?.stage?.toUpperCase() || LISTS[0]);
  const [team, setTeam] = useState(task?.team || []);
  const [priority, setPriority] = useState(
    task?.priority?.toUpperCase() || PRIORITY[2]
  );
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const URLS = task?.assets ? [...task.assets] : [];

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result;
        resolve({
          name: file.name,
          link: base64String,
        });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleOnSubmit = async (data) => {
    setUploading(true);
    try {
      // Convert files to base64 with name and link structure
      const convertedAssets = [];
      for (const file of assets) {
        try {
          const base64Asset = await convertFileToBase64(file);
          convertedAssets.push(base64Asset);
        } catch (error) {
          console.error("Error converting file:", error.message);
          toast.error(`Failed to process file: ${file.name}`);
          return;
        }
      }

      const newData = {
        ...data,
        assets: [...URLS, ...convertedAssets],
        team,
        stage,
        priority,
      };

      console.log("Task data being sent to server:", newData);
      const res = task?._id
        ? await updateTask({ ...newData, _id: task._id }).unwrap()
        : await createTask(newData).unwrap();

      toast.success(res.message);

      setTimeout(() => {
        setOpen(false);
      }, 500);
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || err.error);
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate files
    const validFiles = [];
    const errors = [];

    selectedFiles.forEach((file) => {
      if (!validateFileSize(file)) {
        errors.push(`${file.name} is too large (max 5MB)`);
      } else if (!isImageFile(file)) {
        errors.push(`${file.name} is not an image file`);
      } else {
        validFiles.push(file);
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    // Set valid files
    if (validFiles.length > 0) {
      setAssets(validFiles);
      toast.success(`Added ${validFiles.length} image(s)`);
    }
  };

  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(handleOnSubmit)}>
          <Dialog.Title
            as="h2"
            className="text-base font-bold leading-6 text-gray-900 mb-4"
          >
            {task ? "UPDATE TASK" : "ADD TASK"}
          </Dialog.Title>

          <div className="mt-2 flex flex-col gap-6">
            <Textbox
              placeholder="Task title"
              type="text"
              name="title"
              label="Task Title"
              className="w-full rounded"
              register={register("title", {
                required: "Title is required!",
              })}
              error={errors.title ? errors.title.message : ""}
            />
            <UserList setTeam={setTeam} team={team} />
            <div className="flex gap-4">
              <SelectList
                label="Task Stage"
                lists={LISTS}
                selected={stage}
                setSelected={setStage}
              />
              <SelectList
                label="Priority Level"
                lists={PRIORITY}
                selected={priority}
                setSelected={setPriority}
              />
            </div>
            <div className="flex gap-4">
              <div className="w-full">
                <Textbox
                  placeholder="Date"
                  type="date"
                  name="date"
                  label="Task Date"
                  className="w-full rounded"
                  register={register("date", {
                    required: "Date is required!",
                  })}
                  error={errors.date ? errors.date.message : ""}
                />
              </div>
              <div className="w-full flex items-center justify-center mt-4">
                <label
                  className="flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4"
                  htmlFor="imgUpload"
                >
                  <input
                    type="file"
                    className="hidden"
                    id="imgUpload"
                    onChange={(e) => handleSelect(e)}
                    accept="image/*"
                    multiple={true}
                  />
                  <BiImages />
                  <span>Add Images</span>
                </label>
              </div>
            </div>

            {/* <div className='w-full'>
              <p>Task Description</p>
              <textarea
                name='description'
                {...register("description")}
                className='w-full bg-transparent px-3 py-1.5 2xl:py-3 border border-gray-300
            dark:border-gray-600 placeholder-gray-300 dark:placeholder-gray-700
            text-gray-900 dark:text-white outline-none text-base focus:ring-2
            ring-blue-300'
              ></textarea>
            </div> */}

            {/* <div className='w-full'>
              <p>
                Add Links{" "}
                <span className='text- text-gray-600'>
                  seperated by comma (,)
                </span>
              </p>        
              <textarea
                name='links'
                {...register("links")}
                className='w-full bg-transparent px-3 py-1.5 2xl:py-3 border border-gray-300
            dark:border-gray-600 placeholder-gray-300 dark:placeholder-gray-700
            text-gray-900 dark:text-white outline-none text-base focus:ring-2
            ring-blue-300'
              ></textarea>
            </div> */}
          </div>

          {isLoading || isUpdating || uploading ? (
            <div className="py-4">
              <Loading />
            </div>
          ) : (
            <div className="bg-gray-50 mt-6 mb-4 sm:flex sm:flex-row-reverse gap-4">
              <Button
                label="Submit"
                type="submit"
                className="bg-gradient-to-r from-teal-700 via-blue-600 to-sky-400 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
              />

              <Button
                type="button"
                className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto border border-dashed"
                onClick={() => setOpen(false)}
                label="Cancel"
              />
            </div>
          )}
        </form>
      </ModalWrapper>
    </>
  );
};

export default AddTask;
